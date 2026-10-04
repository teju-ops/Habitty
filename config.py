"""
Application configuration module for Habitty.
Loads environment variables and configures SQLAlchemy, sessions, and security settings.
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, ".env"))


class Config:
    """Base configuration class."""
    SECRET_KEY = os.environ.get("SECRET_KEY") or "dev-fallback-secret-key-change-in-production"
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL") or (
        "sqlite:///" + os.path.join(basedir, "instance", "habitty.db")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    REMEMBER_COOKIE_DURATION = timedelta(days=14)
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    WTF_CSRF_ENABLED = True


class TestingConfig(Config):
    """Testing configuration using an in-memory SQLite database."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    WTF_CSRF_ENABLED = False
    SECRET_KEY = "test-secret-key"


class ProductionConfig(Config):
    """Production configuration enforcing strict security settings."""
    SESSION_COOKIE_SECURE = True


config_by_name = {
    "development": Config,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": Config,
}
