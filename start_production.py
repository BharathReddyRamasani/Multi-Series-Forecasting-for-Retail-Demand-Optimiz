"""
DemandAI Production Server
Builds the frontend and serves it from FastAPI as static files.

Usage:
    python start_production.py              # default port 8000
    PORT=8080 python start_production.py    # custom port
    CORS_ORIGINS=https://myapp.com python start_production.py
"""
import subprocess
import sys
import os
import shutil

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")
STATIC_DIR = os.path.join(BACKEND_DIR, "static")

PORT = int(os.environ.get("PORT", "8000"))
HOST = os.environ.get("HOST", "0.0.0.0")


def build_frontend():
    print("Building frontend...")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    result = subprocess.run(
        [npm_cmd, "run", "build"],
        cwd=FRONTEND_DIR,
        shell=sys.platform == "win32",
    )
    if result.returncode != 0:
        print("ERROR: Frontend build failed!")
        sys.exit(1)

    dist_dir = os.path.join(FRONTEND_DIR, "dist")
    if not os.path.isdir(dist_dir):
        print("ERROR: dist/ directory not found after build.")
        sys.exit(1)

    if os.path.exists(STATIC_DIR):
        shutil.rmtree(STATIC_DIR)
    shutil.copytree(dist_dir, STATIC_DIR)
    print("Frontend built and copied to backend/static/")


def install_backend_deps():
    print("Installing backend dependencies...")
    subprocess.run(
        [sys.executable, "-m", "pip", "install", "-r",
         os.path.join(BACKEND_DIR, "requirements.txt")],
        check=True,
    )


def start_server():
    print(f"\nStarting production server on http://{HOST}:{PORT}")
    print(f"API docs at http://localhost:{PORT}/docs\n")
    subprocess.run(
        [
            sys.executable, "-m", "uvicorn",
            "main:app",
            "--host", HOST,
            "--port", str(PORT),
            "--workers", "1",
            "--log-level", "info",
        ],
        cwd=BACKEND_DIR,
        env={**os.environ, "ENV": "production"},
    )


if __name__ == "__main__":
    build_frontend()
    install_backend_deps()
    start_server()
