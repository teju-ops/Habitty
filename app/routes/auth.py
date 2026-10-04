"""
Authentication routes for Habitty: /register, /login, /logout, and /profile.
"""
import re
from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_user, logout_user, login_required, current_user
from app import db
from app.models import User

auth_bp = Blueprint("auth", __name__)

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    """Register a new user account with validation and Werkzeug password hashing."""
    if current_user.is_authenticated:
        return redirect(url_for("dashboard.index"))

    if request.method == "POST":
        username = (request.form.get("username") or "").strip()
        email = (request.form.get("email") or "").strip().lower()
        password = request.form.get("password") or ""
        confirm_password = request.form.get("confirm_password") or ""

        # Validation rules
        if not username:
            flash("Username cannot be empty.", "danger")
            return render_template("auth/register.html", username=username, email=email), 400

        if len(username) < 3 or len(username) > 64:
            flash("Username must be between 3 and 64 characters.", "danger")
            return render_template("auth/register.html", username=username, email=email), 400

        if not email or not EMAIL_REGEX.match(email):
            flash("Please provide a valid email address.", "danger")
            return render_template("auth/register.html", username=username, email=email), 400

        if len(password) < 6:
            flash("Password must be at least 6 characters long.", "danger")
            return render_template("auth/register.html", username=username, email=email), 400

        if password != confirm_password:
            flash("Password and confirm password do not match.", "danger")
            return render_template("auth/register.html", username=username, email=email), 400

        if User.query.filter_by(username=username).first():
            flash("That username is already taken. Please choose another.", "danger")
            return render_template("auth/register.html", username=username, email=email), 400

        if User.query.filter_by(email=email).first():
            flash("An account with that email already exists.", "danger")
            return render_template("auth/register.html", username=username, email=email), 400

        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        flash("Account registered! Please log in with your credentials.", "success")
        return redirect(url_for("auth.login"))

    return render_template("auth/register.html")


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    """Authenticate an existing user and create a Flask-Login session."""
    if current_user.is_authenticated:
        return redirect(url_for("dashboard.index"))

    if request.method == "POST":
        email = (request.form.get("email") or "").strip().lower()
        password = request.form.get("password") or ""

        if not email or not password:
            flash("Both email and password are required.", "danger")
            return render_template("auth/login.html", email=email), 400

        user = User.query.filter_by(email=email).first()
        if user is None:
            flash("Invalid email address or account does not exist.", "danger")
            return render_template("auth/login.html", email=email), 401

        if not user.check_password(password):
            flash("Invalid password. Please try again.", "danger")
            return render_template("auth/login.html", email=email), 401

        login_user(user, remember=True)
        flash(f"Welcome back, {user.username}!", "success")
        next_page = request.args.get("next")
        if next_page and next_page.startswith("/"):
            return redirect(next_page)
        return redirect(url_for("dashboard.index"))

    return render_template("auth/login.html")


@auth_bp.route("/logout")
@login_required
def logout():
    """Log out the currently authenticated user and redirect to login."""
    logout_user()
    flash("You have been logged out.", "info")
    return redirect(url_for("auth.login"))
