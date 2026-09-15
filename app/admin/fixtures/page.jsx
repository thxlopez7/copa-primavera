import { supabase } from "@/lib/supabase";
import MatchManagerCard from "@/components/admin/MatchManagerCard";

export const revalidate = 0;

export default async function AdminFixturesPage({ searchParams }) {
  // Opcional: Permitir filtrado por categoría en el futuro si searchParams.cat existe
  
  // 1. Fetch de los Partidos cruzando con Categorías y Equipos
  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      *,
      category:categories(name),
      team1:team1_id(id, player1:player1_id(first_name, last_name), player2:player2_id(first_name, last_name)),
      team2:team2_id(id, player1:player1_id(first_name, last_name), player2:player2_id(first_name, last_name))
    `)
    // Ordenamos por status para que los pendientes/en_juego salgan primeros, 
    // y secundariamente por fecha de creación o programación
    .order('status', { ascending: false })
    .order('scheduled_at', { ascending: true, nullsFirst: true });

  if (error) {
    return <div className="text-red-500 font-bold">Error cargando fixtures: {error.message}</div>;
  }

  // Agrupamos lógicamente para la vista (Pendientes vs Finalizados)
  const activeMatches = (matches || []).filter(m => m !== null && !['completed', 'walkover', 'Finalizado', 'W.O.'].includes(m.status));
  const completedMatches = (matches || []).filter(m => m !== null && ['completed', 'walkover', 'Finalizado', 'W.O.'].includes(m.status));

  return (
    <div className="max-w-7xl mx-auto animate-fade-in-up">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-navy-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Gestión de Partidos</h1>
          <p className="text-slate-400 font-medium mt-1">
            Programa horarios, asigna canchas y carga resultados oficiales.
          </p>
        </div>
        
        {/* Futuro: Filtros por Categoría */}
        <div className="flex gap-2">
          <span className="px-4 py-2 bg-navy-800 rounded-lg text-sm font-bold text-slate-400">
            Total Activos: {activeMatches.length}
          </span>
        </div>
      </div>

      <div className="space-y-12">
        {/* SECCIÓN 1: Activos y Pendientes */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <i className="fa-regular fa-clock"></i>
            </div>
            <h2 className="text-xl font-black text-white">Partidos Pendientes & En Vivo</h2>
          </div>

          {activeMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {activeMatches.map(match => (
                <MatchManagerCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <div className="bg-navy-900 border border-navy-800 rounded-2xl p-12 text-center">
              <p className="text-slate-400 font-medium">No hay partidos pendientes. Ve al Generador de Torneos para crear llaves.</p>
            </div>
          )}
        </section>

        {/* SECCIÓN 2: Finalizados (Historial de gestión) */}
        {completedMatches.length > 0 && (
          <section className="opacity-80">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-navy-800 text-slate-400 flex items-center justify-center">
                <i className="fa-solid fa-square-check"></i>
              </div>
              <h2 className="text-xl font-black text-slate-300">Partidos Finalizados</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {completedMatches.map(match => (
                <MatchManagerCard key={match.id} match={match} />
              ))}
            </div>
          </section>
        )}
      </div>

    </div>
  );
}
