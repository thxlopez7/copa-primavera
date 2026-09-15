import { MatchEngine } from "./MatchEngine";

/**
 * Domain-Driven Design: Knockout Stage Service
 * Servicio puro de dominio para generar cuadros eliminatorios (Brackets / DAG).
 */

export class KnockoutStageService {
  
  /**
   * Calcula la siguiente potencia de 2 para determinar el tamaño real del cuadro.
   * Ej: Si hay 6 equipos, devuelve 8 (habrá 2 byes).
   */
  static getNextPowerOf2(num) {
    if (num <= 2) return 2;
    return Math.pow(2, Math.ceil(Math.log2(num)));
  }

  /**
   * Retorna una etiqueta amigable según el tamaño de la ronda.
   */
  static getRoundLabel(size) {
    switch (size) {
      case 64: return "R64";
      case 32: return "R32";
      case 16: return "R16";
      case 8: return "QF"; // Quarter Finals
      case 4: return "SF"; // Semi Finals
      case 2: return "FINAL";
      default: return `R${size}`;
    }
  }

  /**
   * Genera el esqueleto de un cuadro eliminatorio conectando nodos (partidos)
   * hacia rondas posteriores utilizando `next_match_id`.
   * 
   * @param {Array} pairs - Array de parejas u objetos con ID a distribuir en 1ra ronda.
   * @param {string} categoryId - UUID de la categoría.
   * @param {number} forcedSize - (Opcional) Fuerza un tamaño base si el array de pairs está vacío o es parcial.
   * @returns {Array} - Array plano de objetos de partido que representan el DAG completo.
   */
  static generateBracket(pairs, categoryId, forcedSize = null) {
    const targetCount = forcedSize || pairs.length;
    if (targetCount < 2) {
      throw new Error("Se necesitan al menos 2 equipos para armar el cuadro final.");
    }

    const bracketSize = this.getNextPowerOf2(targetCount);
    const totalRounds = Math.log2(bracketSize);
    
    // Matriz temporal para organizar rondas antes de aplanarlas
    const roundsData = [];
    for (let r = 0; r < totalRounds; r++) {
      roundsData.push([]);
    }

    // 1. Generar todos los partidos vacíos por cada ronda
    for (let r = 0; r < totalRounds; r++) {
      const currentRoundSize = bracketSize / Math.pow(2, r); // Ej: 8 -> 4 -> 2
      const numMatchesInRound = currentRoundSize / 2;
      const roundLabel = this.getRoundLabel(currentRoundSize);

      for (let m = 0; m < numMatchesInRound; m++) {
        let t1 = null;
        let t2 = null;

        // Seeding lineal en la 1ra ronda
        if (r === 0 && pairs && pairs.length > 0) {
          const idx1 = m * 2;
          const idx2 = m * 2 + 1;
          
          if (idx1 < pairs.length) {
            t1 = pairs[idx1].id || pairs[idx1];
          }
          if (idx2 < pairs.length) {
            t2 = pairs[idx2].id || pairs[idx2];
          }
        }

        roundsData[r].push({
          id: crypto.randomUUID(), // ID efímero, será útil para enlazar relacionalmente en memoria
          category_id: categoryId,
          team1_id: t1,
          team2_id: t2,
          phase: 'knockout',
          status: 'scheduled',
          round_name: `${roundLabel}_match_${m + 1}`, // Ej: "QF_match_1"
          result: MatchEngine.createEmptyResult(),
          next_match_id: null,
          scheduled_at: null,
          court: null
        });
      }
    }

    // 2. Conectar relaciones explícitas (DAG) uniendo cada ronda con la siguiente
    for (let r = 0; r < totalRounds - 1; r++) {
      const currentRoundMatches = roundsData[r];
      const nextRoundMatches = roundsData[r + 1];

      currentRoundMatches.forEach((match, index) => {
        // En un árbol binario completo, dos partidos consecutivos apuntan al mismo partido padre
        const nextMatchIndex = Math.floor(index / 2);
        const nextMatch = nextRoundMatches[nextMatchIndex];
        
        // Eliminamos next_match_slot porque ya no existe en el esquema V1
        match.next_match_id = nextMatch.id;
      });
    }

    // Retorna el array plano listo para ser guardado (por un servicio de aplicación)
    return roundsData.flat();
  }
}
