"use client";

export default function AdminBanner({ isAdmin, logoutAdmin }) {
  if (!isAdmin) return null;

  return (
    <div className="bg-navy-900/90 backdrop-blur-md border-b border-orange-500/30 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(249,115,22,0.05)_10px,rgba(249,115,22,0.05)_20px)] text-orange-400 text-xs font-semibold py-2.5 px-4 sticky top-20 z-30 flex justify-between items-center shadow-md">
      <div className="flex items-center gap-2">
        <i className="fa-solid fa-user-shield text-sm animate-pulse"></i>
        <span className="tracking-widest">MODO ADMINISTRADOR ACTIVO</span>
      </div>
      <button onClick={logoutAdmin} className="bg-transparent border border-dashed border-orange-500/50 hover:bg-orange-500/10 hover:border-orange-500 text-orange-400 px-3 py-1 rounded-lg text-[10px] font-bold transition-all">Cerrar Sesión</button>
    </div>
  );
}
