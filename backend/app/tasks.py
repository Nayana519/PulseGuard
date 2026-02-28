from datetime import datetime, timedelta
from .models import Medication, DoseLog, Alert, User, CaregiverLink
from . import db
import logging

logger = logging.getLogger(__name__)


def check_missed_doses():
    threshold = datetime.utcnow() - timedelta(minutes=15)
    overdue_meds = Medication.query.filter(
        Medication.is_active == True,
        Medication.next_dose_time <= threshold
    ).all()

    for med in overdue_meds:
        already_logged = DoseLog.query.filter(
            DoseLog.medication_id == med.id,
            DoseLog.status == 'missed',
            DoseLog.scheduled_time >= med.next_dose_time - timedelta(minutes=1)
        ).first()
        if already_logged:
            continue

        log = DoseLog(medication_id=med.id, scheduled_time=med.next_dose_time, status='missed')
        db.session.add(log)

        alert = Alert(
            user_id=med.patient_id, type='missed_dose', severity='warning',
            title=f'Missed Dose: {med.name}',
            message=f'You missed your scheduled dose of {med.name} at {med.next_dose_time.strftime("%H:%M UTC")}.',
            medication_id=med.id
        )
        db.session.add(alert)

        patient = User.query.get(med.patient_id)
        for link in CaregiverLink.query.filter_by(patient_id=med.patient_id).all():
            db.session.add(Alert(
                user_id=link.caregiver_id, type='missed_dose', severity='warning',
                title=f'Missed Dose — {patient.name}: {med.name}',
                message=f'{patient.name} missed their {med.name} dose.',
                medication_id=med.id
            ))

        med.next_dose_time = datetime.utcnow() + timedelta(hours=med.frequency_hours)

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"check_missed_doses error: {e}")


def check_low_stock():
    low_meds = Medication.query.filter(
        Medication.is_active == True,
        Medication.current_stock <= Medication.stock_threshold
    ).all()

    for med in low_meds:
        recent = Alert.query.filter_by(
            user_id=med.patient_id, medication_id=med.id, type='low_stock', is_read=False
        ).first()
        if recent:
            continue
        db.session.add(Alert(
            user_id=med.patient_id, type='low_stock', severity='warning',
            title=f'Low Stock: {med.name}',
            message=f'Only {med.current_stock:.1f} {med.dose_unit} remaining.',
            medication_id=med.id
        ))

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"check_low_stock error: {e}")