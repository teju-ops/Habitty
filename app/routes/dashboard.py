"""
Dashboard routes for Habitty: /dashboard and /profile.
"""
from datetime import datetime, date
from flask import Blueprint, render_template
from flask_login import login_required, current_user
from app.models import Habit
from app.services.habit_service import calculate_streak
from app.services.statistics_service import get_dashboard_statistics

dashboard_bp = Blueprint("dashboard", __name__)


def get_time_greeting() -> str:
    """Return an appropriate time-of-day greeting."""
    hour = datetime.now().hour
    if hour < 12:
        return "Good morning"
    if hour < 18:
        return "Good afternoon"
    return "Good evening"


@dashboard_bp.route("/dashboard")
@login_required
def index():
    """Render the authenticated user's main habit dashboard and progress analytics."""
    today = date.today()
    user_habits = (
        Habit.query.filter_by(user_id=current_user.id)
        .order_by(Habit.created_at.desc())
        .all()
    )

    habit_cards = []
    for habit in user_habits:
        habit_cards.append({
            "habit": habit,
            "current_streak": calculate_streak(habit.id, reference_date=today),
            "completed_today": habit.is_completed_on(today),
        })

    stats = get_dashboard_statistics(current_user.id, reference_date=today)
    greeting = get_time_greeting()

    return render_template(
        "dashboard/dashboard.html",
        greeting=greeting,
        habit_cards=habit_cards,
        stats=stats,
        today=today,
    )
