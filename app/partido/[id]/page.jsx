import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import MatchCard from "@/components/MatchCard";
import ShareButton from "@/components/ShareButton";
import Link from "next/link";

export const revalidate = 0;

// Utilidad para extraer un texto amigable del equipo
const getTeamName = (team) => {
  if (!team) return "Por definir";
  if (team.player1_name && team.player2_name) return `${team.player1_name} / ${team.player2_name}`;
  return team.name || "Equipo";
};

// 1. Metadatos dinámicos para SEO y Compartir en Redes Sociales (Open Graph)
export async function generateMetadata({ params }) {
  const { data: match } = await supabase
    .from('matches')
    .select(`
      *,
      team1:team1_id (id, player1_name, player2_name),
      team2:team2_id (id, player1_name, player2_name)
    `)
    .eq('id', params.id)
    .single();

  if (!match) return { title: "Partido no encontrado - Copa Primavera" };

  // Fetch secundario para la categoría (seguro contra errores de FK name inference)
  let categoryName = "Categoría";
  if (match.category_id) {
    const { data: cat } = await supabase.from('categories').select('name').eq('id', match.category_id).single();
    if (cat) categoryName = cat.name;
  }

  const t1Name = getTeamName(match.team1);
  const t2Name = getTeamName(match.team2);
  
  const title = `${categoryName}: ${t1Name} vs ${t2Name}`;
  const description = `${match.round || 'Partido'} - ${match.scheduled_at || 'Horario a definir'} en ${match.court || 'Cancha a definir'}`;

  return {
    title: `${title} | Copa Primavera`,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Copa Primavera",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    }
  };
}

export default async function MatchDetailPage({ params }) {
  // Fetch del partido
  const { data: match, error } = await supabase
    .from('matches')
    .select(`
      *,
      team1:team1_id (id, player1_name, player2_name),
      team2:team2_id (id, player1_name, player2_name)
    `)
    .eq('id', params.id)
    .single();

  if (error || !match) {
    notFound();
  }

  // Fetch de categoría seguro
  let categoryName = "Categoría";
  if (match.category_id) {
    const { data: cat } = await supabase.from('categories').select('name').eq('id', match.category_id).single();
    if (cat) categoryName = cat.name;
  }

  // Preparamos el objeto estructurado para el MatchCard
  const fullMatch = {
    ...match,
    category_name: categoryName,
    round_name: match.round, // mapeo de la propiedad DB a la UI
    status: match.status // mapeo de la propiedad DB a la UI
  };

  const t1Name = getTeamName(match.team1);
  const t2Name = getTeamName(match.team2);
  const shareTitle = `${categoryName}: ${t1Name} vs ${t2Name}`;
  const shareText = `Sigue el resultado en vivo del partido de ${match.round || 'Fase'}.`;

  return (
    <div className="min-h-screen bg-navy-950 font-sans text-slate-300 flex flex-col items-center justify-center p-4 py-12">
      
      {/* Botón Volver */}
      <div className="w-full max-w-md mb-8">
        <Link href="/programacion" className="text-sm font-bold text-slate-400 hover:text-white flex items-center gap-2 transition-colors w-fit">
          <i className="fa-solid fa-arrow-left"></i> Volver a la cartelera
        </Link>
      </div>

      <main className="w-full max-w-md flex flex-col items-center gap-8">
        
        {/* Título de la vista */}
        <div className="text-center">
          <h1 className="text-3xl font-black text-white mb-2">Detalles del Partido</h1>
          <p className="text-slate-500 font-medium text-sm">Copa Primavera Central</p>
        </div>

        {/* Tarjeta Destacada */}
        <div className="w-full transform scale-100 sm:scale-105 transition-transform">
          {/* Reutilizamos el MatchCard universal pasándole el objeto enriquecido */}
          <MatchCard match={fullMatch} />
        </div>

        {/* Info Detallada de Sets (Fallback visual si hay JSONB) */}
        {match.result?.sets && match.result.sets.length > 0 && (
          <div className="w-full bg-navy-900 border border-navy-800 rounded-xl p-4 mt-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">Desglose de Sets</h3>
            <div className="flex flex-col gap-2">
              {match.result.sets.map((set, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm font-medium bg-navy-950/50 rounded-lg p-2 border border-navy-800/50">
                  <span className={set.team1_score > set.team2_score ? 'text-brand-400 font-bold' : 'text-slate-400'}>
                    {set.team1_score}
                  </span>
                  <span className="text-xs text-slate-500">Set {idx + 1}</span>
                  <span className={set.team2_score > set.team1_score ? 'text-brand-400 font-bold' : 'text-slate-400'}>
                    {set.team2_score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botón de Compartir */}
        <div className="w-full pt-4 border-t border-navy-800 flex justify-center">
          <ShareButton title={shareTitle} text={shareText} />
        </div>

      </main>
    </div>
  );
}
