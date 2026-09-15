"use server";

import { supabase } from "@/lib/supabase";
import { ClassificationEngine } from "@/lib/domain/ClassificationEngine";

/**
 * Obtiene y calcula la tabla de clasificación para la fase de grupos de una categoría.
 * 
 * @param {string} categoryId - UUID de la categoría
 * @returns {Array} - Tabla de posiciones ordenada
 */
export async function getCategoryClassification(categoryId) {
  try {
    // 1. Fetch de los partidos de Fase de Grupos
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .eq('category_id', categoryId)
      .eq('phase', 'group_stage');

    if (matchesError) {
      throw new Error(`Error al obtener partidos: ${matchesError.message}`);
    }

    // 2. Fetch de todas las parejas (equipos) de la categoría para inicializar la tabla
    const { data: pairs, error: pairsError } = await supabase
      .from('pairs')
      .select('*')
      .eq('category_id', categoryId);

    if (pairsError) {
      throw new Error(`Error al obtener parejas: ${pairsError.message}`);
    }

    // 3. Orquestar el cálculo puro en el motor de dominio
    const standings = ClassificationEngine.calculateStandings(matches || [], pairs || []);

    return { success: true, data: standings };
  } catch (error) {
    console.error("[getCategoryClassification] Error:", error);
    return { success: false, error: error.message };
  }
}
