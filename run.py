import sys
from pathlib import Path
import uvicorn

# Añadir la carpeta raíz al path de Python
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

if __name__ == "__main__":
    from src.api.main import app
    uvicorn.run(app, host="127.0.0.1", port=8000)