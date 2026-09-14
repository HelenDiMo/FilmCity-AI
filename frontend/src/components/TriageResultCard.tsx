import { useState } from "react";
import type { TriageResponse, UrgencyLevel } from "../types/triage";
import {
  Building2,
  Clock,
  Coins,
  Cpu,
  FileText,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";

interface TriageResultCardProps {
  data: TriageResponse;
}

const URGENCY_CONFIG: Record<
  UrgencyLevel,
  { bg: string; text: string; border: string }
> = {
  Baja: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  Media: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
  },
  Alta: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
  },
  Crítica: {
    bg: "bg-rose-500/20",
    text: "text-rose-400",
    border: "border-rose-500/40",
  },
};

export function TriageResultCard({ data }: TriageResultCardProps) {
  const [showReasoning, setShowReasoning] = useState(true);
  const {
    resultado,
    metricas,
    validado_exitosamente,
    intentos_autorreparacion,
  } = data;
  const urgency =
    URGENCY_CONFIG[resultado.nivel_urgencia] || URGENCY_CONFIG.Media;

  return (
    <div className="bg-neutral-700 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-sm space-y-6">
      {/* Header del Dictamen */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            Dictamen Oficial de Triaje
          </span>
          <h3 className="text-lg font-bold text-white mt-0.5">
            {resultado.categoria}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Badge de Urgencia */}
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${urgency.bg} ${urgency.text} ${urgency.border} flex items-center gap-1.5`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Urgencia: {resultado.nivel_urgencia}
          </span>

          {/* Estado de validación */}
          {validado_exitosamente && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Validado
            </span>
          )}
        </div>
      </div>

      {/* Resumen Ejecutivo y Asignación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Resumen 10 palabras */}
        <div className="bg-neutral-900 border border-yellow-500/20 rounded-lg p-4">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
            <FileText className="w-4 h-4 text-amber-400" />
            Síntesis Ejecutiva (≤ 10 palabras)
          </span>
          <p className="text-sm font-medium text-slate-100 italic">
            "{resultado.resumen_10_palabras}"
          </p>
        </div>

        {/* Departamento Asignado */}
        <div className="bg-neutral-900 border border-yellow-500/20 rounded-lg p-4">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
            <Building2 className="w-4 h-4 text-cyan-400" />
            Derivación Municipal
          </span>
          <p className="text-sm font-semibold text-cyan-200">
            {resultado.departamento_asignado}
          </p>
        </div>
      </div>

      {/* Acciones e Impacto */}
      <div className="grid grid-cols-1 gap-3 text-xs bg-neutral-900 p-4 rounded-lg border border-yellow-500/20">
        <div>
          <span className="font-semibold text-slate-300">
            Justificación de Prioridad:{" "}
          </span>
          <span className="text-slate-400">
            {resultado.justificacion_urgencia}
          </span>
        </div>
        <div>
          <span className="font-semibold text-slate-300">
            Acción Inmediata Sugerida:{" "}
          </span>
          <span className="text-slate-400">
            {resultado.accion_inmediata_recomendada}
          </span>
        </div>
      </div>

      {/* Razonamiento ReAct (Human-in-the-Loop) */}
      {resultado.react_reasoning && (
        <div className="border border-yellow-500/20 rounded-lg overflow-hidden bg-neutral-900">
          <button
            type="button"
            onClick={() => setShowReasoning(!showReasoning)}
            className="w-full flex items-center justify-between p-3.5 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-purple-400" />
              Traza de Razonamiento ReAct (Auditoría Técnica)
            </span>
            {showReasoning ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showReasoning && (
            <div className="p-4 pt-1 space-y-2.5 text-xs border-t border-slate-800/60 font-mono">
              <div className="p-2.5 rounded bg-neutral-800 border-l-2 border-purple-500">
                <span className="font-bold text-purple-400 block mb-0.5">
                  THOUGHT (Pensamiento):
                </span>
                <span className="text-slate-300">
                  {resultado.react_reasoning.thought}
                </span>
              </div>
              <div className="p-2.5 rounded bg-neutral-800 border-l-2 border-blue-500">
                <span className="font-bold text-blue-400 block mb-0.5">
                  ACTION (Acción de Búsqueda/Cálculo):
                </span>
                <span className="text-slate-300">
                  {resultado.react_reasoning.action}
                </span>
              </div>
              <div className="p-2.5 rounded bg-neutral-800 border-l-2 border-emerald-500">
                <span className="font-bold text-emerald-400 block mb-0.5">
                  OBSERVATION (Evidencia / Decisión):
                </span>
                <span className="text-slate-300">
                  {resultado.react_reasoning.observation}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Métricas de Ejecución */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Latencia:{" "}
            <strong className="text-slate-200">
              {metricas.latencia_ms} ms
            </strong>
          </span>
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-slate-500" />
            Tokens:{" "}
            <strong className="text-slate-200">
              {metricas.tokens_entrada + metricas.tokens_salida}
            </strong>{" "}
            ({metricas.tokens_entrada} in / {metricas.tokens_salida} out)
          </span>
          <span className="flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-slate-500" />
            Coste:{" "}
            <strong className="text-slate-200">
              ${metricas.coste_estimado_usd.toFixed(6)}
            </strong>
          </span>
        </div>

        <div className="text-slate-500">
          Proveedor:{" "}
          <span className="text-slate-300 font-medium">
            {metricas.proveedor}
          </span>
          {intentos_autorreparacion !== undefined &&
            intentos_autorreparacion > 0 && (
              <span className="ml-2 text-amber-400 font-semibold">
                ({intentos_autorreparacion} autorreparación JSON)
              </span>
            )}
        </div>
      </div>
    </div>
  );
}
