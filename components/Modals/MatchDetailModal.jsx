"use client";

import { useScrollLock } from "@/hooks/useScrollLock";

export default function MatchDetailModal({ isOpen, onClose }) {
  useScrollLock(isOpen);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-navy-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white p-2">
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>
        <div className="text-center space-y-1 border-b border-navy-800 pb-3">
          <span className="text-brand-500 text-[11px] font-bold uppercase tracking-wider block">Zona A</span>
          <h3 className="text-xl font-black text-white">Detalles del Partido</h3>
          <div className="flex justify-center items-center gap-3 text-xs text-slate-300 pt-1">
            <span className="bg-navy-800 px-2.5 py-1 rounded-lg border border-navy-700">
              <i className="fa-solid fa-location-dot text-brand-500 mr-1"></i><span>Cancha PP1</span>
            </span>
            <span className="bg-navy-800 px-2.5 py-1 rounded-lg border border-navy-700">
              <i className="fa-regular fa-clock text-copaBlue-500 mr-1"></i><span>A definir</span>
            </span>
          </div>
        </div>

        <div className="bg-navy-800/80 border border-navy-700 rounded-2xl p-4 space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-bold text-white text-sm truncate max-w-[65%]">Pareja 1</span>
            <span className="font-mono font-extrabold text-base px-3 py-1 bg-navy-900 rounded-lg text-brand-500 border border-navy-700">-</span>
          </div>
          <div className="text-center text-[10px] text-slate-500 font-bold uppercase">VS</div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-white text-sm truncate max-w-[65%]">Pareja 2</span>
            <span className="font-mono font-extrabold text-base px-3 py-1 bg-navy-900 rounded-lg text-brand-500 border border-navy-700">-</span>
          </div>
        </div>

        <div className="text-center">
          <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-navy-800 text-slate-300 border border-navy-700">Programado</span>
        </div>

        <button onClick={onClose} className="w-full bg-navy-800 hover:bg-navy-700 text-white font-bold py-2.5 rounded-xl text-xs transition">
          Cerrar
        </button>
      </div>
    </div>
  );
}
