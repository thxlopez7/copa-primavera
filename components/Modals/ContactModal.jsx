"use client";

import { useScrollLock } from "@/hooks/useScrollLock";

export default function ContactModal({ isOpen, onClose }) {
  useScrollLock(isOpen);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-navy-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold text-white">Escribinos por WhatsApp</h3>
          <p className="text-xs text-slate-400">Seleccioná a cualquiera de los organizadores para anotarte:</p>
        </div>
        <div className="space-y-2">
          <a href="https://wa.me/595975748033?text=Hola%20Facu,%20quiero%20inscribirme%20al%20Torneo%20Copa%20Primavera" target="_blank" rel="noreferrer" className="w-full bg-navy-800 hover:bg-brand-500 hover:text-navy-950 text-white font-bold p-3 rounded-xl text-xs transition flex items-center justify-between border border-navy-700">
            <span>Facu Aguilera</span>
            <span className="font-mono text-[10px]">+595 975 748 033</span>
          </a>
          <a href="https://wa.me/595975620833?text=Hola%20Ferchu,%20quiero%20inscribirme%20al%20Torneo%20Copa%20Primavera" target="_blank" rel="noreferrer" className="w-full bg-navy-800 hover:bg-brand-500 hover:text-navy-950 text-white font-bold p-3 rounded-xl text-xs transition flex items-center justify-between border border-navy-700">
            <span>Ferchu Martinez</span>
            <span className="font-mono text-[10px]">+595 975 620 833</span>
          </a>
          <a href="https://wa.me/595995619918?text=Hola%20Jere,%20quiero%20inscribirme%20al%20Torneo%20Copa%20Primavera" target="_blank" rel="noreferrer" className="w-full bg-navy-800 hover:bg-brand-500 hover:text-navy-950 text-white font-bold p-3 rounded-xl text-xs transition flex items-center justify-between border border-navy-700">
            <span>Jere Caceres</span>
            <span className="font-mono text-[10px]">+595 995 619 918</span>
          </a>
        </div>
        <button onClick={onClose} className="w-full bg-transparent text-slate-400 hover:text-white text-xs pt-1">
          Cerrar
        </button>
      </div>
    </div>
  );
}
