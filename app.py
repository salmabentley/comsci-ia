from flask import Flask, request, redirect, render_template, jsonify, json, url_for
from flask_sqlalchemy import SQLAlchemy
import random

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
db = SQLAlchemy(app)


@app.cli.command('stock')
def show_stock_table():
    stock = Stock.query.all()
    print(stock[0])


class Users(db.Model):
    __tablename__='users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50))
    password = db.Column(db.String(50))
    
    def __repr__(self):
        return f'<Users "{self.name}">'

class Stock(db.Model):
    __tablename__='stock'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50))
    category = db.Column(db.String(50))
    quantity = db.Column(db.Integer)

    # def get_name(self):
    #     return self.name
    
    # def get_category(self):
    #     return self.category
    
    # def get_quantity(self):
    #     return self.quantity
    
    # def set_quantity(quantity, self):
    #     self.quantity = quantity
    def __repr__(self):
        return self.name

class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.String(50), primary_key=True)
    total = db.Column(db.Float)
    status = db.Column(db.Boolean)

    def get_id(self):
        return self.id
    
    def get_total(self):
        return self.total
    
    def get_status(self):
        return self.status
    
    def set_status(status, self):
        self.status = status
    

@app.route("/stock", methods=['GET', 'POST'])
def manage_stock():    
    if request.method == 'POST':
        item = json.loads(request.data)
        try:
            new_stock = Stock(
                id = random.randint(1,19999999),
                name = item['name'],
                category = item['category'],
                quantity = item['quantity']
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
def get_stock():
    stock = Stock.query.all()
    stock_data = [
        {
            'id': item.id,
            'name': item.name,
            'category': item.category,
            'quantity': item.quantity
        } for item in stock
    ]
    return jsonify(stock_data)

@app.route('/update-stock', methods=['PATCH'])
def update_stock():
    data = request.json
    for d in data:
        item = db.session.execute(db.select(Stock).filter_by(name=d['name'])).scalar_one_or_none()

        if item:
            item.quantity += int(d['quantity'])
    db.session.commit()

    return render_template('stock.html')



if __name__ == '__main__':
    # with app.app_context():
    #     db.create_all()
    app.run(debug=True)