import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import AdminMatchListClient from "@/components/admin/AdminMatchListClient";

export const revalidate = 0; // Evitar caché estático para el panel de administración

export default async function ResultadosAdmin() {
  // Fetch masivo de los datos en el servidor
  const [
    { data: catData }, 
    { data: pairsData }, 
    { data: matchesData }
  ] = await Promise.all([
    supabase.from('categories').select('*').order('name'),
    supabase.from('pairs').select('*, player1:player1_id(*), player2:player2_id(*)'),
    supabase.from('matches').select('*')
  ]);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <Suspense fallback={
        <div className="p-10 flex justify-center items-center h-full">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <AdminMatchListClient 
          initialCategories={catData || []} 
          initialPairs={pairsData || []} 
          initialMatches={matchesData || []} 
        />
      </Suspense>
    </div>
  );
}
