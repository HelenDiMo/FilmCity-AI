# 🎬 ScreenGuard AI

> **Motor de triaje asistido por LLMs con validación Type-Safe y supervisión Human-in-the-Loop para servicios urbanos y turismo cinematográfico.**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Pydantic](https://img.shields.io/badge/Pydantic-v2-E92063?style=flat&logo=pydantic&logoColor=white)](https://docs.pydantic.dev/)
[![Streamlit](https://img.shields.io/badge/Streamlit-1.32+-FF4B4B?style=flat&logo=streamlit&logoColor=white)](https://streamlit.io/)
[![Ollama](https://img.shields.io/badge/Ollama-Local_LLM-000000?style=flat&logo=ollama&logoColor=white)](https://ollama.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📌 Visión General

**ScreenGuard AI** es un microservicio backend y panel de control interactivo diseñado para el departamento de atención ciudadana y gestión de turismo de pantalla (*Screen Tourism*). 

Procesa reportes de incidencias no estructurados en localizaciones de rodaje y monumentos históricos mediante:
- **Razonamiento ReAct / Chain-of-Thought:** Evaluación rigurosa de urgencia, seguridad y preservación patrimonial antes de emitir la clasificación.
- **Validación Type-Safe Estricta:** Intercepción de alucinaciones y salidas rotas mediante contratos de datos con Pydantic.
- **Arquitectura Multi-Proveedor:** Comparativa en tiempo real entre modelos Open-Source locales (Ollama) y APIs Cloud (Groq/Gemini) en términos de latencia, coste y precisión.
- **Panel Human-in-the-Loop:** Dashboard de supervisión donde los operadores validan las decisiones del modelo antes del registro definitivo.