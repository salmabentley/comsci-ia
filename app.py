# loading all needed libraries
from flask import Flask, request, redirect, render_template, jsonify, json, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
import random
from werkzeug.security import generate_password_hash, check_password_hash
import uuid
import os
from datetime import date, datetime, timedelta
import pandas as pd
from sqlalchemy import func
from flask_mail import Mail, Message
from threading import Thread
import numpy as np
import joblib
from model_setup import create_or_load_model, update_model, retrain_model_from_orders
from werkzeug.utils import secure_filename

# basic app and database config
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
db = SQLAlchemy(app)

# setting up login management
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# mail server settings (using gmail for now)
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USERNAME'] = 'lostidlesinventory@gmail.com'
app.config['MAIL_PASSWORD'] = 'ynkx eike hnve xilm'
app.config['MAIL_DEFAULT_SENDER'] = 'lostidlesinventory@gmail.com'
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
mail = Mail(app)

# image upload rules
app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'static', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 512 * 1024 * 1024 
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# simple check to make sure the file is actually an image
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# loading the trained sales model from a pkl file
model, base_date = joblib.load("sales_model.pkl")

# --- terminal commands for dev ---

@app.cli.command('stock')
def show_stock_table():
    # peek at the first stock item in the console
    stock = Stock.query.all()
    print(stock[0])

@app.cli.command('reset-users')
def reset_users():
    # overrides the users table and starts fresh
    Users.__table__.drop(db.engine)
    db.create_all()

@app.cli.command('reset-orders')
def reset_users():
    # overrides the orders table
    Orders.__table__.drop(db.engine)
    db.create_all()

@app.cli.command('create-model')
def create_model():
    # builds the ml model based on current order history
    orders = db.session.query(Orders).order_by(Orders.order_date).all()
    model = create_or_load_model(orders)

# --- database models ---

class Users(UserMixin, db.Model):
    # standard user model for logins
    __tablename__ = 'users'
    user_id = db.Column(db.String(50), primary_key=True)
    username = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(5000), nullable=False)
    orders = db.relationship('Orders', back_populates='user', cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.username}>"
    
    def get_id(self):
        return str(self.user_id)

@login_manager.user_loader
def load_user(user_id):
    # helps flask-login find the right person
    return Users.query.get(user_id)

class Orders(db.Model):
    # keeping track of every sale made
    __tablename__ = 'orders'
    order_id = db.Column(db.String(50), primary_key=True)
    order_date = db.Column(db.Date, nullable=False, default=date.today)
    status = db.Column(db.Boolean, nullable=False) # true = complete, false = processing
    total = db.Column(db.Float, nullable=False)
    user_id = db.Column(db.String(50), db.ForeignKey('users.user_id'))
    user = db.relationship('Users', back_populates='orders')  
    order_items = db.relationship('OrderStock', back_populates='order', cascade="all, delete-orphan")

class Stock(db.Model):
    # what's currently in the warehouse
    __tablename__ = 'stock'
    stock_id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    stock_level = db.Column(db.Integer, nullable=False)
    image = db.Column(db.String(120), nullable=True)
    price = db.Column(db.Float, nullable=False)
    order_items = db.relationship('OrderStock', back_populates='stock', cascade="all, delete-orphan")

class OrderStock(db.Model):
    # junction table that links orders to specific products
    __tablename__ = 'order_stock'
    order_id = db.Column(db.String(50), db.ForeignKey('orders.order_id'), primary_key=True)
    stock_id = db.Column(db.String(50), db.ForeignKey('stock.stock_id'), primary_key=True)
    quantity = db.Column(db.Integer, nullable=False)
    order = db.relationship('Orders', back_populates='order_items')
    stock = db.relationship('Stock', back_populates='order_items')

# --- routes and logic ---

@app.route("/predict-sales", methods=["GET", "POST"])
@login_required
def predict_sales():
    # guesses future sales based on past data
    if request.method == "POST":
        data = request.get_json()
        days_ahead = data.get("days_ahead", [1])
        today_offset = (date.today() - base_date).days
        future_offsets = np.array([today_offset + d for d in days_ahead]).reshape(-1, 1)
        predictions = model.predict(future_offsets)
        return jsonify({
            "days_ahead": days_ahead,
            "predicted_sales": predictions.tolist()
        })
    else:
        # if just loading the page, crunch numbers for week/month/year views
        today_offset = (date.today() - base_date).days
        # calculate the next 7 days
        days_week = list(range(1, 8))
        offsets_week = np.array([today_offset + d for d in days_week]).reshape(-1, 1)
        pred_week = model.predict(offsets_week)
        week_labels = [(date.today() + timedelta(days=d)).strftime("%Y-%m-%d") for d in days_week]

        # calculate for the next 60 days
        days_month = list(range(1, 61))
        offsets_month = np.array([today_offset + d for d in days_month]).reshape(-1, 1)
        pred_month = model.predict(offsets_month)
        month_dates = [date.today() + timedelta(days=d) for d in days_month]
        df_month = pd.DataFrame({"date": month_dates, "prediction": pred_month})
        df_month["date"] = pd.to_datetime(df_month["date"])
        df_month["year_month"] = df_month["date"].dt.to_period("M")
        grouped_month = df_month.groupby("year_month")["prediction"].sum().reset_index()
        
        # for a whole year
        pred_year = model.predict(np.array([today_offset + d for d in range(1, 366)]).reshape(-1, 1))

        return render_template(
            "prediction.html",
            week_labels=week_labels,
            week_values=pred_week.round(2).tolist(),
            month_labels=grouped_month["year_month"].astype(str).tolist(),
            month_values=grouped_month["prediction"].round(2).tolist(),
            year_total=round(pred_year.sum(), 2)
        )

@app.route('/login', methods=['GET', 'POST'])
def login():
    # letting users back into the system
    if request.method == 'POST':
        credentials = json.loads(request.data)
        user = Users.query.filter_by(username=credentials['username']).first()
        if user and check_password_hash(user.password, credentials['password']):
            login_user(user, remember=True)
            return redirect(url_for('dashboard'))
        return "Invalid credentials", 401
    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
@login_required
def create_account():
    # making new user accounts (needs a login already to create more)
    if request.method == 'POST':
        account = json.loads(request.data)
        try:
            new_user = Users(
                user_id=uuid.uuid4().hex,
                username=account['username'],
                email=account['email'],
                password=generate_password_hash(account['password'], method='scrypt')
            )
            db.session.add(new_user)
            db.session.commit()
            login_user(new_user, remember=True)
            return redirect(url_for('dashboard'))
        except Exception as e:
            db.session.rollback()
            return "Error", 500
    return render_template('create_account.html') 

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/')
@login_required
def dashboard():
    # the main dashboard where all the stats live
    today = date.today()
    start_of_week = today - timedelta(days=today.weekday()) 
    start_of_last_week = start_of_week - timedelta(days=7)
    end_of_last_week = start_of_week - timedelta(days=1)

    # get this week's sales total
    try:
        weekly_sales = db.session.query(func.sum(Orders.total)).filter(Orders.order_date >= start_of_week).scalar() or 0
    except:
        weekly_sales = 0

    # compare against last week
    last_week_sales = db.session.query(func.round(func.sum(Orders.total), 2)).filter(
        Orders.order_date >= start_of_last_week, Orders.order_date <= end_of_last_week
    ).scalar() or 0

    # stats for a quick chart (last 3 days)
    last_three_sales = db.session.query(
        Orders.order_date, func.round(func.sum(Orders.total), 2).label("total")
    ).filter(Orders.order_date >= (today - timedelta(days=2))).group_by(Orders.order_date).all()

    sales_data = {
        "labels": [row.order_date.strftime("%a") for row in last_three_sales],
        "values": [float(row.total) for row in last_three_sales]
    }

    # math for the percentage change bubble
    current_sales = sum(sales_data["values"])
    percentage_change = ((current_sales - last_week_sales) / last_week_sales * 100) if last_week_sales > 0 else 0

    # find low stock and pending orders
    stock = db.session.execute(db.select(Stock).filter(Stock.stock_level < 15)).scalars()
    orders = db.session.execute(db.select(Orders).filter_by(status=False)).scalars()

    return render_template(
        'dashboard.html', 
        stock=stock, 
        orders=[{'order_id': o.order_id, 'total': o.total, 'status': o.status, 'items': len(o.order_items)} for o in orders],
        weekly_sales=weekly_sales,
        last_week_sales=last_week_sales,
        percentage=percentage_change,
        sales_data=sales_data
    )

@app.route('/analytics')
@login_required
def analytics():
    # data for charts and top sellers
    orders = Orders.query.all()
    df = pd.DataFrame([{'date': o.order_date, 'total': o.total} for o in orders])
    df['date'] = pd.to_datetime(df['date'])

    # calculate this month's stats
    now = datetime.now()
    this_month_df = df[df['date'].dt.month == now.month]
    
    # identify the best and worst products
    order_stocks = OrderStock.query.all()
    sales_map = {}
    for os_item in order_stocks:
        sid = os_item.stock_id
        if sid not in sales_map:
            s = Stock.query.get(sid)
            sales_map[sid] = {'name': s.name, 'orders': 0, 'revenue': 0, 'image': s.image}
        sales_map[sid]['orders'] += os_item.quantity
        sales_map[sid]['revenue'] += os_item.quantity * Stock.query.get(sid).price

    sorted_sales = sorted(sales_map.values(), key=lambda x: x['orders'], reverse=True)

    return render_template('analytics.html',
                           best_seller=sorted_sales[0] if sorted_sales else None,
                           worst_seller=sorted_sales[-1] if sorted_sales else None,
                           this_month_orders=len(this_month_df),
                           this_month_revenue=this_month_df['total'].sum())

# --- api and update routes ---

@app.route('/update-orders', methods=['PATCH'])
@login_required
def update_orders():
    # toggle an order from processing to complete (and fix stock levels)
    data = request.json
    order_ids = data.get('orders', [])
    orders_to_update = db.session.execute(db.select(Orders).filter(Orders.order_id.in_(order_ids))).scalars().all()

    for order_obj in orders_to_update:
        new_status = not order_obj.status
        order_obj.status = new_status
        # adjust stock based on whether order was fulfilled or cancelled
        for item in order_obj.order_items:
            if item.stock:
                item.stock.stock_level += (-item.quantity if new_status else item.quantity)

    db.session.commit()
    return '', 204

def send_mail_async(app, msg):
    # helper to send mail in the background so the app doesn't lag
    with app.app_context():
        mail.send(msg)

def send_stock_email(stock):
    # notify everyone of which stocks are low
    users = Users.query.all()
    low_stock_items = Stock.query.filter(Stock.stock_level < 15).all()
    recipient_emails = [user.email for user in users]
    msg = Message(subject=f"Stock Alert: {stock.name}", recipients=recipient_emails)
    msg.html = render_template('stock_email.html', stock=stock, low_stock_items=low_stock_items)
    Thread(target=send_mail_async, args=(app,msg)).start()

@app.route('/orders', methods=['GET', 'POST'])
@login_required
def manage_orders():
    # creating new orders or viewing current ones
    if request.method == 'POST':
        data = request.json
        new_order = Orders(
            order_id=data['id'] or uuid.uuid4().hex,
            order_date=datetime.strptime(data['date'], '%Y-%m-%d').date() if data.get('date') else date.today(),
            status=False,
            total=data['total'],
            user_id=current_user.user_id
        )
        for item in data['order']:
            stock = Stock.query.get(item['stock_id'])
            if stock.stock_level - item['quantity'] < 15:
                send_stock_email(stock)
            new_order.order_items.append(OrderStock(stock_id=item['stock_id'], quantity=item['quantity']))

        db.session.add(new_order)
        db.session.commit()
        # update our ml model with the new data
        global model, base_date
        model = update_model(model, base_date, new_order)
        return redirect(url_for('manage_orders'))
    
    stock = Stock.query.all()
    return render_template('order.html', stock=[{'stock_id': s.stock_id, 'name': s.name, 'quantity': s.stock_level, 'price': s.price} for s in stock])

@app.route('/stock', methods=['GET', 'POST'])
@login_required
def manage_stock():
    # adding new items to the inventory
    if request.method == 'POST':
        image_file = request.files.get('image')
        filename = f"{uuid.uuid4().hex}_{image_file.filename}" if image_file else None
        if image_file: image_file.save(os.path.join('static', 'uploads', filename))

        new_stock = Stock(
            stock_id=uuid.uuid4().hex,
            name=request.form['name'],
            category=request.form['category'],
            price=float(request.form['price']),
            stock_level=int(request.form['quantity']),
            image=filename
        )
        db.session.add(new_stock)
        db.session.commit()
        return redirect(url_for('manage_stock'))
    return render_template('stock.html')

if __name__ == '__main__':
    # starting the engines
    app.run(debug=True)