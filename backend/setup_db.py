import os
import pandas as pd
import numpy as np
import sqlite3
from datetime import datetime, timedelta

def generate_synthetic_data(num_stores=10, num_items=50, start_date='2020-01-01', end_date='2022-12-31'):
    print(f"Generating synthetic data for {num_stores} stores and {num_items} items from {start_date} to {end_date}...")
    
    dates = pd.date_range(start=start_date, end=end_date)
    
    data = []
    
    for store in range(1, num_stores + 1):
        for item in range(1, num_items + 1):
            # Base sales level for this store-item pair
            base_sales = np.random.randint(10, 100)
            
            # Trend (slight upward or downward)
            trend = np.linspace(0, np.random.uniform(-0.5, 2.0), len(dates))
            
            # Seasonality (weekly and yearly)
            day_of_week = dates.dayofweek
            day_of_year = dates.dayofyear
            
            weekly_seasonality = np.where(day_of_week >= 5, 1.3, 1.0) # Weekends 30% higher
            yearly_seasonality = 1.0 + 0.3 * np.sin(2 * np.pi * day_of_year / 365) # Peak in summer
            
            # Noise
            noise = np.random.normal(0, base_sales * 0.1, len(dates))
            
            sales = base_sales * trend * weekly_seasonality * yearly_seasonality + noise
            sales = np.maximum(0, sales).astype(int) # No negative sales
            
            df_store_item = pd.DataFrame({
                'date': dates,
                'store': store,
                'item': item,
                'sales': sales
            })
            
            data.append(df_store_item)
            
    df = pd.concat(data, ignore_index=True)
    return df

def setup_database():
    db_path = os.path.join(os.path.dirname(__file__), 'forecast.db')
    
    if os.path.exists(db_path):
        print(f"Database {db_path} already exists. Skipping generation.")
        return
        
    df = generate_synthetic_data()
    
    print(f"Saving {len(df)} rows to {db_path}...")
    
    conn = sqlite3.connect(db_path)
    
    # Stores table
    stores_df = pd.DataFrame({'store_id': df['store'].unique()})
    stores_df.to_sql('stores', conn, if_exists='replace', index=False)
    
    # Items table
    items_df = pd.DataFrame({'item_id': df['item'].unique()})
    items_df.to_sql('items', conn, if_exists='replace', index=False)
    
    # Sales table
    df.to_sql('sales', conn, if_exists='replace', index=False)
    
    # Empty forecast_history and model_results tables
    cursor = conn.cursor()
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS forecast_history (
        id TEXT PRIMARY KEY,
        timestamp TEXT,
        store_id INTEGER,
        item_id INTEGER,
        model TEXT,
        horizon INTEGER,
        expected_demand REAL
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS model_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model_name TEXT,
        rmse REAL,
        mae REAL,
        mape REAL,
        r2 REAL,
        training_time_sec REAL,
        prediction_time_ms REAL
    )
    ''')
    
    # Insert dummy model results
    cursor.execute('''
    INSERT INTO model_results (model_name, rmse, mae, mape, r2, training_time_sec, prediction_time_ms)
    VALUES 
    ('LightGBM', 9.2, 7.1, 15.4, 0.91, 12.5, 45.2),
    ('XGBoost', 10.4, 8.2, 17.1, 0.88, 25.1, 80.5),
    ('CatBoost', 9.5, 7.4, 16.0, 0.90, 45.0, 60.1),
    ('Random Forest', 14.2, 11.5, 22.4, 0.81, 120.0, 150.0)
    ''')
    
    conn.commit()
    conn.close()
    
    print("Database setup complete.")

if __name__ == "__main__":
    setup_database()
