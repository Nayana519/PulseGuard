from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from ..models import Medication, DoseLog, Alert, User, CaregiverLink
from .. import db

dose_bp = Blueprint('doses', __name__)


@dose_bp.route('/<int:med_id>/log', methods=['POST'])
@jwt_required()
def log_dose(med_id):
    med = Medication.query.get_or_404(med_id)
    data = request.get_json()
    taken_time = datetime.utcnow()
    scheduled_time = med.next_dose_time or taken_time
    status = data.get('status', 'taken')

    if status == 'taken':
        med.next_dose_time = taken_time + timedelta(hours=med.frequency_hours)
        med.current_stock = max(0, med.current_stock - med.dose_amount)

    log = DoseLog(
        medication_id=med_id,
        scheduled_time=scheduled_time,
        taken_time=taken_time if status == 'taken' else None,
        status=status,
        notes=data.get('notes', '')
    )
    db.session.add(log)
    db.session.commit()
    return jsonify(log.to_dict()), 201


@dose_bp.route('/<int:med_id>/history', methods=['GET'])
@jwt_required()
def dose_history(med_id):
    logs = DoseLog.query.filter_by(medication_id=med_id).order_by(DoseLog.created_at.desc()).limit(30).all()
    return jsonify([l.to_dict() for l in logs])


@dose_bp.route('/<int:med_id>/concentration', methods=['GET'])
@jwt_required()
def concentration_curve(med_id):
    med = Medication.query.get_or_404(med_id)
    half_life = med.half_life_hours
    initial_concentration = 100.0

    accumulation = []
    c_accum = 0
    for dose_num in range(3):
        for h in range(int(med.frequency_hours) + 1):
            t = dose_num * med.frequency_hours + h
            c_from_this_dose = initial_concentration * (0.5 ** (h / half_life))
            residual = c_accum * (0.5 ** (h / half_life)) if dose_num > 0 else 0
            total = c_from_this_dose + residual
            accumulation.append({'time': round(t, 1), 'concentration': round(total, 2)})
        if dose_num < 2:
            c_accum = accumulation[-1]['concentration']

    return jsonify({
        'accumulation': accumulation,
        'half_life': half_life,
        'frequency_hours': med.frequency_hours,
        'next_dose_time': med.next_dose_time.isoformat() if med.next_dose_time else None
    })