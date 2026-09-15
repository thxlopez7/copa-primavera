/**
 * Domain-Driven Design: Match Engine
 * Responsable de las reglas matemáticas de un partido individual.
 * Ya no interactúa con React ni con Supabase directamente.
 */

export class MatchEngine {
  
  /**
   * Retorna la estructura JSONB por defecto para un partido nuevo.
   */
  static createEmptyResult() {
    return {
      sets: [],
      winner_id: null,
      is_walkover: false
    };
  }

  /**
   * Retorna una estructura JSONB que representa un Walkover (W.O.).
   */
  static processWalkover(winnerId) {
    return {
      sets: [],
      winner_id: winnerId,
      is_walkover: true
    };
  }

  /**
   * Determina quién ganó el partido en base a los sets jugados.
   * Regla: El primero en ganar 2 sets gana el partido.
   * 
   * @param {Object} result - El objeto JSONB de resultados (debe contener 'sets').
   * @param {string} team1Id - ID del Equipo 1.
   * @param {string} team2Id - ID del Equipo 2.
   * @returns {string|null} - Devuelve el teamId del ganador, o null si no hay ganador claro aún.
   */
  static calculateWinner(result, team1Id, team2Id) {
    if (!result) return null;

    if (result.is_walkover) {
      return result.winner_id;
    }

    if (!result.sets || !Array.isArray(result.sets) || result.sets.length === 0) {
      return null;
    }

    let t1Sets = 0;
    let t2Sets = 0;

    for (const set of result.sets) {
      const s1 = parseInt(set.team1_score) || 0;
      const s2 = parseInt(set.team2_score) || 0;

      // Evalúa al ganador del set. Para una lógica de pádel exacta se podría expandir (ej. tiebreaks)
      if (s1 > s2) {
        t1Sets++;
      } else if (s2 > s1) {
        t2Sets++;
      }
    }

    // Regla: Mejor de 3 sets (el primero en ganar 2)
    if (t1Sets >= 2) return team1Id;
    if (t2Sets >= 2) return team2Id;

    return null;
  }
}
