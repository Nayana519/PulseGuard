from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from ..models import Medication, User, Alert
from .. import db
from ..services.drug_api import get_rxcui, check_drug_interactions, fetch_fda_drug_info, check_pharmacokinetic_interactions

med_bp = Blueprint('medications', __name__)


def _get_patient_id(current_user_id, patient_id_param=None):
    user = User.query.get(current_user_id)
    if user.role == 'caregiver' and patient_id_param:
        return int(patient_id_param)
    return current_user_id


@med_bp.route('/', methods=['GET'])
@jwt_required()
def list_medications():
    uid = int(get_jwt_identity())
    patient_id = _get_patient_id(uid, request.args.get('patient_id'))
    meds = Medication.query.filter_by(patient_id=patient_id, is_active=True).all()
    return jsonify([m.to_dict() for m in meds])


@med_bp.route('/', methods=['POST'])
@jwt_required()
def add_medication():
    uid = int(get_jwt_identity())
    data = request.get_json()
    patient_id = _get_patient_id(uid, data.get('patient_id'))

    rxcui = get_rxcui(data['name'])
    
    # Get existing medications to check interactions
    existing = Medication.query.filter_by(patient_id=patient_id, is_active=True).all()
    
    # Check 1: RxNav drug interaction database
    if rxcui:
        existing_cuis = [m.rxcui for m in existing if m.rxcui]
        if existing_cuis:
            interaction_result = check_drug_interactions(rxcui, existing_cuis)
            if interaction_result.get('has_critical'):
                critical = interaction_result['critical_interactions']
                
                # Create a critical alert for the patient
                alert = Alert(
                    user_id=patient_id,
                    type='drug_interaction',
                    severity='critical',
                    title=f'CRITICAL: Cannot add {data["name"]}',
                    message=f'This medication has a HIGH-SEVERITY interaction with your current medications: {", ".join([c["drugs"][0] if c.get("drugs") else "" for c in critical[:2]])}. Please consult with your healthcare provider.',
                    is_read=False
                )
                db.session.add(alert)
                db.session.commit()
                
                return jsonify({
                    'error': 'FATAL_INTERACTION_BLOCKED',
                    'message': 'This medication has been BLOCKED due to a high-severity drug interaction.',
                    'interactions': critical
                }), 409
    
    # Check 2: Pharmacokinetic overlap (active time window collision)
    if existing:
        # Create temporary medication object for checking
        temp_med = Medication(
            name=data['name'],
            half_life_hours=float(data.get('half_life_hours', 6.0))
        )
        pk_interactions = check_pharmacokinetic_interactions(temp_med, existing)
        if pk_interactions:
            pk_critical = pk_interactions
            
            # Create a critical alert for pharmacokinetic interaction
            alert = Alert(
                user_id=patient_id,
                type='drug_interaction',
                severity='critical',
                title=f'CRITICAL: Cannot add {data["name"]}',
                message=f'This medication will be active in your body at the same time as {", ".join([i["med2"] for i in pk_critical])}. This combination is dangerous. Please consult with your healthcare provider.',
                is_read=False
            )
            db.session.add(alert)
            db.session.commit()
            
            return jsonify({
                'error': 'FATAL_INTERACTION_BLOCKED',
                'message': 'This medication has been BLOCKED due to pharmacokinetic overlap with active medications.',
                'interactions': pk_critical
            }), 409

    fda_info = fetch_fda_drug_info(data['name'])
    next_dose = datetime.utcnow() + timedelta(hours=1)

    med = Medication(
        patient_id=patient_id,
        name=data['name'],
        rxcui=rxcui,
        form=data.get('form', 'pill'),
        dose_amount=float(data['dose_amount']),
        dose_unit=data.get('dose_unit', 'mg'),
        frequency_hours=float(data['frequency_hours']),
        half_life_hours=float(data.get('half_life_hours', 6.0)),
        current_stock=float(data['current_stock']),
        stock_threshold=float(data.get('stock_threshold', 5.0)),
        next_dose_time=next_dose,
        description=fda_info.get('description', ''),
        side_effects=fda_info.get('side_effects', ''),
        boxed_warnings=fda_info.get('boxed_warnings', '')
    )
    db.session.add(med)
    
    # Create a warning alert if there are any interactions (even non-critical)
    if rxcui:
        existing = Medication.query.filter_by(patient_id=patient_id, is_active=True).all()
        existing_cuis = [m.rxcui for m in existing if m.rxcui]
        if existing_cuis:
            interaction_result = check_drug_interactions(rxcui, existing_cuis)
            all_interactions = interaction_result.get('all_interactions', [])
            if all_interactions:
                for interaction in all_interactions:
                    if not interaction.get('is_critical'):  # Only warn about non-critical ones here
                        alert = Alert(
                            user_id=patient_id,
                            type='drug_interaction',
                            severity='warning',
                            title=f'Drug Interaction: {data["name"]}',
                            message=f'Moderate interaction detected: {interaction.get("description", "")}. Monitor for side effects.',
                            is_read=False
                        )
                        db.session.add(alert)
                        break  # Only create one warning alert per medication
    
    db.session.commit()
    return jsonify(med.to_dict()), 201


@med_bp.route('/<int:med_id>', methods=['PUT'])
@jwt_required()
def update_medication(med_id):
    med = Medication.query.get_or_404(med_id)
    data = request.get_json()
    for field in ['dose_amount', 'frequency_hours', 'half_life_hours', 'current_stock', 'stock_threshold']:
        if field in data:
            setattr(med, field, float(data[field]))
    if 'name' in data:
        med.name = data['name']
    db.session.commit()
    return jsonify(med.to_dict())


@med_bp.route('/<int:med_id>', methods=['DELETE'])
@jwt_required()
def delete_medication(med_id):
    med = Medication.query.get_or_404(med_id)
    med.is_active = False
    db.session.commit()
    return jsonify({'message': 'Medication deactivated'})


@med_bp.route('/check-pk-overlaps', methods=['GET'])
@jwt_required()
def check_pk_overlaps():
    """Check for pharmacokinetic overlaps among all current medications"""
    uid = int(get_jwt_identity())
    patient_id = _get_patient_id(uid, request.args.get('patient_id'))
    
    meds = Medication.query.filter_by(patient_id=patient_id, is_active=True).all()
    
    if len(meds) < 2:
        return jsonify({
            'has_overlaps': False,
            'overlaps': [],
            'message': 'Need at least 2 medications to check for overlaps'
        }), 200
    
    overlaps = []
    
    # Check each pair of medications
    for i in range(len(meds)):
        for j in range(i + 1, len(meds)):
            med1 = meds[i]
            med2 = meds[j]
            
            pk_intrs = check_pharmacokinetic_interactions(med1, [med2])
            if pk_intrs:
                overlaps.extend(pk_intrs)
    
    return jsonify({
        'has_overlaps': len(overlaps) > 0,
        'overlaps': overlaps,
        'message': f'Found {len(overlaps)} pharmacokinetic overlap(s)' if overlaps else 'No overlaps detected'
    }), 200


@med_bp.route('/fda-info', methods=['GET'])
@jwt_required()
def fda_lookup():
    name = request.args.get('name', '')
    if not name:
        return jsonify({'error': 'name required'}), 400
    info = fetch_fda_drug_info(name)
    rxcui = get_rxcui(name)
    return jsonify({**info, 'rxcui': rxcui})


@med_bp.route('/check-interactions', methods=['POST'])
@jwt_required()
def check_interactions():
    """Check for drug interactions before adding a medication"""
    uid = int(get_jwt_identity())
    data = request.get_json()
    patient_id = _get_patient_id(uid, data.get('patient_id'))
    medication_name = data.get('name', '')
    half_life = float(data.get('half_life_hours', 6.0))
    
    if not medication_name:
        return jsonify({'error': 'medication name required'}), 400
    
    rxcui = get_rxcui(medication_name)
    
    # Get patient's current medications
    existing = Medication.query.filter_by(patient_id=patient_id, is_active=True).all()
    
    # Check 1: RxNav interactions
    critical = []
    warnings = []
    
    if rxcui and existing:
        existing_cuis = [m.rxcui for m in existing if m.rxcui]
        if existing_cuis:
            interaction_result = check_drug_interactions(rxcui, existing_cuis)
            critical = interaction_result.get('critical_interactions', [])
            all_interactions = interaction_result.get('all_interactions', [])
            warnings = [i for i in all_interactions if not i.get('is_critical', False)]
    
    # Check 2: Pharmacokinetic overlap
    pk_interactions = []
    if existing:
        temp_med = Medication(
            name=medication_name,
            half_life_hours=half_life
        )
        pk_interactions = check_pharmacokinetic_interactions(temp_med, existing)
    
    # Combine critical interactions
    all_critical = critical + pk_interactions
    
    return jsonify({
        'has_interactions': len(all_critical) > 0 or len(warnings) > 0,
        'has_critical': len(all_critical) > 0,
        'critical_interactions': all_critical,
        'warnings': warnings,
        'message': f'Found {len(all_critical)} critical and {len(warnings)} warning interaction(s)' if all_critical or warnings else 'No interactions found'
    }), 200