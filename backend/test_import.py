import sys
try:
    from services.forecaster import ForecastingService
    print("Forecaster imported successfully!")
except Exception as e:
    print(f"Error: {e}")
