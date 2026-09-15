import { supabase } from "@/lib/supabase";

export const revalidate = 0;

export default async function AdminDashboardPage() {
  // 1. Fetching concurrente de datos para las métricas
  const [
    { data: matches },
    { count: pairsCount }
  ] = await Promise.all([
    supabase.from('matches').select('status, scheduled_at'),
    supabase.from('pairs').select('*', { count: 'exact', head: true })
  ]);

  const safeMatches = matches || [];
  
  // 2. Cálculos en memoria (más seguro si hay strings sucios en fechas legacy)
  const todayISO = new Date().toISOString().split('T')[0];
  
  let matchesTodayCount = 0;
  let pendingCount = 0;
  let liveCount = 0;

  safeMatches.forEach(m => {
    const status = m.status;
    const timeStr = m.scheduled_at || "";

    if (status === 'scheduled' || status === 'Programado') {
      pendingCount++;
      // Chequeo tosco de "Hoy". Si tienes fechas ISO, esto coincidirá.
      if (timeStr.includes(todayISO)) {
        matchesTodayCount++;
      }
    }

    if (status === 'in_progress' || status === 'En Juego') {
      liveCount++;
    }
  });

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Dashboard General</h1>
        <p className="text-slate-400 font-medium">Resumen en tiempo real del torneo.</p>
      </div>

      {/* Grid de KPIs (Tarjetas de Resumen) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1: Partidos Hoy */}
        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center text-xl">
            <i className="fa-regular fa-calendar-check"></i>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Partidos Hoy</p>
            <p className="text-3xl font-black text-white leading-none">{matchesTodayCount}</p>
          </div>
        </div>

        {/* KPI 2: Pendientes */}
        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-500/10 text-slate-400 flex items-center justify-center text-xl">
            <i className="fa-regular fa-clock"></i>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Pendientes Totales</p>
            <p className="text-3xl font-black text-white leading-none">{pendingCount}</p>
          </div>
        </div>

        {/* KPI 3: En Vivo */}
        <div className="bg-navy-900 border border-red-500/30 rounded-2xl p-6 shadow-[0_0_15px_rgba(239,68,68,0.1)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center text-xl relative">
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <i className="fa-solid fa-satellite-dish"></i>
          </div>
          <div>
            <p className="text-red-400/80 text-xs font-bold uppercase tracking-wider mb-1">En Vivo Ahora</p>
            <p className="text-3xl font-black text-white leading-none">{liveCount}</p>
          </div>
        </div>

        {/* KPI 4: Parejas */}
        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-xl">
            <i className="fa-solid fa-users"></i>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Parejas Inscritas</p>
            <p className="text-3xl font-black text-white leading-none">{pairsCount || 0}</p>
          </div>
        </div>

      </div>

      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-8 mt-8">
        <h3 className="text-xl font-bold text-white mb-4">Bienvenido al Panel de Control</h3>
        <p className="text-slate-400">
          Usa el menú lateral para gestionar categorías, inscribir parejas, armar el cuadro del torneo y cargar resultados.
          Toda modificación impactará inmediatamente en el sitio público gracias a la arquitectura Server-Side.
        </p>
      </div>

    </div>
  );
}
