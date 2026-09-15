# 🎬 FilmCity IA — Plataforma Inteligente de Triaje y Mediación de Rodajes Urbanos

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Pydantic v2](https://img.shields.io/badge/Validation-Pydantic%20v2-E92063?style=flat&logo=pydantic)](https://docs.pydantic.dev/)
[![Pytest](https://img.shields.io/badge/Testing-Pytest%20(100%25%20Passed)-brightgreen?style=flat&logo=pytest)](https://pytest.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**FilmCity IA** es una solución cívico-tecnológica diseñada para la mediación y gestión operativa de rodajes audiovisuales en el espacio público (Madrid Film Office). La plataforma implementa un pipeline de triaje automatizado con modelos LLM de código abierto, razonamiento estructurado **ReAct**, enriquecimiento geográfico mediante **geolocalización GPS (OpenStreetMap Nominatim)**, validación determinista de esquemas mediante **Pydantic v2** y una arquitectura **Human-in-the-Loop (HITL)** para la supervisión y validación por parte de operadores municipales.

---

## 🏛️ Arquitectura del Sistema

```
                      ┌─────────────────────────────────┐
                      │    Portal Ciudadano / Admin     │
                      │  GPS Nominatim + React + Vite   │
                      └───────────────┬─────────────────┘
                                      │ Ingesta Enriquecida (Coords + Calle)
                                      ▼
                      ┌─────────────────────────────────┐
                      │      FastAPI Backend Core       │
                      │   Type-Safety & Middlewares     │
                      └───────────────┬─────────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
  ┌───────────────────────────────┐         ┌───────────────────────────────┐
  │   Proveedor Cloud (Groq)      │         │   Proveedor Local (Ollama)    │
  │   Llama 3.3 70B Versatile     │         │   Qwen 2.5 Coder              │
  │   Alta Velocidad LPUs (~300ms)│         │   Soberanía RGPD / Coste 0.0$ │
  └──────────────┬────────────────┘         └──────────────┬────────────────┘
                 │                                         │
                 └────────────────────┬────────────────────┘
                                      ▼
                      ┌─────────────────────────────────┐
                      │   Capa de Validación Pydantic   │
                      │  Sanitización ≤10 palabras      │
                      │  Autocorrección JSON defensiva  │
                      └───────────────┬─────────────────┘
                                      ▼
                      ┌─────────────────────────────────┐
                      │   Consola de Operador (HITL)    │
                      │  Auditoría ReAct + Validación   │
                      └─────────────────────────────────┘
```

### Principios y Decisiones de Diseño

* **Geolocalización Asistida por GPS (OpenStreetMap Reverse Geocoding):** Ingesta ciudadana enriquecida con coordenadas exactas y normalización de calle/distrito mediante la API de Nominatim. Proporciona al motor LLM el contexto espacial para inferir competencias de las Juntas de Distrito de Madrid.
* **Ecosistema Abierto & Multi-Proveedor:** Desacoplamiento de la infraestructura de inferencia mediante el patrón *Strategy/Provider*. Permite alternar en tiempo de ejecución entre **Groq Cloud API** (Llama 3.3 70B para alto rendimiento) y **Ollama Local** (Qwen 2.5 Coder para soberanía de datos estricta y privacidad).
* **Razonamiento ReAct (Reasoning + Acting):** Inyección de directrices en tres fases auditables:
  * **Thought:** Análisis contextual del incidente, cruce espacial con el set de rodaje y evaluación de riesgos.
  * **Action:** Protocolo municipal aplicable y comprobación de permisos.
  * **Observation:** Determinación de prioridad operativa y asignación departamental.
* **Validación Estricta & Parsing Defensivo:** Modelado con **Pydantic v2** y enumeraciones cerradas (`UrgencyLevel`, `IncidentCategory`, `Department`). Incluye sanitización automática para restringir la síntesis ejecutiva a un máximo estricto de 10 palabras y tolerancia a respuestas truncadas.
* **Human-in-the-Loop (HITL):** El modelo genera un dictamen preliminar que es auditado en tiempo real por el operador municipal, quien cuenta con la potestad de confirmar o reasignar el expediente antes de su derivación a los servicios de calle.

---

## 🗂️ Estructura del Repositorio

```text
FilmCity-AI/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/  # Rutas de Triaje, Comparativa y Sets
│   │   ├── core/              # Configuraciones de entorno y CORS
│   │   ├── models/            # Schemas Pydantic y Enums tipados
│   │   └── services/          # Clientes LLM (Groq/Ollama) y Prompts ReAct
│   ├── tests/
│   │   └── test_triage_api.py # Suite de pruebas unitarias y de integración
│   ├── requirements.txt       # Dependencias backend
│   └── run.py                 # Script de arranque Uvicorn
├── frontend/
│   ├── src/
│   │   ├── components/        # CitizenPortal (GPS), TriageForm, TriageResultCard, ComparisonView
│   │   ├── types/             # Interfaces TypeScript espejo de Pydantic
│   │   └── App.tsx            # Navegación y orquestación de estado
│   ├── package.json           # Dependencias frontend
│   └── vite.config.ts         # Configuración Vite + Proxy
└── README.md
```

---

## 🚀 Puesta en Marcha

### Prerrequisitos

* Python 3.11+
* Node.js 18+
* Ollama local en ejecución (`ollama serve`) con el modelo `qwen2.5-coder` (opcional para inferencia local).
* Clave de API de Groq Console.

### 1. Configuración del Backend

```bash
cd backend

# Crear y activar entorno virtual
python -m venv venv
source venv/bin/activate   # En Linux/Mac
venv\Scripts\activate      # En Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
```

Variables de entorno requeridas en `backend/.env`:

```
GROQ_API_KEY=gsk_tu_clave_de_groq_aqui
GROQ_MODEL=llama-3.3-70b-versatile
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder
```

Iniciar servidor API:

```bash
python run.py
# Servidor disponible en http://localhost:8000 (Documentación Swagger: http://localhost:8000/docs)
```

### 2. Configuración del Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
# Aplicación disponible en http://localhost:5173
```

---

## 🧪 Batería de Pruebas y Cobertura (Pytest)

La suite de pruebas automatizadas valida la robustez de los contratos de API, la detección de alucinaciones estructurales, la sanitización de resúmenes y el comportamiento ante fallos de conexión.

### Ejecución de Tests con Reporte de Cobertura

```bash
cd backend
python -m pytest --cov=app --cov-report=term-missing --cov-report=html tests/test_triage_api.py
```

### Resumen de Cobertura Obtenido

```
==================================== test session starts ====================================
collected 11 items

tests/test_triage_api.py ...........                                                  [100%]

---------------------------------------------------------------------------------------------
Name                                  Stmts   Miss  Cover   Missing
---------------------------------------------------------------------------------------------
app/main.py                              12      0   100%
app/core/config.py                       20      0   100%
app/models/enums.py                      22      0   100%
app/models/schemas.py                    36      1    97%
app/api/v1/endpoints/sets.py             15      1    93%
app/api/v1/endpoints/triage.py           22      4    82%
app/services/prompts.py                   8      0   100%
app/services/llm_service.py              14      7    50%
app/services/llm_providers.py            85     55    35%   (Aislado con mocks para CI/CD)
---------------------------------------------------------------------------------------------
TOTAL                                   234     68    71%
================================ 11 passed, 3 warnings in 0.53s ==============================
```

**Aislamiento de Red:** Los clientes de red hacia proveedores externos (`llm_providers.py`) se aíslan intencionadamente mediante `unittest.mock` para garantizar pruebas deterministas, rápidas y sin coste de consumo de cuota ni dependencia de internet.

---

## 📊 Matriz Comparativa: Groq Cloud vs. Ollama Local

| Métrica / Dimensión | Groq Cloud API (Llama 3.3 70B) | Ollama Local (Qwen 2.5 Coder) |
|---|---|---|
| **Latencia Promedio** | ~250 ms – 450 ms (Hardware LPU) | ~1.800 ms – 3.200 ms (CPU/GPU local) |
| **Coste Operativo** | ~$0.00005 USD / petición | $0.00000 USD (Sin coste de tokens) |
| **Privacidad / RGPD** | Procesamiento en infraestructura cloud | 100% On-Premise / Soberanía Total |
| **Escenario Óptimo** | Picos de tráfico y alta concurrencia | Incidencias confidenciales / Modo offline |

---

## 🎨 Sistema de Diseño y Colorimetría

La interfaz de FilmCity IA utiliza una paleta en modo oscuro (*Dark Mode UI*) orientada a consolas operativas y salas de control municipal, combinando alto contraste para accesibilidad y codificación semántica de estados:

### 1. Paleta de Superficies y Jerarquía Visual

| Elemento / Capa | Clase Tailwind | Hex / Token | Propósito y Uso |
| :--- | :--- | :--- | :--- |
| **Fondo Principal** | `bg-neutral-900` / `bg-slate-950` | ![#0f172a](https://img.shields.io/badge/-%230f172a-0f172a) ![#171717](https://img.shields.io/badge/-%23171717-171717) | Lienzo base de baja fatiga visual para turnos de monitoreo continuo. |
| **Tarjetas y Paneles** | `bg-neutral-700` | ![#3f3f46](https://img.shields.io/badge/-%233f3f46-3f3f46) | Contenedores principales de dictámenes y formularios (elevación visual). |
| **Bloques Interiores** | `bg-neutral-900` / `bg-neutral-800` | ![#18181b](https://img.shields.io/badge/-%2318181b-18181b) ![#27272a](https://img.shields.io/badge/-%2327272a-27272a) | Cajas de métricas, síntesis ejecutiva y trazas ReAct. |
| **Acento Primario** | `bg-yellow-400` / `text-zinc-950` | ![#facc15](https://img.shields.io/badge/-%23facc15-facc15) | Acciones principales (*Call to Action*), geolocalización GPS y foco. |

### 2. Semántica de Proveedores (Benchmarking)

| Proveedor | Clase Tailwind | Color | Descripción |
| :--- | :--- | :--- | :--- |
| 🟠 **Groq Cloud API** | `bg-orange-600` | ![#ea580c](https://img.shields.io/badge/-%23ea580c-ea580c) | Naranja Oficial, asociado al isotipo del rayo LPU y a la alta velocidad de procesamiento en la nube. |
| ⚪ **Ollama Local** | `text-white` / `text-amber-400` | ![#ffffff](https://img.shields.io/badge/-%23ffffff-ffffff) ![#fbbf24](https://img.shields.io/badge/-%23fbbf24-fbbf24) | Blanco / Ámbar, representando la soberanía de datos *On-Premise* y la inferencia local sin coste. |

### 3. Codificación Semántica de Urgencia (HITL)

| Nivel | Clases Tailwind | Color |
| :--- | :--- | :--- |
| 🔵 **Baja** | `bg-blue-500/10` `text-blue-400` `border-blue-500/30` | ![#60a5fa](https://img.shields.io/badge/-%2360a5fa-60a5fa) |
| 🟢 **Media** | `bg-emerald-500/10` `text-emerald-400` `border-emerald-500/30` | ![#34d399](https://img.shields.io/badge/-%2334d399-34d399) |
| 🟡 **Alta** | `bg-amber-500/10` `text-amber-400` `border-amber-500/30` | ![#fbbf24](https://img.shields.io/badge/-%23fbbf24-fbbf24) |
| 🔴 **Crítica** | `bg-rose-500/20` `text-rose-400` `border-rose-500/40` | ![#fb7185](https://img.shields.io/badge/-%23fb7185-fb7185) |

---

## 🛡️ Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más información.