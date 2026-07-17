import sys
sys.path.append('D:/forecast')
from main import app
from fastapi.testclient import TestClient

with TestClient(app) as client:
    # Login (form data)
    login_resp = client.post('/api/auth/login', data={'username':'admin','password':'admin123'})
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token = login_resp.json()['access_token']
    client.headers.update({'Authorization': f'Bearer {token}'})

    # Health endpoint (should report models loaded after startup)
    health = client.get('/api/health')
    print('Health:', health.status_code, health.json())

    # Stores-items (protected)
    stores_items_resp = client.get('/api/stores-items')
    print('Stores-items:', stores_items_resp.status_code, stores_items_resp.json() if stores_items_resp.ok else stores_items_resp.text)

    # Forecast LightGBM
    forecast_resp = client.post('/api/forecast', json={'store':1,'item':1,'horizon':7,'model_type':'lightgbm'})
    print('Forecast LB:', forecast_resp.status_code, forecast_resp.json()[:2] if forecast_resp.ok else forecast_resp.text)

    # Forecast RF (mapped error)
    forecast_rf_resp = client.post('/api/forecast', json={'store':1,'item':1,'horizon':7,'model_type':'rf'})
    print('Forecast RF:', forecast_rf_resp.status_code, forecast_rf_resp.json())

    # Model performance
    mp_resp = client.get('/api/model-performance/')
    print('Model perf keys:', mp_resp.json().keys())

    # Feature importance
    fi_resp = client.get('/api/model-performance/importance?model=lightgbm')
    print('Feature importance count:', len(fi_resp.json()))

    # Accuracy history
    ah_resp = client.get('/api/history/accuracy-history?store=1&item=1')
    print('Accuracy history:', ah_resp.json())

    # Explain
    exp_resp = client.post('/api/explain/', json={'store':1,'item':1,'forecast_date':'2025-07-17','model_type':'lightgbm'})
    print('Explain response keys:', exp_resp.json().keys())
