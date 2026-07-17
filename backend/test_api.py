import sys
import os
sys.path.append('D:/forecast')
from main import app
from fastapi.testclient import TestClient
with TestClient(app) as client:
# Login to obtain JWT token
login_resp = client.post('/api/auth/login', data={'username':'admin','password':'admin123'})
assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
access_token = login_resp.json().get('access_token')
client.headers.update({'Authorization': f'Bearer {access_token}'})

# Health check
print('Health status:', client.get('/api/health').status_code)
print('Health body:', client.get('/api/health').json())

# Detailed health
print('Detailed health status:', client.get('/health/detailed').status_code)
print('Detailed health body:', client.get('/health/detailed').json())

# Stores-items
print('Stores-items status:', client.get('/api/stores-items').status_code)
print('Stores-items body:', client.get('/api/stores-items').json())

# Forecast LightGBM
resp = client.post('/api/forecast', json={'store':1,'item':1,'horizon':7,'model_type':'lightgbm'})
print('Forecast LightGBM status:', resp.status_code)
print('Forecast LightGBM body sample:', resp.json()[:2] if resp.ok else resp.text)

# Forecast RF (expected error)
resp2 = client.post('/api/forecast', json={'store':1,'item':1,'horizon':7,'model_type':'rf'})
print('Forecast RF status:', resp2.status_code)
print('Forecast RF body:', resp2.json())

# Model performance endpoint
mp = client.get('/api/model-performance/').json()
print('Model performance keys:', mp.keys())

# Feature importance
fi = client.get('/api/model-performance/importance?model=lightgbm').json()
print('Feature importance count:', len(fi))

# History accuracy-history
hist = client.get('/api/history/accuracy-history?store=1&item=1').json()
print('Accuracy history:', hist)

# Explain endpoint
exp = client.post('/api/explain/', json={'store':1,'item':1,'forecast_date':'2025-07-17','model_type':'lightgbm'}).json()
print('Explain result keys:', exp.keys())
