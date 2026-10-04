# Habitty

A minimalist Python-based habit tracking application that helps users create, manage, and track daily habits.

## Features

- **User Authentication**: Secure registration, login, and session management with Flask-Login.
- **Secure Password Hashing**: Passwords hashed via Werkzeug (`generate_password_hash` / `check_password_hash`).
- **Habit CRUD**: Create, read, update, and delete personal daily or weekly habits.
- **Strict Ownership Authorization**: Prevents users from viewing or modifying another user's habits (`403 Forbidden`).
- **Daily Habit Tracking**: Mark and unmark daily habit completions with database-enforced uniqueness per date.
- **Streak Calculation**: Reusable service (`calculate_streak`) computing active and all-time longest consecutive streaks.
- **Progress Statistics & Chart.js**: Dynamic dashboard KPIs, completion rates, monthly completion calendar, and 7-day completion bar chart.
- **Responsive UI**: Clean, modern minimalist interface built with CSS variables, Grid/Flexbox, and semantic HTML5.
- **Modular Flask Architecture**: Application factory pattern (`create_app`) with separated `auth`, `habits`, and `dashboard` Blueprints and business logic services.

## Tech Stack

```text
Python 3.x
Flask
Flask-SQLAlchemy
Flask-Login
Flask-WTF
Werkzeug
SQLite
HTML5 / CSS3 / JavaScript
Jinja2 Templates
Chart.js
Pytest
```

## Project Structure

```text
habitty/
├── app/
│   ├── __init__.py
│   ├── models.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── habits.py
│   │   └── dashboard.py
│   ├── services/
│   │   ├── habit_service.py
│   │   └── statistics_service.py
│   ├── templates/
│   │   ├── base.html
│   │   ├── 403.html
│   │   ├── 404.html
│   │   ├── 500.html
│   │   ├── auth/
│   │   │   ├── login.html
│   │   │   └── register.html
│   │   ├── dashboard/
│   │   │   └── dashboard.html
│   │   └── habits/
│   │       ├── create.html
│   │       ├── edit.html
│   │       └── details.html
│   └── static/
│       ├── css/
│       │   └── style.css
│       └── js/
│           └── app.js
├── instance/
│   └── habitty.db
├── tests/
│   ├── test_auth.py
│   ├── test_habits.py
│   └── test_dashboard.py
├── config.py
├── run.py
├── requirements.txt
├── .env.example
└── README.md
```

## Installation

1. Clone the repository and navigate to the project directory:

```bash
git clone <repository-url>
cd habitty
python -m venv venv
```

2. Activate the virtual environment:

**Windows:**

```bash
venv\Scripts\activate
```

**macOS / Linux:**

```bash
source venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the root directory:

```text
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///habitty.db
```

5. Run the application:

```bash
python run.py
```

6. Open in your browser:

```text
http://127.0.0.1:5000
```

## Running Automated Tests

```bash
pytest
```

## Screenshots

- **Login** (`docs/screenshots/login.png`)
- **Register** (`docs/screenshots/register.png`)
- **Dashboard** (`docs/screenshots/dashboard.png`)
- **Create Habit** (`docs/screenshots/create_habit.png`)
- **Habit Details & Monthly Calendar** (`docs/screenshots/habit_details.png`)
- **Weekly Progress Analytics** (`docs/screenshots/analytics.png`)

## Future Improvements

- Email reminders and daily digest summaries
- Web push notifications
- Google OAuth authentication
- PostgreSQL production database migration
- Docker and Gunicorn container deployment
- RESTful API endpoints with JWT authentication
- Mobile companion application
- AI-powered personalized habit coaching
