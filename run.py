"""
Entry point to run the Habitty Flask application.
"""
import os
from app import create_app, db

config_name = os.environ.get("FLASK_ENV", "default")
app = create_app(config_name)

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=(config_name == "default"))
