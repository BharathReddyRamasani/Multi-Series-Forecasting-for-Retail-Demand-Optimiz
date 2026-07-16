#!/usr/bin/env python3
"""
Start the DemandAI backend server.
Run from the project root: python start_backend.py
"""
import subprocess
import sys
import os

os.chdir(os.path.join(os.path.dirname(__file__), "backend"))

# Install dependencies if not already present
print("📦 Checking Python dependencies...")
subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)

# Start uvicorn
print("\n🚀 Starting FastAPI backend on http://localhost:8000")
print("📚 API docs: http://localhost:8000/docs\n")
subprocess.run([
    sys.executable, "-m", "uvicorn",
    "main:app",
    "--reload",
    "--host", "0.0.0.0",
    "--port", "8000",
])
