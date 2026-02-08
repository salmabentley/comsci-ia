from datetime import date
import sys,os
from app import db
from app import app 
from werkzeug.security import generate_password_hash

# initialise database
with app.app_context(): 
    db.drop_all()
    db.create_all()
    db.session.commit()