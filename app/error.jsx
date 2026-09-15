"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Aquí podrías enviar el error a un servicio como Sentry si lo tuvieras
    console.error("Error Global Capturado:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-6 text-center animate-fade-in-up">
      <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-8 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
        <i className="fa-solid fa-triangle-exclamation text-4xl text-red-500"></i>
      </div>
      
      <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
        ¡Doble Falta!
      </h1>
      
      <p className="text-slate-400 font-medium text-lg max-w-md mx-auto mb-8">
        Algo salió mal procesando esta información. La pelota quedó en la red.
        <br/><br/>
        <span className="text-sm font-mono text-slate-500 bg-navy-900 p-2 rounded block">
          {error.message || "Error interno del servidor"}
        </span>
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => reset()}
          className="px-8 py-3 bg-brand-500 hover:bg-brand-400 text-navy-950 font-black rounded-xl transition-all shadow-lg hover:shadow-brand-500/20"
        >
          <i className="fa-solid fa-rotate-right mr-2"></i>
          Intentar de Nuevo
        </button>
        <Link 
          href="/"
          className="px-8 py-3 bg-navy-900 border border-navy-700 hover:bg-navy-800 text-white font-bold rounded-xl transition-all"
        >
          <i className="fa-solid fa-house mr-2"></i>
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}
