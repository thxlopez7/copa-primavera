import { supabase } from "@/lib/supabase";
import MatchCard from "@/components/MatchCard";
import Link from "next/link";

export const revalidate = 0;

// Utilidad para agrupar por fecha
const extractDateGroup = (datetimeStr) => {
  if (!datetimeStr || datetimeStr === "A definir" || datetimeStr === "Automático") return "Fecha sin definir";
  
  if (datetimeStr.includes("T")) {
    const d = new Date(datetimeStr);
    // Para resultados queda bien algo como "Sábado 15 de Octubre"
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  
  const parts = datetimeStr.split('-');
  return parts.length > 1 ? parts[0].trim() : datetimeStr;
};

export default async function ResultadosPage() {
  // 1. Fetch de todos los partidos finalizados
  const { data: rawMatches, error } = await supabase
    .from('matches')
    .select(`
      *,
      category:categories(name),
      team1:team1_id(id, player1:player1_id(first_name, last_name), player2:player2_id(first_name, last_name)),
      team2:team2_id(id, player1:player1_id(first_name, last_name), player2:player2_id(first_name, last_name))
    `)
    .in('status', ['completed', 'walkover', 'Finalizado', 'W.O.']);

  if (error) {
    console.error("Error fetching results:", error);
    throw new Error(error.message);
  }

  // 2. Ordenamiento Descendente (los más recientes primero)
  let validMatches = rawMatches || [];
  validMatches.sort((a, b) => {
    const timeA = a.scheduled_at || a.match_datetime || "";
    const timeB = b.scheduled_at || b.match_datetime || "";
    // Descendente
    return timeB.localeCompare(timeA);
  });

  // 3. Agrupación por Fecha
  const groupedResults = {};
  validMatches.forEach(m => {
    const timeStr = m.scheduled_at || m.match_datetime;
    const groupName = extractDateGroup(timeStr);
    
    if (!groupedResults[groupName]) {
      groupedResults[groupName] = [];
    }

    // Adaptador para el MatchCard
    const cleanMatch = {
      ...m,
      category_name: m.category?.name || "Categoría",
      round_name: m.round,
      status: m.status,
      scheduled_at: timeStr
    };

    groupedResults[groupName].push(cleanMatch);
  });

  // Mantenemos el orden de las llaves tal cual porque el array original ya estaba ordenado descendentemente
  // y al iterar Object.keys() el orden de inserción en objetos modernos se suele mantener.
  // Pero para asegurar:
  const dates = [...new Set(validMatches.map(m => extractDateGroup(m.scheduled_at || m.match_datetime)))];

  return (
    <div className="min-h-screen bg-navy-950 font-sans text-slate-300 flex flex-col">
      
      {/* Cabecera */}
      <div className="bg-navy-900 border-b border-navy-800 pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center gap-3 mb-4 justify-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-navy-950 flex items-center justify-center font-black shadow-lg shadow-brand-500/20">
              <i className="fa-solid fa-square-check text-2xl"></i>
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">
            Resultados del Torneo
          </h1>
          <p className="text-slate-400 font-medium text-center max-w-2xl mx-auto">
            Revive los marcadores y el historial de todos los partidos jugados hasta la fecha.
          </p>
        </div>
      </div>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
        
        {dates.length === 0 ? (
          <div className="bg-navy-900/50 border border-navy-800 rounded-3xl p-16 text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-navy-950 rounded-full flex items-center justify-center border border-navy-800 mx-auto text-slate-600 mb-6 text-3xl">
              <i className="fa-regular fa-clock"></i>
            </div>
            <h2 className="text-white font-bold text-xl mb-2">Aún no hay resultados</h2>
            <p className="text-slate-400 text-sm">
              El torneo está por comenzar o no se han cargado marcadores oficiales.
            </p>
            <Link href="/programacion" className="inline-block mt-6 px-6 py-2 bg-navy-800 hover:bg-navy-700 text-white font-bold rounded-lg transition-colors">
              Ver Programación
            </Link>
          </div>
        ) : (
          dates.map((dateTitle, idx) => (
            <section key={idx} className="animate-fade-in-up">
              {/* Título de Agrupación por Fecha */}
              <div className="flex items-center gap-4 mb-6 sticky top-0 bg-navy-950/90 backdrop-blur-md py-4 z-10 border-b border-navy-800">
                <h2 className="text-xl font-black text-white capitalize">
                  {dateTitle}
                </h2>
                <div className="flex-1 h-px bg-navy-800"></div>
                <span className="text-xs font-bold text-brand-500 bg-brand-500/10 px-3 py-1 rounded-full">
                  {groupedResults[dateTitle].length} partido{groupedResults[dateTitle].length > 1 ? 's' : ''}
                </span>
              </div>
              
              {/* Grid Responsivo de Resultados usando MatchCard */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedResults[dateTitle].map(match => (
                  <div key={match.id} className="transform hover:-translate-y-1 transition-transform">
                    {/* Al envolverlo en el link aprovechamos la página compartible generada antes */}
                    <Link href={`/partido/${match.id}`}>
                      <MatchCard match={match} />
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}

      </main>
    </div>
  );
}
