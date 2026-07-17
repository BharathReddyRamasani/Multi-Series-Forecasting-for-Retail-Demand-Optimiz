import sys
import os
sys.path.append('D:/forecast')
from main import app
from fastapi.testclient import TestClient

with TestClient(app) as client:
    # Authenticate
    login_resp = client.post('/api/auth/login', data={'username': 'admin', 'password': 'admin123'})
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token = login_resp.json().get('access_token')
    client.headers.update({'Authorization': f'Bearer {token}'})

    # Request prediction history for a known store/item
    resp = client.get('/api/history/prediction?store=1&item=1')
    assert resp.status_code == 200, f"Prediction history request failed: {resp.text}"
    data = resp.json()
    # Basic sanity checks
    assert 'rows' in data and isinstance(data['rows'], list)
    assert 'mae' in data and isinstance(data['mae'], (float, int, type(None)))
    assert 'mape' in data and isinstance(data['mape'], (float, int, type(None)))
    # Verify at least one row has expected keys
    if data['rows']:
        row = data['rows'][0]
        for key in ['date', 'actual', 'predicted']:
            assert key in row, f"Missing {key} in row"
    print('Prediction history endpoint works.')
