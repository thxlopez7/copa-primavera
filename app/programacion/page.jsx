import { supabase } from "@/lib/supabase";
import ScheduleRow from "@/components/ScheduleRow";
import Link from "next/link";

export const revalidate = 0;

// Utilidad para extraer la fecha o el bloque agrupador
const extractDateGroup = (datetimeStr) => {
  if (!datetimeStr || typeof datetimeStr !== 'string' || datetimeStr === "A definir" || datetimeStr === "Automático") return null;
  
  // Si es ISO 8601
  if (datetimeStr.includes("T")) {
    const d = new Date(datetimeStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    }
  }
  
  // Si es un formato de texto como "Sábado 15 - 21:00"
  const parts = datetimeStr.split('-');
  if (parts.length > 1) {
    return parts[0].trim();
  }
  
  // Fallback
  return datetimeStr;
};

export default async function ProgramacionPage() {
  // 1. Fetch de los partidos programados
  // Filtramos los estados tanto en inglés (fase nueva) como en español (fase antigua) por seguridad
  const { data: rawMatches = [], error } = await supabase
    .from('matches')
    .select(`
      *,
      category:categories(name),
      team1:team1_id(id, player1:player1_id(first_name, last_name), player2:player2_id(first_name, last_name)),
      team2:team2_id(id, player1:player1_id(first_name, last_name), player2:player2_id(first_name, last_name))
    `)
    .in('status', ['scheduled', 'in_progress', 'Programado', 'En Juego']);

  if (error) {
    console.error("Error fetching schedule:", error);
    return <div className="p-8 text-center text-red-400">Error cargando la programación.</div>;
  }

  // 2. Limpieza y Ordenamiento en Servidor
  // Descartamos los que no tienen horario real definido
  let validMatches = (rawMatches || []).filter(m => {
    const s = m.scheduled_at || m.match_datetime; // Soporte legacy
    return s && s !== "A definir" && s !== "Automático";
  });

  // Ordenamos (si son ISO funciona nativo, si son strings funciona alfabético)
  validMatches.sort((a, b) => {
    const timeA = String(a.scheduled_at || a.match_datetime || "");
    const timeB = String(b.scheduled_at || b.match_datetime || "");
    return timeA.localeCompare(timeB);
  });

  // 3. Agrupación por Fecha
  const groupedSchedule = {};
  validMatches.forEach(m => {
    const timeStr = m.scheduled_at || m.match_datetime;
    const groupName = extractDateGroup(timeStr) || "Próximamente";
    
    if (!groupedSchedule[groupName]) {
      groupedSchedule[groupName] = [];
    }

    // Mapeo defensivo de propiedades para el ScheduleRow
    const cleanMatch = {
      ...m,
      category_name: m.category?.name || "Categoría",
      round_name: m.round,
      status: m.status,
      scheduled_at: timeStr
    };

    groupedSchedule[groupName].push(cleanMatch);
  });

  const dates = Object.keys(groupedSchedule);

  return (
    <div className="min-h-screen bg-navy-950 font-sans text-slate-300 flex flex-col">
      
      {/* Cabecera */}
      <div className="bg-navy-900 border-b border-navy-800 pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center gap-3 mb-4 justify-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-navy-950 flex items-center justify-center font-black shadow-lg shadow-brand-500/20">
              <i className="fa-regular fa-calendar-days text-2xl"></i>
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">
            Cartelera de Partidos
          </h1>
          <p className="text-slate-400 font-medium text-center max-w-xl mx-auto">
            Sigue la agenda diaria del torneo. Todos los horarios y canchas confirmados para los próximos días.
          </p>
        </div>
      </div>

      <main className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        
        {dates.length === 0 ? (
          <div className="bg-navy-900/50 border border-navy-800 rounded-3xl p-16 text-center">
            <div className="w-16 h-16 bg-navy-950 rounded-full flex items-center justify-center border border-navy-800 mx-auto text-slate-600 mb-6 text-3xl">
              <i className="fa-solid fa-mug-hot"></i>
            </div>
            <h2 className="text-white font-bold text-xl mb-2">Día de descanso</h2>
            <p className="text-slate-400 text-sm">
              No hay partidos programados para los próximos días.
            </p>
            <Link href="/fixture" className="inline-block mt-6 px-6 py-2 bg-navy-800 hover:bg-navy-700 text-white font-bold rounded-lg transition-colors">
              Ver Fixture General
            </Link>
          </div>
        ) : (
          dates.map((dateTitle, idx) => (
            <section key={idx} className="animate-fade-in-up">
              {/* Título de Agrupación por Fecha */}
              <div className="flex items-center gap-4 mb-6 sticky top-0 bg-navy-950/90 backdrop-blur-md py-4 z-10 border-b border-navy-800">
                <h2 className="text-lg font-black text-white capitalize">
                  {dateTitle}
                </h2>
                <div className="flex-1 h-px bg-navy-800"></div>
                <span className="text-xs font-bold text-brand-500 bg-brand-500/10 px-3 py-1 rounded-full">
                  {groupedSchedule[dateTitle].length} partido{groupedSchedule[dateTitle].length > 1 ? 's' : ''}
                </span>
              </div>
              
              {/* Listado de Partidos */}
              <div className="flex flex-col gap-3">
                {groupedSchedule[dateTitle].map(match => (
                  <ScheduleRow key={match.id} match={match} />
                ))}
              </div>
            </section>
          ))
        )}

      </main>
    </div>
  );
}
