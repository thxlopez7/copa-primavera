import { KnockoutStageService } from "./KnockoutStageService";

/**
 * Hydration Layer: Transforma la tabla plana de DB en un Grafo (DAG) estructurado para el Frontend.
 */

export class TournamentBuilder {

  /**
   * Lee la tabla de partidos de una categoría y construye la estructura JSON completa.
   */
  static buildGraph(matches) {
    const graph = {
      groups: [],
      knockout: []
    };

    if (!matches || matches.length === 0) return graph;

    // 1. Agrupar Fase de Zonas
    const groupMatches = matches.filter(m => m.phase === 'group_stage' || m.round_name === 'Fase de Grupos' || (m.round && m.round.startsWith('GROUP_')));
    const zonesMap = {};
    
    groupMatches.forEach(m => {
      let zoneId = m.result?.group_name;
      
      // Fallback para datos legacy
      if (!zoneId && m.round) {
        const parts = m.round.split('_');
        if (parts.length >= 3) {
          zoneId = parts[1];
        }
      }

      if (zoneId) {
        if (!zonesMap[zoneId]) {
          zonesMap[zoneId] = {
            id: zoneId,
            name: `Zona ${zoneId}`,
            matches: []
          };
        }
        zonesMap[zoneId].matches.push(m);
      }
    });

    graph.groups = Object.values(zonesMap).sort((a, b) => a.id.localeCompare(b.id));

    // 2. Agrupar Fase Eliminatoria (DAG)
    const koMatches = matches.filter(m => m.phase === 'knockout' || (m.round_name && m.round_name !== 'Fase de Grupos' && (!m.round || !m.round.startsWith('GROUP_'))));
    const koMap = {};

    koMatches.forEach(m => {
      // Intentamos calcular el tamaño de la ronda contando cuántos partidos apuntan a la misma llave.
      // O usando el nombre si es un esquema legacy. 
      // Si la ronda actual tiene N partidos, su size nominal es N * 2
      let rSize = null;

      if (m.round_name && (m.round_name.startsWith('R') || m.round_name.startsWith('QF') || m.round_name.startsWith('SF') || m.round_name.startsWith('FINAL'))) {
         // Parsear el roundLabel
         if (m.round_name.includes('FINAL') && !m.round_name.includes('SF') && !m.round_name.includes('QF')) rSize = 2;
         else if (m.round_name.includes('SF')) rSize = 4;
         else if (m.round_name.includes('QF')) rSize = 8;
         else if (m.round_name.includes('R16')) rSize = 16;
         else if (m.round_name.includes('R32')) rSize = 32;
         else if (m.round_name.includes('R64')) rSize = 64;
      }
      
      // Fallback para legacy
      if (!rSize && m.round && m.round.startsWith('KO_')) {
        const parts = m.round.split('_');
        if (parts.length >= 2) rSize = parseInt(parts[1].replace('R', ''));
      }

      // Default si fallan los métodos: adivinar por cantidad (no ideal si hay partidos aislados, pero robusto si tenemos todos)
      if (!rSize) {
        const sameRoundMatches = koMatches.filter(other => other.round_name === m.round_name);
        rSize = sameRoundMatches.length * 2;
      }

      if (rSize) {
        if (!koMap[rSize]) {
          koMap[rSize] = {
            id: `R${rSize}`,
            size: rSize,
            name: KnockoutStageService.getRoundLabel(rSize),
            matches: []
          };
        }

        // Resolviendo Source Matches explícitamente mediante el DAG matemático
        // Buscamos partidos que apunten a ESTE partido (m.id) y al slot correspondiente
        const sourceMatch1 = koMatches.find(prev => prev.next_match_id === m.id && prev.next_match_slot === 1);
        const sourceMatch2 = koMatches.find(prev => prev.next_match_id === m.id && prev.next_match_slot === 2);

        // Posición dentro de la ronda (importante para ordenar visualmente)
        // Extraemos el número del match, ej: QF_match_3 -> position 3
        let pos = 999;
        const matchStr = m.round_name ? m.round_name.match(/match_(\d+)/) : null;
        if (matchStr) {
          pos = parseInt(matchStr[1]);
        } else if (m.round && m.round.includes('_P')) {
          const parts = m.round.split('_');
          pos = parseInt(parts[2].replace('P', ''));
        }

        const hydratedMatch = {
          ...m,
          metadata: {
            position: pos,
            sourceMatch1: sourceMatch1 || null,
            sourceMatch2: sourceMatch2 || null,
            sourceLabel1: sourceMatch1 
              ? `Ganador ${sourceMatch1.round_name || 'Ronda Anterior'}` 
              : "Por definir",
            sourceLabel2: sourceMatch2 
              ? `Ganador ${sourceMatch2.round_name || 'Ronda Anterior'}` 
              : "Por definir"
          }
        };

        koMap[rSize].matches.push(hydratedMatch);
      }
    });

    graph.knockout = Object.values(koMap).sort((a, b) => b.size - a.size);

    graph.knockout.forEach(round => {
      round.matches.sort((a, b) => a.metadata.position - b.metadata.position);
    });

    return graph;
  }
}
