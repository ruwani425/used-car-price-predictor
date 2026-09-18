"""
Feature Engineering Pipeline for Used Car Price Prediction.
Transforms raw vehicle attributes into machine learning features:
1. Derived Features: Car Age, Mileage per Year, Luxury Score.
2. Remove unneeded columns: Index column, Date.
3. Binary Encoding: Amenities (AC, Power Steering, Power Mirror, Power Window), Condition, Leasing.
4. High-Cardinality Handling: Rare models (< 5 frequency) grouped into 'OTHER', Frequency encoding for Brands and Towns.
5. Outlier Capping: IQR clipping on Mileage.
6. Target Transformation: log(1 + Price) to reduce positive skewness.
7. Standard Scaling & One-Hot Encoding via Scikit-Learn Pipeline.
"""

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer


# Column name aliases to handle both CSV column headers and frontend API JSON keys
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
    """
    Standardizes all DataFrame column names to lowercase snake_case (e.g., 'Engine (cc)' -> 'engine_cc').
    """
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
    Custom Scikit-Learn Transformer for car domain feature extraction,
    outlier handling, frequency encoding, and high-cardinality grouping.
    """

    def __init__(self, current_year=2025, rare_model_threshold=5, mileage_iqr_multiplier=1.5):
        self.current_year = current_year
        self.rare_model_threshold = rare_model_threshold
        self.mileage_iqr_multiplier = mileage_iqr_multiplier

        # Internal state learned during fit()
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
        """
        Learns statistical parameters from the training set:
        - Frequent models (count >= 5)
        - Frequency ratios for Brands and Towns
        - IQR outlier threshold for Mileage
        - Unique lists for frontend dropdown metadata
        """
        df = standardize_columns(pd.DataFrame(X))

        # 1. Learn frequent models (cluster rare models appearing < 5 times into 'OTHER')
        if "model" in df.columns:
            model_counts = df["model"].astype(str).str.strip().str.upper().value_counts()
            self.frequent_models_ = set(model_counts[model_counts >= self.rare_model_threshold].index)

        # 2. Learn Frequency Encoding for Brand (Brand count / Total records)
        if "brand" in df.columns:
            brand_series = df["brand"].astype(str).str.strip().str.upper()
            self.brand_freq_map_ = (brand_series.value_counts() / len(brand_series)).to_dict()
            self.unique_brands_ = sorted(brand_series.unique().tolist())

        # 3. Learn Frequency Encoding for Town (Town count / Total records)
        if "town" in df.columns:
            town_series = df["town"].astype(str).str.strip()
            self.town_freq_map_ = (town_series.value_counts() / len(town_series)).to_dict()
            self.unique_towns_ = sorted(town_series.unique().tolist())

        # 4. Learn Brand -> Models mapping for cascading frontend dropdowns
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

        # 5. Extract unique Fuel Types and Gear types
        if "fuel_type" in df.columns:
            self.unique_fuel_types_ = sorted(df["fuel_type"].astype(str).str.strip().unique().tolist())

        if "gear" in df.columns:
            self.unique_gears_ = sorted(df["gear"].astype(str).str.strip().unique().tolist())

        # 6. Learn IQR Upper Bound for Mileage to cap extreme outliers
        if "mileage_km" in df.columns:
            q1 = df["mileage_km"].quantile(0.25)
            q3 = df["mileage_km"].quantile(0.75)
            iqr = q3 - q1
            self.mileage_upper_bound_ = float(q3 + self.mileage_iqr_multiplier * iqr)
            # Ensure reasonable minimum threshold (at least 500,000 km)
            self.mileage_upper_bound_ = max(self.mileage_upper_bound_, 500000.0)

        return self

    def transform(self, X):
        """
        Applies feature extraction and data transformations to the dataset.
        """
        df = standardize_columns(pd.DataFrame(X))

        # 1. Drop unnecessary columns that should not be fed to the model
        cols_to_drop = [c for c in ["unnamed:_0", "unnamed_0", "date", "price"] if c in df.columns]
        if cols_to_drop:
            df = df.drop(columns=cols_to_drop)

        # 2. Outlier Treatment: Cap extreme mileage values at the learned IQR upper bound
        if "mileage_km" in df.columns and self.mileage_upper_bound_ is not None:
            df["mileage_km"] = df["mileage_km"].clip(lower=0, upper=self.mileage_upper_bound_)

        # 3. Derived Feature: Car Age = Current Year (2025) - Year of Manufacture (YOM)
        if "yom" in df.columns:
            df["car_age"] = (self.current_year - pd.to_numeric(df["yom"], errors="coerce").fillna(self.current_year)).clip(lower=0)
        else:
            df["car_age"] = 0

        # 4. Derived Feature: Mileage per Year = Total Mileage / (Car Age + 1)
        if "mileage_km" in df.columns:
            mileage = pd.to_numeric(df["mileage_km"], errors="coerce").fillna(0)
            df["mileage_per_year"] = mileage / (df["car_age"] + 1.0)
        else:
            df["mileage_per_year"] = 0.0

        # 5. Binary Feature Encoding: Convert luxury amenities to 1 (Available) or 0 (Not Available)
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

        # 6. Derived Feature: Luxury Score = Sum of all 4 luxury amenities (Range: 0 to 4)
        df["luxury_score"] = (
            df["air_condition"] + df["power_steering"] + df["power_mirror"] + df["power_window"]
        ).clip(lower=0, upper=4)

        # 7. Condition Encoding: NEW -> 1, USED -> 0
        if "condition" in df.columns:
            df["is_new_condition"] = df["condition"].astype(str).str.strip().str.upper().apply(
                lambda x: 1 if x == "NEW" else 0
            )
        else:
            df["is_new_condition"] = 0

        # 8. Leasing Encoding: Ongoing Lease -> 1, No Leasing -> 0
        if "leasing" in df.columns:
            df["has_ongoing_lease"] = df["leasing"].astype(str).str.strip().str.upper().apply(
                lambda x: 1 if "ONGOING" in x else 0
            )
        else:
            df["has_ongoing_lease"] = 0

        # 9. Rare Model Grouping: Map rare car models (< 5 records) to 'OTHER'
        if "model" in df.columns:
            cleaned_models = df["model"].astype(str).str.strip().str.upper()
            df["model_grouped"] = cleaned_models.apply(
                lambda m: m if m in self.frequent_models_ else "OTHER"
            )
        else:
            df["model_grouped"] = "OTHER"

        # 10. Frequency Encoding: Replace Brand with its historical frequency percentage
        if "brand" in df.columns:
            cleaned_brands = df["brand"].astype(str).str.strip().str.upper()
            df["brand_freq"] = cleaned_brands.map(self.brand_freq_map_).fillna(0.0)
        else:
            df["brand_freq"] = 0.0

        # 11. Frequency Encoding: Replace Town with its historical frequency percentage
        if "town" in df.columns:
            cleaned_towns = df["town"].astype(str).str.strip()
            df["town_freq"] = cleaned_towns.map(self.town_freq_map_).fillna(0.0)
        else:
            df["town_freq"] = 0.0

        # 12. Convert Engine CC to numeric
        if "engine_cc" in df.columns:
            df["engine_cc"] = pd.to_numeric(df["engine_cc"], errors="coerce").fillna(1500.0)
        else:
            df["engine_cc"] = 1500.0

        # 13. Clean and standardize Gear and Fuel Type for One-Hot Encoding
        if "gear" in df.columns:
            df["gear"] = df["gear"].astype(str).str.strip().str.capitalize()
        else:
            df["gear"] = "Automatic"

        if "fuel_type" in df.columns:
            df["fuel_type"] = df["fuel_type"].astype(str).str.strip().str.capitalize()
        else:
            df["fuel_type"] = "Petrol"

        # Select the final list of ordered feature columns
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


# Target (Price) Outlier Capping and Log Transformation Helpers
def clip_target_outliers(y: pd.Series, iqr_multiplier=1.5):
    """
    Caps extreme price outliers using the Interquartile Range (IQR) method.
    """
    q1 = y.quantile(0.25)
    q3 = y.quantile(0.75)
    iqr = q3 - q1
    lower_bound = max(0.0, float(q1 - iqr_multiplier * iqr))
    upper_bound = float(q3 + iqr_multiplier * iqr)
    return y.clip(lower=lower_bound, upper=upper_bound), lower_bound, upper_bound


def log_transform_target(y):
    """
    Applies natural log transformation: y_trans = log(1 + Price)
    Converts heavily skewed price distribution into a normal-like distribution.
    """
    return np.log1p(np.maximum(y, 0))


def inverse_log_transform(y_log):
    """
    Inverts log transformation back to real Price (Lakhs): Price = exp(y_log) - 1
    """
    return np.expm1(y_log)


def build_full_preprocessing_pipeline(feature_engineer: CarFeatureEngineer):
    """
    Assembles the complete Scikit-Learn preprocessing Pipeline:
    - Custom feature engineering transformer
    - StandardScaler on numerical features (car age, mileage, engine cc)
    - Passthrough on binary features
    - OneHotEncoder on categorical features (gear, fuel_type, model_grouped)
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


# Verification runner when executing script directly
if __name__ == "__main__":
    import os

    print("=" * 60)
    print("FEATURE ENGINEERING PIPELINE VERIFICATION")
    print("=" * 60)

    data_path = os.path.join(os.path.dirname(__file__), "dataset", "car_price_dataset_clean.csv")
    if not os.path.exists(data_path):
        print("Clean dataset not found. Running clean_dataset first...")
        from clean_dataset import clean_dataset
        df = clean_dataset()
    else:
        df = pd.read_csv(data_path)

    print(f"\n1. Loaded Clean Dataset Shape: {df.shape}")

    # Separate feature matrix (X) and target variable (y)
    y_raw = df["Price"]
    X_raw = df.drop(columns=["Price"])

    # Target outlier IQR clipping
    y_clipped, l_bound, u_bound = clip_target_outliers(y_raw)
    print(f"2. Target IQR Capping: Bounds [{l_bound:.2f}, {u_bound:.2f}] Lakhs")

    # Target log transformation
    y_log = log_transform_target(y_clipped)
    print(f"3. Log Transform Target: Skewness reduced from {y_raw.skew():.2f} to {y_log.skew():.2f}")

    # Initialize and fit preprocessing pipeline
    fe = CarFeatureEngineer()
    pipeline = build_full_preprocessing_pipeline(fe)

    print("\n4. Fitting Preprocessing Pipeline...")
    X_transformed = pipeline.fit_transform(X_raw)
    print(f"   Transformed Feature Matrix Shape: {X_transformed.shape}")

    print("\n5. Learned Metadata:")
    print(f"   - Unique Brands: {len(fe.unique_brands_)}")
    print(f"   - Frequent Models: {len(fe.frequent_models_)} (Rare models -> 'OTHER')")
    print(f"   - Unique Towns: {len(fe.unique_towns_)}")
    print(f"   - Fuel Types: {fe.unique_fuel_types_}")
    print(f"   - Gears: {fe.unique_gears_}")
    print(f"   - Mileage IQR Upper Bound: {fe.mileage_upper_bound_:.2f} KM")

    print("\nPipeline successfully verified!")
