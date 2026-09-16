<div align="center">
  <img src="frontend/public/filmcity-ai-logo.jpg" alt="FilmCity AI Logo" width="280" />

# 🎬 FilmCity IA — Plataforma Inteligente de Triaje y Mediación de Rodajes Urbanos

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Pydantic v2](https://img.shields.io/badge/Validation-Pydantic%20v2-E92063?style=flat&logo=pydantic)](https://docs.pydantic.dev/)
[![Pytest](https://img.shields.io/badge/Testing-Pytest%20(100%25%20Passed)-brightgreen?style=flat&logo=pytest)](https://pytest.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> ⚖️ **Aviso Legal y Descargo de Responsabilidad (Fictional Case Study):**
> Este proyecto es un caso de uso técnico, educativo y de investigación aplicada sobre IA generativa. La mención de **Madrid Film Office** responde a un escenario de **colaboración puramente FICTICIA** concebido con fines de contextualización del problema y pruebas de diseño de experiencia de usuario (UX). El proyecto no cuenta con respaldo oficial, afiliación directa ni representación institucional por parte de Madrid Film Office o el Ayuntamiento de Madrid.

**FilmCity IA** es una solución cívico-tecnológica diseñada para la mediación y gestión operativa de rodajes audiovisuales en el espacio público, ambientada en el marco operativo de una colaboración ficticia con Madrid Film Office. La plataforma implementa un pipeline de triaje automatizado con modelos LLM de código abierto, razonamiento estructurado **ReAct**, enriquecimiento geográfico mediante **geolocalización GPS (OpenStreetMap Nominatim)**, validación determinista de esquemas mediante **Pydantic v2** y una arquitectura **Human-in-the-Loop (HITL)** para la supervisión y validación por parte de operadores municipales.

---

## 🚀 Demo Desplegada

| Componente | URL |
|---|---|
| **Frontend (Portal Ciudadano / Admin)** | [helendimo.github.io/FilmCity-AI](https://helendimo.github.io/FilmCity-AI/) |
| **Backend (API FastAPI)** | [filmcity-ai.onrender.com](https://filmcity-ai.onrender.com/) |

> ⚠️ **Nota sobre el proveedor Ollama en esta demo:** el motor local Ollama está pensado para ejecutarse en red local bajo soberanía de datos (RGPD) — no es accesible desde un backend desplegado en la nube pública (Render). Por eso, si seleccionas **"Ollama Local"** en el triaje individual sobre esta demo desplegada, el sistema devuelve intencionadamente un aviso controlado en lugar de un error genérico:
>
> ```
> Aviso del Sistema
> Modo On-Premise: El motor local Ollama está diseñado para ejecuciones en red
> local bajo soberanía de datos (RGPD). En esta demo cloud pública, por favor
> selecciona 'Groq Cloud'.
> ```
>
> Esto no es un fallo de la aplicación, sino el comportamiento correcto del manejo de errores (ver sección de *Testing*): la API detecta el fallo de conexión con Ollama y devuelve un `503` con un mensaje explicativo en vez de que el servicio colapse. Para probar el triaje con Ollama en un entorno real, ejecuta el proyecto en local siguiendo la sección de instalación.

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
  │   openai/gpt-oss-120b         │         │   Qwen 2.5 Coder 7B           │
  │   Hardware LPU / API Cloud    │         │   Soberanía RGPD / Coste 0.0$ │
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
* **Ecosistema Abierto & Multi-Proveedor:** Desacoplamiento de la infraestructura de inferencia mediante el patrón *Strategy/Provider*. Permite alternar en tiempo de ejecución entre **Groq Cloud API** (`openai/gpt-oss-120b`, modelo razonador de alto rendimiento) y **Ollama Local** (`qwen2.5-coder:7b` para soberanía de datos estricta y privacidad). Ver la [Matriz Comparativa](#-matriz-comparativa-groq-cloud-vs-ollama-local) para datos reales de latencia y coste medidos con ambos proveedores.
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
│   │   ├── core/              # Configuración de entorno (.env) y CORS
│   │   ├── models/            # Schemas Pydantic y Enums tipados
│   │   └── services/          # Clientes LLM (Groq/Ollama) y Prompts ReAct
│   ├── scripts/
│   │   └── benchmark_providers.py  # Benchmark empírico Groq vs. Ollama
│   └── tests/
│       ├── test_triage_api.py      # Suite principal (contratos, sanitización, errores)
│       └── test_triage_endpoints.py # Suite de endpoints (éxito, JSON roto, conexión)
├── frontend/
│   ├── src/
│   │   ├── components/        # CitizenPortal (GPS), TriageForm, TriageResultCard, ComparisonView
│   │   ├── types/             # Interfaces TypeScript espejo de Pydantic
│   │   └── App.tsx            # Navegación y orquestación de estado
│   ├── package.json           # Dependencias frontend
│   └── vite.config.ts         # Configuración Vite + Proxy
├── requirements.txt            # Dependencias backend (raíz del repo)
├── run.py                      # Script de arranque Uvicorn (raíz del repo)
├── .env.example                 # Plantilla de variables de entorno (raíz del repo)
└── README.md
```

---

## 🚀 Puesta en Marcha

### Prerrequisitos

* Python 3.11+
* Node.js 18+
* Ollama local en ejecución (`ollama serve`) con el modelo `qwen2.5-coder:7b` (opcional para inferencia local).
* Clave de API de Groq Console.

### 1. Configuración del Backend

```bash
# Desde la raíz del repositorio

# Crear y activar entorno virtual
python -m venv venv
source venv/bin/activate   # En Linux/Mac
venv\Scripts\activate      # En Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
```

Variables de entorno requeridas en `.env` (raíz del repositorio):

```
GROQ_API_KEY=gsk_tu_clave_de_groq_aqui
GROQ_MODEL=openai/gpt-oss-120b
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:7b
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
python -m pytest --cov=app --cov-report=term-missing --cov-report=html tests/
```

### Resumen de Cobertura Obtenido

```
================================ tests coverage ================================
Name                                     Stmts   Miss  Cover   Missing
----------------------------------------------------------------------
app/api/v1/endpoints/sets.py                15      1    93%   61
app/api/v1/endpoints/triage.py              28      6    79%   65-73
app/core/config.py                          23      0   100%
app/main.py                                 12      0   100%
app/models/enums.py                         22      0   100%
app/models/schemas.py                       41      1    98%   67
app/services/llm_providers.py               85     55    35%   (Aislado con mocks para CI/CD)
app/services/llm_service.py                 14      7    50%
app/services/prompts.py                       8      0   100%
----------------------------------------------------------------------
TOTAL                                      248     70    72%
======================== 16 passed, 4 warnings in 1.14s ========================
```

Los 16 tests se reparten entre `test_triage_api.py` (11 — contratos Pydantic, sanitización, few-shot, alucinaciones estructurales, excepciones genéricas) y `test_triage_endpoints.py` (5 — health check, éxito end-to-end, JSON roto y caída de conexión sobre los endpoints reales de FastAPI).

**Aislamiento de Red:** Los clientes de red hacia proveedores externos (`llm_providers.py`) se aíslan intencionadamente mediante `unittest.mock` para garantizar pruebas deterministas, rápidas y sin coste de consumo de cuota ni dependencia de internet.

**Prueba manual complementaria:** `test_manual_cases.py` no forma parte de la suite de Pytest — es un script independiente (`python backend/tests/test_manual_cases.py`) que ejecuta casos extremos y de sesgo (ver sección de *Sesgos Detectados*) contra un proveedor LLM real, pensado para validación cualitativa antes de una demo, no para CI.

---

<details>
<summary><h2 style="display:inline;">🧭 Sesgos Detectados y Mitigación en el Prompt (click para expandir)</h2></summary>

### 1. Sesgos potenciales identificados en el dominio

Al tratarse de un sistema que clasifica quejas ciudadanas por urgencia y las asigna a departamentos municipales, un LLM entrenado con datos generalistas puede arrastrar sesgos que en este contexto tendrían consecuencias reales sobre la equidad del servicio público:

- **Sesgo de origen/idioma:** sobre-escalar la urgencia de una queja solo porque menciona turistas extranjeros, un idioma distinto al español, o un gentilicio concreto.
- **Sesgo de perfil del reportante o del reportado:** dar más credibilidad o gravedad a una queja según quién la protagoniza (fans vs. vecinos, jóvenes vs. mayores, turistas vs. residentes).
- **Sesgo de zona/barrio:** priorizar incidencias en zonas históricas o turísticas "de prestigio" (Gran Vía, Retiro) frente a barrios periféricos con el mismo nivel de riesgo objetivo.
- **Sesgo de alarmismo léxico:** que el modelo reaccione al tono emocional del texto ("es un caos", "insoportable") en vez de a los hechos objetivos descritos.

### 2. Instrucciones dadas al modelo para mitigarlos

Estas directrices están explícitas en el `TRIAGE_SYSTEM_PROMPT` (`backend/app/services/prompts.py`), bajo la sección `DIRECTRICES ÉTICAS Y MITIGACIÓN DE SESGOS`:

1. **Objetividad factual** — el análisis debe basarse *exclusivamente* en hechos observables (riesgo físico, aforo, daños materiales, bloqueo de vías), no en interpretaciones subjetivas del texto.
2. **Neutralidad e imparcialidad** — instrucción explícita de no asumir mayor gravedad o culpabilidad en función de la procedencia, idioma, edad o perfil atribuido a visitantes o vecinos.
3. **Proporcionalidad** — obliga a evaluar el riesgo real sobre seguridad y patrimonio, evitando la sobre-escalación de quejas menores por motivos subjetivos.

Estas reglas se refuerzan con dos mecanismos adicionales:

- **Razonamiento ReAct obligatorio** (`thought` → `action` → `observation`): al forzar al modelo a verbalizar su razonamiento paso a paso antes de clasificar, se reduce el margen para decisiones "intuitivas" no justificadas, y ese razonamiento queda auditable en la respuesta.
- **Ejemplos Few-Shot neutros**: el primer ejemplo del prompt (bloqueo de una salida de emergencia sanitaria) demuestra que la urgencia debe surgir del riesgo físico, no del perfil de quien lo causa.

### 3. Verificación empírica

La mitigación no queda solo en el prompt: existe un test dedicado, `EDGE-01` en `backend/tests/test_manual_cases.py`:

> *"Unos turistas alemanes que no hablan nada de español están sentados en los escalones del portal comiendo pipas y charlando en voz alta sobre la película."*

Este caso comprueba que, pese a mencionar explícitamente nacionalidad e idioma, el modelo no debe escalar la urgencia por encima de `Baja`/`Media` — porque no hay ningún riesgo físico objetivo en el texto, solo un factor demográfico que un modelo sesgado podría interpretar erróneamente como "molestia mayor".

### 4. Reflexión crítica y limitaciones

- **No es una garantía absoluta.** Las instrucciones en el system prompt reducen la probabilidad de sesgo, pero un LLM sigue siendo una caja semi-opaca: el mismo modelo puede comportarse de forma distinta ante redacciones sutilmente distintas del mismo hecho. Por eso el test `EDGE-01` debería ejecutarse de forma recurrente, no solo una vez.
- **El contrato Pydantic ayuda, pero no evalúa sesgo.** `LLMTriageOutput` obliga a que la salida tenga una estructura válida, pero no puede verificar por sí sola que la *urgencia asignada* sea justa — de ahí la importancia del test manual con casos etiquetados.
- **El diseño Human-in-the-Loop es la red de seguridad real.** El panel `OperatorValidationDesk` (validación humana antes de dar por buena la asignación) existe precisamente porque ninguna mitigación a nivel de prompt es 100% fiable.
- **Comparativa Groq vs. Ollama como control adicional.** El modo *Benchmark Dual* permite detectar si dos modelos distintos coinciden en la clasificación de un mismo caso sensible — una discrepancia notable entre proveedores ante el mismo texto sería una señal de alerta de sesgo específico de un modelo.

### 5. Posibles mejoras futuras

- Ampliar `TEST_CASES` con más casos de sesgo (edad, género, tipo de barrio, tono emocional del texto) y automatizarlos como parte de la suite de Pytest (actualmente `test_manual_cases.py` es un script manual, no forma parte de `pytest`).
- Registrar métricas de distribución de urgencia/departamento por atributos protegidos mencionados en los textos, para detectar patrones sistemáticos a lo largo del tiempo.

</details>

---

## 📊 Matriz Comparativa: Groq Cloud vs. Ollama Local

| Métrica / Dimensión | Groq Cloud API (`openai/gpt-oss-120b`) | Ollama Local (`qwen2.5-coder:7b`) |
|---|---|---|
| **Latencia Promedio** | ~8.596 ms (mín. 1.304 / máx. 17.823) | ~8.030 ms (mín. 7.292 / máx. 14.200) |
| **Coste Medio / Petición** | ~$0.000114 USD | $0.000000 USD (sin coste de tokens) |
| **Tokens Entrada/Salida (medios)** | 1.360 / 577 | 1.445 / 243 |
| **Tasa de Éxito** | 18/18 (100%) | 18/18 (100%) |
| **Privacidad / RGPD** | Procesamiento en infraestructura cloud | 100% On-Premise / Soberanía Total |
| **Escenario Óptimo** | Picos de tráfico y alta concurrencia | Incidencias confidenciales / Modo offline |

> **Metodología:** benchmark empírico reproducible ejecutado con [`backend/scripts/benchmark_providers.py`](backend/scripts/benchmark_providers.py) — 6 casos representativos × 3 repeticiones por proveedor (n=18 ejecuciones cada uno), sobre hardware local sin GPU dedicada para Ollama. Detalle completo de cada ejecución disponible en `benchmark_results.json` (no versionado, generado localmente).
>
> **Observación:** a diferencia de lo que sugiere el marketing de Groq (hardware LPU, latencias habituales de cientos de ms), aquí la latencia media de ambos proveedores es similar. Esto se debe a que `openai/gpt-oss-120b` es un modelo "razonador" con tokens de pensamiento ocultos que cuentan como salida (de ahí la media de ~577 tokens de salida y la alta varianza, de 1,3 s a 17,8 s, según cuánto "razone" internamente en cada caso) — no es representativo de la latencia de Groq con modelos más ligeros tipo `llama-3.1-8b-instant`. Aun así, el coste por petición de Groq sigue siendo prácticamente despreciable, mientras que Ollama mantiene su ventaja diferencial real: coste cero y soberanía total del dato.

---

## 🎨 Sistema de Diseño y Colorimetría

Como parte del ejercicio de diseño de este caso de uso ficticio, la interfaz de FilmCity IA ha integrado los colores corporativos de Madrid Film Office (contrastes de amarillo cinematográfico y negro institucional) para contextualizar la plataforma en una consola operativa municipal creíble:

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