import { useState } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  Terminal, 
  X, 
  AlertCircle,
  KeyRound,
  Mail,
  ArrowRight
} from 'lucide-react';

export type UserRole = 'operator' | 'admin';

interface AuthModalProps {
  isOpen: boolean;
  initialRole?: UserRole;
  onClose: () => void;
  onLoginSuccess: (role: UserRole, userEmail: string) => void;
}

export function AuthModal({ isOpen, initialRole = 'operator', onClose, onLoginSuccess }: AuthModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Credenciales demo configuradas
  const handleQuickLogin = (role: UserRole) => {
    if (role === 'operator') {
      onLoginSuccess('operator', 'operador@madridfilmoffice.es');
    } else {
      onLoginSuccess('admin', 'admin@filmcity.ai');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validación simulada de credenciales
    if (selectedRole === 'operator') {
      if (email === 'operador@madridfilmoffice.es' && password === 'madrid2026') {
        onLoginSuccess('operator', email);
      } else {
        setError('Credenciales inválidas para Operador Municipal.');
      }
    } else {
      if (email === 'admin@filmcity.ai' && password === 'admin2026') {
        onLoginSuccess('admin', email);
      } else {
        setError('Credenciales inválidas para Administrador Técnico.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-zinc-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
        
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabecera del Modal */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-yellow-300 rounded-lg text-zinc-900">
              <Lock className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900">
              Acceso Restringido
            </h2>
          </div>
          <p className="text-xs text-zinc-500">
            Identificación para personal municipal y administradores de FilmCity IA.
          </p>
        </div>

        {/* Selector de Rol */}
        <div className="grid grid-cols-2 gap-2 bg-zinc-100 p-1 rounded-xl border border-zinc-200 text-xs">
          <button
            type="button"
            onClick={() => { setSelectedRole('operator'); setError(null); }}
            className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
              selectedRole === 'operator'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-900" />
            Operador Gestor
          </button>
          <button
            type="button"
            onClick={() => { setSelectedRole('admin'); setError(null); }}
            className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
              selectedRole === 'admin'
                ? 'bg-zinc-900 text-yellow-300 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Admin / Consola
          </button>
        </div>

        {/* Acceso rápido (Demo 1-Click) */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-bold text-zinc-800">Acceso Rápido para Demostración:</span>
            <span className="text-[10px] text-zinc-500 uppercase font-mono">1-Clic</span>
          </div>
          <button
            type="button"
            onClick={() => handleQuickLogin(selectedRole)}
            className="w-full flex items-center justify-between px-3 py-1.5 bg-yellow-300 hover:bg-yellow-400 text-zinc-900 font-bold rounded-lg transition-colors"
          >
            <span>Entrar como {selectedRole === 'operator' ? 'Operador Municipal' : 'Administrador IA'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Formulario Estándar */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="font-semibold text-zinc-700 block mb-1">Correo Corporativo</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={selectedRole === 'operator' ? 'operador@madridfilmoffice.es' : 'admin@filmcity.ai'}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-3 py-2 text-zinc-900 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-zinc-700 block mb-1">Contraseña</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-3 py-2 text-zinc-900 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl transition-all shadow-sm active:scale-95 mt-2"
          >
            Iniciar Sesión
          </button>
        </form>

      </div>
    </div>
  );
}