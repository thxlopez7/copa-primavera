/**
 * Domain-Driven Design: Match Engine
 * Responsable de las reglas matemáticas de un partido individual.
 * Contrato oficial para matches.result
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
    if (!winnerId) throw new Error("Se requiere un winnerId para procesar un W.O.");
    return {
      sets: [],
      winner_id: winnerId,
      is_walkover: true
    };
  }

  /**
   * Valida un resultado para asegurar que los scores son números y el formato es el correcto.
   * Modifica el resultado in-place para sanitizarlo.
   */
  static validateResult(result, team1Id, team2Id) {
    if (!result) return this.createEmptyResult();
    
    if (result.is_walkover) {
      if (!result.winner_id || (result.winner_id !== team1Id && result.winner_id !== team2Id)) {
        throw new Error("W.O. inválido: el ganador no pertenece a este partido.");
      }
      return result;
    }

    if (result.sets) {
      result.sets = result.sets.map(set => ({
        team1_score: parseInt(set.team1_score) || 0,
        team2_score: parseInt(set.team2_score) || 0
      }));
    } else {
      result.sets = [];
    }
    
    return result;
  }

  /**
   * Determina quién ganó el partido en base a los sets jugados.
   * Regla: El primero en ganar 2 sets gana el partido (Mejor de 3).
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

      if (s1 > s2) {
        t1Sets++;
      } else if (s2 > s1) {
        t2Sets++;
      }
    }

    if (t1Sets >= 2) return team1Id;
    if (t2Sets >= 2) return team2Id;

    return null;
  }

  /**
   * Evalúa si un resultado indica que el partido terminó.
   */
  static isCompleted(result, team1Id, team2Id) {
    return this.calculateWinner(result, team1Id, team2Id) !== null;
  }

  /**
   * Obtiene estadísticas de sets y games para un equipo (team1 o team2).
   * @param {Object} result - El objeto JSONB de resultados.
   * @param {boolean} isTeam1 - true si queremos estadísticas de team1_id, false si queremos de team2_id.
   * @returns {Object} { setsWon, setsLost, gamesWon, gamesLost }
   */
  static getStatistics(result, isTeam1) {
    let setsWon = 0;
    let setsLost = 0;
    let gamesWon = 0;
    let gamesLost = 0;

    if (!result) return { setsWon, setsLost, gamesWon, gamesLost };

    if (result.is_walkover) {
      // Regla común: W.O. cuenta como victoria 2-0 (y 12-0 en games) o simplemente victoria sin games.
      // Implementaremos +2 sets a favor del ganador, -2 para el perdedor.
      const isWinner = (isTeam1 && result.winner_id) ? true : (!isTeam1 && result.winner_id) ? true : false; 
      // Need a better check. Wait, we don't know the IDs here, just if it's team1 or team2 slot.
      // But winner_id is a UUID. If we don't have the UUID, how do we know if team1 won?
      // W.O. result should ideally tell us if team1 or team2 won, but it only stores winner_id.
      // To keep MatchEngine pure, we need to pass team1Id and team2Id.
      throw new Error("getStatistics debe recibir team1Id y team2Id para resolver W.O.");
    }

    if (!result.sets) return { setsWon, setsLost, gamesWon, gamesLost };

    for (const set of result.sets) {
      const s1 = parseInt(set.team1_score) || 0;
      const s2 = parseInt(set.team2_score) || 0;

      const myScore = isTeam1 ? s1 : s2;
      const theirScore = isTeam1 ? s2 : s1;

      gamesWon += myScore;
      gamesLost += theirScore;

      if (myScore > theirScore) {
        setsWon++;
      } else if (theirScore > myScore) {
        setsLost++;
      }
    }

    return { setsWon, setsLost, gamesWon, gamesLost };
  }

  /**
   * Obtiene estadísticas completas para un equipo.
   */
  static getStatsForTeam(result, targetTeamId, team1Id, team2Id) {
    if (!result) return { setsWon: 0, setsLost: 0, gamesWon: 0, gamesLost: 0 };
    
    if (result.is_walkover) {
      if (result.winner_id === targetTeamId) {
        return { setsWon: 2, setsLost: 0, gamesWon: 12, gamesLost: 0 };
      } else if (result.winner_id) {
        return { setsWon: 0, setsLost: 2, gamesWon: 0, gamesLost: 12 };
      }
      return { setsWon: 0, setsLost: 0, gamesWon: 0, gamesLost: 0 };
    }

    const isTeam1 = (targetTeamId === team1Id);
    return this.getStatistics(result, isTeam1);
  }
}
