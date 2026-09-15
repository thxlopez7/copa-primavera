import Link from "next/link";
import LogoutButton from "@/components/admin/LogoutButton";

export const revalidate = 0;

export default async function AdminLayout({ children }) {

  return (
    <div className="flex min-h-screen bg-navy-950 text-slate-300 font-sans">
      
      {/* Sidebar Desktop (Oculto en mobile muy pequeños, apilable en tablets) */}
      <aside className="w-64 bg-navy-900 border-r border-navy-800 hidden md:flex flex-col">
        <div className="p-6 border-b border-navy-800">
          <h2 className="text-xl font-black text-white tracking-tighter">
            COPA <span className="text-brand-500">ADMIN</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Panel de Control</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-brand-500/10 hover:text-brand-400 transition-colors font-bold text-sm">
            <i className="fa-solid fa-chart-line w-5"></i> Dashboard
          </Link>
          <Link href="/admin/categorias" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-brand-500/10 hover:text-brand-400 transition-colors font-bold text-sm">
            <i className="fa-solid fa-layer-group w-5"></i> Categorías
          </Link>
          <Link href="/admin/parejas" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-brand-500/10 hover:text-brand-400 transition-colors font-bold text-sm">
            <i className="fa-solid fa-users w-5"></i> Parejas
          </Link>
          <Link href="/admin/torneo" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-brand-500/10 hover:text-brand-400 transition-colors font-bold text-sm">
            <i className="fa-solid fa-sitemap w-5"></i> Fixture / Torneo
          </Link>
          <Link href="/admin/resultados" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-brand-500/10 hover:text-brand-400 transition-colors font-bold text-sm">
            <i className="fa-solid fa-square-check w-5"></i> Resultados
          </Link>
        </nav>

        <div className="p-4 border-t border-navy-800">
          <div className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-500">
            <i className="fa-solid fa-shield-halved"></i> Admin Seguro
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
        
        {/* Header Mobile (Solo visible en móviles) */}
        <header className="md:hidden bg-navy-900 border-b border-navy-800 p-4 flex items-center justify-between sticky top-0 z-50">
          <h2 className="text-lg font-black text-white tracking-tighter">
            COPA <span className="text-brand-500">ADMIN</span>
          </h2>
          <Link href="/admin" className="text-brand-500"><i className="fa-solid fa-bars text-xl"></i></Link>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
      
    </div>
  );
}
