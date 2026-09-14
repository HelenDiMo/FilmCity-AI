import { useState } from 'react';
import type { IncidentTicket } from '../types/triage';
import { 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';

interface OperatorValidationDeskProps {
  tickets: IncidentTicket[];
  onApproveTicket: (id: string) => void;
  onReassignTicket: (id: string, newDept: string) => void;
}

export function OperatorValidationDesk({ 
  tickets, 
  onApproveTicket, 
  onReassignTicket 
}: OperatorValidationDeskProps) {
  const [selectedId, setSelectedId] = useState<string>(tickets[0]?.id || '');
  const [manualDept, setManualDept] = useState<string>('');

  const activeTicket = tickets.find((t) => t.id === selectedId) || tickets[0];

  const handleReassignSubmit = () => {
    if (!manualDept.trim() || !activeTicket) return;
    onReassignTicket(activeTicket.id, manualDept.trim());
    setManualDept('');
  };

  return (
    <div className="space-y-6">
      
      {/* Cabecera del Panel */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-zinc-900">
            <ShieldCheck className="w-5 h-5 text-zinc-900" />
            <h2 className="text-xl font-bold tracking-tight text-zinc-900">
              Bandeja de Validación Municipal (Human-in-the-Loop)
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Supervisión y confirmación de los dictámenes emitidos por el motor de triaje FilmCity IA.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-yellow-50 border border-yellow-200 font-bold text-zinc-800">
            {tickets.filter((t) => t.estado === 'Pendiente').length} Pendientes
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 font-bold text-emerald-800">
            {tickets.filter((t) => t.estado === 'Validado').length} Validados
          </span>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white border border-dashed border-zinc-300 rounded-2xl p-12 text-center text-zinc-500 text-xs">
          <AlertCircle className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
          <span>No hay incidencias registradas en este momento.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Columna Izquierda: Cola de Expedientes */}
          <div className="lg:col-span-5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
              Cola de Expedientes ({tickets.length})
            </span>

            <div className="space-y-2 max-h-150 overflow-y-auto pr-1">
              {tickets.map((ticket) => {
                const isSelected = ticket.id === activeTicket?.id;
                return (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => setSelectedId(ticket.id)}
                    className={`w-full p-4 rounded-xl border text-left transition-all space-y-2 ${
                      isSelected
                        ? 'bg-white border-yellow-400 ring-2 ring-yellow-400/50 shadow-sm'
                        : 'bg-white border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-zinc-900">{ticket.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ticket.estado === 'Validado'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ticket.estado === 'Reasignado'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-yellow-100 text-zinc-900'
                      }`}>
                        {ticket.estado}
                      </span>
                    </div>

                    <div>
                      <strong className="block text-xs font-bold text-zinc-800 line-clamp-1">
                        {ticket.categoria || 'Incidencia Vecinal'}
                      </strong>
                      <span className="text-xs text-zinc-500 line-clamp-1">
                        {ticket.ubicacion} • {ticket.fecha}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Columna Derecha: Detalle del Caso */}
          {activeTicket && (
            <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-6">
              
              <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
                <div>
                  <span className="text-xs text-zinc-400 font-mono">Expediente {activeTicket.id}</span>
                  <h3 className="text-base font-bold text-zinc-900">
                    {activeTicket.categoria || 'Incidencia Registrada'}
                  </h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  activeTicket.urgencia === 'Crítica'
                    ? 'bg-rose-100 text-rose-800'
                    : activeTicket.urgencia === 'Alta'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-yellow-100 text-zinc-900'
                }`}>
                  Urgencia: {activeTicket.urgencia}
                </span>
              </div>

              {/* Reporte Original */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-xs space-y-1">
                <span className="font-bold text-zinc-500 uppercase tracking-wider block">
                  Texto Original del Reporte ({activeTicket.origen})
                </span>
                <p className="text-zinc-800 text-xs italic">
                  "{activeTicket.reporte_original}"
                </p>
              </div>

              {/* Dictamen Generado por IA */}
              <div className="bg-yellow-50/50 border border-yellow-200/80 rounded-xl p-4 text-xs space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                  <Building2 className="w-4 h-4 text-zinc-900" />
                  <span>Propuesta de Derivación Automática</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-zinc-500 block">Derivación recomendada:</span>
                    <strong className="text-zinc-900 font-bold">{activeTicket.departamento_propuesto}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Síntesis ejecutiva:</span>
                    <span className="text-zinc-800">"{activeTicket.resumen}"</span>
                  </div>
                </div>
              </div>

              {/* Acciones de Validación */}
              <div className="pt-2 border-t border-zinc-200 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 block">
                  Acción del Operador Municipal
                </span>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onApproveTicket(activeTicket.id)}
                    disabled={activeTicket.estado === 'Validado'}
                    className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-yellow-300 hover:bg-yellow-400 disabled:bg-zinc-100 disabled:text-zinc-400 text-zinc-900 font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {activeTicket.estado === 'Validado' ? 'Dictamen Aprobado' : 'Aprobar Derivación Oficial'}
                  </button>

                  <div className="w-full sm:w-auto flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={manualDept}
                      onChange={(e) => setManualDept(e.target.value)}
                      placeholder="Reasignar departamento..."
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-yellow-400"
                    />
                    <button
                      type="button"
                      onClick={handleReassignSubmit}
                      disabled={!manualDept.trim()}
                      className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 text-white font-bold text-xs rounded-xl transition-all shrink-0"
                    >
                      Reasignar
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}