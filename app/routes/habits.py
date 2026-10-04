"""
Habit management routes for Habitty:
- /habits/create
- /habits/<id>
- /habits/<id>/edit
- /habits/<id>/delete
- /habits/<id>/complete
- /habits/<id>/uncomplete
"""
from datetime import date
from flask import (
    Blueprint,
    render_template,
    redirect,
    url_for,
    flash,
    request,
    abort,
    jsonify,
)
from flask_login import login_required, current_user
from app import db
from app.models import Habit
from app.services.habit_service import (
    create_habit_for_user,
    update_user_habit,
    delete_user_habit,
    mark_habit_complete,
    unmark_habit_complete,
    calculate_streak,
)
from app.services.statistics_service import (
    get_habit_statistics,
    get_monthly_calendar_grid,
)

habits_bp = Blueprint("habits", __name__)


def get_owned_habit_or_403(habit_id: int) -> Habit:
    """
    Fetch a habit by ID and enforce strict ownership check:
    `habit.user_id == current_user.id`
    Raises 404 if not found, or 403 Forbidden if owned by another user.
    """
    habit = db.session.get(Habit, habit_id)
    if habit is None:
        abort(404)
    if habit.user_id != current_user.id:
        abort(403)
    return habit


@habits_bp.route("/create", methods=["GET", "POST"])
@login_required
def create():
    """Create a new habit for the logged-in user."""
    if request.method == "POST":
        name = (request.form.get("name") or "").strip()
        description = (request.form.get("description") or "").strip()
        category = (request.form.get("category") or "").strip()
        frequency = (request.form.get("frequency") or "").strip()
        target_raw = request.form.get("target") or "1"

        if not name:
            flash("Habit name is required.", "danger")
            return render_template("habits/create.html"), 400

        if not category:
            flash("Category is required.", "danger")
            return render_template("habits/create.html"), 400

        if frequency not in ("Daily", "Weekly"):
            flash("Frequency must be Daily or Weekly.", "danger")
            return render_template("habits/create.html"), 400

        try:
            target = int(target_raw)
            if target < 1:
                raise ValueError
        except ValueError:
            flash("Target must be a positive integer.", "danger")
            return render_template("habits/create.html"), 400

        create_habit_for_user(
            user_id=current_user.id,
            name=name,
            description=description,
            category=category,
            frequency=frequency,
            target=target,
        )
        flash(f"Habit '{name}' created.", "success")
        return redirect(url_for("dashboard.index"))

    return render_template("habits/create.html")


@habits_bp.route("/<int:habit_id>")
@login_required
def details(habit_id: int):
    """Display detailed statistics and monthly completion calendar for a habit."""
    habit = get_owned_habit_or_403(habit_id)
    stats = get_habit_statistics(habit)
    calendar_data = get_monthly_calendar_grid(habit)
    return render_template(
        "habits/details.html",
        habit=habit,
        stats=stats,
        calendar_data=calendar_data,
    )


@habits_bp.route("/<int:habit_id>/edit", methods=["GET", "POST"])
@login_required
def edit(habit_id: int):
    """Edit an existing habit after verifying ownership."""
    habit = get_owned_habit_or_403(habit_id)

    if request.method == "POST":
        name = (request.form.get("name") or "").strip()
        description = (request.form.get("description") or "").strip()
        category = (request.form.get("category") or "").strip()
        frequency = (request.form.get("frequency") or "").strip()
        target_raw = request.form.get("target") or "1"
        is_active = request.form.get("is_active") in ("on", "true", "1", "True")

        if not name or not category or frequency not in ("Daily", "Weekly"):
            flash("Please provide a valid name, category, and frequency.", "danger")
            return render_template("habits/edit.html", habit=habit), 400

        try:
            target = max(1, int(target_raw))
        except ValueError:
            flash("Target must be a positive integer.", "danger")
            return render_template("habits/edit.html", habit=habit), 400

        update_user_habit(
            habit=habit,
            name=name,
            description=description,
            category=category,
            frequency=frequency,
            target=target,
            is_active=is_active,
        )
        flash(f"Habit '{habit.name}' updated.", "success")
        return redirect(url_for("dashboard.index"))

    return render_template("habits/edit.html", habit=habit)


@habits_bp.route("/<int:habit_id>/delete", methods=["POST"])
@login_required
def delete(habit_id: int):
    """Delete a habit and its completion records via POST after ownership check."""
    habit = get_owned_habit_or_403(habit_id)
    habit_name = habit.name
    delete_user_habit(habit)
    flash(f"Habit '{habit_name}' has been deleted.", "info")
    return redirect(url_for("dashboard.index"))


@habits_bp.route("/<int:habit_id>/complete", methods=["POST"])
@login_required
def complete(habit_id: int):
    """Mark a habit as completed for today."""
    habit = get_owned_habit_or_403(habit_id)
    _, created = mark_habit_complete(habit, completion_date=date.today())
    streak = calculate_streak(habit.id)

    if request.headers.get("X-Requested-With") == "XMLHttpRequest" or request.is_json:
        return jsonify({
            "status": "completed",
            "habit_id": habit.id,
            "completed_today": True,
            "created": created,
            "current_streak": streak,
        })

    flash(f"Marked '{habit.name}' as completed for today!", "success")
    return redirect(request.referrer or url_for("dashboard.index"))


@habits_bp.route("/<int:habit_id>/uncomplete", methods=["POST"])
@login_required
def uncomplete(habit_id: int):
    """Undo today's completion record for a habit."""
    habit = get_owned_habit_or_403(habit_id)
    removed = unmark_habit_complete(habit, completion_date=date.today())
    streak = calculate_streak(habit.id)

    if request.headers.get("X-Requested-With") == "XMLHttpRequest" or request.is_json:
        return jsonify({
            "status": "uncompleted",
            "habit_id": habit.id,
            "completed_today": False,
            "removed": removed,
            "current_streak": streak,
        })

    flash(f"Undid today's completion for '{habit.name}'.", "info")
    return redirect(request.referrer or url_for("dashboard.index"))
