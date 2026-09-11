import { useState } from "react";
import type { LLMProviderType } from "../types/triage";
import {
  Send,
  Sparkles,
  Film,
  AlertTriangle,
  Volume2,
  ShieldCheck,
  Loader2,
} from "lucide-react";

interface TriageFormProps {
  onSubmit: (texto: string, provider: LLMProviderType) => void;
  isLoading: boolean;
}

const PRESET_CASES = [
  {
    icon: AlertTriangle,
    title: "Bloqueo Set de Rodaje (Crítica)",
    text: "Varios camiones de producción de la serie en Gran Vía han bloqueado la salida de emergencia de nuestro edificio y la toma de agua de los bomberos desde las 08:00.",
  },
  {
    icon: Volume2,
    title: "Ruidos Nocturnos Generador",
    text: "Llevan desde las 23:30 con generadores diésel a máxima potencia y focos de 10.000W apuntando directo a las ventanas de la C/ Huertas sin aviso previo.",
  },
  {
    icon: Film,
    title: "Aglomeración Fans / Turismo",
    text: "Cientos de fans y turistas están colapsando la Plaza de la Villa por la presencia de los actores principales, impidiendo el paso peatonal a los comercios.",
  },
  {
    icon: ShieldCheck,
    title: "Consulta Permiso Oficial",
    text: "Buenos días, querría saber si el equipo de rodaje en el Parque del Retiro cuenta con permiso para cortar el paso de bicicletas esta tarde.",
  },
];

export function TriageForm({ onSubmit, isLoading }: TriageFormProps) {
  const [texto, setTexto] = useState("");
  const [provider, setProvider] = useState<LLMProviderType>("cloud_groq");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!texto.trim() || isLoading) return;
    onSubmit(texto, provider);
  };

  const handleSelectPreset = (presetText: string) => {
    setTexto(presetText);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-red-500" />
            Reporte de Mediación y Rodajes
          </h2>
          <p className="text-xs text-slate-400">
            Canal oficial de incidencias de FilmCity IA - Madrid Film Office
          </p>
        </div>

        {/* Selector de Proveedor LLM */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setProvider("cloud_groq")}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              provider === "cloud_groq"
                ? "bg-red-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Groq Cloud (Rápido)
          </button>
          <button
            type="button"
            onClick={() => setProvider("local_ollama")}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              provider === "local_ollama"
                ? "bg-amber-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Ollama Local (Privado)
          </button>
        </div>
      </div>

      {/* Casos rápidos / Presets */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          Casos de Prueba Rápida (1-Clic)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PRESET_CASES.map((preset, index) => {
            const Icon = preset.icon;
            return (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectPreset(preset.text)}
                className="flex items-start gap-2.5 p-2.5 text-left rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/60 hover:border-slate-700 transition-all text-xs group"
              >
                <Icon className="w-4 h-4 text-red-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="font-semibold text-slate-200 block">
                    {preset.title}
                  </span>
                  <span className="text-slate-400 line-clamp-1">
                    {preset.text}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="incidencia"
            className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1"
          >
            Descripción de la Incidencia o Consulta
          </label>
          <textarea
            id="incidencia"
            rows={4}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Describe la situación (ej. calle, producción involucrada, obstáculo, ruido o consulta)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all resize-none"
            disabled={isLoading}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <span className="text-xs text-slate-500">
            Motor activo:{" "}
            <strong className="text-slate-300">
              {provider === "cloud_groq"
                ? "Llama 3.3 (Groq API)"
                : "Llama 3 (Ollama Local)"}
            </strong>
          </span>

          <button
            type="submit"
            disabled={!texto.trim() || isLoading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg shadow-lg shadow-red-900/30 transition-all active:scale-95"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analizando con IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Ejecutar Triaje Inteligente</span>
                <Send className="w-3.5 h-3.5 ml-1 opacity-70" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
