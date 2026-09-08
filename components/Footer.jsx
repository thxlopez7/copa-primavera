"use client";

export default function Footer({ openContactModal, openAdminModal }) {
  return (
    <footer className="bg-navy-900 border-t border-navy-800 mt-12 text-slate-400 py-8 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-8 bg-copaBlue-500 rounded px-2 flex items-center justify-between gap-1.5 border border-blue-400/30">
            <div className="text-left leading-none">
              <span className="text-[6px] font-black tracking-widest text-white block uppercase">TORNEO</span>
              <span className="text-xs font-extrabold tracking-tighter text-white block leading-tight">COPA PRIMAVERA</span>
            </div>
          </div>
          <span className="text-white font-semibold">Pilar - Paraguay 2026</span>
        </div>
        
        <div className="flex gap-6 items-center">
          <button onClick={openContactModal} className="hover:text-white font-semibold text-brand-500">
            <i className="fa-brands fa-whatsapp"></i> Inscribirse por WhatsApp
          </button>
          <a href="https://www.instagram.com/torneo_copa_primavera?igsi=a2EzZWJuaXpncGxx" target="_blank" rel="noreferrer" className="hover:text-white">
            <i className="fa-brands fa-instagram"></i> Instagram
          </a>
          
          <button onClick={openAdminModal} className="bg-navy-800 hover:bg-navy-700 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg border border-navy-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow">
            <i className="fa-solid fa-lock text-[10px]"></i>
            <span>INGRESAR COMO ADMIN</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
