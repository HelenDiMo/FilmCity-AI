import type {
  TriageRequestPayload,
  TriageResponse,
  CompareTriageResponse,
  FilmingSet,
} from "../types/triage";

const API_BASE_URL = "https://filmcity-ai.onrender.com";

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
    const detail =
      errorData?.detail || `Error en la solicitud (${response.status})`;
    throw new Error(detail);
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
    const detail =
      errorData?.detail || `Error en comparativa (${response.status})`;
    throw new Error(detail);
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
