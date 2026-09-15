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
