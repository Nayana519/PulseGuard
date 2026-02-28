from datetime import datetime
from .. import db


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    medications = db.relationship('Medication', backref='patient', lazy=True, foreign_keys='Medication.patient_id')
    alerts = db.relationship('Alert', backref='user', lazy=True)
    caregiver_links_as_patient = db.relationship(
        'CaregiverLink', backref='patient', foreign_keys='CaregiverLink.patient_id', lazy=True
    )
    caregiver_links_as_caregiver = db.relationship(
        'CaregiverLink', backref='caregiver', foreign_keys='CaregiverLink.caregiver_id', lazy=True
    )

    def to_dict(self):
        try:
            profile_data = None
            if self.profile:
                profile_data = self.profile.to_dict()
        except:
            profile_data = None
        
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'role': self.role,
            'created_at': self.created_at.isoformat(),
            'profile': profile_data
        }


class UserProfile(db.Model):
    __tablename__ = 'user_profiles'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    age = db.Column(db.Integer)
    height_cm = db.Column(db.Float)  # height in centimeters
    weight_kg = db.Column(db.Float)  # weight in kilograms
    blood_type = db.Column(db.String(5))
    allergies = db.Column(db.Text)  # comma-separated or JSON
    medical_history = db.Column(db.Text)  # medical conditions, surgeries, etc.
    medications_history = db.Column(db.Text)  # previous medications
    emergency_contact_name = db.Column(db.String(100))
    emergency_contact_phone = db.Column(db.String(20))
    emergency_contact_relationship = db.Column(db.String(50))
    notes = db.Column(db.Text)  # additional notes or observations
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='profile', uselist=False)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'age': self.age,
            'height_cm': self.height_cm,
            'weight_kg': self.weight_kg,
            'blood_type': self.blood_type,
            'allergies': self.allergies,
            'medical_history': self.medical_history,
            'medications_history': self.medications_history,
            'emergency_contact_name': self.emergency_contact_name,
            'emergency_contact_phone': self.emergency_contact_phone,
            'emergency_contact_relationship': self.emergency_contact_relationship,
            'notes': self.notes,
            'updated_at': self.updated_at.isoformat(),
            'created_at': self.created_at.isoformat()
        }


class CaregiverLink(db.Model):
    __tablename__ = 'caregiver_links'
    id = db.Column(db.Integer, primary_key=True)
    caregiver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Medication(db.Model):
    __tablename__ = 'medications'
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    rxcui = db.Column(db.String(50))
    form = db.Column(db.String(20), nullable=False)
    dose_amount = db.Column(db.Float, nullable=False)
    dose_unit = db.Column(db.String(20), nullable=False)
    frequency_hours = db.Column(db.Float, nullable=False)
    half_life_hours = db.Column(db.Float, default=6.0)
    current_stock = db.Column(db.Float, nullable=False)
    stock_threshold = db.Column(db.Float, nullable=False, default=5.0)
    next_dose_time = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    description = db.Column(db.Text)
    side_effects = db.Column(db.Text)
    boxed_warnings = db.Column(db.Text)

    dose_logs = db.relationship('DoseLog', backref='medication', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'name': self.name,
            'rxcui': self.rxcui,
            'form': self.form,
            'dose_amount': self.dose_amount,
            'dose_unit': self.dose_unit,
            'frequency_hours': self.frequency_hours,
            'half_life_hours': self.half_life_hours,
            'current_stock': self.current_stock,
            'stock_threshold': self.stock_threshold,
            'next_dose_time': self.next_dose_time.isoformat() if self.next_dose_time else None,
            'is_active': self.is_active,
            'description': self.description,
            'side_effects': self.side_effects,
            'boxed_warnings': self.boxed_warnings,
            'created_at': self.created_at.isoformat()
        }


class DoseLog(db.Model):
    __tablename__ = 'dose_logs'
    id = db.Column(db.Integer, primary_key=True)
    medication_id = db.Column(db.Integer, db.ForeignKey('medications.id'), nullable=False)
    scheduled_time = db.Column(db.DateTime, nullable=False)
    taken_time = db.Column(db.DateTime)
    status = db.Column(db.String(20), nullable=False, default='pending')
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'medication_id': self.medication_id,
            'medication_name': self.medication.name if self.medication else None,
            'scheduled_time': self.scheduled_time.isoformat(),
            'taken_time': self.taken_time.isoformat() if self.taken_time else None,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat()
        }


class Alert(db.Model):
    __tablename__ = 'alerts'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    severity = db.Column(db.String(20), nullable=False, default='info')
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    medication_id = db.Column(db.Integer, db.ForeignKey('medications.id'), nullable=True)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'type': self.type,
            'severity': self.severity,
            'title': self.title,
            'message': self.message,
            'medication_id': self.medication_id,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat()
        }