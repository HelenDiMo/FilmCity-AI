# Imagen base oficial de Python ligera
FROM python:3.11-slim

# Evitar que Python escriba archivos .pyc y forzar buffer de logs inmediato
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements desde la raíz e instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiar el código fuente de la aplicación desde backend/app
COPY backend/app ./app

# Exponer el puerto de FastAPI
EXPOSE 8000

# Comando de arranque con Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]