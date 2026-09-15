"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function AdminLayout({ children }) {
  const [isAdmin, setIsAdmin] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/");
      } else {
        setIsAdmin(true);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        router.push("/");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(34,197,94,0.3)]"></div>
        <p className="text-sm font-bold text-slate-400">Verificando acceso seguro...</p>
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const navGroups = [
    {
      title: "GENERAL",
      links: [
        { name: "Dashboard", href: "/admin", icon: "fa-solid fa-chart-pie" }
      ]
    },
    {
      title: "TORNEO",
      links: [
        { name: "Equipos", href: "/admin/equipos", icon: "fa-solid fa-users" },
        { name: "Fase de grupos", href: "/admin/fase-grupos", icon: "fa-solid fa-layer-group" },
        { name: "Fixtures", href: "/admin/fixtures", icon: "fa-solid fa-calendar-days" },
        { name: "Clasificación", href: "/admin/clasificacion", icon: "fa-solid fa-list-ol" },
        { name: "Cuadro final", href: "/admin/cuadro", icon: "fa-solid fa-sitemap" }
      ]
    },
    {
      title: "CONTENIDO",
      links: [
        { name: "Noticias", href: "/admin/noticias", icon: "fa-regular fa-newspaper" },
        { name: "Información", href: "/admin/informacion", icon: "fa-solid fa-circle-info" }
      ]
    },
    {
      title: "SISTEMA",
      links: [
        { name: "Configuración", href: "/admin/configuracion", icon: "fa-solid fa-gear" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col md:flex-row font-sans text-slate-300">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-navy-900 border-b border-navy-800 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-brand-500 text-navy-950 flex items-center justify-center font-black">
            CP
          </div>
          <span className="font-bold text-white text-sm">Operations Center</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white p-2">
          <i className={`fa-solid ${isSidebarOpen ? 'fa-xmark' : 'fa-bars'} text-xl`}></i>
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'block' : 'hidden'} md:block w-full md:w-64 bg-navy-900 border-r border-navy-800 flex-shrink-0 z-40 fixed md:sticky top-[65px] md:top-0 h-[calc(100vh-65px)] md:h-screen overflow-y-auto`}>
        <div className="p-6 hidden md:block">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-navy-950 flex items-center justify-center font-black shadow-lg shadow-brand-500/20">
              <i className="fa-solid fa-bolt text-xl"></i>
            </div>
            <div>
              <h1 className="font-black text-white text-lg leading-tight tracking-tight">COPA</h1>
              <h2 className="font-bold text-brand-400 text-[10px] uppercase tracking-widest leading-none">Operations</h2>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-6">
          {navGroups.map((group, idx) => (
            <div key={idx}>
              <h3 className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                {group.title}
              </h3>
              <ul className="space-y-1">
                {group.links.map(link => {
                  const isActive = pathname === link.href;
                  return (
                    <li key={link.href}>
                      <Link 
                        href={link.href}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                          isActive 
                            ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' 
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <i className={`${link.icon} w-5 text-center ${isActive ? 'text-brand-400' : 'text-slate-500'}`}></i>
                        {link.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-navy-800">
          <Link href="/" className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-400 hover:text-white mb-2">
            <i className="fa-solid fa-arrow-left"></i> Volver al sitio público
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-bold transition-colors">
            <i className="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden min-h-screen bg-navy-950 pb-12">
        {children}
      </main>
    </div>
  );
}
