# model_handler.py
import numpy as np
import joblib
from sklearn.linear_model import SGDRegressor
import os
from datetime import date


MODEL_PATH = "sales_model.pkl"

def create_or_load_model(orders):
    if os.path.exists(MODEL_PATH):
        model, base_date = joblib.load(MODEL_PATH)
    else:
        model = SGDRegressor()
        if orders:
            base_date = orders[0].order_date  # earliest order
            X = np.array([(o.order_date - base_date).days for o in orders]).reshape(-1, 1)
            y = np.array([o.total for o in orders])
            model.partial_fit(X, y)
        else:
            base_date = date.today()
            model.partial_fit([[0]], [0])

        joblib.dump((model, base_date), MODEL_PATH)

    return model, base_date

def update_model(model, base_date, order):
    """Update model incrementally with a new order"""
    days = (order.order_date - base_date).days
    X_new = np.array([[days]])
    y_new = np.array([order.total])

    model.partial_fit(X_new, y_new)
    joblib.dump((model, base_date), MODEL_PATH)
    return model



