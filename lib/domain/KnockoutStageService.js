import { supabase } from "@/lib/supabase";
import { MatchEngine } from "./MatchEngine";

/**
 * Servicio para gestionar la Fase Eliminatoria (Knockout / FEP Bracket)
 */

export class KnockoutStageService {
  
  static getNextPowerOf2(num) {
    if (num <= 2) return 2;
    return Math.pow(2, Math.ceil(Math.log2(num)));
  }

  static getRoundLabel(size) {
    switch (size) {
      case 64: return "32avos";
      case 32: return "16avos";
      case 16: return "Octavos";
      case 8: return "Cuartos";
      case 4: return "Semifinal";
      case 2: return "Final";
      default: return `Ronda de ${size}`;
    }
  }

  /**
   * Genera el cuadro de eliminación directa conectando los IDs explícitamente.
   */
  static async generateBracket(categoryId, teamsArray) {
    if (!teamsArray || teamsArray.length < 2) {
      alert("Se necesitan al menos 2 equipos para armar el cuadro.");
      return false;
    }

    try {
      // 1. Borrar partidos KO actuales de la categoría
      const { error: deleteError } = await supabase
        .from('matches')
        .delete()
        .eq('category_id', categoryId)
        .like('round', 'KO_%');

      if (deleteError) throw deleteError;

      const bracketSize = this.getNextPowerOf2(teamsArray.length);
      const numByes = bracketSize - teamsArray.length;
      
      const teams = [...teamsArray.map(t => t.id || t)];
      for (let i = 0; i < numByes; i++) {
        teams.push("BYE");
      }

      const roundsData = [];
      const totalRounds = Math.log2(bracketSize);

      for (let r = 0; r < totalRounds; r++) {
        roundsData.push([]);
      }

      // R1 matches (Index 0)
      for (let i = 0; i < bracketSize / 2; i++) {
        const t1 = teams[i * 2];
        const t2 = teams[i * 2 + 1];
        const hasBye = t1 === "BYE" || t2 === "BYE";
        
        roundsData[0].push({
          id: crypto.randomUUID(),
          category_id: categoryId,
          round: `KO_R${bracketSize}_P${i + 1}`,
          team1_id: t1 === "BYE" ? null : t1,
          team2_id: t2 === "BYE" ? null : t2,
          status: hasBye ? "Finalizado" : "Programado",
          score_team1: hasBye && t2 === "BYE" ? "W.O." : null,
          score_team2: hasBye && t1 === "BYE" ? "W.O." : null,
          match_datetime: hasBye ? "Automático" : "A definir",
          court: "A definir",
          next_match_id: null,
          next_match_slot: null
        });
      }

      // Rondas siguientes (vacías inicialmente)
      for (let r = 1; r < totalRounds; r++) {
        const currentRoundSize = bracketSize / Math.pow(2, r); // 16 -> 8 -> 4 -> 2
        const numMatchesInRound = currentRoundSize / 2;
        
        for (let m = 0; m < numMatchesInRound; m++) {
          roundsData[r].push({
            id: crypto.randomUUID(),
            category_id: categoryId,
            round: `KO_R${currentRoundSize}_P${m + 1}`,
            team1_id: null,
            team2_id: null,
            status: "Pendiente",
            score_team1: null,
            score_team2: null,
            match_datetime: "A definir",
            court: "A definir",
            next_match_id: null,
            next_match_slot: null
          });
        }
      }

      // Conectar relaciones explícitas (DAG)
      for (let r = 0; r < totalRounds - 1; r++) {
        const currentRoundMatches = roundsData[r];
        const nextRoundMatches = roundsData[r+1];

        currentRoundMatches.forEach((match, index) => {
          const nextMatchIndex = Math.floor(index / 2);
          const nextMatch = nextRoundMatches[nextMatchIndex];
          const slot = (index % 2 === 0) ? 1 : 2;

          match.next_match_id = nextMatch.id;
          match.next_match_slot = slot;
        });
      }

      const initialMatches = roundsData.flat();

      // 2. Insertar en DB
      const { data: insertedMatches, error: insertError } = await supabase
        .from('matches')
        .insert(initialMatches)
        .select();

      if (insertError) throw insertError;

      // 3. Propagar W.O. virtuales (BYEs) hacia la siguiente ronda usando el Engine
      for (const match of insertedMatches) {
        if (match.status === "Finalizado") {
          const winnerId = match.score_team1 === "W.O." ? match.team1_id : match.team2_id;
          if (winnerId) {
            await MatchEngine.propagateForward(match, winnerId, insertedMatches);
          }
        }
      }

      return true;
    } catch (error) {
      console.error("Error generando KO Bracket:", error);
      alert("Error generando Bracket KO: " + error.message);
      return false;
    }
  }
}
