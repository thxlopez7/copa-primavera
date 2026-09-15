import { MatchEngine } from "./MatchEngine";

/**
 * Domain-Driven Design: Group Stage Service
 * Servicio puro de dominio para generar calendarios de Fase de Zonas.
 */

export class GroupStageService {
  
  /**
   * Genera los partidos (todos contra todos) para un conjunto de equipos en una zona.
   * Evita duplicados y devuelve objetos listos para inserción en DB.
   * 
   * @param {Array} pairs - Lista de objetos representando equipos (con propiedad `id`).
   * @param {string} categoryId - UUID de la categoría a la que pertenece el grupo.
   * @param {string} groupName - Nombre o letra identificadora del grupo (ej. "A", "1").
   * @returns {Array} - Lista de partidos estructurados listos para insertar.
   */
  static generateRoundRobin(pairs, categoryId, groupName = "A") {
    if (!pairs || pairs.length < 2) {
      throw new Error("Se necesitan al menos 2 equipos para armar una zona.");
    }

    const matches = [];
    let matchCount = 1;

    // Generar combinaciones únicas (Round Robin de una sola vuelta)
    for (let i = 0; i < pairs.length; i++) {
      for (let j = i + 1; j < pairs.length; j++) {
        matches.push({
          id: crypto.randomUUID(), // ID temporal (ideal si la UI necesita key única antes de persistir)
          category_id: categoryId,
          team1_id: pairs[i].id,
          team2_id: pairs[j].id,
          phase: 'group_stage',
          status: 'scheduled',
          round_name: 'Fase de Grupos', // Guardamos como Fase de Grupos
          result: {
            ...MatchEngine.createEmptyResult(),
            group_name: groupName // Guardamos el nombre de la zona en el JSONB metadata
          },
          scheduled_at: null,
          court: null
        });
        matchCount++;
      }
    }

    return matches;
  }

  /**
   * Calcula la tabla de posiciones (Standings) de un grupo basándose en los partidos.
   * @param {Array} matches - Los partidos jugados en el grupo
   * @param {Array} pairs - Las parejas que participan en el grupo
   */
  static getQualifiedTeams(matches, pairs) {
    // Inicializar stats
    const statsMap = {};
    pairs.forEach(p => {
      statsMap[p.id] = {
        id: p.id,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        setsWon: 0,
        setsLost: 0,
        gamesDiff: 0
      };
    });

    // Calcular stats
    matches.forEach(m => {
      if (m.status === 'completed' || m.status === 'Finalizado') {
        const team1 = m.team1_id;
        const team2 = m.team2_id;
        
        // Si no existen en el mapa, ignorarlos (podría pasar si filtraron mal)
        if (!statsMap[team1] || !statsMap[team2]) return;
        
        statsMap[team1].matchesPlayed++;
        statsMap[team2].matchesPlayed++;

        // Ganador
        if (m.winner_id === team1) {
          statsMap[team1].matchesWon++;
          statsMap[team2].matchesLost++;
        } else if (m.winner_id === team2) {
          statsMap[team2].matchesWon++;
          statsMap[team1].matchesLost++;
        }

        // Sets y Games (asumiendo que result.sets tiene la info de los sets)
        if (m.result && Array.isArray(m.result.sets)) {
          let t1Sets = 0;
          let t2Sets = 0;
          let t1Games = 0;
          let t2Games = 0;
          
          m.result.sets.forEach(set => {
            if (set.team1 > set.team2) t1Sets++;
            else if (set.team2 > set.team1) t2Sets++;
            
            t1Games += set.team1 || 0;
            t2Games += set.team2 || 0;
          });
          
          statsMap[team1].setsWon += t1Sets;
          statsMap[team1].setsLost += t2Sets;
          statsMap[team2].setsWon += t2Sets;
          statsMap[team2].setsLost += t1Sets;
          
          statsMap[team1].gamesDiff += (t1Games - t2Games);
          statsMap[team2].gamesDiff += (t2Games - t1Games);
        }
      }
    });

    // Convertir a array y ordenar
    const standings = Object.values(statsMap);
    standings.sort((a, b) => {
      // Criterios de desempate
      if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon; // 1. Partidos ganados
      const diffSetsA = a.setsWon - a.setsLost;
      const diffSetsB = b.setsWon - b.setsLost;
      if (diffSetsB !== diffSetsA) return diffSetsB - diffSetsA; // 2. Diferencia de sets
      if (b.gamesDiff !== a.gamesDiff) return b.gamesDiff - a.gamesDiff; // 3. Diferencia de games
      return 0; // Podría añadirse enfrentamiento directo
    });

    return standings;
  }
}
