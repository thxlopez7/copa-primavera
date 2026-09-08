"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useScrollLock } from "@/hooks/useScrollLock";

export default function AdminLoginModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useScrollLock(isOpen);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setErrorMsg("");
    setIsLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      setErrorMsg("Credenciales incorrectas. Verificá tu correo y contraseña.");
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-navy-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold text-white">Acceso de Organizador</h3>
          <p className="text-xs text-slate-400">Ingresá tus credenciales para acceder al panel de administración.</p>
        </div>
        <div className="space-y-3">
          <input 
            type="email" 
            placeholder="Correo electrónico..." 
            value={email}
            onChange={(e) => {setEmail(e.target.value); setErrorMsg("");}}
            className="w-full bg-navy-800 border border-navy-700 rounded-xl px-3 py-2 text-white outline-none focus:border-brand-500"
          />
          <input 
            type="password" 
            placeholder="Contraseña..." 
            value={password}
            onChange={(e) => {setPassword(e.target.value); setErrorMsg("");}}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-full bg-navy-800 border border-navy-700 rounded-xl px-3 py-2 text-white outline-none focus:border-brand-500"
          />
          {errorMsg && <p className="text-xs text-rose-400 text-center font-medium">{errorMsg}</p>}
          <button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 disabled:cursor-not-allowed text-navy-950 font-bold py-2.5 rounded-xl text-xs transition"
          >
            {isLoading ? "Ingresando..." : "Ingresar"}
          </button>
          <button onClick={onClose} className="w-full bg-transparent text-slate-400 hover:text-white py-1.5 text-xs">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
