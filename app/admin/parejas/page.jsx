import { supabase } from "@/lib/supabase";
import PairForm from "@/components/admin/PairForm";

export const revalidate = 0;

export default async function AdminParejasPage() {
  // 1. Fetch de categorías para el formulario
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name');

  // 2. Fetch relacional de Parejas cruzando Jugadores y Categorías
  const { data: pairs, error } = await supabase
    .from('pairs')
    .select(`
      *,
      category:categories(name),
      player1:player1_id(*),
      player2:player2_id(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return <div className="text-red-500 font-bold">Error cargando parejas: {error.message}</div>;
  }

  // Utilidad para extraer el nombre seguro de la tupla relacional
  const renderPairName = (pair) => {
    const p1 = pair.player1;
    const p2 = pair.player2;
    
    if (p1 && p2) {
      return (
        <span>
          {p1.first_name} {p1.last_name} <span className="text-slate-500 font-normal">/</span> {p2.first_name} {p2.last_name}
        </span>
      );
    }
    return <span className="text-slate-500 italic">Jugadores no asignados</span>;
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight">Parejas Inscritas</h1>
        <p className="text-slate-400 font-medium">Registra los equipos para la competición.</p>
      </div>

      {/* Componente Cliente para Inscribir (Formulario Complejo) */}
      <PairForm categories={categories || []} />

      {/* Tabla Servidor para Listar */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl overflow-hidden shadow-lg">
        {pairs && pairs.length > 0 ? (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-navy-950/80 text-slate-400 border-b border-navy-800">
                <tr>
                  <th className="px-6 py-4 font-bold min-w-[250px]">PAREJA</th>
                  <th className="px-6 py-4 font-bold">CATEGORÍA</th>
                  <th className="px-6 py-4 font-bold text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/50">
                {pairs.map((pair) => (
                  <tr key={pair.id} className="hover:bg-navy-800/50 transition-colors">
                    <td className="px-6 py-4 text-white font-bold">
                      {renderPairName(pair)}
                    </td>
                    <td className="px-6 py-4 text-brand-400 font-bold text-xs uppercase tracking-wider">
                      {pair.category?.name || "Sin Categoría"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button disabled className="text-slate-500 hover:text-red-400 transition-colors" title="Eliminar (Pronto)">
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            No hay parejas registradas en el torneo.
          </div>
        )}
      </div>
    </div>
  );
}
