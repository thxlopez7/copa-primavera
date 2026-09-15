import { MatchEngine } from "./MatchEngine";

/**
 * Domain-Driven Design: Knockout Stage Service
 * Servicio puro de dominio para generar cuadros eliminatorios (Brackets / DAG).
 */

export class KnockoutStageService {
  
  static getNextPowerOf2(num) {
    if (num <= 2) return 2;
    return Math.pow(2, Math.ceil(Math.log2(num)));
  }

  static getRoundLabel(size) {
    switch (size) {
      case 64: return "R64";
      case 32: return "R32";
      case 16: return "R16";
      case 8: return "QF";
      case 4: return "SF";
      case 2: return "FINAL";
      default: return `R${size}`;
    }
  }

  /**
   * Genera el orden matemático de siembra cruzada para evitar que los 
   * mejores clasificados se enfrenten prematuramente.
   * Devuelve un array de índices (1-based) para una llave de `size`.
   */
  static getSeedingOrder(size) {
    let rounds = Math.log2(size);
    let matches = [1, 2];
    for (let r = 1; r < rounds; r++) {
      let currentRoundSize = Math.pow(2, r + 1);
      let nextMatches = [];
      for (let match of matches) {
        nextMatches.push(match);
        nextMatches.push(currentRoundSize + 1 - match);
      }
      matches = nextMatches;
    }
    return matches;
  }

  /**
   * Construye el bracket y resuelve automáticamente los BYEs.
   * Asigna explícitamente next_match_slot (1 o 2) a cada partido.
   * 
   * @param {Array} seededPairs - Array de parejas. El índice representa su Seed (0 = Seed 1).
   * @param {string} categoryId - UUID de la categoría.
   */
  static generateBracket(seededPairs, categoryId) {
    const targetCount = seededPairs.length;
    if (targetCount < 2) {
      throw new Error("Se necesitan al menos 2 equipos para armar el cuadro final.");
    }

    const bracketSize = this.getNextPowerOf2(targetCount);
    const totalRounds = Math.log2(bracketSize);
    
    const roundsData = [];
    for (let r = 0; r < totalRounds; r++) {
      roundsData.push([]);
    }

    // 1. Generar todos los partidos vacíos por cada ronda con IDs temporales
    for (let r = 0; r < totalRounds; r++) {
      const currentRoundSize = bracketSize / Math.pow(2, r); // Ej: 8 -> 4 -> 2
      const numMatchesInRound = currentRoundSize / 2;
      const roundLabel = this.getRoundLabel(currentRoundSize);

      for (let m = 0; m < numMatchesInRound; m++) {
        roundsData[r].push({
          id: crypto.randomUUID(), 
          category_id: categoryId,
          team1_id: null,
          team2_id: null,
          phase: 'knockout',
          status: 'scheduled',
          round_name: `${roundLabel}_match_${m + 1}`,
          result: MatchEngine.createEmptyResult(),
          next_match_id: null,
          next_match_slot: null,
          scheduled_at: null,
          court: null,
          _metadata: { roundIndex: r, matchIndex: m } 
        });
      }
    }

    // 2. Conectar relaciones topológicas (next_match_id y next_match_slot)
    for (let r = 0; r < totalRounds - 1; r++) {
      const currentRoundMatches = roundsData[r];
      const nextRoundMatches = roundsData[r + 1];

      currentRoundMatches.forEach((match, index) => {
        const nextMatchIndex = Math.floor(index / 2);
        const nextMatch = nextRoundMatches[nextMatchIndex];
        
        match.next_match_id = nextMatch.id;
        match.next_match_slot = (index % 2 === 0) ? 1 : 2;
      });
    }

    // 3. Sembrar los equipos en la Primera Ronda (Ronda 0) usando algoritmo estricto
    const seeding = this.getSeedingOrder(bracketSize);
    const firstRoundMatches = roundsData[0];
    
    // seeding tiene formato [1, 8, 4, 5, 3, 6, 2, 7]. 
    // Recorremos de 2 en 2 para armar los cruces de R1.
    for (let i = 0; i < seeding.length; i += 2) {
      const seedA = seeding[i];
      const seedB = seeding[i+1];
      
      const team1 = seedA <= targetCount ? seededPairs[seedA - 1] : null;
      const team2 = seedB <= targetCount ? seededPairs[seedB - 1] : null;
      
      const matchIndex = i / 2;
      
      firstRoundMatches[matchIndex].team1_id = team1 ? (team1.id || team1) : null;
      firstRoundMatches[matchIndex].team2_id = team2 ? (team2.id || team2) : null;
    }

    // 4. Validación Matemática Pura requerida por auditoría
    firstRoundMatches.forEach(match => {
      if (!match.team1_id && !match.team2_id) {
        throw new Error("BRACKET MATEMÁTICAMENTE INVÁLIDO: Se generó un partido NULL vs NULL. Abortando.");
      }
      if (match.team1_id && match.team2_id && match.team1_id === match.team2_id) {
        throw new Error("BRACKET MATEMÁTICAMENTE INVÁLIDO: Self-match detectado. Abortando.");
      }
    });

    // 5. Resolución Automática de BYEs
    // BYE = Un partido donde el bracket era mayor que los participantes.
    let byesResolved = 0;
    firstRoundMatches.forEach(match => {
      const hasTeam1 = !!match.team1_id;
      const hasTeam2 = !!match.team2_id;

      if ((hasTeam1 && !hasTeam2) || (!hasTeam1 && hasTeam2)) {
        const solitaryTeamId = hasTeam1 ? match.team1_id : match.team2_id;
        
        match.status = 'completed';
        // Diferenciación conceptual: internamente usamos el flag is_bye si se requiere, 
        // pero la BD espera el JSON del MatchEngine (is_walkover) para mantener compatibilidad.
        match.result = MatchEngine.processWalkover(solitaryTeamId);
        match.result.is_bye = true; // Agregado explícitamente para diferenciar en Frontend o reportes.
        
        if (match.next_match_id) {
          const nextRound = roundsData[1];
          const parentMatch = nextRound.find(m => m.id === match.next_match_id);
          if (parentMatch) {
            if (match.next_match_slot === 1) {
              parentMatch.team1_id = solitaryTeamId;
            } else {
              parentMatch.team2_id = solitaryTeamId;
            }
          }
        }
        byesResolved++;
      }
    });

    const expectedByes = bracketSize - targetCount;
    if (byesResolved !== expectedByes) {
      throw new Error(`BRACKET MATEMÁTICAMENTE INVÁLIDO: Se resolvieron ${byesResolved} BYEs, pero se esperaban ${expectedByes}.`);
    }

    // 6. Limpieza y Aplanamiento
    const flatMatches = roundsData.flat().map(m => {
      const { _metadata, ...cleanMatch } = m;
      return cleanMatch;
    });

    if (flatMatches.length !== bracketSize - 1) {
      throw new Error("BRACKET MATEMÁTICAMENTE INVÁLIDO: La cantidad de partidos generados no coincide con un DAG perfecto.");
    }

    return flatMatches;
  }
}
