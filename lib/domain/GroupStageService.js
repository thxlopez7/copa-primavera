import { MatchEngine } from "./MatchEngine";

/**
 * Domain-Driven Design: Group Stage Service
 * Servicio puro de dominio para generar calendarios de Fase de Zonas.
 */

export class GroupStageService {
  
  /**
   * Genera los partidos (todos contra todos) para un conjunto de equipos en una zona.
   * Determinista, basado en el orden del array (sin math.random).
   */
  static generateRoundRobin(pairs, categoryId, groupName = "A") {
    if (!pairs || pairs.length < 2) {
      throw new Error("Se necesitan al menos 2 equipos para armar una zona.");
    }

    const matches = [];
    let matchCount = 1;

    for (let i = 0; i < pairs.length; i++) {
      for (let j = i + 1; j < pairs.length; j++) {
        matches.push({
          id: crypto.randomUUID(),
          category_id: categoryId,
          team1_id: pairs[i].id || pairs[i],
          team2_id: pairs[j].id || pairs[j],
          phase: 'group_stage',
          status: 'scheduled',
          round_name: 'Fase de Grupos',
          result: {
            ...MatchEngine.createEmptyResult(),
            group_name: groupName
          },
          next_match_id: null,
          next_match_slot: null,
          scheduled_at: null,
          court: null
        });
        matchCount++;
      }
    }

    return matches;
  }

  /**
   * Calcula la tabla de posiciones (Standings) determinista de un grupo basándose en los partidos.
   */
  static getQualifiedTeams(matches, pairs) {
    const statsMap = {};
    pairs.forEach(p => {
      const pid = p.id || p;
      statsMap[pid] = {
        id: pid,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        setsWon: 0,
        setsLost: 0,
        gamesWon: 0,
        gamesLost: 0,
        gamesDiff: 0
      };
    });

    matches.forEach(m => {
      if (MatchEngine.isCompleted(m.result, m.team1_id, m.team2_id) || m.status === 'completed' || m.status === 'Finalizado') {
        const team1 = m.team1_id;
        const team2 = m.team2_id;
        
        if (!statsMap[team1] || !statsMap[team2]) return;
        
        statsMap[team1].matchesPlayed++;
        statsMap[team2].matchesPlayed++;

        const winnerId = MatchEngine.calculateWinner(m.result, team1, team2);

        if (winnerId === team1) {
          statsMap[team1].matchesWon++;
          statsMap[team2].matchesLost++;
        } else if (winnerId === team2) {
          statsMap[team2].matchesWon++;
          statsMap[team1].matchesLost++;
        }

        const t1Stats = MatchEngine.getStatsForTeam(m.result, team1, team1, team2);
        const t2Stats = MatchEngine.getStatsForTeam(m.result, team2, team1, team2);

        statsMap[team1].setsWon += t1Stats.setsWon;
        statsMap[team1].setsLost += t1Stats.setsLost;
        statsMap[team1].gamesWon += t1Stats.gamesWon;
        statsMap[team1].gamesLost += t1Stats.gamesLost;
        statsMap[team1].gamesDiff += (t1Stats.gamesWon - t1Stats.gamesLost);

        statsMap[team2].setsWon += t2Stats.setsWon;
        statsMap[team2].setsLost += t2Stats.setsLost;
        statsMap[team2].gamesWon += t2Stats.gamesWon;
        statsMap[team2].gamesLost += t2Stats.gamesLost;
        statsMap[team2].gamesDiff += (t2Stats.gamesWon - t2Stats.gamesLost);
      }
    });

    const standings = Object.values(statsMap);
    standings.sort((a, b) => {
      if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon; // 1. Partidos ganados
      
      // 2. Enfrentamiento directo (Head-to-Head)
      const headToHeadMatch = matches.find(m => 
        (m.team1_id === a.id && m.team2_id === b.id) || 
        (m.team1_id === b.id && m.team2_id === a.id)
      );
      if (headToHeadMatch && MatchEngine.isCompleted(headToHeadMatch.result, headToHeadMatch.team1_id, headToHeadMatch.team2_id)) {
        const winner = MatchEngine.calculateWinner(headToHeadMatch.result, headToHeadMatch.team1_id, headToHeadMatch.team2_id);
        if (winner === a.id) return -1;
        if (winner === b.id) return 1;
      }

      const diffSetsA = a.setsWon - a.setsLost;
      const diffSetsB = b.setsWon - b.setsLost;
      if (diffSetsB !== diffSetsA) return diffSetsB - diffSetsA; // 2. Diferencia de sets
      
      if (b.gamesDiff !== a.gamesDiff) return b.gamesDiff - a.gamesDiff; // 3. Diferencia de games
      
      // Fallback determinista (ID string comparison) para evitar aleatoriedad pura en empate absoluto
      return a.id.localeCompare(b.id);
    });

    return standings;
  }
}
