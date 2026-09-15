import { supabase } from "@/lib/supabase";
import TournamentWizard from "@/components/admin/TournamentWizard";

export const revalidate = 0;

export default async function AdminTorneoPage() {
  // 1. Fetching masivo concurrente de entidades necesarias para el Wizard
  const [
    { data: categories },
    { data: pairs }
  ] = await Promise.all([
    supabase.from('categories').select('*').order('name'),
    supabase.from('pairs').select('id, category_id, player1:player1_id(first_name, last_name), player2:player2_id(first_name, last_name)')
  ]);

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      <div className="mb-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-navy-950 flex items-center justify-center font-black shadow-lg shadow-brand-500/20 mx-auto mb-4 text-3xl">
          <i className="fa-solid fa-wand-magic-sparkles"></i>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Generador de Torneos</h1>
        <p className="text-slate-400 font-medium max-w-2xl mx-auto mt-2">
          Usa este asistente para generar automáticamente las fases de grupos o llaves eliminatorias de las distintas categorías. Toda modificación impactará directamente en la base de datos de Supabase.
        </p>
      </div>

      {/* El Wizard (Client Component) recibe todo ya fetcheado y parseado para no interrumpir la UX */}
      <TournamentWizard 
        categories={categories || []} 
        allPairs={pairs || []} 
      />

    </div>
  );
}
