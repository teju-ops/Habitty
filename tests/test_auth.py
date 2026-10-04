"""
Automated pytest suite for Habitty user authentication:
- User registration
- Duplicate email rejection
- Duplicate username rejection
- Login with valid credentials
- Login with invalid credentials
- Logout and route protection
"""
import pytest
from app import create_app, db
from app.models import User


@pytest.fixture
def client():
    app = create_app("testing")
    with app.test_client() as test_client:
        with app.app_context():
            db.create_all()
            yield test_client
            db.session.remove()
            db.drop_all()


def test_user_registration_and_password_hashing(client):
    """Test valid registration hashes password and redirects to login."""
    response = client.post(
        "/register",
        data={
            "username": "tejaswini",
            "email": "tejaswini@example.com",
            "password": "securepassword123",
            "confirm_password": "securepassword123",
        },
        follow_redirects=False,
    )
    assert response.status_code == 302
    assert "/login" in response.headers["Location"]

    user = User.query.filter_by(email="tejaswini@example.com").first()
    assert user is not None
    assert user.username == "tejaswini"
    assert user.password_hash != "securepassword123"
    assert user.check_password("securepassword123") is True


def test_duplicate_email_and_username_rejected(client):
    """Test that duplicate usernames or emails cannot register."""
    client.post(
        "/register",
        data={
            "username": "tejaswini",
            "email": "tejaswini@example.com",
            "password": "password123",
            "confirm_password": "password123",
        },
    )

    # Duplicate username
    dup_user = client.post(
        "/register",
        data={
            "username": "tejaswini",
            "email": "other@example.com",
            "password": "password123",
            "confirm_password": "password123",
        },
    )
    assert dup_user.status_code == 400
    assert b"already taken" in dup_user.data

    # Duplicate email
    dup_email = client.post(
        "/register",
        data={
            "username": "anotheruser",
            "email": "tejaswini@example.com",
            "password": "password123",
            "confirm_password": "password123",
        },
    )
    assert dup_email.status_code == 400
    assert b"already exists" in dup_email.data


def test_login_valid_and_invalid_credentials(client):
    """Test login with valid credentials, wrong password, and unknown email."""
    client.post(
        "/register",
        data={
            "username": "tejaswini",
            "email": "tejaswini@example.com",
            "password": "password123",
            "confirm_password": "password123",
        },
    )

    # Invalid password
    bad_pw = client.post(
        "/login",
        data={"email": "tejaswini@example.com", "password": "wrongpassword"},
    )
    assert bad_pw.status_code == 401
    assert b"Invalid password" in bad_pw.data

    # Invalid email
    bad_email = client.post(
        "/login",
        data={"email": "nonexistent@example.com", "password": "password123"},
    )
    assert bad_email.status_code == 401
    assert b"Invalid email" in bad_email.data

    # Valid login
    good_login = client.post(
        "/login",
        data={"email": "tejaswini@example.com", "password": "password123"},
        follow_redirects=False,
    )
    assert good_login.status_code == 302
    assert "/dashboard" in good_login.headers["Location"]


def test_logout_and_protected_routes(client):
    """Test that logging out clears session and protects /dashboard."""
    client.post(
        "/register",
        data={
            "username": "tejaswini",
            "email": "tejaswini@example.com",
            "password": "password123",
            "confirm_password": "password123",
        },
    )
    client.post(
        "/login",
        data={"email": "tejaswini@example.com", "password": "password123"},
    )

    logout_res = client.get("/logout", follow_redirects=False)
    assert logout_res.status_code == 302
    assert "/login" in logout_res.headers["Location"]

    dash_res = client.get("/dashboard", follow_redirects=False)
    assert dash_res.status_code == 302
    assert "/login" in dash_res.headers["Location"]
