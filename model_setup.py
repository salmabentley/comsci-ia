import numpy as np
import joblib
from sklearn.linear_model import SGDRegressor
import os
from datetime import date

MODEL_PATH = "sales_model.pkl"
SCALE_FACTOR = 365.0 

# creates model if not made, loads if already created
def create_or_load_model(orders):
    # load model if it exists
    if os.path.exists(MODEL_PATH):
        model, base_date = joblib.load(MODEL_PATH)
    else:
        # sgd regressor for incremental learning
        model = SGDRegressor()
        
        # train on existing orders if there are
        if orders:
            base_date = orders[0].order_date  # use earliest order as base
            # scale the days feature before fitting
            X = np.array([(o.order_date - base_date).days / SCALE_FACTOR for o in orders]).reshape(-1, 1)
            y = np.array([o.total for o in orders])
            model.partial_fit(X, y)
        else:
            # no orders so initialise with a dummy point (scaled)
            base_date = date.today()
            # Initialize with a scaled dummy point (0 / SCALE_FACTOR is still 0)
            model.partial_fit([[0]], [0])

        joblib.dump((model, base_date), MODEL_PATH)

    return model, base_date

# update incrementally with new order
def update_model(model, base_date, order):
    days = (order.order_date - base_date).days # days since base date
    
    scaled_days = days / SCALE_FACTOR 
    
    # reshape for sklearn
    X_new = np.array([[scaled_days]]) 
    y_new = np.array([order.total])
    
    # fit with new data
    model.partial_fit(X_new, y_new)
    joblib.dump((model, base_date), MODEL_PATH)
    return model

def retrain_model_from_orders(orders):
    # retrain model on delete
    model = SGDRegressor()
    if orders:
        base_date = orders[0].order_date  # use earliest order as base
        X = np.array([(o.order_date - base_date).days / SCALE_FACTOR for o in orders]).reshape(-1, 1)
        y = np.array([o.total for o in orders])
        model.partial_fit(X, y)
    else:
        base_date = date.today()

        model.partial_fit([[0]], [0])  # initialize with dummy point

    joblib.dump((model, base_date), MODEL_PATH)
    return model, base_date

def predict_sales(model, base_date, prediction_date):
    # predict sales for a given range
    days = (prediction_date - base_date).days
    
    scaled_days = days / SCALE_FACTOR
    
    X_predict = np.array([[scaled_days]]) 
    return model.predict(X_predict)[0]

