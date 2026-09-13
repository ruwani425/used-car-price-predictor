"""
Feature engineering pipeline for used car price prediction.
Transforms raw vehicle attributes into features for model training:
1. Derived features: Car_Age, Mileage_Per_Year, Luxury_Score
2. Remove unneeded columns: Unnamed: 0, Date
3. Binary encoding: Amenities, Condition, Leasing
4. High-cardinality handling: Rare models (< 5 count) to 'OTHER', Frequency encoding for Brand & Town
5. Outlier capping: IQR clipping on mileage
6. Target transformation: log(1 + Price)
7. Standard scaling with Scikit-Learn Pipeline
"""

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer


# Column name aliases for CSV and API JSON compatibility
COLUMN_ALIASES = {
    "Brand": "brand",
    "Model": "model",
    "YOM": "yom",
    "Engine (cc)": "engine_cc",
    "Gear": "gear",
    "Fuel Type": "fuel_type",
    "Millage(KM)": "mileage_km",
    "Town": "town",
    "Date": "date",
    "Leasing": "leasing",
    "Condition": "condition",
    "AIR CONDITION": "air_condition",
    "POWER STEERING": "power_steering",
    "POWER MIRROR": "power_mirror",
    "POWER WINDOW": "power_window",
    "Price": "price",
}


def standardize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Standardizes column names to lowercase snake_case."""
    df_copy = df.copy()
    rename_dict = {}
    for col in df_copy.columns:
        if col in COLUMN_ALIASES:
            rename_dict[col] = COLUMN_ALIASES[col]
        else:
            rename_dict[col] = col.strip().lower().replace(" ", "_").replace("(", "").replace(")", "")
    return df_copy.rename(columns=rename_dict)


class CarFeatureEngineer(BaseEstimator, TransformerMixin):
    """
    Custom transformer to perform domain feature extraction, encoding,
    rare model grouping, and outlier treatment.
    """

    def __init__(self, current_year=2025, rare_model_threshold=5, mileage_iqr_multiplier=1.5):
        self.current_year = current_year
        self.rare_model_threshold = rare_model_threshold
        self.mileage_iqr_multiplier = mileage_iqr_multiplier

        # Learned statistics
        self.frequent_models_ = set()
        self.brand_freq_map_ = {}
        self.town_freq_map_ = {}
        self.mileage_upper_bound_ = None
        self.unique_brands_ = []
        self.brand_models_map_ = {}
        self.unique_towns_ = []
        self.unique_fuel_types_ = []
        self.unique_gears_ = []

    def fit(self, X, y=None):
        df = standardize_columns(pd.DataFrame(X))

        # Technique 4: Learn frequent models (frequency >= threshold)
        if "model" in df.columns:
            model_counts = df["model"].astype(str).str.strip().str.upper().value_counts()
            self.frequent_models_ = set(model_counts[model_counts >= self.rare_model_threshold].index)

        # Technique 4: Learn frequency encoding for Brand and Town
        if "brand" in df.columns:
            brand_series = df["brand"].astype(str).str.strip().str.upper()
            self.brand_freq_map_ = (brand_series.value_counts() / len(brand_series)).to_dict()
            self.unique_brands_ = sorted(brand_series.unique().tolist())

        if "town" in df.columns:
            town_series = df["town"].astype(str).str.strip()
            self.town_freq_map_ = (town_series.value_counts() / len(town_series)).to_dict()
            self.unique_towns_ = sorted(town_series.unique().tolist())

        # Learn Brand -> Model hierarchy mapping for frontend metadata
        if "brand" in df.columns and "model" in df.columns:
            cleaned_brand = df["brand"].astype(str).str.strip().str.upper()
            cleaned_model = df["model"].astype(str).str.strip().str.upper()
            b_m_df = pd.DataFrame({"brand": cleaned_brand, "model": cleaned_model})
            self.brand_models_map_ = (
                b_m_df.groupby("brand")["model"]
                .unique()
                .apply(lambda arr: sorted(list(arr)))
                .to_dict()
            )

        if "fuel_type" in df.columns:
            self.unique_fuel_types_ = sorted(df["fuel_type"].astype(str).str.strip().unique().tolist())

        if "gear" in df.columns:
            self.unique_gears_ = sorted(df["gear"].astype(str).str.strip().unique().tolist())

        # Technique 5: Learn IQR upper bound for Mileage
        if "mileage_km" in df.columns:
            q1 = df["mileage_km"].quantile(0.25)
            q3 = df["mileage_km"].quantile(0.75)
            iqr = q3 - q1
            self.mileage_upper_bound_ = float(q3 + self.mileage_iqr_multiplier * iqr)
            # Ensure upper bound is at least 500,000 km
            self.mileage_upper_bound_ = max(self.mileage_upper_bound_, 500000.0)

        return self

    def transform(self, X):
        df = standardize_columns(pd.DataFrame(X))

        # Technique 2: Irrelevant Feature Removal
        cols_to_drop = [c for c in ["unnamed:_0", "unnamed_0", "date", "price"] if c in df.columns]
        if cols_to_drop:
            df = df.drop(columns=cols_to_drop)

        # Technique 5: Outlier treatment on Mileage (Winsorization)
        if "mileage_km" in df.columns and self.mileage_upper_bound_ is not None:
            df["mileage_km"] = df["mileage_km"].clip(lower=0, upper=self.mileage_upper_bound_)

        # Technique 1: Derived Features
        # 1.1 Car_Age = 2025 - YOM
        if "yom" in df.columns:
            df["car_age"] = (self.current_year - pd.to_numeric(df["yom"], errors="coerce").fillna(self.current_year)).clip(lower=0)
        else:
            df["car_age"] = 0

        # 1.2 Mileage_Per_Year = Mileage / (Car_Age + 1)
        if "mileage_km" in df.columns:
            mileage = pd.to_numeric(df["mileage_km"], errors="coerce").fillna(0)
            df["mileage_per_year"] = mileage / (df["car_age"] + 1.0)
        else:
            df["mileage_per_year"] = 0.0

        # Technique 3: Binary Feature Encoding
        def encode_availability(val):
            if isinstance(val, bool):
                return 1 if val else 0
            if pd.isna(val):
                return 0
            val_str = str(val).strip().lower()
            return 1 if val_str in ["available", "1", "true", "yes"] else 0

        for feat in ["air_condition", "power_steering", "power_mirror", "power_window"]:
            if feat in df.columns:
                df[feat] = df[feat].apply(encode_availability)
            else:
                df[feat] = 0

        # 1.3 Luxury_Score = AC + Power Steering + Power Mirror + Power Window [0, 4]
        df["luxury_score"] = (
            df["air_condition"] + df["power_steering"] + df["power_mirror"] + df["power_window"]
        ).clip(lower=0, upper=4)

        # Condition (USED -> 0, NEW -> 1)
        if "condition" in df.columns:
            df["is_new_condition"] = df["condition"].astype(str).str.strip().str.upper().apply(
                lambda x: 1 if x == "NEW" else 0
            )
        else:
            df["is_new_condition"] = 0

        # Leasing (No Leasing -> 0, Ongoing Lease -> 1)
        if "leasing" in df.columns:
            df["has_ongoing_lease"] = df["leasing"].astype(str).str.strip().str.upper().apply(
                lambda x: 1 if "ONGOING" in x else 0
            )
        else:
            df["has_ongoing_lease"] = 0

        # Technique 4: High-Cardinality Rare Model Grouping (< 5 -> 'Other')
        if "model" in df.columns:
            cleaned_models = df["model"].astype(str).str.strip().str.upper()
            df["model_grouped"] = cleaned_models.apply(
                lambda m: m if m in self.frequent_models_ else "OTHER"
            )
        else:
            df["model_grouped"] = "OTHER"

        # Technique 4: Frequency Encoding for Brand and Town
        if "brand" in df.columns:
            cleaned_brands = df["brand"].astype(str).str.strip().str.upper()
            df["brand_freq"] = cleaned_brands.map(self.brand_freq_map_).fillna(0.0)
        else:
            df["brand_freq"] = 0.0

        if "town" in df.columns:
            cleaned_towns = df["town"].astype(str).str.strip()
            df["town_freq"] = cleaned_towns.map(self.town_freq_map_).fillna(0.0)
        else:
            df["town_freq"] = 0.0

        # Engine (cc) conversion to numeric
        if "engine_cc" in df.columns:
            df["engine_cc"] = pd.to_numeric(df["engine_cc"], errors="coerce").fillna(1500.0)
        else:
            df["engine_cc"] = 1500.0

        # Gear and Fuel Type standardization for One-Hot Encoding
        if "gear" in df.columns:
            df["gear"] = df["gear"].astype(str).str.strip().str.capitalize()
        else:
            df["gear"] = "Automatic"

        if "fuel_type" in df.columns:
            df["fuel_type"] = df["fuel_type"].astype(str).str.strip().str.capitalize()
        else:
            df["fuel_type"] = "Petrol"

        # Select final transformed feature columns
        feature_cols = [
            "car_age",
            "mileage_km",
            "mileage_per_year",
            "engine_cc",
            "luxury_score",
            "air_condition",
            "power_steering",
            "power_mirror",
            "power_window",
            "is_new_condition",
            "has_ongoing_lease",
            "brand_freq",
            "town_freq",
            "gear",
            "fuel_type",
            "model_grouped",
        ]

        return df[feature_cols]


# Technique 5 & 6: Helper functions for Target (Price) Outlier Capping and Log Transformation
def clip_target_outliers(y: pd.Series, iqr_multiplier=1.5):
    """
    Technique 5: Capping target variable outliers using IQR bounds.
    """
    q1 = y.quantile(0.25)
    q3 = y.quantile(0.75)
    iqr = q3 - q1
    lower_bound = max(0.0, float(q1 - iqr_multiplier * iqr))
    upper_bound = float(q3 + iqr_multiplier * iqr)
    return y.clip(lower=lower_bound, upper=upper_bound), lower_bound, upper_bound


def log_transform_target(y):
    """
    Technique 6: Logarithmic transformation to reduce target skewness.
    y_trans = log(1 + y)
    """
    return np.log1p(np.maximum(y, 0))


def inverse_log_transform(y_log):
    """
    Technique 6: Inverse exponential transform for prediction output.
    y = exp(y_log) - 1
    """
    return np.expm1(y_log)


def build_full_preprocessing_pipeline(feature_engineer: CarFeatureEngineer):
    """
    Technique 7: Assembles full Scikit-Learn preprocessing Pipeline.
    Combines:
      - Feature engineering transformer
      - ColumnTransformer for:
          * StandardScaler on continuous numerical features
          * Passthrough on binary/count features
          * OneHotEncoder on categorical features (gear, fuel_type, model_grouped)
    """
    continuous_features = [
        "car_age",
        "mileage_km",
        "mileage_per_year",
        "engine_cc",
    ]

    binary_and_freq_features = [
        "luxury_score",
        "air_condition",
        "power_steering",
        "power_mirror",
        "power_window",
        "is_new_condition",
        "has_ongoing_lease",
        "brand_freq",
        "town_freq",
    ]

    categorical_features = [
        "gear",
        "fuel_type",
        "model_grouped",
    ]

    col_transformer = ColumnTransformer(
        transformers=[
            ("num_scaler", StandardScaler(), continuous_features),
            ("passthrough", "passthrough", binary_and_freq_features),
            (
                "cat_ohe",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                categorical_features,
            ),
        ],
        remainder="drop",
    )

    full_pipeline = Pipeline(
        steps=[
            ("feature_engineer", feature_engineer),
            ("col_transformer", col_transformer),
        ]
    )

    return full_pipeline


if __name__ == "__main__":
    import os

    print("==================================================")
    print("STEP 1 VERIFICATION: 7 FEATURE ENGINEERING TECHNIQUES")
    print("==================================================")

    data_path = os.path.join(os.path.dirname(__file__), "dataset", "car_price_dataset_clean.csv")
    if not os.path.exists(data_path):
        print("Clean dataset not found. Running clean_dataset first...")
        from clean_dataset import clean_dataset
        df = clean_dataset()
    else:
        df = pd.read_csv(data_path)

    print(f"\n1. Loaded Clean Dataset Shape: {df.shape}")

    # Separate X and y
    y_raw = df["Price"]
    X_raw = df.drop(columns=["Price"])

    # Technique 5: Target Outlier IQR Capping
    y_clipped, l_bound, u_bound = clip_target_outliers(y_raw)
    print(f"2. Technique 5 (Target IQR Capping): Bounds [{l_bound:.2f}, {u_bound:.2f}] Lakhs")

    # Technique 6: Log Transformation on Target
    y_log = log_transform_target(y_clipped)
    print(f"3. Technique 6 (Log Transform Target): Skewness reduced from {y_raw.skew():.2f} to {y_log.skew():.2f}")

    # Build and fit Feature Engineer
    fe = CarFeatureEngineer()
    pipeline = build_full_preprocessing_pipeline(fe)

    print("\n4. Fitting Full Feature Engineering & Preprocessing Pipeline...")
    X_transformed = pipeline.fit_transform(X_raw)
    print(f"   Transformed Feature Matrix Shape: {X_transformed.shape}")

    print("\n5. Learned Metadata Profile:")
    print(f"   - Unique Brands learned: {len(fe.unique_brands_)}")
    print(f"   - Frequent Models retained: {len(fe.frequent_models_)} (Rare models clustered to 'OTHER')")
    print(f"   - Unique Towns learned: {len(fe.unique_towns_)}")
    print(f"   - Fuel Types learned: {fe.unique_fuel_types_}")
    print(f"   - Gears learned: {fe.unique_gears_}")
    print(f"   - Mileage IQR Upper Bound: {fe.mileage_upper_bound_:.2f} KM")

    # Test single API JSON request simulation
    sample_request = {
        "brand": "TOYOTA",
        "model": "AXIO",
        "yom": 2017,
        "engine_cc": 1500,
        "gear": "Automatic",
        "fuel_type": "Hybrid",
        "mileage_km": 75000,
        "town": "Colombo",
        "condition": "USED",
        "leasing": "No Leasing",
        "air_condition": "Available",
        "power_steering": "Available",
        "power_mirror": "Available",
        "power_window": "Available",
    }
    sample_df = pd.DataFrame([sample_request])
    sample_transformed = pipeline.transform(sample_df)
    print("\n6. Sample API Payload Transformation Test:")
    print(f"   - Input: {sample_request['brand']} {sample_request['model']} ({sample_request['yom']})")
    print(f"   - Transformed Shape: {sample_transformed.shape}")
    print("   - Non-zero Features Count:", np.count_nonzero(sample_transformed))
    print("\nSUCCESS: All 7 feature engineering techniques implemented and verified!")
