import sys
sys.path.append('D:/forecast')
from main import app
from fastapi.testclient import TestClient

with TestClient(app) as client:
    # login
    login = client.post('/api/auth/login', data={'username':'admin','password':'admin123'})
    assert login.status_code == 200, f'Login failed: {login.text}'
    token = login.json()['access_token']
    client.headers.update({'Authorization': f'Bearer {token}'})
    # Forecast with randomforest
    resp = client.post('/api/forecast', json={'store':1,'item':1,'horizon':7,'model_type':'randomforest'})
    print('RF forecast status:', resp.status_code)
    print('RF forecast sample:', resp.json()['forecasts'][:2] if resp.status_code==200 else resp.text)
