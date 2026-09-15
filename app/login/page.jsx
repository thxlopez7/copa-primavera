"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Credenciales incorrectas o error en el servidor.");
      setLoading(false);
    } else {
      router.push("/admin");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up relative z-10">
        <Link href="/" className="flex justify-center mb-6 text-slate-400 hover:text-white transition-colors">
          <i className="fa-solid fa-arrow-left mr-2 mt-1"></i> Volver al Inicio
        </Link>
        <h2 className="mt-6 text-center text-4xl font-black text-white tracking-tighter">
          COPA <span className="text-brand-500">ADMIN</span>
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400 font-medium">
          Acceso restringido al panel de administración
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up relative z-10" style={{ animationDelay: "100ms" }}>
        <div className="bg-navy-900/80 backdrop-blur-xl py-8 px-4 shadow-[0_0_40px_rgba(0,0,0,0.5)] sm:rounded-3xl sm:px-10 border border-navy-800">
          
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                <i className="fa-solid fa-triangle-exclamation text-red-400 mt-0.5"></i>
                <p className="text-sm text-red-400 font-medium">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Correo Electrónico
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fa-regular fa-envelope text-slate-500"></i>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-11 px-3 py-3 border border-navy-700 rounded-xl bg-navy-950 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 sm:text-sm font-medium transition-colors"
                  placeholder="admin@copaprimavera.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Contraseña
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fa-solid fa-lock text-slate-500"></i>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-11 px-3 py-3 border border-navy-700 rounded-xl bg-navy-950 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 sm:text-sm font-medium transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.2)] text-sm font-black text-navy-950 bg-brand-500 hover:bg-brand-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 focus:ring-offset-navy-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin mr-2"></i> Ingresando...
                  </>
                ) : (
                  "Ingresar al Panel"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
