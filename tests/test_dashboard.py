"""
Automated pytest suite for Habitty streak calculation, statistics, and dashboard analytics:
- Consecutive streak calculation (e.g., Oct 1..4 -> 4 days; gap on Oct 3 -> 1 day)
- Longest streak calculation
- Completion rate calculation
- Dashboard statistics aggregation
"""
from datetime import date, datetime
import pytest
from app import create_app, db
from app.models import User, Habit, HabitCompletion
from app.services.habit_service import calculate_streak, calculate_longest_streak
from app.services.statistics_service import calculate_completion_rate, get_dashboard_statistics


@pytest.fixture
def app_ctx():
    app = create_app("testing")
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


def test_streak_calculation_consecutive_and_gapped(app_ctx):
    """
    Verify exact specification examples:
    - Oct 1, 2, 3, 4 completed -> Current streak = 4 days
    - Oct 1, 2, 4 completed (Oct 3 missed) -> Current streak = 1 day, Longest = 2 days
    """
    user = User(username="tejaswini", email="tejaswini@example.com")
    user.set_password("password123")
    db.session.add(user)
    db.session.commit()

    habit = Habit(
        user_id=user.id,
        name="Exercise",
        category="Fitness",
        frequency="Daily",
        target=1,
        created_at=datetime(2026, 10, 1),
    )
    db.session.add(habit)
    db.session.commit()

    for day in (1, 2, 3, 4):
        db.session.add(HabitCompletion(habit_id=habit.id, completion_date=date(2026, 10, day)))
    db.session.commit()

    assert calculate_streak(habit.id, reference_date=date(2026, 10, 4)) == 4
    assert calculate_longest_streak(habit.id) == 4

    # Remove Oct 3 completion to test broken streak
    oct_3 = HabitCompletion.query.filter_by(
        habit_id=habit.id, completion_date=date(2026, 10, 3)
    ).first()
    db.session.delete(oct_3)
    db.session.commit()

    assert calculate_streak(habit.id, reference_date=date(2026, 10, 4)) == 1
    assert calculate_longest_streak(habit.id) == 2
    assert calculate_completion_rate(habit, reference_date=date(2026, 10, 4)) == 75.0


def test_dashboard_statistics_summary(app_ctx):
    """Verify dashboard stats compute total habits, completed today, and best streak accurately."""
    user = User(username="tejaswini", email="tejaswini@example.com")
    user.set_password("password123")
    db.session.add(user)
    db.session.commit()

    h1 = Habit(user_id=user.id, name="Gym", category="Fitness", frequency="Daily")
    h2 = Habit(user_id=user.id, name="Meditation", category="Mindfulness", frequency="Daily")
    db.session.add_all([h1, h2])
    db.session.commit()

    ref_date = date(2026, 10, 4)
    db.session.add(HabitCompletion(habit_id=h1.id, completion_date=ref_date))
    db.session.commit()

    stats = get_dashboard_statistics(user.id, reference_date=ref_date)
    assert stats["total_habits"] == 2
    assert stats["active_habits"] == 2
    assert stats["completed_today"] == 1
    assert stats["best_streak"] == 1
