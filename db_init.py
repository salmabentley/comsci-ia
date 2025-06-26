from datetime import date
import sys,os
# scriptpath =os.path.dirname(os.path.abspath(__file__))
# print(scriptpath)
# sys.path.append(scriptpath)
from app import db
from app import app 
from werkzeug.security import generate_password_hash


with app.app_context(): 
    db.drop_all()
    db.create_all()
    db.session.commit()