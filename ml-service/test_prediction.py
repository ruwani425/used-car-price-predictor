import json
import joblib
import pandas as pd
import numpy as np

with open('models/metrics.json') as f:
    metrics = json.load(f)

print("=== METRICS.JSON SUMMARY ===")
print("Best Model:", metrics['best_model'])
print("Leaderboard:")
for m in metrics['benchmark_leaderboard']:
    print(f"  - {m['model_name']}: Test R2={m['test_r2_score']}, CV R2={m['cv_r2_mean']}, RMSE={m['test_rmse_lakhs']} Lakhs, MAE={m['test_mae_lakhs']} Lakhs, MAPE={m['test_mape_percent']}%")

print("\nTop 8 Feature Importances:")
for feat in metrics['top_feature_importances'][:8]:
    print(f"  - {feat['feature']}: {feat['importance_percent']}%")

# Test prediction from pickled model
bundle = joblib.load('models/car_price_model.pkl')
preprocessor = bundle['preprocessor']
model = bundle['model']

sample = {
    'brand': 'TOYOTA',
    'model': 'AXIO',
    'yom': 2017,
    'engine_cc': 1500,
    'gear': 'Automatic',
    'fuel_type': 'Hybrid',
    'mileage_km': 75000,
    'town': 'Colombo',
    'condition': 'USED',
    'leasing': 'No Leasing',
    'air_condition': 'Available',
    'power_steering': 'Available',
    'power_mirror': 'Available',
    'power_window': 'Available',
}
df_test = pd.DataFrame([sample])
X_trans = preprocessor.transform(df_test)
pred_log = model.predict(X_trans)
pred_lakhs = float(np.expm1(pred_log)[0])

print(f"\n=== LIVE PREDICTION TEST ===")
print(f"Car: {sample['brand']} {sample['model']} ({sample['yom']})")
print(f"Predicted Price: Rs. {pred_lakhs:.2f} Lakhs (Rs. {pred_lakhs*100000:,.0f} LKR)")
