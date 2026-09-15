import { supabase } from "@/lib/supabase";
import { getCategoryClassification } from "@/lib/actions/classification.actions";
import CategorySelector from "@/components/CategorySelector";
import ClassificationTable from "@/components/ClassificationTable";

export const revalidate = 0;

const slugify = (text) => 
  text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w-]+/g, '');

export default async function ClasificacionPage({ searchParams }) {
  const catSlug = decodeURIComponent(searchParams?.cat || "");

  // 1. Obtener categorías para el selector
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (catError) {
    return <div className="p-8 text-white bg-red-500/10 text-center">Error cargando categorías.</div>;
  }

  let standings = null;
  let currentCategory = null;

  // 2. Si hay un query param, calculamos la tabla
  if (catSlug && categories) {
    currentCategory = categories.find(c => slugify(c.name) === catSlug);
    
    if (currentCategory) {
      // Usar la Server Action pura orquestada en la fase anterior
      const response = await getCategoryClassification(currentCategory.id);
      
      if (response.success) {
        // Enriquecer el array resultante con los nombres de los equipos para el componente Dumb
        // Para esto necesitamos buscar los nombres de la tabla 'pairs' o los pasamos directamente
        // ya que el Action internamente fetchea `pairs`. 
        // Modifiquemos un poco el mapeo aquí o asumimos que ClassificationTable necesita nombres:
        const { data: pairs } = await supabase.from('pairs').select('id, player1_name, player2_name, name').eq('category_id', currentCategory.id);
        
        standings = response.data.map(stat => {
          const pair = pairs?.find(p => p.id === stat.team_id);
          let teamName = "Equipo";
          if (pair) {
             if (pair.player1_name && pair.player2_name) {
               teamName = `${pair.player1_name} / ${pair.player2_name}`;
             } else {
               teamName = pair.name || "Equipo";
             }
          }
          return { ...stat, teamName };
        });
      }
    }
  }

  return (
    <div className="min-h-screen bg-navy-950 font-sans text-slate-300 flex flex-col">
      {/* Cabecera */}
      <div className="bg-navy-900 border-b border-navy-800 pt-16 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-xl bg-navy-800 border border-navy-700 text-brand-500 flex items-center justify-center font-black">
              <i className="fa-solid fa-list-ol"></i>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Clasificación {currentCategory ? <span className="text-brand-500">— {currentCategory.name}</span> : ""}
            </h1>
          </div>
          <p className="text-slate-400 font-medium mb-6 text-center md:text-left text-sm max-w-2xl">
            Sigue de cerca las posiciones de la fase de grupos. Los primeros puestos avanzan a la llave eliminatoria.
          </p>

          <CategorySelector categories={categories} basePath="?cat=" />
        </div>
      </div>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {!catSlug ? (
          <div className="text-center bg-navy-900/50 border border-navy-800 rounded-3xl p-12 max-w-lg mx-auto">
            <div className="w-16 h-16 bg-navy-950 rounded-full flex items-center justify-center border border-navy-800 mx-auto text-brand-500/50 mb-6 text-2xl">
              <i className="fa-solid fa-hand-pointer animate-bounce"></i>
            </div>
            <h2 className="text-white font-bold text-xl mb-2">Selecciona una Categoría</h2>
            <p className="text-slate-400 text-sm">
              Elige una categoría en el menú superior para ver su tabla de posiciones actualizada en tiempo real.
            </p>
          </div>
        ) : (
          <ClassificationTable standings={standings} />
        )}
      </main>
    </div>
  );
}
