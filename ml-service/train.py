"""
Train and evaluate 5 regression models on the cleaned used car dataset.
Compares Linear Regression, Ridge, Decision Tree, Random Forest, and Gradient Boosting.
Exports the best model to models/car_price_model.pkl and metrics to models/metrics.json.
"""

import os
import sys
import json
import time
import joblib
import numpy as np
import pandas as pd

# Set UTF-8 encoding for Windows consoles
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from sklearn.model_selection import train_test_split, KFold, cross_val_score
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error, mean_absolute_percentage_error
from sklearn.linear_model import LinearRegression, RidgeCV
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor



from feature_engineering import (
    CarFeatureEngineer,
    build_full_preprocessing_pipeline,
    clip_target_outliers,
    log_transform_target,
    inverse_log_transform,
)


def load_clean_data(clean_csv_path: str) -> pd.DataFrame:
    """Loads and validates the clean dataset."""
    if not os.path.exists(clean_csv_path):
        raise FileNotFoundError(f"Clean dataset not found at {clean_csv_path}. Please run clean_dataset.py first.")
    df = pd.read_csv(clean_csv_path)
    print(f"[DATA] Loaded clean dataset: {df.shape[0]} rows, {df.shape[1]} columns.")
    return df


def evaluate_model_predictions(y_true_raw, y_pred_raw):
    """
    Computes standard regression evaluation metrics in original units (Lakhs).
    """
    y_pred_safe = np.maximum(y_pred_raw, 0.0)
    
    r2 = float(r2_score(y_true_raw, y_pred_safe))
    rmse = float(np.sqrt(mean_squared_error(y_true_raw, y_pred_safe)))
    mae = float(mean_absolute_error(y_true_raw, y_pred_safe))
    
    valid_mask = y_true_raw > 0.1
    if np.sum(valid_mask) > 0:
        mape = float(mean_absolute_percentage_error(y_true_raw[valid_mask], y_pred_safe[valid_mask]) * 100)
    else:
        mape = 0.0

    return {
        "r2_score": round(r2, 4),
        "rmse_lakhs": round(rmse, 2),
        "mae_lakhs": round(mae, 2),
        "mape_percent": round(mape, 2),
    }


def get_feature_names(fitted_pipeline):
    """Extracts human-readable feature names from the fitted ColumnTransformer."""
    try:
        col_transformer = fitted_pipeline.named_steps["col_transformer"]
        feature_names = []
        for name, trans, cols in col_transformer.transformers_:
            if name == "num_scaler":
                feature_names.extend(cols)
            elif name == "passthrough":
                feature_names.extend(cols)
            elif name == "cat_ohe":
                cats = trans.get_feature_names_out(cols)
                feature_names.extend(cats)
        return feature_names
    except Exception as e:
        print(f"[WARN] Could not extract detailed feature names: {e}")
        return []


def train_and_benchmark():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(script_dir, "dataset", "car_price_dataset_clean.csv")
    models_dir = os.path.join(script_dir, "models")
    os.makedirs(models_dir, exist_ok=True)

    print("=" * 70)
    print("[STEP 2] MULTI-MODEL REGRESSION BENCHMARK & HYPERPARAMETER TUNING")
    print("=" * 70)

    # 1. Load Data
    df = load_clean_data(dataset_path)
    X = df.drop(columns=["Price"])
    y = df["Price"].astype(float)

    # 2. Train / Test Split (80% Train, 20% Test)
    X_train, X_test, y_train_raw, y_test_raw = train_test_split(
        X, y, test_size=0.20, random_state=42, shuffle=True
    )
    print(f"[SPLIT] Training Set: {len(X_train)} samples | Test Set: {len(X_test)} samples")

    # 3. Target handling (IQR outlier clipping & log1p transformation)
    y_train_clipped, lower_bound, upper_bound = clip_target_outliers(y_train_raw, iqr_multiplier=2.5)
    y_train_log = log_transform_target(y_train_clipped)

    print(f"[TARGET] Target IQR Capping Bounds: [{lower_bound:.2f}, {upper_bound:.2f}] Lakhs")
    print(f"[TARGET] Log-transformed target skewness: {y_train_log.skew():.2f}")

    # 4. Build and fit preprocessing pipeline on training set
    fe = CarFeatureEngineer(current_year=2025, rare_model_threshold=5)
    preprocessor = build_full_preprocessing_pipeline(fe)
    
    print("[PIPELINE] Fitting feature engineering and preprocessing pipeline...")
    X_train_transformed = preprocessor.fit_transform(X_train)
    X_test_transformed = preprocessor.transform(X_test)
    print(f"[PIPELINE] Transformed feature count: {X_train_transformed.shape[1]}")

    feature_names = get_feature_names(preprocessor)

    # 5. Define 5 regression models with tuned hyperparameters
    print("\n" + "-" * 70)
    print("[BENCHMARK] Training and evaluating 5 regression algorithms...")
    print("-" * 70)

    models_config = {
        "Linear Regression": LinearRegression(),
        "Ridge Regression": RidgeCV(alphas=[0.01, 0.1, 1.0, 10.0, 50.0, 100.0]),
        "Decision Tree": DecisionTreeRegressor(
            max_depth=15, min_samples_split=8, min_samples_leaf=4, random_state=42
        ),
        "Random Forest": RandomForestRegressor(
            n_estimators=150,
            max_depth=20,
            min_samples_split=6,
            min_samples_leaf=2,
            n_jobs=-1,
            random_state=42,
        ),
        "Gradient Boosting": GradientBoostingRegressor(
            n_estimators=180,
            learning_rate=0.08,
            max_depth=6,
            subsample=0.85,
            random_state=42,
        ),
    }

    benchmark_results = []
    trained_models = {}
    best_model_name = None
    best_r2 = -float("inf")

    kf = KFold(n_splits=5, shuffle=True, random_state=42)

    for name, model in models_config.items():
        t0 = time.time()
        print(f"\n[MODEL] Training {name}...")

        # 5-Fold Cross Validation on Training set
        cv_scores = cross_val_score(model, X_train_transformed, y_train_log, cv=kf, scoring="r2")
        cv_r2_mean = float(np.mean(cv_scores))
        cv_r2_std = float(np.std(cv_scores))

        # Train on full training set
        model.fit(X_train_transformed, y_train_log)
        train_time = round(time.time() - t0, 2)
        trained_models[name] = model

        # Predict on Test Set in log space, then invert to original LKR Lakhs
        y_test_pred_log = model.predict(X_test_transformed)
        y_test_pred_raw = inverse_log_transform(y_test_pred_log)

        # Compute Metrics in original LKR Lakhs
        metrics = evaluate_model_predictions(y_test_raw.values, y_test_pred_raw)

        print(f"   [+] CV R2 Score (5-Fold): {cv_r2_mean:.4f} +/- {cv_r2_std:.4f}")
        print(f"   [+] Test R2 Score       : {metrics['r2_score']:.4f}")
        print(f"   [+] Test RMSE           : Rs. {metrics['rmse_lakhs']} Lakhs")
        print(f"   [+] Test MAE            : Rs. {metrics['mae_lakhs']} Lakhs")
        print(f"   [+] Test MAPE           : {metrics['mape_percent']}%")
        print(f"   [+] Training Time       : {train_time}s")

        result_entry = {
            "model_name": name,
            "cv_r2_mean": round(cv_r2_mean, 4),
            "cv_r2_std": round(cv_r2_std, 4),
            "test_r2_score": metrics["r2_score"],
            "test_rmse_lakhs": metrics["rmse_lakhs"],
            "test_mae_lakhs": metrics["mae_lakhs"],
            "test_mape_percent": metrics["mape_percent"],
            "training_time_seconds": train_time,
        }
        benchmark_results.append(result_entry)

        # Track best model
        if metrics["r2_score"] > best_r2:
            best_r2 = metrics["r2_score"]
            best_model_name = name

    # 6. Leaderboard Summary Table
    print("\n" + "=" * 70)
    print("[LEADERBOARD] FINAL MODEL BENCHMARK RESULTS (TEST SET EVALUATION)")
    print("=" * 70)
    leaderboard_df = pd.DataFrame(benchmark_results).sort_values(by="test_r2_score", ascending=False)
    print(leaderboard_df.to_string(index=False))

    print(f"\n[WINNER] BEST PERFORMING MODEL: {best_model_name} (Test R2 = {best_r2:.4f})")

    # 7. Extract Feature Importances from the best model (or Tree model)
    best_estimator = trained_models[best_model_name]
    feature_importances = []
    
    if hasattr(best_estimator, "feature_importances_") and feature_names:
        importances = best_estimator.feature_importances_
        sorted_indices = np.argsort(importances)[::-1]
        
        for idx in sorted_indices[:20]:  # Top 20 features
            feature_importances.append({
                "feature": feature_names[idx] if idx < len(feature_names) else f"feature_{idx}",
                "importance": round(float(importances[idx]), 4),
                "importance_percent": round(float(importances[idx] * 100), 2)
            })
    elif hasattr(trained_models.get("Random Forest"), "feature_importances_") and feature_names:
        importances = trained_models["Random Forest"].feature_importances_
        sorted_indices = np.argsort(importances)[::-1]
        for idx in sorted_indices[:20]:
            feature_importances.append({
                "feature": feature_names[idx] if idx < len(feature_names) else f"feature_{idx}",
                "importance": round(float(importances[idx]), 4),
                "importance_percent": round(float(importances[idx] * 100), 2)
            })

    # 8. Export Full Pipeline Artifact (Preprocessor + Best Estimator + Target Bounds)
    full_export_pipeline = {
        "preprocessor": preprocessor,
        "model": best_estimator,
        "best_model_name": best_model_name,
        "feature_engineer": fe,
        "target_bounds": {
            "lower_bound": float(lower_bound),
            "upper_bound": float(upper_bound),
        },
        "version": "1.0.0",
        "trained_date": time.strftime("%Y-%m-%d %H:%M:%S"),
    }

    model_pkl_path = os.path.join(models_dir, "car_price_model.pkl")
    joblib.dump(full_export_pipeline, model_pkl_path, compress=3)
    print(f"\n[EXPORT] Serialized Best Model saved to: {model_pkl_path}")

    # 9. Export Frontend Dropdown Metadata
    metadata_json_path = os.path.join(models_dir, "metadata.json")
    metadata_payload = {
        "unique_brands": list(fe.unique_brands_),
        "brand_models_map": {str(k): [str(m) for m in v] for k, v in fe.brand_models_map_.items()},
        "unique_towns": list(fe.unique_towns_),
        "unique_fuel_types": list(fe.unique_fuel_types_),
        "unique_gears": list(fe.unique_gears_),
        "dataset_stats": {
            "total_records": int(len(df)),
            "mean_price_lakhs": round(float(df["Price"].mean()), 2),
            "min_price_lakhs": round(float(df["Price"].min()), 2),
            "max_price_lakhs": round(float(df["Price"].max()), 2),
            "min_year": int(df["YOM"].min()),
            "max_year": int(df["YOM"].max()),
        },
    }
    with open(metadata_json_path, "w", encoding="utf-8") as f:
        json.dump(metadata_payload, f, indent=2, default=str)
    print(f"[EXPORT] Metadata JSON saved to: {metadata_json_path}")

    # 10. Export Comparison Metrics JSON for UI Dashboard
    metrics_json_path = os.path.join(models_dir, "metrics.json")
    metrics_payload = {
        "best_model": best_model_name,
        "benchmark_leaderboard": benchmark_results,
        "top_feature_importances": feature_importances,
        "evaluation_summary": {
            "test_r2_score": round(float(best_r2), 4),
            "training_samples": int(len(X_train)),
            "test_samples": int(len(X_test)),
            "total_features": int(X_train_transformed.shape[1]),
        },
    }
    with open(metrics_json_path, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2, default=str)
    print(f"[EXPORT] Metrics & Performance JSON saved to: {metrics_json_path}")

    print("\n" + "=" * 70)
    print("[SUCCESS] STEP 2 COMPLETED SUCCESSFULLY! All models trained and exported.")
    print("=" * 70)


if __name__ == "__main__":
    train_and_benchmark()
