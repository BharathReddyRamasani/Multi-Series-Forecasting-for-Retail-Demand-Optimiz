import sys
sys.path.append('D:/forecast')
from main import app
from fastapi.testclient import TestClient

with TestClient(app) as client:
    # Login
    login = client.post('/api/auth/login', data={'username':'admin','password':'admin123'})
    assert login.status_code == 200, f'Login failed: {login.text}'
    token = login.json()['access_token']
    client.headers.update({'Authorization': f'Bearer {token}'})

    # Health
    health = client.get('/api/health')
    print('Health:', health.status_code, health.json())

    # Stores-items
    si = client.get('/api/stores-items')
    print('Stores-items:', si.status_code, si.json())

    # Forecast LightGBM
    f = client.post('/api/forecast', json={'store':1,'item':1,'horizon':7,'model_type':'lightgbm'})
    print('Forecast LB status:', f.status_code)
    if f.status_code == 200:
        data = f.json()
        print('Forecast LB sample:', data['forecasts'][:2])
    else:
        print('Forecast LB error:', f.text)

    # Forecast RF (unmapped)
    f_rf = client.post('/api/forecast', json={'store':1,'item':1,'horizon':7,'model_type':'rf'})
    print('Forecast RF status:', f_rf.status_code, f_rf.json())

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
