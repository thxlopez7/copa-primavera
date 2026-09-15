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
          round_name: `group_${groupName}_match_${matchCount}`,
          result: MatchEngine.createEmptyResult(),
          scheduled_at: null,
          court: null
        });
        matchCount++;
      }
    }

    return matches;
  }
}
