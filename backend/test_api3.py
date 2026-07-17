import sys
sys.path.append('D:/forecast')
from main import app
from fastapi.testclient import TestClient

with TestClient(app) as client:
    # Login (form fields)
    login = client.post('/api/auth/login', data={'username':'admin','password':'admin123'})
    assert login.status_code == 200, f'Login failed: {login.text}'
    token = login.json()['access_token']
    client.headers.update({'Authorization': f'Bearer {token}'})

    # Health
    health = client.get('/api/health')
    print('Health:', health.status_code, health.json())

    # Stores-items
    stores = client.get('/api/stores-items')
    print('Stores-items:', stores.status_code, stores.json())

    # Forecast LightGBM
    f_lb = client.post('/api/forecast', json={'store':1,'item':1,'horizon':7,'model_type':'lightgbm'})
    print('Forecast LB:', f_lb.status_code, f_lb.json()[:2] if f_lb.status_code==200 else f_lb.text)

    # Forecast RF (unmapped)
    f_rf = client.post('/api/forecast', json={'store':1,'item':1,'horizon':7,'model_type':'rf'})
    print('Forecast RF:', f_rf.status_code, f_rf.json())

    # Model performance
    mp = client.get('/api/model-performance/')
    print('Model performance keys:', mp.json().keys())

    # Feature importance
    fi = client.get('/api/model-performance/importance?model=lightgbm')
    print('Feature importance count:', len(fi.json()))

    # Accuracy history
    ah = client.get('/api/history/accuracy-history?store=1&item=1')
    print('Accuracy history:', ah.json())

    # Explain
    exp = client.post('/api/explain/', json={'store':1,'item':1,'forecast_date':'2025-07-17','model_type':'lightgbm'})
    print('Explain keys:', exp.json().keys())
