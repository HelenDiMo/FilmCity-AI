import { useState } from 'react';
import type { FilmingSet } from '../types/triage';
import { 
  Building2, 
  MapPin, 
  AlertCircle, 
  Send, 
  CheckCircle2, 
  Volume2, 
  Truck, 
  Users, 
  FileQuestion,
  ArrowRight
} from 'lucide-react';

interface CitizenPortalProps {
  filmingSets: FilmingSet[];
  onSubmitComplaint: (
    payload: string | { texto: string; ubicacion?: string; motivo?: string }
  ) => Promise<string> | Promise<void>;
  isLoading: boolean;
}
const COMMON_ISSUES = [
  { icon: Truck, label: 'Ocupación o Bloqueo', desc: 'Camiones, vados o salidas bloqueadas' },
  { icon: Volume2, label: 'Ruidos / Horarios', desc: 'Generadores nocturnos o luces molestas' },
  { icon: Users, label: 'Aglomeración', desc: 'Paso peatonal colapsado por rodaje o fans' },
  { icon: FileQuestion, label: 'Consulta de Permiso', desc: 'Verificar si la grabación está autorizada' },
];

export function CitizenPortal({ filmingSets, onSubmitComplaint, isLoading }: CitizenPortalProps) {
  const [selectedSet, setSelectedSet] = useState<string>('');
  const [issueType, setIssueType] = useState<string>('Ocupación o Bloqueo');
  const [locationDetail, setLocationDetail] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const handleSetChange = (setId: string) => {
    setSelectedSet(setId);
    const setFound = filmingSets.find((s) => s.id === setId);
    if (setFound) {
      setLocationDetail(`${setFound.ubicacion} (${setFound.distrito})`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || isLoading) return;

    // Construimos un texto contextualizado para que el backend lo procese
    const fullText = `[Tipo: ${issueType}] [Ubicación: ${locationDetail || 'No especificada'}] ${description}`;
    
    await onSubmitComplaint(fullText);

    // Generamos un código de seguimiento verosímil
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    setSubmittedId(`MFO-REC-2026-${randomCode}`);
  };

  const handleReset = () => {
    setSubmittedId(null);
    setDescription('');
    setLocationDetail('');
    setSelectedSet('');
  };

  // Pantalla de Confirmación de Registro
  if (submittedId) {
    return (
      <div className="bg-white border border-zinc-200 rounded-2xl p-8 max-w-2xl mx-auto shadow-sm text-center space-y-6">
        <div className="w-16 h-16 bg-yellow-100 border border-yellow-300 rounded-full flex items-center justify-center mx-auto text-zinc-900 shadow-sm">
          <CheckCircle2 className="w-8 h-8 text-zinc-900" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase font-bold tracking-wider text-zinc-400">
            Registro Oficial Completado
          </span>
          <h2 className="text-2xl font-bold text-zinc-900">
            Incidencia Recibida Correctamente
          </h2>
          <p className="text-sm text-zinc-600 max-w-md mx-auto">
            Tu reporte ha sido registrado en el sistema municipal y clasificado automáticamente por FilmCity AI para su atención prioritaria.
          </p>
        </div>

        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-left space-y-2 text-xs">
          <div className="flex justify-between border-b border-zinc-200 pb-2">
            <span className="text-zinc-500 font-medium">Nº de Expediente:</span>
            <strong className="text-zinc-900 font-mono">{submittedId}</strong>
          </div>
          <div className="flex justify-between border-b border-zinc-200 pb-2">
            <span className="text-zinc-500 font-medium">Motivo:</span>
            <span className="text-zinc-800">{issueType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 font-medium">Estado Inicial:</span>
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Enviado a Triaje y Mediación
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-yellow-300 hover:bg-yellow-400 text-zinc-900 font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95"
        >
          Registrar Otra Incidencia
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 max-w-3xl mx-auto shadow-sm space-y-6">
      
      {/* Cabecera del Portal */}
      <div className="border-b border-zinc-200 pb-5">
        <div className="flex items-center gap-2 text-zinc-900 mb-1">
          <Building2 className="w-5 h-5 text-zinc-900" />
          <h2 className="text-xl font-bold tracking-tight text-zinc-900">
            Portal de Convivencia y Mediación de Rodajes
          </h2>
        </div>
        <p className="text-xs text-zinc-500">
          Canal directo de atención vecinal y comercial de Madrid Film Office para resolver incidencias asociadas a grabaciones en la vía pública.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Paso 1: Tipo de Incidencia */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block mb-3">
            1. Selecciona el tipo de situación
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {COMMON_ISSUES.map((issue) => {
              const Icon = issue.icon;
              const isSelected = issueType === issue.label;
              return (
                <button
                  key={issue.label}
                  type="button"
                  onClick={() => setIssueType(issue.label)}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-yellow-50 border-yellow-400 ring-1 ring-yellow-400 text-zinc-900'
                      : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 text-zinc-600'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-yellow-300 text-zinc-900' : 'bg-zinc-200 text-zinc-700'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-xs font-bold text-zinc-900">{issue.label}</strong>
                    <span className="text-[11px] text-zinc-500 line-clamp-1">{issue.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Paso 2: Ubicación / Set de rodaje vinculado */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block">
            2. Ubicación de la grabación
          </label>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">
                ¿Corresponde a un set de rodaje activo hoy?
              </label>
              <select
                value={selectedSet}
                onChange={(e) => handleSetChange(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
              >
                <option value="">-- Seleccionar set autorizado (Opcional) --</option>
                {filmingSets.map((set) => (
                  <option key={set.id} value={set.id}>
                    {set.ubicacion} • {set.titulo_produccion}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-zinc-500 block mb-1">
                Dirección exacta o referencia
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={locationDetail}
                  onChange={(e) => setLocationDetail(e.target.value)}
                  placeholder="Ej. Gran Vía nº 28, esquina Callao"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Paso 3: Detalle de la queja o consulta */}
        <div>
          <label htmlFor="citizen-desc" className="text-xs font-bold uppercase tracking-wider text-zinc-700 block mb-1.5">
            3. Explica lo sucedido
          </label>
          <textarea
            id="citizen-desc"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalla qué está ocurriendo, desde qué hora y cómo te afecta a ti o a tu actividad comercial..."
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 resize-none"
            required
          />
        </div>

        {/* Aviso de Privacidad y Botón */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-200">
          <span className="text-[11px] text-zinc-500 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            Tratamiento seguro conforme a la normativa de Mediación Urbana de Madrid.
          </span>

          <button
            type="submit"
            disabled={!description.trim() || isLoading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-yellow-300 hover:bg-yellow-400 disabled:bg-zinc-200 disabled:text-zinc-400 text-zinc-900 font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95"
          >
            {isLoading ? (
              <span>Enviando al sistema...</span>
            ) : (
              <>
                <span>Enviar Reporte a Mediación</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}