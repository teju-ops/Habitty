"""
Business logic service for habit management, daily completion, and streak calculation.
"""
from datetime import date, timedelta
from typing import List, Optional, Tuple
from sqlalchemy.exc import IntegrityError
from app import db
from app.models import Habit, HabitCompletion


def calculate_streak(habit_id: int, reference_date: Optional[date] = None) -> int:
    """
    Calculate the current consecutive-day completion streak for a habit.

    A streak remains active if the habit was completed on `reference_date` (today)
    OR on `reference_date - 1 day` (yesterday, before today is logged).
    """
    if reference_date is None:
        reference_date = date.today()

    completions = (
        HabitCompletion.query.filter_by(habit_id=habit_id, completed=True)
        .order_by(HabitCompletion.completion_date.desc())
        .all()
    )
    if not completions:
        return 0

    completed_dates = {c.completion_date for c in completions}

    # Determine starting anchor for consecutive count
    if reference_date in completed_dates:
        check_date = reference_date
    elif (reference_date - timedelta(days=1)) in completed_dates:
        check_date = reference_date - timedelta(days=1)
    else:
        return 0

    streak = 0
    while check_date in completed_dates:
        streak += 1
        check_date -= timedelta(days=1)

    return streak


def calculate_longest_streak(habit_id: int) -> int:
    """
    Calculate the all-time longest consecutive-day completion streak for a habit.
    """
    completions = (
        HabitCompletion.query.filter_by(habit_id=habit_id, completed=True)
        .order_by(HabitCompletion.completion_date.asc())
        .all()
    )
    if not completions:
        return 0

    sorted_dates = sorted({c.completion_date for c in completions})
    longest = 1
    current = 1

    for i in range(1, len(sorted_dates)):
        if sorted_dates[i] == sorted_dates[i - 1] + timedelta(days=1):
            current += 1
            if current > longest:
                longest = current
        else:
            current = 1

    return longest


def create_habit_for_user(
    user_id: int,
    name: str,
    description: str,
    category: str,
    frequency: str,
    target: int = 1,
) -> Habit:
    """Create and persist a new habit for the given user."""
    habit = Habit(
        user_id=user_id,
        name=name.strip(),
        description=(description or "").strip(),
        category=(category or "General").strip(),
        frequency=frequency if frequency in ("Daily", "Weekly") else "Daily",
        target=max(1, int(target or 1)),
        is_active=True,
    )
    db.session.add(habit)
    db.session.commit()
    return habit


def update_user_habit(
    habit: Habit,
    name: str,
    description: str,
    category: str,
    frequency: str,
    target: int,
    is_active: bool,
) -> Habit:
    """Update an existing habit's attributes and commit changes."""
    habit.name = name.strip()
    habit.description = (description or "").strip()
    habit.category = (category or "General").strip()
    habit.frequency = frequency if frequency in ("Daily", "Weekly") else "Daily"
    habit.target = max(1, int(target or 1))
    habit.is_active = bool(is_active)
    db.session.commit()
    return habit


def delete_user_habit(habit: Habit) -> None:
    """Delete a habit and its associated completion records."""
    db.session.delete(habit)
    db.session.commit()


def mark_habit_complete(
    habit: Habit, completion_date: Optional[date] = None
) -> Tuple[HabitCompletion, bool]:
    """
    Mark a habit as completed for `completion_date` (defaults to today).
    Returns (HabitCompletion, created_new_record).
    Prevents duplicate completion entries for the same habit and date.
    """
    target_date = completion_date or date.today()
    existing = HabitCompletion.query.filter_by(
        habit_id=habit.id, completion_date=target_date
    ).first()

    if existing:
        if not existing.completed:
            existing.completed = True
            db.session.commit()
        return existing, False

    completion = HabitCompletion(
        habit_id=habit.id,
        completion_date=target_date,
        completed=True,
    )
    db.session.add(completion)
    try:
        db.session.commit()
        return completion, True
    except IntegrityError:
        db.session.rollback()
        existing = HabitCompletion.query.filter_by(
            habit_id=habit.id, completion_date=target_date
        ).first()
        return existing, False


def unmark_habit_complete(
    habit: Habit, completion_date: Optional[date] = None
) -> bool:
    """
    Remove the completion record for `completion_date` (defaults to today).
    Returns True if a record was removed, False otherwise.
    """
    target_date = completion_date or date.today()
    existing = HabitCompletion.query.filter_by(
        habit_id=habit.id, completion_date=target_date
    ).first()

    if existing:
        db.session.delete(existing)
        db.session.commit()
        return True
    return False
