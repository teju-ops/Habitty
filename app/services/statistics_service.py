"""
Analytics and statistics service for Habitty.
Calculates completion rates, user-wide dashboard metrics, calendar history, and weekly chart series.
"""
import calendar
from datetime import date, timedelta
from typing import Dict, Any, List, Optional
from app.models import Habit, HabitCompletion
from app.services.habit_service import calculate_streak, calculate_longest_streak


def calculate_completion_rate(habit: Habit, reference_date: Optional[date] = None) -> float:
    """
    Calculate the completion percentage for a habit since its creation date.
    Formula: (completed_days / expected_days) * 100, capped at 100.0%.
    """
    if reference_date is None:
        reference_date = date.today()

    created_date = habit.created_at.date() if habit.created_at else reference_date
    total_completions = HabitCompletion.query.filter_by(
        habit_id=habit.id, completed=True
    ).count()

    if habit.frequency == "Weekly":
        days_elapsed = max(1, (reference_date - created_date).days + 1)
        weeks_elapsed = max(1, (days_elapsed + 6) // 7)
        expected = weeks_elapsed * max(1, habit.target)
    else:
        expected = max(1, (reference_date - created_date).days + 1)

    rate = (total_completions / expected) * 100.0
    return round(min(100.0, rate), 1)


def get_habit_statistics(habit: Habit, reference_date: Optional[date] = None) -> Dict[str, Any]:
    """Return comprehensive statistics for a single habit."""
    if reference_date is None:
        reference_date = date.today()

    total_completions = HabitCompletion.query.filter_by(
        habit_id=habit.id, completed=True
    ).count()
    current_streak = calculate_streak(habit.id, reference_date=reference_date)
    longest_streak = calculate_longest_streak(habit.id)
    completion_rate = calculate_completion_rate(habit, reference_date=reference_date)
    completed_today = habit.is_completed_on(reference_date)

    return {
        "habit_id": habit.id,
        "total_completions": total_completions,
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "completion_rate": completion_rate,
        "completed_today": completed_today,
    }


def get_dashboard_statistics(user_id: int, reference_date: Optional[date] = None) -> Dict[str, Any]:
    """
    Calculate summary metrics for a user's dashboard:
    - Total Habits
    - Active Habits
    - Completed Today
    - Current Best Streak
    - Weekly chart data (last 7 days)
    """
    if reference_date is None:
        reference_date = date.today()

    habits = Habit.query.filter_by(user_id=user_id).order_by(Habit.created_at.desc()).all()
    total_habits = len(habits)
    active_habits = [h for h in habits if h.is_active]
    active_count = len(active_habits)

    completed_today_count = 0
    best_streak = 0

    for habit in habits:
        streak = calculate_streak(habit.id, reference_date=reference_date)
        if streak > best_streak:
            best_streak = streak
        if habit.is_active and habit.is_completed_on(reference_date):
            completed_today_count += 1

    weekly_chart = get_weekly_completion_series(user_id, reference_date=reference_date)

    return {
        "total_habits": total_habits,
        "active_habits": active_count,
        "completed_today": completed_today_count,
        "best_streak": best_streak,
        "weekly_chart": weekly_chart,
    }


def get_weekly_completion_series(
    user_id: int, reference_date: Optional[date] = None
) -> Dict[str, List[Any]]:
    """
    Build dynamic Chart.js labels and completion counts for the last 7 days.
    """
    if reference_date is None:
        reference_date = date.today()

    user_habits = Habit.query.filter_by(user_id=user_id).all()
    habit_ids = [h.id for h in user_habits]

    labels: List[str] = []
    dates_iso: List[str] = []
    counts: List[int] = []

    start_date = reference_date - timedelta(days=6)

    if habit_ids:
        completions = HabitCompletion.query.filter(
            HabitCompletion.habit_id.in_(habit_ids),
            HabitCompletion.completed.is_(True),
            HabitCompletion.completion_date >= start_date,
            HabitCompletion.completion_date <= reference_date,
        ).all()
    else:
        completions = []

    count_by_date: Dict[date, int] = {}
    for comp in completions:
        count_by_date[comp.completion_date] = count_by_date.get(comp.completion_date, 0) + 1

    for offset in range(6, -1, -1):
        day = reference_date - timedelta(days=offset)
        labels.append(day.strftime("%a"))
        dates_iso.append(day.isoformat())
        counts.append(count_by_date.get(day, 0))

    return {
        "labels": labels,
        "dates": dates_iso,
        "counts": counts,
    }


def get_monthly_calendar_grid(
    habit: Habit, year: Optional[int] = None, month: Optional[int] = None
) -> Dict[str, Any]:
    """
    Build a monthly calendar grid for the Habit Details page showing completed days.
    Weeks start on Monday (Mon..Sun).
    """
    today = date.today()
    target_year = year or today.year
    target_month = month or today.month

    cal = calendar.Calendar(firstweekday=0)
    month_days = cal.monthdatescalendar(target_year, target_month)

    start_of_month = date(target_year, target_month, 1)
    _, last_day_num = calendar.monthrange(target_year, target_month)
    end_of_month = date(target_year, target_month, last_day_num)

    completions = HabitCompletion.query.filter(
        HabitCompletion.habit_id == habit.id,
        HabitCompletion.completed.is_(True),
        HabitCompletion.completion_date >= start_of_month,
        HabitCompletion.completion_date <= end_of_month,
    ).all()
    completed_dates = {c.completion_date for c in completions}

    created_date = habit.created_at.date() if habit.created_at else start_of_month

    weeks = []
    for week in month_days:
        week_row = []
        for d in week:
            in_month = d.month == target_month
            is_completed = d in completed_dates
            is_Missed = (
                in_month
                and not is_completed
                and created_date <= d < today
            )
            week_row.append({
                "date": d.isoformat(),
                "day": d.day,
                "in_month": in_month,
                "completed": is_completed,
                "missed": is_Missed,
                "is_today": d == today,
            })
        weeks.append(week_row)

    return {
        "year": target_year,
        "month": target_month,
        "month_name": calendar.month_name[target_month],
        "weeks": weeks,
    }
