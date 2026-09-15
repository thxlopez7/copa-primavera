import { supabase } from "@/lib/supabase";
import CategorySelector from "@/components/CategorySelector";

export const revalidate = 0; // Para efectos de esta demo, evitar caché stale excesivo

export default async function FixturePage() {
  // SSR Data Fetching puro
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    return (
      <div className="p-8 text-center bg-navy-950 min-h-screen flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl">
          <p className="font-bold">Error cargando categorías</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 font-sans text-slate-300 flex flex-col">
      {/* Hero Section */}
      <div className="bg-navy-900 border-b border-navy-800 pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4 justify-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-navy-950 flex items-center justify-center font-black shadow-lg shadow-brand-500/20">
              <i className="fa-solid fa-trophy text-2xl"></i>
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight text-center mb-4">
            Fixture del Torneo
          </h1>
          <p className="text-slate-400 font-medium text-center max-w-2xl mx-auto mb-10">
            Sigue de cerca los cruces, fases de grupos y cuadros eliminatorios de todas las categorías en juego. Selecciona tu categoría para comenzar.
          </p>

          <CategorySelector categories={categories || []} />
        </div>
      </div>

      {/* Main Content Area (Empty State) */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center">
        <div className="text-center bg-navy-900/50 border border-navy-800 rounded-3xl p-12 max-w-lg w-full">
          <div className="w-16 h-16 bg-navy-950 rounded-full flex items-center justify-center border border-navy-800 mx-auto text-brand-500/50 mb-6 text-2xl">
            <i className="fa-solid fa-hand-pointer animate-bounce"></i>
          </div>
          <h2 className="text-white font-bold text-xl mb-2">Selecciona una Categoría</h2>
          <p className="text-slate-400 text-sm">
            Navega por las pestañas superiores para ver el estado actual, partidos programados y cruces eliminatorios.
          </p>
        </div>
      </main>
    </div>
  );
}
