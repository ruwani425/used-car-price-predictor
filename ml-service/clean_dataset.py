import os
import pandas as pd

def clean_dataset(
    raw_path="dataset/car_price_dataset.csv",
    clean_path="dataset/car_price_dataset_clean.csv"
):
    """
    Cleans the raw vehicle dataset:
    1. Removes duplicate car records.
    2. Checks for missing / null values.
    3. Exports the cleaned dataset as a CSV file.
    """
    # Get current script folder path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Build absolute file paths for raw and cleaned CSVs
    full_raw_path = os.path.join(script_dir, raw_path)
    full_clean_path = os.path.join(script_dir, clean_path)

    print(f"Loading raw dataset from: {full_raw_path}")
    if not os.path.exists(full_raw_path):
        raise FileNotFoundError(f"Dataset not found at {full_raw_path}")

    # Load raw CSV into Pandas DataFrame
    df = pd.read_csv(full_raw_path)
    initial_rows = len(df)
    print(f"Initial raw rows: {initial_rows}")

    # Ignore index column 'Unnamed: 0' when checking for true duplicates
    cols_for_dup_check = [col for col in df.columns if col != "Unnamed: 0"]
    duplicate_count = df.duplicated(subset=cols_for_dup_check).sum()
    print(f"Duplicate rows identified: {duplicate_count}")

    # Remove all duplicate rows from the dataset
    df_clean = df.drop_duplicates(subset=cols_for_dup_check).copy()
    
    # Drop 'Unnamed: 0' index column permanently
    if "Unnamed: 0" in df_clean.columns:
        df_clean = df_clean.drop(columns=["Unnamed: 0"])

    clean_rows = len(df_clean)
    print(f"Rows after duplicate removal: {clean_rows} (Dropped: {initial_rows - clean_rows})")

    # Verify that there are no missing / null values remaining in the data
    null_counts = df_clean.isnull().sum().sum()
    print(f"Total null/missing values across all features: {null_counts}")
    assert null_counts == 0, f"Expected 0 missing values, found {null_counts}"

    # Create destination folder if it does not exist, then save cleaned CSV
    os.makedirs(os.path.dirname(full_clean_path), exist_ok=True)
    df_clean.to_csv(full_clean_path, index=False)
    print(f"Cleaned dataset saved successfully to: {full_clean_path}")

    return df_clean

# Run cleaning script directly
if __name__ == "__main__":
    clean_dataset()
