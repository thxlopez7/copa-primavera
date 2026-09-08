import { supabase } from "@/lib/supabase";

/**
 * Servicio para gestionar la Fase de Zonas
 */

export class GroupStageService {
  
  /**
   * Genera grupos (zonas) y sus partidos (todos contra todos)
   * Se asume que el backend o admin decide cuántos grupos (por defecto 3 o 4 equipos por zona).
   */
  static async generateGroups(categoryId, pairs, teamsPerGroup = 3) {
    if (!pairs || pairs.length < 3) {
      alert("Se necesitan al menos 3 parejas para armar zonas.");
      return false;
    }

    try {
      // 1. Borrar partidos de zona anteriores
      const { error: deleteError } = await supabase
        .from('matches')
        .delete()
        .eq('category_id', categoryId)
        .like('round', 'GROUP_%');
      if (deleteError) throw deleteError;

      // 2. Dividir parejas en grupos
      const shuffled = [...pairs].sort(() => 0.5 - Math.random());
      const groups = [];
      while (shuffled.length) {
        groups.push(shuffled.splice(0, teamsPerGroup));
      }
      
      const newMatches = [];
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

      // 3. Crear partidos Todos contra Todos (Round Robin)
      groups.forEach((groupTeams, groupIndex) => {
        const groupName = alphabet[groupIndex] || `Z${groupIndex}`;
        let matchCount = 1;

        for (let i = 0; i < groupTeams.length; i++) {
          for (let j = i + 1; j < groupTeams.length; j++) {
            newMatches.push({
              category_id: categoryId,
              round: `GROUP_${groupName}_P${matchCount}`,
              team1_id: groupTeams[i].id,
              team2_id: groupTeams[j].id,
              status: "Programado",
              match_datetime: "A definir",
              court: "PP1"
            });
            matchCount++;
          }
        }
      });

      // 4. Insertar
      const { error: insertError } = await supabase.from('matches').insert(newMatches);
      if (insertError) throw insertError;

      return true;
    } catch (error) {
      console.error("Error generando Zonas:", error);
      alert("Error generando Zonas: " + error.message);
      return false;
    }
  }

  /**
   * Determina los clasificados de cada zona basado en los partidos.
   * Reglas básicas: Partidos ganados, luego diferencia de sets.
   */
  static getQualifiedTeams(groupMatches, teams) {
    // groupMatches: Partidos de fase de zonas ("GROUP_A_P1")
    // teams: Todos los equipos de la categoría
    
    const stats = {};
    teams.forEach(t => {
      stats[t.id] = { id: t.id, matchesWon: 0, matchesLost: 0, setsWon: 0, setsLost: 0 };
    });

    // Calcular estadísticas
    groupMatches.forEach(m => {
      if (m.status !== "Finalizado") return;
      
      let t1Sets = 0;
      let t2Sets = 0;
      
      if (m.score_team1 === "W.O.") {
        t1Sets = 2; // W.O. cuenta como 2 sets ganados
      } else if (m.score_team2 === "W.O.") {
        t2Sets = 2;
      } else if (m.score_team1 && m.score_team2) {
        const s1 = m.score_team1.split(' ');
        const s2 = m.score_team2.split(' ');
        for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
          const g1 = parseInt(s1[i].split('-')[0]) || 0;
          const g2 = parseInt(s2[i].split('-')[0]) || 0;
          if (g1 > g2) t1Sets++;
          else if (g2 > g1) t2Sets++;
        }
      }

      if (t1Sets > t2Sets) {
        if (stats[m.team1_id]) stats[m.team1_id].matchesWon++;
        if (stats[m.team2_id]) stats[m.team2_id].matchesLost++;
      } else if (t2Sets > t1Sets) {
        if (stats[m.team2_id]) stats[m.team2_id].matchesWon++;
        if (stats[m.team1_id]) stats[m.team1_id].matchesLost++;
      }

      if (stats[m.team1_id]) {
        stats[m.team1_id].setsWon += t1Sets;
        stats[m.team1_id].setsLost += t2Sets;
      }
      if (stats[m.team2_id]) {
        stats[m.team2_id].setsWon += t2Sets;
        stats[m.team2_id].setsLost += t1Sets;
      }
    });

    // Ordenar por partidos ganados, luego por diferencia de sets
    const sorted = Object.values(stats).sort((a, b) => {
      if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon;
      const aDiff = a.setsWon - a.setsLost;
      const bDiff = b.setsWon - b.setsLost;
      return bDiff - aDiff;
    });

    // Retorna ordenados, el backend/frontend puede tomar los top N (Ej: los 2 mejores)
    return sorted;
  }
}
