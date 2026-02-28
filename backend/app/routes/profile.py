from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import User, UserProfile
from .. import db

profile_bp = Blueprint('profile', __name__)


@profile_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get user profile"""
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    
    profile = UserProfile.query.filter_by(user_id=user_id).first()
    
    if not profile:
        return jsonify({
            'error': 'Profile not found',
            'message': 'User does not have a profile yet. Please create one.'
        }), 404
    
    return jsonify(profile.to_dict()), 200


@profile_bp.route('/profile', methods=['POST'])
@jwt_required()
def create_profile():
    """Create a new user profile"""
    user_id = int(get_jwt_identity())
    
    # Check if user exists
    user = User.query.get_or_404(user_id)
    
    # Check if profile already exists
    existing_profile = UserProfile.query.filter_by(user_id=user_id).first()
    if existing_profile:
        return jsonify({'error': 'Profile already exists. Use PUT to update.'}), 409
    
    data = request.get_json()
    
    # Create new profile with optional fields
    profile = UserProfile(
        user_id=user_id,
        age=data.get('age'),
        height_cm=data.get('height_cm'),
        weight_kg=data.get('weight_kg'),
        blood_type=data.get('blood_type'),
        allergies=data.get('allergies'),
        medical_history=data.get('medical_history'),
        medications_history=data.get('medications_history'),
        emergency_contact_name=data.get('emergency_contact_name'),
        emergency_contact_phone=data.get('emergency_contact_phone'),
        emergency_contact_relationship=data.get('emergency_contact_relationship'),
        notes=data.get('notes')
    )
    
    db.session.add(profile)
    db.session.commit()
    
    return jsonify(profile.to_dict()), 201


@profile_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    user_id = int(get_jwt_identity())
    
    # Check if user exists
    user = User.query.get_or_404(user_id)
    
    # Get or create profile
    profile = UserProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        profile = UserProfile(user_id=user_id)
    
    data = request.get_json()
    
    # Update fields if provided
    if 'age' in data:
        profile.age = data['age']
    if 'height_cm' in data:
        profile.height_cm = data['height_cm']
    if 'weight_kg' in data:
        profile.weight_kg = data['weight_kg']
    if 'blood_type' in data:
        profile.blood_type = data['blood_type']
    if 'allergies' in data:
        profile.allergies = data['allergies']
    if 'medical_history' in data:
        profile.medical_history = data['medical_history']
    if 'medications_history' in data:
        profile.medications_history = data['medications_history']
    if 'emergency_contact_name' in data:
        profile.emergency_contact_name = data['emergency_contact_name']
    if 'emergency_contact_phone' in data:
        profile.emergency_contact_phone = data['emergency_contact_phone']
    if 'emergency_contact_relationship' in data:
        profile.emergency_contact_relationship = data['emergency_contact_relationship']
    if 'notes' in data:
        profile.notes = data['notes']
    
    db.session.add(profile)
    db.session.commit()
    
    return jsonify(profile.to_dict()), 200


@profile_bp.route('/profile', methods=['DELETE'])
@jwt_required()
def delete_profile():
    """Delete user profile"""
    user_id = int(get_jwt_identity())
    
    profile = UserProfile.query.filter_by(user_id=user_id).first()
    
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
    
    db.session.delete(profile)
    db.session.commit()
    
    return jsonify({'message': 'Profile deleted successfully'}), 200


@profile_bp.route('/user/<int:user_id>/profile', methods=['GET'])
@jwt_required()
def get_user_profile(user_id):
    """Get another user's profile (for caregivers viewing patient profiles)"""
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get_or_404(current_user_id)
    
    # Verify the user has permission to view this profile
    target_user = User.query.get_or_404(user_id)
    
    # Allow if it's their own profile
    if current_user_id == user_id:
        profile = UserProfile.query.filter_by(user_id=user_id).first()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404
        return jsonify(profile.to_dict()), 200
    
    # Allow if current user is a caregiver and viewing their patient's profile
    if current_user.role == 'caregiver':
        from ..models import CaregiverLink
        is_caregiver = CaregiverLink.query.filter_by(
            caregiver_id=current_user_id,
            patient_id=user_id
        ).first()
        if is_caregiver:
            profile = UserProfile.query.filter_by(user_id=user_id).first()
            if not profile:
                return jsonify({'error': 'Profile not found'}), 404
            return jsonify(profile.to_dict()), 200
    
    return jsonify({'error': 'You do not have permission to view this profile'}), 403
