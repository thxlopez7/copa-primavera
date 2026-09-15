# Plan de Implementación: Capa de Aplicación (Fase 5)

Este plan detalla la creación de los orquestadores (Server Actions) en `/lib/actions/` para conectar la Capa de Dominio pura con Supabase.

## User Review Required

> [!WARNING]
> **Estrategia de Inserción del Grafo (DAG):** Para resolver la inserción de los partidos eliminatorios generados en memoria con IDs temporales, propongo **insertar los partidos de forma topológica (de la Final hacia atrás)**. 
> 
> Como Supabase/Postgres genera los IDs reales, el proceso será:
> 1. Encontrar los partidos sin `next_match_id` (la Final).
> 2. Insertarlos en Supabase y capturar el `id` real devuelto.
> 3. Buscar los partidos de la ronda anterior que apuntaban al `id` temporal de la Final.
> 4. Actualizar su `next_match_id` con el `id` real de la Final.
> 5. Insertarlos, capturar sus IDs reales, y repetir el proceso recursivamente hacia atrás hasta la primera ronda.
> 
> ¿Apruebas esta estrategia de resolución de dependencias, o prefieres que la base de datos acepte los UUIDs que ya generó el Dominio (lo cual permitiría una sola inserción masiva)?

## Proposed Changes

### `/lib/actions/`

#### [NEW] [match.actions.js](file:///Users/thiagolopez/Desktop/copa-primavera/lib/actions/match.actions.js)
- **`updateMatchResult(matchId, resultJson)`**:
  - Obtiene el partido usando el cliente de Supabase (SSR).
  - Determina el ganador con `MatchEngine.calculateWinner(resultJson, match.team1_id, match.team2_id)`.
  - Actualiza el partido actual marcándolo como completado.
  - Si hay un ganador y un `next_match_id`, propaga al equipo ganador actualizando el slot correspondiente del partido destino.

#### [NEW] [classification.actions.js](file:///Users/thiagolopez/Desktop/copa-primavera/lib/actions/classification.actions.js)
- **`getCategoryClassification(categoryId)`**:
  - Hace fetch de todos los partidos de la categoría donde `phase = 'group_stage'`.
  - Hace fetch de todas las parejas (`pairs`) de la categoría para tener la base de los equipos.
  - Invoca `ClassificationEngine.calculateStandings(matches, pairs)` y retorna el array de posiciones.

#### [NEW] [tournament.actions.js](file:///Users/thiagolopez/Desktop/copa-primavera/lib/actions/tournament.actions.js)
- **`generateKnockoutPhase(categoryId, qualifiedTeamsCount)`**:
  - Genera el bracket en memoria con `KnockoutStageService.generateBracket()`.
  - Aplica el algoritmo de resolución topológica detallado arriba para mapear UUIDs temporales a UUIDs reales durante la inserción en base de datos, garantizando la integridad referencial.

## Verification Plan

- No se modificará ningún componente de React.
- Se crearán las funciones con el tag `"use server"` para asegurar su ejecución como Server Actions en Next.js.
- Se verificará que el manejo de la propagación funcione con las transacciones o asíncronamente correctamente, usando el JSONB en todo momento.
