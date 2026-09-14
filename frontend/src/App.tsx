import { useState } from "react";
import { TriageForm } from "./components/TriageForm";
import { TriageResultCard } from "./components/TriageResultCard";
import { ComparisonView } from "./components/ComparisonView";
import { processTriage, compareTriage } from "./services/api";
import type {
  TriageResponse,
  CompareTriageResponse,
  LLMProviderType,
} from "./types/triage";
import {
  Clapperboard,
  MapPin,
  Activity,
  Scale,
  ShieldCheck,
  AlertOctagon,
  RefreshCw,
} from "lucide-react";

type TabMode = "single" | "compare";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabMode>("single");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados para almacenar las respuestas
  const [singleResult, setSingleResult] = useState<TriageResponse | null>(null);
  const [compareResult, setCompareResult] =
    useState<CompareTriageResponse | null>(null);

  // Manejo de peticiones
  const handleTriageSubmit = async (
    texto: string,
    provider: LLMProviderType,
  ) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (activeTab === "single") {
        const data = await processTriage({
          texto_incidencia: texto,
          provider: provider,
        });
        setSingleResult(data);
      } else {
        const data = await compareTriage({
          texto_incidencia: texto,
          provider: provider,
        });
        setCompareResult(data);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Error desconocido al conectar con la API";
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col font-sans">
      {/* bg-Background - Cuadro de abajo y text-texto - Lo que va de "Madrid Film Office"*/}
      {/* Topbar Institucional */}
      <header className="border-b border-zinc-900 bg-white backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        {/*Border - borde sup. de sets activos // bg - Background de Titulo*/}
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-300 rounded-xl text-zinc-900 shadow-lg ">
              {/* Fondo (bg) y lineas (text) de la claqueta // shadow-red-400/30 le daba un reflejo rojo */}
              <Clapperboard className="w-6 h-6" />{" "}
              {/* Tamaño del Icono de claqueta*/}
            </div>
            <div>
              <div className="flex items-center gap-2">
                {/* Hueco entre título y etiqueta amarilla*/}
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 ">
                  {/* text - FILMCITY // 2xl el tamaño // uppercase - Lo pone entero en May.*/}
                  FilmCity IA
                </h1>
                <span className="bg-yellow-300 font-semibold text-xs px-2 py-0.5 rounded ">
                  {/* Etiqueta amarilla // border - añade borde negro // border-red-500/20 añade un borde rojo*/}
                  Madrid Film Office
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {/*Frasecita*/}
                Centro de Mediación de Incidencias Urbanas y Turismo
                Cinematográfico
              </p>
            </div>
          </div>

          {/* Selector de Pestañas: Individual vs Comparativa */}
          <div className="flex items-center bg-white p-1 rounded-lg border border-slate-500 text-xs">
            {/*bg- Fondo cuadrado funciones // border - borde*/}
            <button
              type="button"
              onClick={() => setActiveTab("single")}
              className={`px-3.5 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
                activeTab === "single"
                  ? "bg-yellow-300 text-black shadow" /* Cuadradito de funcionalidad*/
                  : "text-slate-500 hover:text-slate-700" /* Texto de funcionalidad*/
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Triaje Asistido
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("compare")}
              className={`px-3.5 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
                activeTab === "compare"
                  ? "bg-black text-yellow-300"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              Benchmark (Local vs Cloud)
            </button>
          </div>
        </div>
      </header>
      {/* Monitor de Rodajes Activos en Madrid */}
      <div className="bg-slate-900/40 border-b border-slate-800/60 px-6 py-2">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-slate-400 overflow-x-auto gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-300">
              Sets Activos Hoy:
            </span>
          </div>
          <div className="flex items-center gap-6 shrink-0 text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-red-400" /> Gran Vía (Serie
              Netflix)
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-red-400" /> Plaza de la Villa
              (Largometraje)
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-red-400" /> Parque del Retiro
              (Ruta Screen Tourism)
            </span>
          </div>
        </div>
      </div>
      {/* Contenido Principal */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 space-y-6">
        {/* Formulario de Ingesta */}
        <TriageForm onSubmit={handleTriageSubmit} isLoading={isLoading} />

        {/* Mensaje de Error (si FastAPI no está corriendo o falla) */}
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-start gap-3 text-rose-300 text-xs">
            <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block text-rose-200">
                No se pudo procesar la solicitud con el backend
              </strong>
              <p className="mt-0.5">{errorMsg}</p>
              <p className="mt-1 text-slate-400">
                Asegúrate de tener FastAPI ejecutándose en{" "}
                <code>http://localhost:8000</code>.
              </p>
            </div>
          </div>
        )}

        {/* Visualización en Modo Individual */}
        {activeTab === "single" && singleResult && !isLoading && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-red-500" />
              Resultado del Análisis
            </h3>
            <TriageResultCard data={singleResult} />
          </div>
        )}

        {/* Visualización en Modo Benchmark */}
        {activeTab === "compare" && compareResult && !isLoading && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-red-500" />
              Comparativa Local vs Cloud
            </h3>
            <ComparisonView data={compareResult} />
          </div>
        )}

        {/* Estado Vacío */}
        {!singleResult && !compareResult && !isLoading && !errorMsg && (
          <div className="border border-dashed border-slate-800 rounded-xl p-10 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 text-slate-600 animate-pulse" />
            <span>
              Selecciona un caso de prueba rápida o escribe una incidencia para
              activar el triaje con IA.
            </span>
          </div>
        )}
      </main>
      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-4 text-center text-xs text-slate-500">
        FilmCity IA © 2026 • Desarrollado para Madrid Film Office • Mediación
        Inteligente y Screen Tourism
      </footer>
    </div>
  );
}
