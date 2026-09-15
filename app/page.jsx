import { supabase } from "@/lib/supabase";
import MatchCard from "@/components/MatchCard";
import ScheduleRow from "@/components/ScheduleRow";
import CategorySelector from "@/components/CategorySelector";
import Link from "next/link";

export const revalidate = 0; // Garantizar frescura de datos en el home

export default async function HomePage() {
  // 1. Fetching concurrente de datos (pantallazos rápidos para el dashboard)
  const [
    { data: liveRaw },
    { data: upcomingRaw },
    { data: latestRaw },
    { data: categories }
  ] = await Promise.all([
    // A) En Vivo
    supabase.from('matches')
      .select('*, category:categories(name), team1:team1_id(id, player1:player1_id(first_name, last_name), player2:player2_id(first_name, last_name)), team2:team2_id(id, player1:player1_id(first_name, last_name), player2:player2_id(first_name, last_name))')
      .in('status', ['in_progress', 'En Juego'])
      .limit(4),
      
    // B) Próximos (Traemos un poco más para filtrar strings basura)
    supabase.from('matches')
      .select('*, category:categories(name), team1:team1_id(id, player1:player1_id(first_name, last_name), player2:player2_id(first_name, last_name)), team2:team2_id(id, player1:player1_id(first_name, last_name), player2:player2_id(first_name, last_name))')
      .in('status', ['scheduled', 'Programado'])
      .not('scheduled_at', 'is', null)
      .limit(10),

    // C) Últimos Resultados
    supabase.from('matches')
      .select('*, category:categories(name), team1:team1_id(id, player1:player1_id(first_name, last_name), player2:player2_id(first_name, last_name)), team2:team2_id(id, player1:player1_id(first_name, last_name), player2:player2_id(first_name, last_name))')
      .in('status', ['completed', 'walkover', 'Finalizado', 'W.O.'])
      .limit(10), // Traemos 10 para ordenarlos bien por fecha antes de cortar

    // D) Categorías para el Selector
    supabase.from('categories')
      .select('*')
      .order('name')
  ]) || [];

  // Fallbacks seguros por si las respuestas vienen mal formadas
  const safeLiveRaw = liveRaw || [];
  const safeUpcomingRaw = upcomingRaw || [];
  const safeLatestRaw = latestRaw || [];
  const safeCategories = categories || [];

  // Adaptadores de formato para que coincidan con los props esperados por los Dumb Components
  const adaptMatch = (m) => ({
    ...m,
    category_name: m.category?.name || "Categoría",
    round_name: m.round,
    status: m.status,
    scheduled_at: m.scheduled_at || m.match_datetime
  });

  const liveMatches = safeLiveRaw.map(adaptMatch);

  // Filtrar horarios inválidos y tomar los primeros 4 ordenados
  const upcomingMatches = safeUpcomingRaw
    .map(adaptMatch)
    .filter(m => m.scheduled_at && m.scheduled_at !== "A definir" && m.scheduled_at !== "Automático")
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
    .slice(0, 4);

  // Tomar los últimos 3 resultados ordenados descendentemente
  const latestResults = safeLatestRaw
    .map(adaptMatch)
    .sort((a, b) => (b.scheduled_at || "").localeCompare(a.scheduled_at || ""))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-navy-950 font-sans text-slate-300">
      
      {/* 1. Hero Section (Diario Deportivo) */}
      <section className="relative overflow-hidden bg-navy-900 border-b border-navy-800">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/10 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-800 border border-navy-700 text-brand-400 font-bold text-xs uppercase tracking-widest mb-6">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
            Torneo Oficial
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-4">
            COPA PRIMAVERA
          </h1>
          <p className="text-xl md:text-2xl font-medium text-slate-400 mb-10 max-w-2xl mx-auto">
            Pádel <span className="text-navy-600 font-black">·</span> Competición <span className="text-navy-600 font-black">·</span> Pasión
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/fixture" className="px-8 py-4 bg-brand-500 hover:bg-brand-400 text-navy-950 font-black rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:scale-105">
              <i className="fa-solid fa-trophy mr-2"></i> Ver Fixture
            </Link>
            <Link href="/programacion" className="px-8 py-4 bg-navy-800 hover:bg-navy-700 text-white font-bold rounded-xl border border-navy-700 transition-all hover:border-brand-500/50">
              <i className="fa-regular fa-calendar-days mr-2"></i> Horarios
            </Link>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20">
        
        {/* 2. Sección "En Vivo" (Solo renderiza si hay partidos) */}
        {liveMatches.length > 0 && (
          <section className="animate-fade-in-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
              <h2 className="text-2xl font-black text-white uppercase tracking-widest">En Vivo Ahora</h2>
            </div>
            
            <div className="p-1 rounded-2xl bg-gradient-to-r from-red-500/20 via-orange-500/10 to-transparent">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-navy-950/80 rounded-xl backdrop-blur-sm">
                {liveMatches.map(match => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* 3. Próximos Partidos (Columna Principal) */}
          <section className="lg:col-span-7">
            <div className="flex items-center justify-between mb-6 border-b border-navy-800 pb-4">
              <div className="flex items-center gap-3">
                <i className="fa-regular fa-clock text-brand-500 text-xl"></i>
                <h2 className="text-2xl font-black text-white">Próximos Partidos</h2>
              </div>
              <Link href="/programacion" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">
                Cartelera Completa <i className="fa-solid fa-arrow-right ml-1"></i>
              </Link>
            </div>
            
            {upcomingMatches.length > 0 ? (
              <div className="flex flex-col gap-3">
                {upcomingMatches.map(match => (
                  <ScheduleRow key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <div className="bg-navy-900/50 border border-navy-800 rounded-xl p-8 text-center">
                <p className="text-slate-400 font-medium">No hay partidos programados en lo inmediato.</p>
              </div>
            )}
          </section>

          {/* 4. Últimos Resultados (Columna Lateral) */}
          <section className="lg:col-span-5">
            <div className="flex items-center justify-between mb-6 border-b border-navy-800 pb-4">
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-square-check text-brand-500 text-xl"></i>
                <h2 className="text-2xl font-black text-white">Últimos Resultados</h2>
              </div>
              <Link href="/resultados" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">
                Ver Todos <i className="fa-solid fa-arrow-right ml-1"></i>
              </Link>
            </div>
            
            {latestResults.length > 0 ? (
              <div className="flex flex-col gap-4">
                {latestResults.map(match => (
                  <Link key={match.id} href={`/partido/${match.id}`} className="transform hover:-translate-x-1 transition-transform block">
                    <MatchCard match={match} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-navy-900/50 border border-navy-800 rounded-xl p-8 text-center">
                <p className="text-slate-400 font-medium">Aún no hay resultados para mostrar.</p>
              </div>
            )}
          </section>
        </div>

        {/* 5. Selector de Categorías Rápido */}
        <section className="pt-8 border-t border-navy-800">
          <div className="flex items-center justify-center gap-3 mb-8">
            <i className="fa-solid fa-layer-group text-brand-500 text-xl"></i>
            <h2 className="text-2xl font-black text-white">Explorar por Categoría</h2>
          </div>
          
          <div className="flex justify-center max-w-4xl mx-auto">
            <CategorySelector categories={safeCategories} basePath="/fixture/" />
          </div>
        </section>

      </main>
    </div>
  );
}
