import { supabase } from "@/lib/supabase";
import CategoryForm from "@/components/admin/CategoryForm";
import DeleteCategoryButton from "@/components/admin/DeleteCategoryButton";

export const revalidate = 0; // Para que el revalidatePath funcione impecable sin caché rancia

export default async function AdminCategoriasPage() {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    return <div className="text-red-500 font-bold">Error cargando categorías: {error.message}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight">Categorías</h1>
        <p className="text-slate-400 font-medium">Gestiona las divisiones del torneo.</p>
      </div>

      {/* Componente Cliente para Crear */}
      <CategoryForm />

      {/* Tabla Servidor para Listar */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl overflow-hidden shadow-lg">
        {categories && categories.length > 0 ? (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-navy-950/80 text-slate-400 border-b border-navy-800">
              <tr>
                <th className="px-6 py-4 font-black">ID</th>
                <th className="px-6 py-4 font-bold">NOMBRE DE LA CATEGORÍA</th>
                <th className="px-6 py-4 font-bold text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800/50">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-navy-800/50 transition-colors">
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">{cat.id.split('-')[0]}...</td>
                  <td className="px-6 py-4 text-white font-bold">{cat.name}</td>
                  <td className="px-6 py-4 text-right">
                    <DeleteCategoryButton categoryId={cat.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-slate-400">
            No hay categorías registradas. Comienza creando una.
          </div>
        )}
      </div>
    </div>
  );
}
