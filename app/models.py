"""
Database models for Habitty: User, Habit, and HabitCompletion.
"""
from datetime import datetime, date
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from app import db, login_manager


class User(UserMixin, db.Model):
    """Authenticated user account model."""
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationship: User 1 ---- * Habit
    habits = db.relationship(
        "Habit",
        backref="owner",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )

    def set_password(self, password: str) -> None:
        """Hash and store the user's password securely using Werkzeug."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Verify a plaintext password against the stored hash."""
        return check_password_hash(self.password_hash, password)

    def __repr__(self) -> str:
        return f"<User {self.username}>"


@login_manager.user_loader
def load_user(user_id: str):
    """Load user by ID for Flask-Login session management."""
    return db.session.get(User, int(user_id))


class Habit(db.Model):
    """Personal habit definition belonging to a specific user."""
    __tablename__ = "habits"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True, default="")
    category = db.Column(db.String(50), nullable=False, default="General")
    frequency = db.Column(db.String(20), nullable=False, default="Daily")  # 'Daily' or 'Weekly'
    target = db.Column(db.Integer, nullable=False, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    # Relationship: Habit 1 ---- * HabitCompletion
    completions = db.relationship(
        "HabitCompletion",
        backref="habit",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )

    def is_completed_on(self, target_date: date) -> bool:
        """Return True if this habit was marked completed on target_date."""
        record = self.completions.filter_by(
            completion_date=target_date, completed=True
        ).first()
        return record is not None

    def __repr__(self) -> str:
        return f"<Habit {self.name} (User {self.user_id})>"


class HabitCompletion(db.Model):
    """Daily completion log entry for a habit."""
    __tablename__ = "habit_completions"
    __table_args__ = (
        db.UniqueConstraint("habit_id", "completion_date", name="uq_habit_completion_date"),
    )

    id = db.Column(db.Integer, primary_key=True)
    habit_id = db.Column(
        db.Integer,
        db.ForeignKey("habits.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    completion_date = db.Column(db.Date, nullable=False, default=date.today, index=True)
    completed = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<HabitCompletion habit_id={self.habit_id} date={self.completion_date}>"
