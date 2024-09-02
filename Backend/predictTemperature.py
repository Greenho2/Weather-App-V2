#Python Script to train linear regression model
import pandas as pd
from sklearn.linear_model import LinearRegression
import json
import sys

#Change date string to actual day value
def preprocess_dates(df, column_name='date'):

    if pd.to_datetime(df[column_name], errors='coerce').notna().all():
        df[column_name] = pd.to_datetime(df[column_name]).dt.dayofyear

    else:
        df[column_name] = pd.to_numeric(df[column_name], errors='coerce')
    
    return df

#Train on old data and predict avg temp using future data
def predict_temperature(historical_data, future_data):
    
    df = pd.DataFrame(historical_data)
    
    df = preprocess_dates(df)
    
    if df.empty:
        raise ValueError("Input historical data is empty. Cannot perform predictions.")
    
    # Ensure data is formatted correctly
    required_columns = ['date', 'minTemp', 'maxTemp', 'avgTemp']

    if not all(column in df.columns for column in required_columns):
        raise ValueError("Historical data must contain 'date', 'minTemp', 'maxTemp', and 'avgTemp' columns.")
    
    #Data
    X = df[['date', 'minTemp', 'maxTemp']]

    #Target
    y = df['avgTemp']
    
    # Train model
    model = LinearRegression()
    model.fit(X, y)
    
    future_df = pd.DataFrame(future_data)
    
    future_df = preprocess_dates(future_df)
    
    # Ensure future data is formatted correctly
    if not all(column in future_df.columns for column in ['date', 'minTemp', 'maxTemp']):
        raise ValueError("Future data must contain 'date', 'minTemp', and 'maxTemp' columns.")
    
    # Predict the average temperature for future dates
    predictions = model.predict(future_df[['date', 'minTemp', 'maxTemp']])
    
    return list(predictions)

def main():

    if len(sys.argv) != 3:
        print("Usage: predict_temperature.py <historical_data_file> <future_data_file>")
        sys.exit(1)
    
    historical_file_path = sys.argv[1]
    future_file_path = sys.argv[2]
    
    # Load historical data
    with open(historical_file_path, 'r') as file:
        historical_data = json.load(file)
    
    # Check if historical data is valid
    if not isinstance(historical_data, list):
        print("Error: Historical data must be a list of dictionaries.")
        sys.exit(1)
    
    # Load future data
    with open(future_file_path, 'r') as file:
        future_data = json.load(file)
    
    # Check if future data is valid
    if not isinstance(future_data, list):
        print("Error: Future data must be a list of dictionaries.")
        sys.exit(1)
    
    #Train model and predict
    try:
        avg_temps = predict_temperature(historical_data, future_data)
        
        #output back to the server
        print(json.dumps({'predicted_avg_temps': avg_temps}))
    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
