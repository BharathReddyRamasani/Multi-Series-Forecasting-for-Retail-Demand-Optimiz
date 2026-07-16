# Test script
import requests

try:
    res = requests.get("http://localhost:8000/api/health")
    print("STATUS:", res.status_code)
    print("RESPONSE:", res.text)
except Exception as e:
    print("ERROR:", str(e))
