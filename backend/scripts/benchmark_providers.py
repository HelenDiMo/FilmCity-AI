"""Benchmark empírico Groq Cloud vs. Ollama Local.

Ejecuta la misma batería de casos sobre ambos proveedores varias veces
y calcula medias reales de latencia, tokens y coste para sustituir los
valores orientativos de la Matriz Comparativa del README.

Requisitos antes de ejecutar:
  - Ollama corriendo en local (`ollama serve`) con el modelo configurado
    en OLLAMA_MODEL (ver .env) ya descargado (`ollama pull qwen2.5-coder`).
  - GROQ_API_KEY configurada en tu .env.

Uso:
  cd backend
  python scripts/benchmark_providers.py

Salida:
  - Tabla resumen impresa en consola (lista para pegar en el README).
  - benchmark_results.json con el detalle de cada ejecución individual.
"""

import json
import statistics
import sys
import time
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.models.enums import LLMProviderType
from app.services.llm_service import triage_service

# Reutilizamos los mismos textos que ya se usan como pruebas de sesgo/edge-cases
# y como presets del formulario, para que el benchmark sea representativo
# del uso real de la app.
BENCHMARK_CASES = [
    "Varios camiones de producción de la serie en Gran Vía han bloqueado la "
    "salida de emergencia de nuestro edificio y la toma de agua de los "
    "bomberos desde las 08:00.",
    "Llevan desde las 23:30 con generadores diésel a máxima potencia y focos "
    "de 10.000W apuntando directo a las ventanas de la C/ Huertas sin aviso "
    "previo.",
    "Cientos de fans y turistas están colapsando la Plaza de la Villa por la "
    "presencia de los actores principales, impidiendo el paso peatonal a "
    "los comercios.",
    "Buenos días, querría saber si el equipo de rodaje en el Parque del "
    "Retiro cuenta con permiso para cortar el paso de bicicletas esta tarde.",
    "Unos turistas alemanes que no hablan nada de español están sentados en "
    "los escalones del portal comiendo pipas y charlando en voz alta sobre "
    "la película.",
    "Varios fans han grabado con una navaja sus nombres sobre la placa de "
    "bronce conmemorativa de la fachada del siglo XVIII.",
]

REPETICIONES_POR_CASO = 3  # Sube esto si quieres una media más fiable


def run_benchmark(provider: LLMProviderType) -> list[dict]:
    """Ejecuta todos los casos N veces sobre un proveedor y devuelve las métricas crudas."""
    resultados = []
    for idx, texto in enumerate(BENCHMARK_CASES, start=1):
        for rep in range(1, REPETICIONES_POR_CASO + 1):
            print(f"  [{provider.value}] Caso {idx}/{len(BENCHMARK_CASES)} · Rep {rep} ...", end=" ")
            try:
                inicio = time.perf_counter()
                response = triage_service.run_triage(texto, provider=provider)
                duracion_total = (time.perf_counter() - inicio) * 1000.0

                resultados.append(
                    {
                        "caso": idx,
                        "repeticion": rep,
                        "latencia_ms_interna": response.metricas.latencia_ms,
                        "latencia_ms_e2e": round(duracion_total, 2),
                        "tokens_entrada": response.metricas.tokens_entrada,
                        "tokens_salida": response.metricas.tokens_salida,
                        "coste_estimado_usd": response.metricas.coste_estimado_usd,
                    }
                )
                print(f"OK ({response.metricas.latencia_ms} ms)")
            except Exception as exc:
                print(f"ERROR: {exc}")
    return resultados


def resumen(resultados: list[dict]) -> dict:
    if not resultados:
        return {}
    latencias = [r["latencia_ms_interna"] for r in resultados]
    costes = [r["coste_estimado_usd"] for r in resultados]
    tokens_in = [r["tokens_entrada"] for r in resultados]
    tokens_out = [r["tokens_salida"] for r in resultados]
    return {
        "ejecuciones_exitosas": len(resultados),
        "latencia_media_ms": round(statistics.mean(latencias), 2),
        "latencia_min_ms": round(min(latencias), 2),
        "latencia_max_ms": round(max(latencias), 2),
        "coste_medio_usd": round(statistics.mean(costes), 6),
        "coste_total_usd": round(sum(costes), 6),
        "tokens_entrada_medios": round(statistics.mean(tokens_in), 1),
        "tokens_salida_medios": round(statistics.mean(tokens_out), 1),
    }


def main() -> None:
    print("=" * 75)
    print(" BENCHMARK EMPÍRICO: GROQ CLOUD vs. OLLAMA LOCAL")
    print("=" * 75)

    print("\n>> Ejecutando batería sobre GROQ CLOUD...")
    res_groq = run_benchmark(LLMProviderType.CLOUD_GROQ)

    print("\n>> Ejecutando batería sobre OLLAMA LOCAL...")
    res_ollama = run_benchmark(LLMProviderType.LOCAL_OLLAMA)

    resumen_groq = resumen(res_groq)
    resumen_ollama = resumen(res_ollama)

    print("\n" + "=" * 75)
    print(" RESUMEN")
    print("=" * 75)
    print(f"\nGroq Cloud   -> {resumen_groq}")
    print(f"\nOllama Local -> {resumen_ollama}")

    print("\n" + "-" * 75)
    print(" TABLA MARKDOWN LISTA PARA EL README (copia y pega):")
    print("-" * 75)
    print(
        "\n| Métrica / Dimensión | Groq Cloud API | Ollama Local |\n"
        "|---|---|---|\n"
        f"| **Latencia Promedio** | ~{resumen_groq.get('latencia_media_ms', '?')} ms "
        f"(min {resumen_groq.get('latencia_min_ms', '?')} / max {resumen_groq.get('latencia_max_ms', '?')}) | "
        f"~{resumen_ollama.get('latencia_media_ms', '?')} ms "
        f"(min {resumen_ollama.get('latencia_min_ms', '?')} / max {resumen_ollama.get('latencia_max_ms', '?')}) |\n"
        f"| **Coste Medio / Petición** | ~${resumen_groq.get('coste_medio_usd', '?')} USD | "
        f"${resumen_ollama.get('coste_medio_usd', '?')} USD |\n"
        f"| **Tokens Entrada/Salida (medios)** | {resumen_groq.get('tokens_entrada_medios', '?')} / "
        f"{resumen_groq.get('tokens_salida_medios', '?')} | {resumen_ollama.get('tokens_entrada_medios', '?')} / "
        f"{resumen_ollama.get('tokens_salida_medios', '?')} |\n"
        f"| **Ejecuciones exitosas** | {resumen_groq.get('ejecuciones_exitosas', 0)}/"
        f"{len(BENCHMARK_CASES) * REPETICIONES_POR_CASO} | {resumen_ollama.get('ejecuciones_exitosas', 0)}/"
        f"{len(BENCHMARK_CASES) * REPETICIONES_POR_CASO} |\n"
    )

    salida = {
        "fecha": time.strftime("%Y-%m-%d %H:%M:%S"),
        "n_casos": len(BENCHMARK_CASES),
        "repeticiones_por_caso": REPETICIONES_POR_CASO,
        "groq": {"resumen": resumen_groq, "detalle": res_groq},
        "ollama": {"resumen": resumen_ollama, "detalle": res_ollama},
    }
    out_path = Path(__file__).resolve().parent / "benchmark_results.json"
    out_path.write_text(json.dumps(salida, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nDetalle completo guardado en: {out_path}")


if __name__ == "__main__":
    main()