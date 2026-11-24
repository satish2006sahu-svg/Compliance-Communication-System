import threading
import time
import requests
import uvicorn
from app.main import app

def run_srv():
    uvicorn.run(app, host="127.0.0.1", port=8877, log_level="warning")

t = threading.Thread(target=run_srv, daemon=True)
t.start()
time.sleep(1.5)

res = requests.get("http://127.0.0.1:8877/api/system/status")
print("Response status:", res.status_code)
print("Response JSON:", res.json())
assert res.status_code == 200
print("Server probe test successful!")
