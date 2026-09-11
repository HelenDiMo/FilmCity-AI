import { useState } from 'react';
import { TriageForm } from './components/TriageForm';
import type { LLMProviderType } from './types/triage';
import { Clapperboard } from 'lucide-react';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);

  const handleTriageSubmit = async (texto: string, provider: LLMProviderType) => {
    setIsLoading(true);
    console.log('Enviando reporte:', { texto, provider });
    // Simulamos respuesta mientras creamos el componente de resultados
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Topbar Institucional */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600 rounded-lg text-white shadow-lg shadow-red-600/30">
              <Clapperboard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                MADRID FILM OFFICE <span className="text-red-500 text-xs px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20">FilmCity IA</span>
              </h1>
              <p className="text-xs text-slate-400">
                Sistema Inteligente de Mediación Ciudadana y Turismo Cinematográfico
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        <TriageForm onSubmit={handleTriageSubmit} isLoading={isLoading} />
      </main>
    </div>
  );
}