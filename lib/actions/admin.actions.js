"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

/**
 * Crea una nueva categoría en el torneo.
 */
export async function createCategory(name, tournamentId = null) {
  try {
    const payload = { name };
    if (tournamentId) payload.tournament_id = tournamentId;

    const { data, error } = await supabase
      .from('categories')
      .insert(payload)
      .select()
      .single();

    if (error) throw new Error(error.message);

    revalidatePath('/admin/categorias');
    return { success: true, data };
  } catch (error) {
    console.error("[createCategory] Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Inscribe una nueva Pareja de forma transaccional.
 * Primero crea/registra a los jugadores, luego genera la pareja.
 * 
 * @param {Object} player1Data - Ej: { first_name, last_name, dni, email }
 * @param {Object} player2Data - Ej: { first_name, last_name, dni, email }
 * @param {string} categoryId - UUID de la categoría
 */
export async function createPair(player1Data, player2Data, categoryId) {
  try {
    // 1. Insertar o recuperar al Jugador 1
    // Si la DB tiene constraint Unique en DNI/Email, hacer upsert() requeriría ese campo.
    // Aquí hacemos un insert directo asumiendo un flujo estándar, o devolverá el creado.
    const { data: p1, error: err1 } = await supabase
      .from('players')
      .insert(player1Data)
      .select('id')
      .single();

    if (err1) throw new Error(`Error al registrar Jugador 1: ${err1.message}`);

    // 2. Insertar o recuperar al Jugador 2
    const { data: p2, error: err2 } = await supabase
      .from('players')
      .insert(player2Data)
      .select('id')
      .single();

    if (err2) {
      // Rollback manual de Jugador 1 si Jugador 2 falla (emulación de transacción)
      await supabase.from('players').delete().eq('id', p1.id);
      throw new Error(`Error al registrar Jugador 2: ${err2.message}`);
    }

    const { data: pair, error: errPair } = await supabase
      .from('pairs')
      .insert({
        category_id: categoryId,
        player1_id: p1.id,
        player2_id: p2.id
      })
      .select('id')
      .single();

    if (errPair) {
      // Rollback manual (compensación)
      await supabase.from('players').delete().in('id', [p1.id, p2.id]);
      throw new Error(`Error al registrar la pareja: ${errPair.message}`);
    }

    // 4. Revalidar la caché de la ruta de administración para reflejar el cambio al instante
    revalidatePath('/admin/parejas');
    
    return { success: true, data: pair };
  } catch (error) {
    console.error("[createPair] Error Transaccional:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Elimina una categoría.
 * Captura el error si hay partidos o parejas dependiendo de esta categoría.
 */
export async function deleteCategory(categoryId) {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      if (error.code === '23503') { // Violación de llave foránea en Postgres
        throw new Error("No se puede eliminar la categoría porque tiene parejas o partidos asociados.");
      }
      throw new Error(`Error al eliminar categoría: ${error.message}`);
    }

    revalidatePath('/admin/categorias');
    return { success: true };
  } catch (error) {
    console.error("[deleteCategory] Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Elimina una pareja.
 * Captura el error si la pareja ya está asignada a algún partido.
 */
export async function deletePair(pairId) {
  try {
    // 1. Obtener la pareja para saber qué jugadores borrar (opcional, pero buena limpieza)
    const { data: pair, error: pairError } = await supabase
      .from('pairs')
      .select('player1_id, player2_id')
      .eq('id', pairId)
      .single();

    if (pairError) throw new Error(`Pareja no encontrada: ${pairError.message}`);

    // 2. Eliminar la pareja
    const { error: deleteError } = await supabase
      .from('pairs')
      .delete()
      .eq('id', pairId);

    if (deleteError) {
      if (deleteError.code === '23503') {
        throw new Error("No se puede eliminar la pareja porque ya está participando en un partido programado.");
      }
      throw new Error(`Error al eliminar pareja: ${deleteError.message}`);
    }

    // 3. Limpieza: Eliminar a los jugadores (Opcional, pero recomendado si solo juegan en parejas)
    if (pair.player1_id) await supabase.from('players').delete().eq('id', pair.player1_id);
    if (pair.player2_id) await supabase.from('players').delete().eq('id', pair.player2_id);

    revalidatePath('/admin/parejas');
    return { success: true };
  } catch (error) {
    console.error("[deletePair] Error:", error);
    return { success: false, error: error.message };
  }
}
