from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
import os

db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()
scheduler = BackgroundScheduler()


def create_app():
    app = Flask(__name__)

    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///pulseguard.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'pulseguard-super-secret-key-change-in-prod')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False

    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    CORS(app, origins="*", supports_credentials=True)

    from .routes.auth import auth_bp
    from .routes.medications import med_bp
    from .routes.doses import dose_bp
    from .routes.caregiver import caregiver_bp
    from .routes.alerts import alerts_bp
    from .routes.profile import profile_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(med_bp, url_prefix='/api/medications')
    app.register_blueprint(dose_bp, url_prefix='/api/doses')
    app.register_blueprint(caregiver_bp, url_prefix='/api/caregiver')
    app.register_blueprint(alerts_bp, url_prefix='/api/alerts')
    app.register_blueprint(profile_bp, url_prefix='/api')

    with app.app_context():
        db.create_all()
        _start_scheduler(app)

    return app


def _start_scheduler(app):
    from .tasks import check_missed_doses, check_low_stock
    if not scheduler.running:
        scheduler.add_job(
            func=lambda: _run_with_context(app, check_missed_doses),
            trigger='interval', minutes=1, id='missed_doses'
        )
        scheduler.add_job(
            func=lambda: _run_with_context(app, check_low_stock),
            trigger='interval', minutes=5, id='low_stock'
        )
        scheduler.start()


def _run_with_context(app, fn):
    with app.app_context():
        fn()