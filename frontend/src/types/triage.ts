export type UrgencyLevel = "Baja" | "Media" | "Alta" | "Crítica";

export type Department =
  | "Policía Municipal / Seguridad Ciudadana"
  | "Movilidad y Transportes"
  | "Medio Ambiente y Limpieza Urbana"
  | "Turismo y Madrid Film Office"
  | "Patrimonio Cultural y Vía Pública"
  | "Distrito Municipal / Atención Ciudadana"
  | "Otro / No Aplica";

export type IncidentCategory =
  | "Ocupación No Autorizada de Vía Pública"
  | "Bloqueo de Vados o Salidas de Emergencia"
  | "Contaminación Acústica / Ruidos Nocturnos"
  | "Suciedad y Residuos Post-Rodaje"
  | "Daño a Mobiliario Urbano o Patrimonio"
  | "Aglomeración Excesiva de Turistas / Fans"
  | "Consulta de Permisos y Autorizaciones"
  | "Otro / Consulta General";

export type LLMProviderType = "local_ollama" | "cloud_groq";

export interface ReactReasoning {
  thought: string;
  action: string;
  observation: string;
}

export interface LLMTriageOutput {
  categoria: IncidentCategory;
  nivel_urgencia: UrgencyLevel;
  departamento_asignado: Department;
  justificacion_urgencia: string;
  accion_inmediata_recomendada: string;
  resumen_10_palabras: string;
  react_reasoning?: ReactReasoning;
}

export interface TriageMetrics {
  latencia_ms: number;
  tokens_entrada: number;
  tokens_salida: number;
  coste_estimado_usd: number;
  proveedor: string;
}

export interface TriageResponse {
  resultado: LLMTriageOutput;
  metricas: TriageMetrics;
  validado_exitosamente: boolean;
  intentos_autorreparacion?: number;
}

export interface CompareTriageResponse {
  texto_original: string;
  resultado_local: TriageResponse;
  resultado_cloud: TriageResponse;
}

export interface TriageRequestPayload {
  texto_incidencia: string;
  provider: LLMProviderType;
}

export interface ActiveProduction {
  id: string;
  title: string;
  type: "Rodaje Serie" | "Largometraje" | "Ruta Screen-Tourism" | "Comercial";
  district: string;
  location: string;
  status: "En Rodaje" | "Montaje de Set" | "Finalizado";
}

export interface FilmingSet {
  id: string;
  titulo_produccion: string;
  ubicacion: string;
  distrito: string;
  tipo_ocupacion: string;
  estado: string;
}

export interface IncidentTicket {
  id: string;
  fecha: string;
  ubicacion: string;
  reporte_original: string;
  categoria: IncidentCategory | string;
  urgencia: UrgencyLevel;
  departamento_propuesto: Department | string;
  resumen: string;
  estado: "Pendiente" | "Validado" | "Reasignado";
  origen: "Ciudadano" | "Inspección Municipal";
}
