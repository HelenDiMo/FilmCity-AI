import type {
  TriageRequestPayload,
  TriageResponse,
  CompareTriageResponse,
  FilmingSet,
} from "../types/triage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const OLLAMA_OFFLINE_NOTICE = 
  "ℹ️ Modo On-Premise: El motor local Ollama está diseñado para ejecuciones en red local bajo soberanía de datos (RGPD). En esta demo cloud pública, por favor selecciona 'Groq Cloud'.";

export async function processTriage(
  payload: TriageRequestPayload,
): Promise<TriageResponse> {
  const response = await fetch(`${API_BASE_URL}/triage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const rawDetail = errorData?.detail || `Error en la solicitud (${response.status})`;

    // Interceptar error de conexión de Ollama
    if (
      payload.proveedor === "local_ollama" ||
      rawDetail.toLowerCase().includes("ollama") ||
      rawDetail.includes("111")
    ) {
      throw new Error(OLLAMA_OFFLINE_NOTICE);
    }

    throw new Error(rawDetail);
  }

  return response.json();
}

export async function compareTriage(
  payload: TriageRequestPayload,
): Promise<CompareTriageResponse> {
  const response = await fetch(`${API_BASE_URL}/triage/compare`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const rawDetail = errorData?.detail || `Error en comparativa (${response.status})`;

    if (
      rawDetail.toLowerCase().includes("ollama") ||
      rawDetail.includes("111")
    ) {
      throw new Error(
        "ℹ️ Comparativa parcial: El motor Ollama no está disponible en la versión cloud pública. Selecciona 'Groq Cloud' para el análisis individual."
      );
    }

    throw new Error(rawDetail);
  }

  return response.json();
}

export async function fetchActiveFilmingSets(): Promise<FilmingSet[]> {
  const response = await fetch(`${API_BASE_URL}/filming-sets/active`);
  if (!response.ok) {
    throw new Error(
      `Error al obtener los sets de rodaje: ${response.statusText}`,
    );
  }
  return response.json();
}