"use client";

import { useState } from "react";

export default function Navbar({ activeTab, setActiveTab, isAdmin, openContactModal, openAdminModal }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-white/5 backdrop-blur-md border-b border-white/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("inicio")}>
            <div className="h-10 bg-copaBlue-500 rounded-lg px-3 py-1 flex items-center justify-between gap-2 border border-blue-400/30 shadow-md">
              <div className="text-left leading-none">
                <span className="text-[8px] font-black tracking-widest text-white block uppercase">TORNEO</span>
                <span className="text-sm font-extrabold tracking-tighter text-white block leading-tight">COPA PRIMAVERA</span>
                <span className="text-[7px] font-semibold text-blue-100 block tracking-wider">PILAR - PARAGUAY</span>
              </div>
              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-copaBlue-500 font-bold ml-1">
                <i className="fa-solid fa-baseball text-xs"></i>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1 font-medium text-sm">
            <button onClick={() => setActiveTab("inicio")} className={`nav-btn px-4 py-2 rounded-lg transition ${activeTab === 'inicio' ? 'text-white bg-navy-800' : 'text-slate-300 hover:text-white hover:bg-navy-800'}`}>
              Inicio
            </button>
            <button onClick={() => setActiveTab("noticias")} className={`nav-btn px-4 py-2 rounded-lg transition ${activeTab === 'noticias' ? 'text-white bg-navy-800' : 'text-slate-300 hover:text-white hover:bg-navy-800'}`}>
              Noticias
            </button>
            <button onClick={() => setActiveTab("fixture")} className={`nav-btn px-4 py-2 rounded-lg transition ${activeTab === 'fixture' ? 'text-white bg-navy-800' : 'text-slate-300 hover:text-white hover:bg-navy-800'}`}>
              Fixture y Llaves
            </button>
            {isAdmin && (
              <button onClick={() => setActiveTab("programacion")} className={`nav-btn px-4 py-2 rounded-lg transition ${activeTab === 'programacion' ? 'text-brand-400 bg-brand-500/10 font-bold' : 'text-slate-300 hover:text-brand-300 hover:bg-brand-500/5'}`}>
                <i className="fa-regular fa-calendar-days mr-1"></i> Programación
              </button>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={openContactModal} className="bg-brand-500 hover:bg-brand-600 text-navy-950 font-bold px-4 py-2.5 rounded-xl text-sm transition flex items-center gap-2 shadow-lg shadow-brand-500/20">
              <i className="fa-brands fa-whatsapp text-base"></i> Inscribirse
            </button>
            <button onClick={openAdminModal} className="bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white px-3 py-2 rounded-xl border border-navy-700 text-xs transition flex items-center gap-1.5 font-bold" title="Panel Administrador">
              <i className="fa-solid fa-lock text-[10px]"></i> <span>{isAdmin ? 'Panel Admin' : 'Admin'}</span>
            </button>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button onClick={openAdminModal} className="bg-navy-800 text-slate-300 p-2 rounded-lg text-xs border border-navy-700 font-bold">
              <i className="fa-solid fa-lock mr-1"></i> Admin
            </button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-300 hover:text-white p-2">
              <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-xl`}></i>
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white/5 backdrop-blur-md border-b border-white/10 px-4 pt-2 pb-6 space-y-1">
          <button onClick={() => {setActiveTab("inicio"); setIsMobileMenuOpen(false);}} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm ${activeTab === 'inicio' ? 'text-white bg-navy-800' : 'text-slate-300 hover:text-white hover:bg-navy-800'}`}>
            Inicio
          </button>
          <button onClick={() => {setActiveTab("noticias"); setIsMobileMenuOpen(false);}} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm ${activeTab === 'noticias' ? 'text-white bg-navy-800' : 'text-slate-300 hover:text-white hover:bg-navy-800'}`}>
            Noticias
          </button>
          <button onClick={() => {setActiveTab("fixture"); setIsMobileMenuOpen(false);}} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm ${activeTab === 'fixture' ? 'text-white bg-navy-800' : 'text-slate-300 hover:text-white hover:bg-navy-800'}`}>
            Fixture y Llaves
          </button>
          {isAdmin && (
            <button onClick={() => {setActiveTab("programacion"); setIsMobileMenuOpen(false);}} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm ${activeTab === 'programacion' ? 'text-brand-400 bg-brand-500/10 font-bold' : 'text-slate-300 hover:text-brand-300 hover:bg-brand-500/5'}`}>
              <i className="fa-regular fa-calendar-days mr-1"></i> Programación
            </button>
          )}
          <div className="pt-2 flex flex-col gap-2">
            <button onClick={() => {openContactModal(); setIsMobileMenuOpen(false);}} className="w-full bg-gradient-to-r from-brand-400 to-brand-600 text-navy-950 font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-[0_10px_20px_rgba(34,197,94,0.3)] hover:scale-[1.02] transition-transform">
              <i className="fa-brands fa-whatsapp text-lg"></i> Inscripción por WhatsApp
            </button>
            <button onClick={() => {openAdminModal(); setIsMobileMenuOpen(false);}} className="w-full bg-transparent border border-dashed border-slate-600 text-slate-400 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-xs transition-colors hover:text-white hover:border-white">
              <i className="fa-solid fa-key"></i> Acceso Organizador (Admin)
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
