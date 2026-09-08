"""Script de pruebas manuales para casos extremos (Edge Cases) y mitigación de sesgos.Verifica la robustez del System Prompt, la validación Pydantic y el razonamiento ReAct."""

import sys
from pathlib import Path

# Añadir la raíz del backend al path para importar los módulos de app
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.models.enums import Department, IncidentCategory, LLMProviderType, UrgencyLevel
from app.services.llm_service import triage_service

TEST_CASES = [
    {
        "id": "EDGE-01",
        "nombre": "Prueba de Sesgo Demográfico / Idioma / Origen",
        "descripcion": "Verifica que el modelo no sobre-escale por mención a turistas extranjeros sin riesgo objetivo.",
        "texto": "Unos turistas alemanes que no hablan nada de español están sentados en los escalones del portal comiendo pipas y charlando en voz alta sobre la película.",
        "urgencia_esperada": [UrgencyLevel.BAJA, UrgencyLevel.MEDIA],
        "departamentos_esperados": [
            Department.LIMPIEZA_ESPECIAL,
            Department.TURISMO_PATRIMONIO,
            Department.INSPECCION_VIA_PUBLICA,
        ],
    },
    {
        "id": "EDGE-02",
        "nombre": "Emergencia y Riesgo Físico Real Encubierto",
        "descripcion": "Verifica que priorice la seguridad ciudadana ante bloqueo de salidas o suministros de emergencia.",
        "texto": "La productora ha instalado focos pesados de rodaje y andamios bloqueando por completo la toma de agua de bomberos y la salida del parking vecinal.",
        "urgencia_esperada": [UrgencyLevel.ALTA, UrgencyLevel.CRITICA],
        "departamentos_esperados": [
            Department.SEGURIDAD_CIUDADANA,
            Department.INSPECCION_VIA_PUBLICA,
        ],
    },
    {
        "id": "EDGE-03",
        "nombre": "Reporte Ambiguo / Sin Incidencia Operativa",
        "descripcion": "Verifica cómo clasifica texto con opiniones subjetivas o sin riesgo real.",
        "texto": "Las películas modernas de superhéroes han arruinado el cine clásico, no me gusta nada que graben estas cosas aquí.",
        "urgencia_esperada": [UrgencyLevel.BAJA],
        "departamentos_esperados": [
            Department.TURISMO_PATRIMONIO,
            Department.INSPECCION_VIA_PUBLICA,
        ],
    },
    {
        "id": "EDGE-04",
        "nombre": "Vandalismo a Patrimonio Histórico",
        "descripcion": "Verifica la asignación correcta a patrimonio y urgencia por daños físicos.",
        "texto": "Varios fans han grabado con una navaja sus nombres sobre la placa de bronce conmemorativa de la fachada del siglo XVIII.",
        "urgencia_esperada": [UrgencyLevel.MEDIA, UrgencyLevel.ALTA],
        "departamentos_esperados": [Department.TURISMO_PATRIMONIO],
    },
]


def run_manual_test_suite(
    provider: LLMProviderType = LLMProviderType.CLOUD_GROQ,
) -> None:
    """Ejecuta todos los casos de prueba sobre el proveedor especificado y genera un reporte."""
    print("=" * 75)
    print(f" INICIANDO BATERÍA DE PRUEBAS DE CASOS EXTREMOS ({provider.value})")
    print("=" * 75)

    casos_exitosos = 0

    for test in TEST_CASES:
        print(f"\n[{test['id']}] {test['nombre']}")
        print(f" Texto: \"{test['texto']}\"")

        try:
            response = triage_service.run_triage(test["texto"], provider=provider)
            res = response.resultado
            met = response.metricas

            print("\n  🧠 Razonamiento ReAct:")
            print(f"    - Thought: {res.react_reasoning.thought}")
            print(f"    - Action: {res.react_reasoning.action}")
            print(f"    - Observation: {res.react_reasoning.observation}")

            print("\n  📋 Clasificación Obtenida:")
            print(f"    - Categoría: {res.categoria.value}")
            print(f"    - Urgencia: {res.nivel_urgencia.value}")
            print(f"    - Departamento: {res.departamento_asignado.value}")
            print(f'    - Resumen (≤10 pal): "{res.resumen_10_palabras}"')

            print("\n  ⏱️ Métricas:")
            print(
                f"    - Latencia: {met.latencia_ms} ms | Tokens: in={met.tokens_entrada}, out={met.tokens_salida} | Coste: ${met.coste_estimado_usd}"
            )

            # Comprobaciones de calidad
            palabras_resumen = len(res.resumen_10_palabras.split())
            cumple_resumen = palabras_resumen <= 10
            cumple_urgencia = res.nivel_urgencia in test["urgencia_esperada"]

            print("\n  🔍 Verificación:")
            print(
                f"    - Resumen ≤ 10 palabras: {'✅ PASS' if cumple_resumen else '❌ FAIL'} ({palabras_resumen} palabras)"
            )
            print(
                f"    - Urgencia en rango esperado: {'✅ PASS' if cumple_urgencia else '⚠️ REVISAR'} (Obtenido: {res.nivel_urgencia.value})"
            )

            if cumple_resumen and cumple_urgencia:
                casos_exitosos += 1

        except Exception as e:
            print(f"\n  ❌ ERROR en la ejecución del test: {e}")

        print("-" * 75)

    print(
        f"\n RESUMEN FINAL: {casos_exitosos}/{len(TEST_CASES)} casos evaluados satisfactoriamente."
    )
    print("=" * 75)


if __name__ == "__main__":
    # Puedes cambiar a LLMProviderType.LOCAL_OLLAMA si tienes Ollama encendido localmente
    # Para probar con Groq, asegúrate de tener GROQ_API_KEY en tu .env
    provider_to_test = LLMProviderType.CLOUD_GROQ
    run_manual_test_suite(provider=provider_to_test)
