from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import Alert
from .. import db

alerts_bp = Blueprint('alerts', __name__)


@alerts_bp.route('/', methods=['GET'])
@jwt_required()
def get_alerts():
    uid = int(get_jwt_identity())
    unread_only = request.args.get('unread', 'false').lower() == 'true'
    query = Alert.query.filter_by(user_id=uid)
    if unread_only:
        query = query.filter_by(is_read=False)
    alerts = query.order_by(Alert.created_at.desc()).limit(50).all()
    return jsonify([a.to_dict() for a in alerts])


@alerts_bp.route('/<int:alert_id>/read', methods=['PUT'])
@jwt_required()
def mark_read(alert_id):
    uid = int(get_jwt_identity())
    alert = Alert.query.get_or_404(alert_id)
    if alert.user_id != uid:
        return jsonify({'error': 'Forbidden'}), 403
    alert.is_read = True
    db.session.commit()
    return jsonify({'message': 'marked read'})


@alerts_bp.route('/read-all', methods=['PUT'])
@jwt_required()
def mark_all_read():
    uid = int(get_jwt_identity())
    Alert.query.filter_by(user_id=uid, is_read=False).update({'is_read': True})
    db.session.commit()
    return jsonify({'message': 'all read'})