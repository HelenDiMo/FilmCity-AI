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
  IncidentTicket,
} from "./types/triage";
import {
  Clapperboard,
  MapPin,
  Activity,
  Scale,
  ShieldCheck,
  AlertOctagon,
  RefreshCw,
  LogOut,
  Terminal,
  Layers,
} from "lucide-react";

type RoleSession = "public" | "operator" | "admin";
type AdminTabMode = "single" | "compare";

const SEED_TICKETS: IncidentTicket[] = [
  {
    id: "MFO-2026-001",
    fecha: "Hoy, 10:14",
    ubicacion: "Gran Vía / Callao",
    reporte_original:
      "Varios camiones de producción han bloqueado la salida de emergencia del edificio y la toma de agua de bomberos.",
    categoria: "Bloqueo de Vados o Salidas de Emergencia",
    urgencia: "Crítica",
    departamento_propuesto: "Policía Municipal / Seguridad Ciudadana",
    resumen: "Bloqueo de salida de emergencia y toma de bomberos.",
    estado: "Pendiente",
    origen: "Ciudadano",
  },
  {
    id: "MFO-2026-002",
    fecha: "Hoy, 11:30",
    ubicacion: "Calle de las Huertas",
    reporte_original:
      "Generador diésel a máxima potencia y focos de 10.000W sin apagar a las 23:45 h.",
    categoria: "Contaminación Acústica / Ruidos Nocturnos",
    urgencia: "Media",
    departamento_propuesto: "Medio Ambiente y Limpieza Urbana",
    resumen: "Ruidos de generadores diésel fuera de horario.",
    estado: "Pendiente",
    origen: "Ciudadano",
  },
];

export default function App() {
  const [currentUserRole, setCurrentUserRole] = useState<RoleSession>("public");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialRole, setAuthModalInitialRole] =
    useState<UserRole>("operator");

  const [adminTab, setAdminTab] = useState<AdminTabMode>("single");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [tickets, setTickets] = useState<IncidentTicket[]>(SEED_TICKETS);
  const [filmingSets, setFilmingSets] = useState<FilmingSet[]>([]);

  const [singleResult, setSingleResult] = useState<TriageResponse | null>(null);
  const [compareResult, setCompareResult] =
    useState<CompareTriageResponse | null>(null);

  useEffect(() => {
    fetchActiveFilmingSets()
      .then((data) => setFilmingSets(data))
      .catch((err) =>
        console.error("No se pudieron cargar los sets de rodaje:", err)
      );
  }, []);

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

  // Manejo de queja ciudadana con tipado flexible
  const handleCitizenComplaint = async (
    payload: string | { texto: string; ubicacion?: string; motivo?: string }
  ): Promise<string> => {
    setIsLoading(true);
    setErrorMsg(null);

    const texto = typeof payload === "string" ? payload : payload.texto;
    const ubicacion =
      typeof payload === "string"
        ? "Madrid Centro"
        : payload.ubicacion || "Ubicación reportada";
    const motivo =
      typeof payload === "string"
        ? "Incidencia Vecinal"
        : payload.motivo || "Incidencia Vecinal";

    const generatedId = `MFO-2026-${String(tickets.length + 1).padStart(3, "0")}`;

    try {
      const responseData = await processTriage({
        texto_incidencia: texto,
        provider: "cloud_groq",
      });
      setSingleResult(responseData);

      const newTicket: IncidentTicket = {
        id: generatedId,
        fecha: "Ahora mismo",
        ubicacion: ubicacion,
        reporte_original: texto,
        categoria: responseData.resultado.categoria || motivo,
        urgencia: responseData.resultado.nivel_urgencia || "Media",
        departamento_propuesto:
          responseData.resultado.departamento_asignado ||
          "Turismo y Madrid Film Office",
        resumen:
          responseData.resultado.resumen_10_palabras ||
          "Reporte vecinal recibido.",
        estado: "Pendiente",
        origen: "Ciudadano",
      };

      setTickets((prev) => [newTicket, ...prev]);
      return generatedId;
    } catch (err: unknown) {
      let errorText = "Error desconocido de conexión";
      if (err instanceof Error) {
        errorText = err.message;
      } else if (typeof err === "object" && err !== null) {
        errorText = JSON.stringify(err);
      }

      const fallbackTicket: IncidentTicket = {
        id: generatedId,
        fecha: "Ahora mismo",
        ubicacion: ubicacion,
        reporte_original: texto,
        categoria: motivo,
        urgencia: "Media",
        departamento_propuesto: "Turismo y Madrid Film Office",
        resumen: "Reporte vecinal registrado.",
        estado: "Pendiente",
        origen: "Ciudadano",
      };
      setTickets((prev) => [fallbackTicket, ...prev]);

      setErrorMsg(
        `Aviso: Queja registrada en cola, pero falló el triaje en tiempo real: ${errorText}`
      );
      return generatedId;
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveTicket = (id: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, estado: "Validado" } : t))
    );
  };

  const handleReassignTicket = (id: string, newDept: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, departamento_propuesto: newDept, estado: "Reasignado" }
          : t
      )
    );
  };

  // Manejo de peticiones de triaje técnico para Admin
  const handleTriageSubmit = async (
    texto: string,
    provider: LLMProviderType
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
        err instanceof Error ? err.message : "Error al conectar con la API";
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
                Centro de Mediación de Incidencias Urbanas y Turismo
                Cinematográfico
              </p>
            </div>
          </div>

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
                    {currentUserRole === "operator"
                      ? "Operador Gestor"
                      : "Administrador IT"}
                  </span>
                  <span className="text-zinc-400 font-mono text-[11px]">
                    ({userEmail})
                  </span>
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

      {/* Monitor Dinámico de Rodajes */}
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

      {/* Contenido Principal */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 space-y-6">
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-800 text-xs shadow-sm">
            <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block text-rose-900">
                Aviso del Sistema
              </strong>
              <p className="mt-0.5 text-rose-700">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* 1. Vista Pública: Portal Ciudadano */}
        {currentUserRole === "public" && (
          <CitizenPortal
            filmingSets={filmingSets}
            onSubmitComplaint={handleCitizenComplaint}
            isLoading={isLoading}
          />
        )}

        {/* 2. Vista Operador: Bandeja Human-in-the-Loop */}
        {currentUserRole === "operator" && (
          <OperatorValidationDesk
            tickets={tickets}
            onApproveTicket={handleApproveTicket}
            onReassignTicket={handleReassignTicket}
          />
        )}

        {/* 3. Vista Admin: Consola de Inferencia y Benchmark */}
        {currentUserRole === "admin" && (
          <div className="space-y-6">
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

            {/* Selector de Quejas Reales Registradas en Cola */}
            {tickets.length > 0 && (
              <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-zinc-800">
                  <Layers className="w-4 h-4 text-zinc-700" />
                  <span>Auditar Quejas Reales de la Cola Ciudadana:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tickets.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() =>
                        handleTriageSubmit(t.reporte_original, "cloud_groq")
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-yellow-300 hover:text-zinc-900 border border-zinc-200 text-zinc-700 transition-colors text-left"
                    >
                      <strong>{t.id}:</strong> {t.categoria} ({t.ubicacion})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <TriageForm onSubmit={handleTriageSubmit} isLoading={isLoading} />

            {adminTab === "single" && singleResult && !isLoading && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-zinc-900" />
                  Dictamen con Traza ReAct
                </h3>
                <TriageResultCard data={singleResult} />
              </div>
            )}

            {adminTab === "compare" && compareResult && !isLoading && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-zinc-900" />
                  Benchmark Comparativo
                </h3>
                <ComparisonView data={compareResult} />
              </div>
            )}

            {!singleResult && !compareResult && !isLoading && !errorMsg && (
              <div className="border border-dashed border-zinc-300 bg-white rounded-2xl p-10 text-center text-zinc-500 text-xs flex flex-col items-center justify-center gap-2 shadow-sm">
                <RefreshCw className="w-6 h-6 text-zinc-400 animate-pulse" />
                <span>
                  Selecciona una queja real de la lista o escribe en el
                  formulario para ejecutar la inferencia.
                </span>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-200 bg-white px-6 py-4 text-center text-xs text-zinc-500">
        FilmCity IA © 2026 • Mediación Inteligente y Screen Tourism •
        Desarrollado para Bootcamp IA & Data | Somos F5
      </footer>

      <AuthModal
        isOpen={isAuthModalOpen}
        initialRole={authModalInitialRole}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}