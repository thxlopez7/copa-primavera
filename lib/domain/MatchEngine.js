import { supabase } from "@/lib/supabase";

/**
 * Motor Central de Resultados y Propagación
 */

export class MatchEngine {
  
  /**
   * Determina matemáticamente el ganador de un partido.
   * Retorna el team_id ganador, o null si no hay ganador claro.
   */
  static determineWinner(match, score1, score2) {
    if (!match.team1_id && !match.team2_id) return null;
    
    // W.O. Directo
    if (score1 === "W.O." && score2 === "-") return match.team1_id;
    if (score2 === "W.O." && score1 === "-") return match.team2_id;
    if (score1 === "W.O.") return match.team1_id; // Legacy support
    if (score2 === "W.O.") return match.team2_id;

    // Cálculo por Sets
    if (!score1 || !score2) return null;

    const s1 = score1.split(' ');
    const s2 = score2.split(' ');
    
    let t1Sets = 0;
    let t2Sets = 0;

    for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
      const g1 = parseInt(s1[i].split('-')[0]) || 0;
      const g2 = parseInt(s2[i].split('-')[0]) || 0;
      if (g1 > g2) t1Sets++;
      else if (g2 > g1) t2Sets++;
    }

    if (t1Sets > t2Sets) return match.team1_id;
    if (t2Sets > t1Sets) return match.team2_id;

    return null; // Empate o incompleto
  }

  /**
   * Propaga el ganador hacia el siguiente slot en el árbol usando la relación directa en DB.
   */
  static async propagateForward(match, winnerId, allMatchesContext = null) {
    if (!match.next_match_id) return; // Es la final, no hay propagación posterior

    let nextMatch = null;
    
    // Si tenemos el contexto (usado en la generación inicial de brackets) evitamos query
    if (allMatchesContext) {
      nextMatch = allMatchesContext.find(m => m.id === match.next_match_id);
    } else {
      const { data } = await supabase.from('matches').select('*').eq('id', match.next_match_id).single();
      nextMatch = data;
    }

    if (!nextMatch) return;

    const slotField = match.next_match_slot === 1 ? 'team1_id' : 'team2_id';
    const otherSlotField = match.next_match_slot === 1 ? 'team2_id' : 'team1_id';
    
    const updateData = { [slotField]: winnerId };
    
    // Si el siguiente partido ya tiene el otro rival, se pone Programado
    if (winnerId && nextMatch[otherSlotField]) {
      updateData.status = "Programado";
    } else {
      updateData.status = "Pendiente";
    }

    await supabase.from('matches').update(updateData).eq('id', nextMatch.id);
  }

  /**
   * Si un resultado se corrige o anula, limpiaremos recursivamente el árbol hacia adelante.
   */
  static async revertPropagation(match) {
    if (!match.next_match_id) return;

    const { data: nextMatch } = await supabase.from('matches').select('*').eq('id', match.next_match_id).single();
    if (!nextMatch) return;

    const slotField = match.next_match_slot === 1 ? 'team1_id' : 'team2_id';

    const updateData = { 
      [slotField]: null,
      status: "Pendiente" // Faltan equipos
    };

    // Si el nextMatch ya estaba Finalizado (o tenía un resultado parcial), debemos borrar su resultado y propagar la limpieza
    if (nextMatch.status === "Finalizado" || nextMatch.score_team1) {
      updateData.score_team1 = null;
      updateData.score_team2 = null;
      
      // Actualizamos primero para borrar a este nivel, antes de entrar en la recursión
      await supabase.from('matches').update(updateData).eq('id', nextMatch.id);
      
      // Recursión con el estado limpiado del nextMatch
      const cleanedNextMatch = { ...nextMatch, ...updateData };
      await this.revertPropagation(cleanedNextMatch);
    } else {
      // Si no estaba finalizado, solo limpiamos el slot vacío
      await supabase.from('matches').update(updateData).eq('id', nextMatch.id);
    }
  }
}
