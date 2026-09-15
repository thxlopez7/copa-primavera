import { supabase } from "@/lib/supabase";
import CategorySelector from "@/components/CategorySelector";
import MatchCard from "@/components/MatchCard";
import Bracket from "@/components/Bracket";
import { notFound } from "next/navigation";

export const revalidate = 0;

// Utilidad local para emular el slugify de base de datos de forma segura (sin acentos)
const slugify = (text) => 
  text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w-]+/g, '');

export default async function CategoryFixturePage({ params }) {
  // 1. Obtener todas las categorías para construir el selector y buscar el slug actual
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (catError) {
    return <div className="p-8 text-white bg-red-500/10">Error de conexión: {catError.message}</div>;
  }

  // Next.js >= 15 (o Server Components asíncronos en Next 14) recomiendan await params
  const resolvedParams = await params;

  // 2. Buscar la categoría actual basándose en el slug de la URL decodificado
  const decodedCategoryParam = decodeURIComponent(resolvedParams.category || "");
  const currentCategory = categories?.find(c => slugify(c.name) === decodedCategoryParam);

  if (!currentCategory) {
    notFound(); // 404 dinámico si no existe la categoría
  }

  // 3. Obtener los partidos de esta categoría, trayendo la información de los equipos (pairs) anidada
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select(`
      *,
      team1:team1_id(id, player1:player1_id(first_name, last_name), player2:player2_id(first_name, last_name)),
      team2:team2_id(id, player1:player1_id(first_name, last_name), player2:player2_id(first_name, last_name))
    `)
    .eq('category_id', currentCategory.id);

  if (matchesError) {
    console.error("Error fetching matches:", matchesError);
  }

  // 4. Separar por fases para su renderizado
  const groupMatches = matches?.filter(m => m.match_type === 'group_stage') || [];
  const knockoutMatches = matches?.filter(m => m.match_type === 'knockout') || [];

  return (
    <div className="min-h-screen bg-navy-950 font-sans text-slate-300 flex flex-col">
      {/* Cabecera unificada */}
      <div className="bg-navy-900 border-b border-navy-800 pt-16 pb-6 px-4 sm:px-6 lg:px-8 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight mb-6">
            Fixture <span className="text-brand-500">— {currentCategory.name}</span>
          </h1>
          
          <CategorySelector categories={categories} />
        </div>
      </div>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
        
        {(!matches || matches.length === 0) ? (
          <div className="bg-navy-900/50 border border-navy-800 rounded-3xl p-16 text-center max-w-2xl mx-auto mt-10">
            <div className="w-16 h-16 bg-navy-950 rounded-full flex items-center justify-center border border-navy-800 mx-auto text-slate-600 mb-6 text-3xl">
              <i className="fa-regular fa-calendar-xmark"></i>
            </div>
            <h2 className="text-white font-bold text-xl mb-2">Aún no hay partidos programados</h2>
            <p className="text-slate-400 text-sm">
              La organización todavía no ha generado los cruces ni los cuadros eliminatorios para la categoría <strong className="text-brand-400">{currentCategory.name}</strong>.
            </p>
          </div>
        ) : (
          <>
            {/* Sección: Fase de Grupos */}
            {groupMatches.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 rounded-lg bg-navy-800 border border-navy-700 flex items-center justify-center text-brand-500">
                    <i className="fa-solid fa-layer-group"></i>
                  </div>
                  <h2 className="text-2xl font-black text-white">Fase de Grupos</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupMatches.map(match => (
                    <MatchCard key={match.id} match={{...match, category_name: currentCategory.name}} />
                  ))}
                </div>
              </section>
            )}

            {/* Sección: Fase Eliminatoria (Bracket) */}
            {knockoutMatches.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 rounded-lg bg-navy-800 border border-navy-700 flex items-center justify-center text-brand-500">
                    <i className="fa-solid fa-sitemap"></i>
                  </div>
                  <h2 className="text-2xl font-black text-white">Cuadro Eliminatorio</h2>
                </div>
                
                {/* Pre-procesamos category_name porque el Bracket le pasa el match entero a MatchCard */}
                <Bracket matches={knockoutMatches.map(m => ({...m, category_name: currentCategory.name}))} />
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
