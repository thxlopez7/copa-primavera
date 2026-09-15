/**
 * Domain-Driven Design: Classification Engine
 * Calcula las posiciones y estadísticas de una fase de grupos (Round Robin).
 */

export class ClassificationEngine {
  
  /**
   * Procesa una lista de partidos y devuelve la tabla de clasificación ordenada.
   * 
   * @param {Array} matches - Partidos de una categoría/grupo (con el jsonb `result`).
   * @param {Array} pairs - Todos los equipos involucrados en esos partidos.
   * @returns {Array} - Array ordenado de objetos de estadística.
   */
  static calculateStandings(matches, pairs) {
    const stats = {};
    
    // 1. Inicializar la tabla para cada equipo
    pairs.forEach(p => {
      stats[p.id] = {
        team_id: p.id,
        PJ: 0, // Partidos Jugados
        PG: 0, // Partidos Ganados
        PP: 0, // Partidos Perdidos
        SG: 0, // Sets Ganados
        SP: 0, // Sets Perdidos
        JG: 0, // Juegos Ganados
        JP: 0, // Juegos Perdidos
        PTS: 0 // Puntos (ej. 3 por victoria)
      };
    });

    // 2. Acumular métricas
    matches.forEach(m => {
      // Ignorar partidos no finalizados o sin resultado válido
      if (m.status !== 'completed' && m.status !== 'Finalizado') return;
      if (!m.result || !m.result.winner_id) return;
      
      const t1 = m.team1_id;
      const t2 = m.team2_id;
      
      if (!t1 || !t2) return;
      if (!stats[t1] || !stats[t2]) return;

      const res = m.result;

      // Incrementar Partidos Jugados
      stats[t1].PJ++;
      stats[t2].PJ++;

      // Caso Walkover (W.O.)
      if (res.is_walkover) {
        if (res.winner_id === t1) {
          stats[t1].PG++;
          stats[t1].PTS += 3; // 3 ptos por victoria
          stats[t1].SG += 2;  // W.O. cuenta como ganar 2 sets a 0
          stats[t2].PP++;
          stats[t2].SP += 2;
        } else if (res.winner_id === t2) {
          stats[t2].PG++;
          stats[t2].PTS += 3;
          stats[t2].SG += 2;
          stats[t1].PP++;
          stats[t1].SP += 2;
        }
        return; // Fin del procesamiento de W.O.
      }

      // Caso Partido Normal: Contar sets y juegos
      let t1Sets = 0;
      let t2Sets = 0;
      let t1Games = 0;
      let t2Games = 0;

      if (res.sets && Array.isArray(res.sets)) {
        res.sets.forEach(s => {
          const s1 = parseInt(s.team1_score) || 0;
          const s2 = parseInt(s.team2_score) || 0;
          
          t1Games += s1;
          t2Games += s2;
          
          if (s1 > s2) t1Sets++;
          else if (s2 > s1) t2Sets++;
        });
      }

      stats[t1].SG += t1Sets;
      stats[t1].SP += t2Sets;
      stats[t1].JG += t1Games;
      stats[t1].JP += t2Games;

      stats[t2].SG += t2Sets;
      stats[t2].SP += t1Sets;
      stats[t2].JG += t2Games;
      stats[t2].JP += t1Games;

      // Determinar ganador para Puntos y PG/PP
      if (res.winner_id === t1 || t1Sets > t2Sets) {
        stats[t1].PG++;
        stats[t1].PTS += 3;
        stats[t2].PP++;
      } else if (res.winner_id === t2 || t2Sets > t1Sets) {
        stats[t2].PG++;
        stats[t2].PTS += 3;
        stats[t1].PP++;
      }
    });

    // 3. Ordenar (Tie-breaker system)
    return Object.values(stats).sort((a, b) => {
      // 1° Criterio: Puntos Totales
      if (b.PTS !== a.PTS) return b.PTS - a.PTS;
      
      // 2° Criterio: Diferencia de Sets
      const diffSetsA = a.SG - a.SP;
      const diffSetsB = b.SG - b.SP;
      if (diffSetsB !== diffSetsA) return diffSetsB - diffSetsA;
      
      // 3° Criterio: Diferencia de Juegos
      const diffGamesA = a.JG - a.JP;
      const diffGamesB = b.JG - b.JP;
      return diffGamesB - diffGamesA;
    });
  }
}
