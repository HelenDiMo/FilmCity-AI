import { useState, useEffect } from "react";
import { CitizenPortal } from "./components/CitizenPortal";
import { OperatorValidationDesk } from "./components/OperatorValidationDesk";
import { AuthModal, type UserRole } from "./components/AuthModal";
import { TriageForm } from "./components/TriageForm";
import { TriageResultCard } from "./components/TriageResultCard";
import { ComparisonView } from "./components/ComparisonView";
import {
  processTriage,
  compareTriage,
  fetchActiveFilmingSets,
} from "./services/api";
import type {
  TriageResponse,
  CompareTriageResponse,
  LLMProviderType,
  FilmingSet,
} from "./types/triage";
import {
  Clapperboard,
  MapPin,
  Activity,
  Scale,
  ShieldCheck,
  AlertOctagon,
  RefreshCw,
  Lock,
  LogOut,
  Terminal,
} from "lucide-react";

type RoleSession = "public" | "operator" | "admin";
type AdminTabMode = "single" | "compare";

export default function App() {
  // Estado de Autenticación y Sesión Activa
  const [currentUserRole, setCurrentUserRole] = useState<RoleSession>("public");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialRole, setAuthModalInitialRole] = useState<UserRole>("operator");

  // Pestañas internas para la Consola Técnica de Administrador
  const [adminTab, setAdminTab] = useState<AdminTabMode>("single");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estado para los sets de rodaje activos en Madrid
  const [filmingSets, setFilmingSets] = useState<FilmingSet[]>([]);

  // Estados para almacenar las respuestas de triaje
  const [singleResult, setSingleResult] = useState<TriageResponse | null>(null);
  const [compareResult, setCompareResult] = useState<CompareTriageResponse | null>(null);

  // Carga inicial de los sets de rodaje desde la API
  useEffect(() => {
    fetchActiveFilmingSets()
      .then((data) => setFilmingSets(data))
      .catch((err) =>
        console.error("No se pudieron cargar los sets de rodaje:", err)
      );
  }, []);

  // Manejadores de Autenticación
  const handleOpenLogin = (role: UserRole) => {
    setAuthModalInitialRole(role);
    setIsAuthModalOpen(true);
  };

  const handleLoginSuccess = (role: UserRole, email: string) => {
    setCurrentUserRole(role);
    setUserEmail(email);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    setCurrentUserRole("public");
    setUserEmail(null);
  };

  // Manejo de peticiones desde el Portal Ciudadano
  const handleCitizenComplaint = async (texto: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await processTriage({
        texto_incidencia: texto,
        provider: "cloud_groq",
      });
      setSingleResult(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Error al enviar la incidencia ciudadana";
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejo de peticiones de triaje técnico
  const handleTriageSubmit = async (
    texto: string,
    provider: LLMProviderType,
  ) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (adminTab === "single") {
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
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans selection:bg-yellow-300 selection:text-zinc-900">
      
      {/* Topbar Institucional */}
      <header className="border-b border-zinc-200 bg-white/95 backdrop-blur-md px-6 py-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo y Título */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-300 rounded-xl text-zinc-900 shadow-sm">
              <Clapperboard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                  FilmCity IA
                </h1>
                <span className="bg-yellow-300 text-zinc-900 font-semibold text-xs px-2.5 py-0.5 rounded border border-yellow-400">
                  Madrid Film Office
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Centro de Mediación de Incidencias Urbanas y Turismo Cinematográfico
              </p>
            </div>
          </div>

          {/* Barra de Acciones según Rol */}
          <div className="flex items-center gap-2">
            {currentUserRole === "public" ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenLogin("operator")}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-900" />
                  Acceso Operador
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenLogin("admin")}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-yellow-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  Consola Admin
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-zinc-100 px-3 py-1.5 rounded-xl border border-zinc-200 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-semibold text-zinc-800 capitalize">
                    {currentUserRole === "operator" ? "Operador Gestor" : "Administrador IT"}
                  </span>
                  <span className="text-zinc-400 font-mono text-[11px]">({userEmail})</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1 text-zinc-500 hover:text-rose-600 rounded transition-colors"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Monitor Dinámico de Rodajes Activos */}
      <div className="bg-white border-b border-zinc-200 px-6 py-2 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0 bg-white z-10 pr-2 border-r border-zinc-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-xs text-zinc-800 shrink-0">
              Sets Activos Hoy:
            </span>
          </div>

          <div className="overflow-hidden w-full relative">
            {filmingSets.length > 0 ? (
              <div className="animate-marquee flex items-center gap-8 text-xs text-zinc-600 cursor-default">
                {[...filmingSets, ...filmingSets].map((set, index) => (
                  <span
                    key={`${set.id}-${index}`}
                    className="flex items-center gap-1.5 shrink-0 hover:text-zinc-900 transition-colors"
                    title={`${set.tipo_ocupacion} (${set.id})`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-zinc-900 fill-yellow-300 shrink-0" />
                    <strong className="text-zinc-900 font-medium">
                      {set.ubicacion}
                    </strong>
                    <span className="text-zinc-500">
                      ({set.titulo_produccion})
                    </span>
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-zinc-400 italic">
                Cargando autorizaciones activas...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contenido Principal Modular según Rol */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 space-y-6">
        
        {/* Error Alert Global */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-800 text-xs shadow-sm">
            <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block text-rose-900">
                No se pudo procesar la solicitud con el backend
              </strong>
              <p className="mt-0.5 text-rose-700">{errorMsg}</p>
              <p className="mt-1 text-zinc-500">
                Asegúrate de tener FastAPI ejecutándose en{" "}
                <code className="text-zinc-900 font-mono bg-zinc-100 px-1 py-0.5 rounded border border-zinc-200">
                  http://localhost:8000
                </code>
                .
              </p>
            </div>
          </div>
        )}

        {/* 1. VISTA PÚBLICA: Portal Ciudadano */}
        {currentUserRole === "public" && (
          <CitizenPortal
            filmingSets={filmingSets}
            onSubmitComplaint={handleCitizenComplaint}
            isLoading={isLoading}
          />
        )}

        {/* 2. VISTA OPERADOR: Bandeja Human-in-the-Loop */}
        {currentUserRole === "operator" && (
          <OperatorValidationDesk recentTriage={singleResult} />
        )}

        {/* 3. VISTA ADMIN: Consola Técnica y Benchmark */}
        {currentUserRole === "admin" && (
          <div className="space-y-6">
            
            {/* Sub-navegador de Auditoría Técnica */}
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                  <Terminal className="w-5 h-5" />
                  Consola de Inferencia y Auditoría LLM
                </h2>
                <p className="text-xs text-zinc-500">
                  Métricas de latencia, consumo de tokens y trazas de razonamiento ReAct.
                </p>
              </div>

              <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200 text-xs">
                <button
                  type="button"
                  onClick={() => setAdminTab("single")}
                  className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                    adminTab === "single"
                      ? "bg-yellow-300 text-zinc-900 shadow-sm font-semibold"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  Triaje Individual
                </button>
                <button
                  type="button"
                  onClick={() => setAdminTab("compare")}
                  className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                    adminTab === "compare"
                      ? "bg-zinc-900 text-yellow-300 shadow-sm font-bold"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  Benchmark Dual
                </button>
              </div>
            </div>

            {/* Formulario de Ingesta */}
            <TriageForm onSubmit={handleTriageSubmit} isLoading={isLoading} />

            {/* Resultado Individual */}
            {adminTab === "single" && singleResult && !isLoading && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-zinc-900" />
                  Dictamen con Traza ReAct
                </h3>
                <TriageResultCard data={singleResult} />
              </div>
            )}

            {/* Resultado Benchmark */}
            {adminTab === "compare" && compareResult && !isLoading && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-zinc-900" />
                  Benchmark Comparativo
                </h3>
                <ComparisonView data={compareResult} />
              </div>
            )}

            {/* Estado Vacío */}
            {!singleResult && !compareResult && !isLoading && !errorMsg && (
              <div className="border border-dashed border-zinc-300 bg-white rounded-2xl p-10 text-center text-zinc-500 text-xs flex flex-col items-center justify-center gap-2 shadow-sm">
                <RefreshCw className="w-6 h-6 text-zinc-400 animate-pulse" />
                <span>
                  Selecciona un caso de prueba o escribe una incidencia para ejecutar la inferencia.
                </span>
              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white px-6 py-4 text-center text-xs text-zinc-500">
        FilmCity IA © 2026 • Mediación Inteligente y Screen Tourism • Desarrollado para Bootcamp IA & Data | Somos F5
      </footer>

      {/* Modal de Autenticación */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialRole={authModalInitialRole}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}