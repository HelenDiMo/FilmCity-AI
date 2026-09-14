import type { CompareTriageResponse } from "../types/triage";
import {
  Clock,
  Cpu,
  DollarSign,
  ShieldAlert,
  Building2,
  CheckCircle2,
  AlertCircle,
  GitCompare,
} from "lucide-react";

// Isotipo oficial de Groq (Rayo de velocidad LPUs)
function GroqIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" />
    </svg>
  );
}

// Logo original de Ollama (cabeza oficial de la llama)
function OllamaIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <img
      src="https://cdn.simpleicons.org/ollama"
      alt="Ollama"
      className={`${className} object-contain`}
      loading="lazy"
    />
  );
}

interface ComparisonViewProps {
  data: CompareTriageResponse;
}

export function ComparisonView({ data }: ComparisonViewProps) {
  const { resultado_local, resultado_cloud } = data;

  const localRes = resultado_local.resultado;
  const cloudRes = resultado_cloud.resultado;
  const localMet = resultado_local.metricas;
  const cloudMet = resultado_cloud.metricas;

  // Comparación de coincidencia de dictamen
  const matchUrgency = localRes.nivel_urgencia === cloudRes.nivel_urgencia;
  const matchDept =
    localRes.departamento_asignado === cloudRes.departamento_asignado;

  // Diferencial de latencia
  const speedDiff =
    localMet.latencia_ms > cloudMet.latencia_ms
      ? (localMet.latencia_ms / (cloudMet.latencia_ms || 1)).toFixed(1)
      : (cloudMet.latencia_ms / (localMet.latencia_ms || 1)).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Banner Resumen Comparativo */}
      <div className="bg-linear-to-r from-neutral-900 via-neutral-800 to-neutral-900 border border-slate-700/80 rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-600/20 border border-red-500/30 rounded-lg text-red-400">
            <GitCompare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Benchmarking en Tiempo Real: Ollama vs. Groq
            </h3>
            <p className="text-xs text-slate-400">
              Evaluación comparada de inferencia local (soberanía de datos) vs.
              cloud inferencing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span
            className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 ${
              matchUrgency && matchDept
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                : "bg-amber-500/10 text-amber-300 border-amber-500/30"
            }`}
          >
            {matchUrgency && matchDept ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Consenso Total de Dictamen
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Discrepancia en Clasificación
              </>
            )}
          </span>
        </div>
      </div>

      {/* Grid Comparativo 2 Columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tarjeta Cloud (Groq) */}
        <div className="bg-neutral-700 border border-neutral-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <GroqIcon className="w-4 h-4 shrink-0 text-orange-600 fill-orange-600" />{" "}
              <span className="font-bold text-white text-sm">
                Groq Cloud API
              </span>
            </div>
            <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-mono">
              Llama 3.3 70B
            </span>
          </div>

          {/* Métricas Cloud */}
          <div className="grid grid-cols-3 gap-2 bg-neutral-900 p-3 rounded-lg border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Latencia
              </span>
              <p className="text-emerald-400 font-bold mt-0.5">
                {cloudMet.latencia_ms} ms
              </p>
            </div>
            <div>
              <span className="text-slate-500 flex items-center gap-1">
                <Cpu className="w-3 h-3" /> Tokens
              </span>
              <p className="text-slate-200 font-bold mt-0.5">
                {cloudMet.tokens_entrada + cloudMet.tokens_salida}
              </p>
            </div>
            <div>
              <span className="text-slate-500 flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Coste
              </span>
              <p className="text-slate-200 font-bold mt-0.5">
                ${cloudMet.coste_estimado_usd.toFixed(6)}
              </p>
            </div>
          </div>

          {/* Dictamen Cloud */}
          <div className="space-y-2.5 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Categoría:</span>
              <p className="font-bold text-slate-100">{cloudRes.categoria}</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Urgencia:
              </span>
              <span className="font-bold text-red-400">
                {cloudRes.nivel_urgencia}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />{" "}
                Departamento:
              </span>
              <p className="text-cyan-200 font-medium mt-0.5">
                {cloudRes.departamento_asignado}
              </p>
            </div>
            <div className="p-2.5 bg-neutral-900 rounded border border-slate-800/60">
              <span className="text-slate-500 block mb-1">Síntesis:</span>
              <p className="text-slate-300 italic">
                "{cloudRes.resumen_10_palabras}"
              </p>
            </div>
          </div>
        </div>

        {/* Tarjeta Local (Ollama) */}
        <div className="bg-neutral-700 border border-amber-900/30 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <OllamaIcon className="w-5 h-5 text-amber-500" />
              <span className="font-bold text-white text-sm">Ollama Local</span>
            </div>
            <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono">
              Llama 3 8B
            </span>
          </div>

          {/* Métricas Local */}
          <div className="grid grid-cols-3 gap-2 bg-neutral-900 p-3 rounded-lg border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Latencia
              </span>
              <p className="text-amber-400 font-bold mt-0.5">
                {localMet.latencia_ms} ms
              </p>
            </div>
            <div>
              <span className="text-slate-500 flex items-center gap-1">
                <Cpu className="w-3 h-3" /> Tokens
              </span>
              <p className="text-slate-200 font-bold mt-0.5">
                {localMet.tokens_entrada + localMet.tokens_salida}
              </p>
            </div>
            <div>
              <span className="text-slate-500 flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Coste
              </span>
              <p className="text-emerald-400 font-bold mt-0.5">
                $0.000000 (Local)
              </p>
            </div>
          </div>

          {/* Dictamen Local */}
          <div className="space-y-2.5 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Categoría:</span>
              <p className="font-bold text-slate-100">{localRes.categoria}</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Urgencia:
              </span>
              <span className="font-bold text-amber-400">
                {localRes.nivel_urgencia}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />{" "}
                Departamento:
              </span>
              <p className="text-cyan-200 font-medium mt-0.5">
                {localRes.departamento_asignado}
              </p>
            </div>
            <div className="p-2.5 bg-neutral-900 rounded border border-slate-800/60">
              <span className="text-slate-500 block mb-1">Síntesis:</span>
              <p className="text-slate-300 italic">
                "{localRes.resumen_10_palabras}"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conclusión del Benchmark */}
      <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-slate-400 leading-relaxed">
        <strong className="text-slate-200 block mb-1">
          Análisis de Trade-off para Madrid Film Office:
        </strong>
        Groq Cloud proporciona una velocidad aproximada{" "}
        <strong className="text-white">{speedDiff}x mayor</strong>, ideal para
        procesamiento masivo en picos de eventos turísticos. Ollama Local
        garantiza coste operativo nulo y soberanía de datos estricta bajo
        normativa RGPD para incidencias confidenciales en rodajes protegidos.
      </div>
    </div>
  );
}
