"""
Automated pytest suite for Habitty habit CRUD, ownership security, and completion tracking:
- Create habit
- Read habit details
- Update habit
- Delete habit
- Prevent unauthorized habit access (403 Forbidden)
- Mark habit complete & prevent duplicate completion on same day
- Uncomplete habit
"""
from datetime import date
import pytest
from app import create_app, db
from app.models import User, Habit, HabitCompletion
from app.services.habit_service import mark_habit_complete


@pytest.fixture
def client():
    app = create_app("testing")
    with app.test_client() as test_client:
        with app.app_context():
            db.create_all()
            yield test_client
            db.session.remove()
            db.drop_all()


def register_and_login(client, username="tejaswini", email="tejaswini@example.com"):
    client.post(
        "/register",
        data={
            "username": username,
            "email": email,
            "password": "password123",
            "confirm_password": "password123",
        },
    )
    client.post("/login", data={"email": email, "password": "password123"})


def test_habit_crud_lifecycle(client):
    """Test creating, reading, updating, and deleting a habit."""
    register_and_login(client)

    # Create
    res = client.post(
        "/habits/create",
        data={
            "name": "Exercise",
            "description": "Workout for at least 45 minutes.",
            "category": "Fitness",
            "frequency": "Daily",
            "target": "1",
        },
        follow_redirects=True,
    )
    assert res.status_code == 200
    habit = Habit.query.filter_by(name="Exercise").first()
    assert habit is not None
    assert habit.category == "Fitness"

    # Read Details
    detail_res = client.get(f"/habits/{habit.id}")
    assert detail_res.status_code == 200
    assert b"Exercise" in detail_res.data

    # Update
    edit_res = client.post(
        f"/habits/{habit.id}/edit",
        data={
            "name": "Morning Gym",
            "description": "Strength training 45m",
            "category": "Fitness",
            "frequency": "Daily",
            "target": "1",
            "is_active": "on",
        },
        follow_redirects=True,
    )
    assert edit_res.status_code == 200
    updated = db.session.get(Habit, habit.id)
    assert updated.name == "Morning Gym"

    # Delete
    del_res = client.post(f"/habits/{habit.id}/delete", follow_redirects=True)
    assert del_res.status_code == 200
    assert db.session.get(Habit, habit.id) is None


def test_unauthorized_habit_access_forbidden(client):
    """Verify User B receives 403 Forbidden when attempting to view/edit/delete User A's habit."""
    register_and_login(client, username="user_a", email="a@example.com")
    client.post(
        "/habits/create",
        data={
            "name": "Private Journal",
            "description": "Write 1 page",
            "category": "Mindfulness",
            "frequency": "Daily",
            "target": "1",
        },
    )
    habit_a = Habit.query.filter_by(name="Private Journal").first()
    client.get("/logout")

    # Log in as User B
    register_and_login(client, username="user_b", email="b@example.com")

    assert client.get(f"/habits/{habit_a.id}").status_code == 403
    assert client.get(f"/habits/{habit_a.id}/edit").status_code == 403
    assert client.post(f"/habits/{habit_a.id}/delete").status_code == 403
    assert client.post(f"/habits/{habit_a.id}/complete").status_code == 403


def test_mark_complete_and_prevent_duplicate(client):
    """Verify completing a habit twice on the same date only stores 1 completion record."""
    register_and_login(client)
    client.post(
        "/habits/create",
        data={
            "name": "Read 20 Pages",
            "description": "Non-fiction reading",
            "category": "Study",
            "frequency": "Daily",
            "target": "1",
        },
    )
    habit = Habit.query.first()

    # Complete first time
    client.post(f"/habits/{habit.id}/complete")
    # Complete second time on the same day
    _, created_second = mark_habit_complete(habit, completion_date=date.today())
    assert created_second is False

    records = HabitCompletion.query.filter_by(habit_id=habit.id, completion_date=date.today()).all()
    assert len(records) == 1

    # Uncomplete
    client.post(f"/habits/{habit.id}/uncomplete")
    assert HabitCompletion.query.filter_by(habit_id=habit.id, completion_date=date.today()).count() == 0
