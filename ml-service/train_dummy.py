import joblib
from sklearn.linear_model import LinearRegression
import numpy as np

# Sample training data: [Year, Mileage]
# for a example, we have 4 cars with their respective year and mileage
X = np.array([
    [2015, 80000],
    [2018, 50000],
    [2020, 25000],
    [2022, 10000]
])

# Prices:
y = np.array([12000, 18000, 24000, 31000])

model = LinearRegression()
model.fit(X, y)

# Save model
joblib.dump(model, 'models/car_price_model.pkl')
print("Model saved successfully as models/car_price_model.pkl")