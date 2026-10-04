"""
Habitty Application Factory.
Initializes Flask extensions, registers blueprints, and configures custom error handlers.
"""
import os
from flask import Flask, render_template, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, current_user
from flask_wtf.csrf import CSRFProtect
from config import config_by_name

db = SQLAlchemy()
login_manager = LoginManager()
csrf = CSRFProtect()

login_manager.login_view = "auth.login"
login_manager.login_message = "Please log in to access your habits and dashboard."
login_manager.login_message_category = "warning"


def create_app(config_name: str = "default") -> Flask:
    """Create and configure an instance of the Flask application."""
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_by_name.get(config_name, config_by_name["default"]))

    # Ensure instance folder exists for SQLite database
    try:
        os.makedirs(app.instance_path, exist_ok=True)
    except OSError:
        pass

    # Initialize Flask extensions
    db.init_app(app)
    login_manager.init_app(app)
    csrf.init_app(app)

    # Import models so SQLAlchemy registers tables
    from app import models  # noqa: F401

    # Register Blueprints
    from app.routes.auth import auth_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.habits import habits_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(habits_bp, url_prefix="/habits")

    # Root route redirection
    @app.route("/")
    def index():
        if current_user.is_authenticated:
            return redirect(url_for("dashboard.index"))
        return redirect(url_for("auth.login"))

    # Register custom error handlers
    register_error_handlers(app)

    return app


def register_error_handlers(app: Flask) -> None:
    """Register custom HTTP error pages for 403, 404, and 500."""

    @app.errorhandler(403)
    def forbidden_error(error):
        return render_template("403.html"), 403

    @app.errorhandler(404)
    def not_found_error(error):
        return render_template("404.html"), 404

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return render_template("500.html"), 500
