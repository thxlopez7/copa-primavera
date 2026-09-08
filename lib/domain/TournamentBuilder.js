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

    // 1. Agrupar Fase de Zonas (Identificador: GROUP_A_P1)
    const groupMatches = matches.filter(m => m.round.startsWith('GROUP_'));
    const zonesMap = {};
    
    groupMatches.forEach(m => {
      const parts = m.round.split('_'); // GROUP, A, P1
      if (parts.length >= 3) {
        const zoneId = parts[1];
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

    // 2. Agrupar Fase Eliminatoria (Identificador: KO_R16_P1)
    const koMatches = matches.filter(m => m.round.startsWith('KO_'));
    const koMap = {};

    koMatches.forEach(m => {
      const parts = m.round.split('_'); // KO, R16, P1
      if (parts.length === 3) {
        const rSize = parseInt(parts[1].replace('R', '')); // 16
        const pos = parseInt(parts[2].replace('P', '')); // 1

        if (!koMap[rSize]) {
          koMap[rSize] = {
            id: `R${rSize}`,
            size: rSize,
            name: KnockoutStageService.getRoundLabel(rSize),
            matches: []
          };
        }
        
        // En lugar de parsear strings para calcular los sources,
        // Buscamos directamente qué partidos apuntan a este partido como `next_match_id`
        const sourceMatch1 = koMatches.find(prev => prev.next_match_id === m.id && prev.next_match_slot === 1);
        const sourceMatch2 = koMatches.find(prev => prev.next_match_id === m.id && prev.next_match_slot === 2);

        // Agregamos metadata extra al match in-memory para el frontend
        const hydratedMatch = {
          ...m,
          metadata: {
            position: pos,
            sourceMatch1: sourceMatch1 || null,
            sourceMatch2: sourceMatch2 || null,
            sourceLabel1: sourceMatch1 
              ? `Ganador ${KnockoutStageService.getRoundLabel(parseInt(sourceMatch1.round.split('_')[1].replace('R','')))} (M${sourceMatch1.round.split('_')[2].replace('P','')})` 
              : "Por definir",
            sourceLabel2: sourceMatch2 
              ? `Ganador ${KnockoutStageService.getRoundLabel(parseInt(sourceMatch2.round.split('_')[1].replace('R','')))} (M${sourceMatch2.round.split('_')[2].replace('P','')})` 
              : "Por definir"
          }
        };

        koMap[rSize].matches.push(hydratedMatch);
      }
    });

    // Convertir a array y ordenar desde la ronda más grande (Ej: 16avos) hasta la Final
    graph.knockout = Object.values(koMap).sort((a, b) => b.size - a.size);

    // Ordenar los partidos internamente por su posición (P1, P2, P3...)
    graph.knockout.forEach(round => {
      round.matches.sort((a, b) => a.metadata.position - b.metadata.position);
    });

    return graph;
  }
}
