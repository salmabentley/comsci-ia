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

from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USERNAME'] = 'lostidlesinventory@gmail.com'
app.config['MAIL_PASSWORD'] = 'ynkx eike hnve xilm'
app.config['MAIL_DEFAULT_SENDER'] = 'lostidlesinventory@gmail.com'
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
mail = Mail(app)

#image checks
app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'static', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 512 * 1024 * 1024 
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS



@app.cli.command('stock')
def show_stock_table():
    stock = Stock.query.all()
    print(stock[0])

@app.cli.command('reset-users')
def reset_users():
    Users.__table__.drop(db.engine)
    db.create_all()
@app.cli.command('reset-orders')
def reset_users():
    Orders.__table__.drop(db.engine)
    db.create_all()

class Users(UserMixin, db.Model):
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
    return Users.query.get(user_id)

class Orders(db.Model):
    __tablename__ = 'orders'
    order_id = db.Column(db.String(50), primary_key=True)
    # user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    order_date = db.Column(db.Date, nullable=False, default=date.today)
    status = db.Column(db.Boolean, nullable=False)
    total = db.Column(db.Float, nullable=False)
    
    user_id = db.Column(db.String(50), db.ForeignKey('users.user_id'))
    user = db.relationship('Users', back_populates='orders')  
    order_items = db.relationship('OrderStock', back_populates='order', cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Order {self.order_id}>"


class Stock(db.Model):
    __tablename__ = 'stock'
    stock_id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    stock_level = db.Column(db.Integer, nullable=False)
    image = db.Column(db.String(120), nullable=True)
    price = db.Column(db.Float, nullable=False)

    order_items = db.relationship('OrderStock', back_populates='stock', cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Stock {self.name}>"


class OrderStock(db.Model):
    __tablename__ = 'order_stock'
    order_id = db.Column(db.String(50), db.ForeignKey('orders.order_id'), primary_key=True)
    stock_id = db.Column(db.String(50), db.ForeignKey('stock.stock_id'), primary_key=True)
    quantity = db.Column(db.Integer, nullable=False)

    order = db.relationship('Orders', back_populates='order_items')
    stock = db.relationship('Stock', back_populates='order_items')

    def __repr__(self):
        return f"<OrderStock Order:{self.order_id} Stock:{self.stock_id} Qty:{self.quantity}>"

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.data
        credentials = json.loads(data)
        username = credentials['username']
        password = credentials['password']
        user = Users.query.filter_by(username=username).first()
        if user and check_password_hash(user.password, password):
            login_user(user, remember=True)
            return redirect(url_for('dashboard'))
        else:
            return "Invalid credentials", 401
    else:
        return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def create_account():
    if request.method == 'POST':
        data = request.data
        account = json.loads(data)
        print(data)
        print(account)
        username = account['username']
        email = account['email']
        password = account['password']
        try:
            new_user = Users(
                user_id=uuid.uuid4().hex,
                username=username,
                email=email,
                password=generate_password_hash(password, method='scrypt')
            )
            db.session.add(new_user)
            db.session.commit()
            login_user(new_user, remember=True)
            print('created')
            return redirect(url_for('dashboard'))
        except Exception as e:
            db.session.rollback()
            print(e)
            return "Error", 500
    else:
        return render_template('create_account.html')
    
@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/')
@login_required
def dashboard():
    today = date.today()
    start_of_week = today - timedelta(days=today.weekday())   # Monday of current week
    start_of_last_week = start_of_week - timedelta(days=7)
    end_of_last_week = start_of_week - timedelta(days=1)

    # --- Current Week Sales (grouped by day) ---
    try:
        weekly_sales = (
            db.session.query(
                func.strftime('%w', Orders.order_date).label("weekday"),  # 0=Sunday ... 6=Saturday
                func.sum(Orders.total).label("total")
            )
            .filter(Orders.order_date >= start_of_week)
            .group_by("weekday")
            .all()
        )[0][1]
    except:
        weekly_sales = 0


    # --- Last Week Total ---
    last_week_sales = (
        db.session.query(func.sum(Orders.total))
        .filter(Orders.order_date >= start_of_last_week, Orders.order_date <= end_of_last_week)
        .scalar()
    ) or 0

    # --- Chart: Last 3 days sales ---
    three_days_ago = today - timedelta(days=2)
    last_three_sales = (
        db.session.query(
            Orders.order_date,
            func.sum(Orders.total).label("total")
        )
        .filter(Orders.order_date >= three_days_ago)
        .group_by(Orders.order_date)
        .order_by(Orders.order_date)
        .all()
    )

    # format labels/values
    labels = [row.order_date.strftime("%a") for row in last_three_sales]  # Mon, Tue, Wed
    values = [float(row.total) for row in last_three_sales]
    sales_data = {"labels": labels, "values": values}

    current_sales = sum(values)
    print(values)
    percentage_change = ((current_sales - last_week_sales) / last_week_sales * 100) if last_week_sales > 0 else 0

    # --- Stock & Orders (unchanged) ---
    stock = db.session.execute(db.select(Stock).filter(Stock.stock_level < 15)).scalars()
    orders = db.session.execute(db.select(Orders).filter_by(status=False)).scalars()

    orders_list = []
    for order_obj in orders:
        orders_list.append({
            'order_id': order_obj.order_id,
            'total': order_obj.total,
            'status': order_obj.status,
            'items': len(order_obj.order_items)
        })

    return render_template(
        'dashboard.html', 
        stock=stock, 
        orders=orders_list,
        weekly_sales=weekly_sales,
        last_week_sales=last_week_sales,
        percentage=percentage_change,
        sales_data=sales_data
    )


@app.route('/analytics')
@login_required
def analytics():
    # Query all order data
    orders = Orders.query.all()

    # Create dataframe from orders
    df = pd.DataFrame([{
        'order_id': o.order_id,
        'date': o.order_date,
        'total': o.total,
        'status': 'Complete' if o.status else 'Processing'
    } for o in orders])

    # Group by month for chart
    df['month'] = pd.to_datetime(df['date']).dt.strftime('%B')  # 'March', 'April', etc.
    monthly_data = df.groupby('month')['total'].agg(['sum', 'count']).reset_index()
    monthly_data = monthly_data.sort_values(by='month')
    df['date'] = pd.to_datetime(df['date'])

    # Calculate this month's revenue and orders
    now = datetime.now()
    this_month_df = df[df['date'].dt.month == now.month]
    this_month_orders = len(this_month_df)
    this_month_revenue = this_month_df['total'].sum()

    # Get best/worst seller
    order_stocks = OrderStock.query.all()
    sales_data = {}

    for os in order_stocks:
        stock_id = os.stock_id
        stock = Stock.query.get(stock_id)
        if stock_id not in sales_data:
            sales_data[stock_id] = {'name': stock.name, 'orders': 0, 'revenue': 0, 'image': stock.image}
        sales_data[stock_id]['orders'] += os.quantity
        sales_data[stock_id]['revenue'] += os.quantity * stock.price

    sorted_sales = sorted(sales_data.values(), key=lambda x: x['orders'], reverse=True)
    best_seller = sorted_sales[0] if sorted_sales else None
    worst_seller = sorted_sales[-1] if sorted_sales else None
    # Group by Month
    df['month'] = df['date'].dt.strftime('%B')
    month_data = df.groupby('month')['total'].sum().reset_index()

    # Group by Day (latest 7 days)
    df['day'] = df['date'].dt.strftime('%Y-%m-%d')
    day_data = df.groupby('day')['total'].sum().reset_index().tail(7)

    # Group by Year
    df['year'] = df['date'].dt.year
    year_data = df.groupby('year')['total'].sum().reset_index()


    return render_template('analytics.html',
                            month_data=month_data.to_dict(orient='records'),
                            day_data=day_data.to_dict(orient='records'),
                            year_data=year_data.to_dict(orient='records'),
                           monthly_data=monthly_data.to_dict(orient='records'),
                           order_summary=df.tail(5).to_dict(orient='records'),
                           this_month_orders=this_month_orders,
                           this_month_revenue=this_month_revenue,
                           best_seller=best_seller,
                           worst_seller=worst_seller)


@app.route('/get-orders')
@login_required
def get_orders():
    orders = Orders.query.all()
    order_data = [
        {
            'order_id': order.order_id,
            'order_date': order.order_date.strftime('%Y-%m-%d'),
            'status':order.status,
            'total': order.total,
            'order_items': [
                {
                    'stock_id': order_item.stock_id,
                    'quantity': order_item.quantity
                } for order_item in order.order_items
            ]
        } for order in orders
    ]
    return jsonify(order_data)

@app.route('/update-orders', methods=['PATCH'])
@login_required
def update_orders():
    data = request.json
    order_ids = data.get('orders', [])

    if not order_ids:
        return 'No orders provided', 400
    
    orders_to_update = db.session.execute(
        db.select(Orders).filter(Orders.order_id.in_(order_ids))
    ).scalars().all()

    for order_obj in orders_to_update:
        original_status = order_obj.status
        new_status = not original_status
        order_obj.status = new_status

        if not new_status:
            for order_item in order_obj.order_items:
                stock_item = order_item.stock
                if stock_item:
                    stock_item.stock_level += order_item.quantity
        elif new_status:
            for order_item in order_obj.order_items:
                stock_item = order_item.stock
                if stock_item:
                    stock_item.stock_level -= order_item.quantity

    db.session.commit()
    return '', 204

def send_mail_async(app, msg):
    with app.app_context():
        mail.send(msg)

def send_stock_email(stock):
    users = Users.query.all()
    low_stock_items = Stock.query.filter(Stock.stock_level < 15).all()
    print(low_stock_items)
    print(stock)
    recipient_emails = [user.email for user in users]
    msg = Message(subject=f"Stock Alert: Low Inventory - {stock.name}", recipients=recipient_emails)
    msg.html = render_template('stock_email.html', stock=stock, low_stock_items=low_stock_items)
    Thread(target=send_mail_async, args=(app,msg)).start()

@app.route('/orders', methods=['GET', 'POST'])
@login_required
def manage_orders():
    if request.method == 'GET':
        stock = Stock.query.all()
        stock_data = [
            {
                'stock_id': item.stock_id,
                'name': item.name,
                'category': item.category,
                'quantity': item.stock_level,
                'price': item.price,
                'image': item.image
            } for item in stock
        ]
        return render_template('order.html', stock=stock_data)

    elif request.method == 'POST':
        data = request.json

        order_id = data['id'] if data['id'] != '' else uuid.uuid4().hex   
        date_str = data.get('date')
        order_date = datetime.strptime(date_str, '%Y-%m-%d').date() if date_str else date.today()
        new_order = Orders(
            order_id=order_id,
            order_date=order_date,
            status=False,
            total=data['total'],
            user_id=current_user.user_id
        )
        for item in data['order']:
            stock_id = item['stock_id']
            quantity = item['quantity']

            stock = Stock.query.get(stock_id)
            if not stock:
                return jsonify({"error": f"Stock ID {stock_id} not found"}), 400
            if stock.stock_level-quantity < 15:
                send_stock_email(stock)

            order_item = OrderStock(
                stock_id=stock_id,
                quantity=quantity
            )
            new_order.order_items.append(order_item)

        # Add to database
        try:
            db.session.add(new_order)
            db.session.commit()
            print("✅ Order saved successfully")
        except Exception as e:
            db.session.rollback()
            print(f"❌ Failed to save order: {e}")
            return jsonify({"error": "Failed to save order"}), 500


        return redirect(url_for('manage_orders'))

@app.route('/order/<order_id>', methods=['GET', 'DELETE'])
@login_required
def individual_order(order_id):
    if request.method == 'GET':
        order = db.session.execute(
            db.select(Orders).filter_by(order_id=order_id)
        ).scalar_one_or_none()

        user = db.session.execute(
            db.select(Users).filter_by(user_id=order.user_id)
        ).scalar_one_or_none()

        if not order:
            return "Order not found", 404

        items = [
            {
                'id': item.stock.stock_id,
                'name': item.stock.name,
                'category': item.stock.category,
                'price': item.stock.price,
                'image': item.stock.image,
                'quantity': item.quantity
            } for item in order.order_items
        ]

        order_data = {
            'order_id': order.order_id,
            'order_date': order.order_date,
            'status': order.status,
            'total': order.total,
            'user': user.username,
            'length': len(items)
        }

        return render_template('individual_order.html', order=order_data, items=items)

@app.route("/stock", methods=['GET', 'POST'])
@login_required
def manage_stock():
    if request.method == 'POST':
        name = request.form['name']
        category = request.form['category']
        price = request.form['price']
        quantity = request.form['quantity']

        image_file = request.files.get('image')
        image_filename = None
        if image_file:
            filename = f"{uuid.uuid4().hex}_{image_file.filename}"
            upload_path = os.path.join('static', 'uploads', filename)
            image_file.save(upload_path)
            image_filename = filename

        try:
            new_stock = Stock(
                stock_id=uuid.uuid4().hex,  # Generate a unique stock ID
                name=name,
                category=category,
                price=float(price),
                stock_level=int(quantity),
                image=image_filename
            )
            db.session.add(new_stock)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(e)
        return redirect(url_for('manage_stock'))
    else:
        return render_template('stock.html')


@app.route('/get-stock')
@login_required
def get_stock():
    stock = Stock.query.all()
    stock_data = [
        {
            'id': item.stock_id,
            'name': item.name,
            'category': item.category,
            'quantity': item.stock_level
        } for item in stock
    ]
    return jsonify(stock_data)

@app.route('/update-stock', methods=['PATCH'])
@login_required
def update_stock():
    data = request.json
    print(data)
    if isinstance(data, list):
        for d in data:
            item = db.session.execute(db.select(Stock).filter_by(name=d['name'])).scalar_one_or_none()

            if item:
                item.stock_level += int(d['quantity'])
    else:
        item = db.session.execute(db.select(Stock).filter_by(name=data['name'])).scalar_one_or_none()
        if item:
            item.stock_level += int(data['quantity'])
    db.session.commit()

    return render_template('stock.html')

@app.route('/stock/<stock_id>', methods=['GET', 'DELETE'])
@login_required
def individual_stock(stock_id):
    if request.method == 'GET':
        # Get stock object
        stock = db.session.execute(
            db.select(Stock).filter_by(stock_id=stock_id)
        ).scalar_one_or_none()

        if not stock:
            return "Stock not found", 404

        # Get all OrderStock entries for this stock
        order_stocks = db.session.execute(
            db.select(OrderStock).filter_by(stock_id=stock.stock_id)
        ).scalars().all()

        # Build the orders list using the related Orders object
        orders = [
            {
                'id': os.order.order_id,
                'date': os.order.order_date,
                'status': os.order.status,
                'total': os.order.total,
                'quantity': os.quantity
            }
            for os in order_stocks
        ]

        return render_template('individual_stock.html', stock=stock, orders=orders)
    else:
        stock = db.session.execute(
            db.select(Stock).filter_by(stock_id=stock_id)
        ).scalar_one_or_none()
        db.session.delete(stock)
        db.session.commit()

        return ''




if __name__ == '__main__':
    # with app.app_context():
    #     db.create_all()
    app.run(debug=True)