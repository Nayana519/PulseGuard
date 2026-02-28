from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from ..models import User, CaregiverLink, Medication, DoseLog, Alert
from .. import db

caregiver_bp = Blueprint('caregiver', __name__)


@caregiver_bp.route('/link-patient', methods=['POST'])
@jwt_required()
def link_patient():
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if user.role != 'caregiver':
        return jsonify({'error': 'Only caregivers can link patients'}), 403
    data = request.get_json()
    patient = User.query.filter_by(email=data.get('patient_email'), role='patient').first()
    if not patient:
        return jsonify({'error': 'Patient not found'}), 404
    if CaregiverLink.query.filter_by(caregiver_id=uid, patient_id=patient.id).first():
        return jsonify({'error': 'Already linked'}), 409
    link = CaregiverLink(caregiver_id=uid, patient_id=patient.id)
    db.session.add(link)
    db.session.commit()
    return jsonify({'message': f'Linked to patient {patient.name}', 'patient': patient.to_dict()}), 201


@caregiver_bp.route('/patients', methods=['GET'])
@jwt_required()
def get_patients():
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if user.role != 'caregiver':
        return jsonify({'error': 'Caregivers only'}), 403

    links = CaregiverLink.query.filter_by(caregiver_id=uid).all()
    result = []

    for link in links:
        patient = User.query.get(link.patient_id)
        meds = Medication.query.filter_by(patient_id=patient.id, is_active=True).all()

        week_ago = datetime.utcnow() - timedelta(days=7)
        all_logs = DoseLog.query.join(Medication).filter(
            Medication.patient_id == patient.id,
            DoseLog.created_at >= week_ago
        ).all()

        total = len(all_logs)
        taken = sum(1 for l in all_logs if l.status == 'taken')
        compliance = round((taken / total * 100) if total > 0 else 100, 1)

        active_alerts = Alert.query.filter_by(user_id=patient.id, is_read=False).all()
        critical_alerts = [a for a in active_alerts if a.severity == 'critical']
        low_stock = [m for m in meds if m.current_stock <= m.stock_threshold]

        two_hours_ago = datetime.utcnow() - timedelta(hours=2)
        missed_recent = DoseLog.query.join(Medication).filter(
            Medication.patient_id == patient.id,
            DoseLog.status == 'missed',
            DoseLog.created_at >= two_hours_ago
        ).first()

        status = 'red' if (critical_alerts or compliance < 60) else \
                 'yellow' if (missed_recent or low_stock or compliance < 80) else 'green'

        result.append({
            'patient': patient.to_dict(),
            'medications': [m.to_dict() for m in meds],
            'compliance_percent': compliance,
            'active_alerts': [a.to_dict() for a in active_alerts],
            'critical_alert_count': len(critical_alerts),
            'low_stock_meds': [m.name for m in low_stock],
            'has_missed_dose': missed_recent is not None,
            'status': status
        })

    return jsonify(result)