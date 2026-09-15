# COPA PRIMAVERA — DATABASE AUDIT

## 1. Tables

De acuerdo a las consultas realizadas en el frontend, se identifican las siguientes tablas:

- `categories`
- `pairs`
- `matches`
- `news`

**Información No Disponible:** No podemos verificar la existencia de tablas subyacentes relacionadas a autenticación, más allá de la infraestructura estándar `auth.users` de Supabase.

## 2. Columns

Basado en el código observado (`.select('*')`, desestructuraciones e inserts):

### `categories`
- `id` (uuid o bigint, presumiblemente PK)
- `name` (string)
- `tournament_id` (uuid, asume existencia pero es forzado a `null` en creación).

### `pairs` (Actúa como tabla "equipos/teams")
- `id` (uuid o bigint, PK)
- `category_id` (uuid, FK hacia `categories`)
- `player1_name` (string)
- `player2_name` (string)

### `matches`
- `id` (uuid, PK)
- `category_id` (uuid, FK hacia `categories`)
- `team1_id` (uuid, FK hacia `pairs`, nullable para Byes/slots vacíos)
- `team2_id` (uuid, FK hacia `pairs`, nullable para Byes/slots vacíos)
- `round` (string, ej: `"GROUP_A_P1"`, `"KO_R16_P1"`)
- `status` (string, ej: `"Programado"`, `"Pendiente"`, `"En Juego"`, `"Finalizado"`)
- `score_team1` (string, ej: `"6-4 6-2"`, `"W.O."`, nullable)
- `score_team2` (string, ej: `"4-6 2-6"`, `"W.O."`, nullable)
- `match_datetime` (string/timestamp?, manejado como string "A definir" o "Automático" inicialmente)
- `court` (string, ej: `"PP1"`, `"A definir"`)
- `next_match_id` (uuid, FK hacia `matches(id)`, nullable, soporte de árbol eliminatorio)
- `next_match_slot` (integer, `1` o `2`, determina si va al bracket de local o visitante)

### `news`
- `id` (uuid/int, PK)
- `title` (string)
- `content` (string/text)
- `created_at` (timestamp, deducido por el ordenamiento `order('created_at')`)
- `imageUrl` / `image_url` (posible, deducido por requerimientos de UI, no explícito en inserts revisados)

## 3. Primary Keys
- Se asume UUID (`crypto.randomUUID()` generado a mano en la inserción de fixtures). `id` en todas las tablas es la PK natural de Supabase.

## 4. Foreign Keys
- `pairs.category_id` → `categories.id`
- `matches.category_id` → `categories.id`
- `matches.team1_id` → `pairs.id`
- `matches.team2_id` → `pairs.id`
- `matches.next_match_id` → `matches.id` (Relación recursiva, provista en `migration.sql`)

## 5. Unique Constraints
- INFORMACIÓN NO DISPONIBLE. Asumimos la estándar de PK `id`.

## 6. Indexes
- INFORMACIÓN NO DISPONIBLE. Al menos deberían existir índices en los UUIDs para optimizar los joins manuales.

## 7. RLS (Row Level Security)
- INFORMACIÓN NO DISPONIBLE. (El código asume un entorno de confianza desde el frontend; no vemos capturas de denegación de RLS, pero la advertencia del admin lo asume. Faltan detalles de consola).

## 8. Policies
- INFORMACIÓN NO DISPONIBLE.

## 9. Triggers
- INFORMACIÓN NO DISPONIBLE. (Al no haber DB functions vistas, la propagación es manual, por tanto asumimos sin triggers).

## 10. Functions
- INFORMACIÓN NO DISPONIBLE. (Todo el pesado recae en `lib/domain/`, no se usa RPC en base de datos).

## 11. Relationships

```text
       (N/A)
    Tournament [MISSING]
         ↓
     Category
         ↓
  ┌──────┴──────┐
  ↓             ↓
Pairs        Matches
  │             │
  └─────────────┘
   (team1_id / team2_id)
```

## 12. Matches Analysis

**Manejo de estados y representación del partido:**
1. **Identificación**: A través del campo autogenerado `id`.
2. **Equipos**: Referenciados en `team1_id` y `team2_id` hacia la tabla `pairs`. Si es BYE, es null.
3. **Resultado**: El resultado se almacena como texto desestructurado en `score_team1` y `score_team2`.
4. **Fechas/Canchas**: Son texto estático inicialmente. 
5. **Estado**: Depende de una cadena de texto en `status` ("Programado", "Pendiente", "Finalizado").
6. **Ronda**: Es un campo String semi-estructurado: `KO_R[Num]_P[Pos]` (ej: `KO_R16_P1`). 
7. **Winner**: NO se almacena el ID del ganador; se infiere on-the-fly contando la matemática de los strings de los sets. 
8. **Relación al Siguiente (DAG)**: Utiliza apuntadores `next_match_id` y `next_match_slot` que se llenan en el momento de generar el cuadro. Si está completo, se inyecta el ganador directamente en el slot. 

**Limitaciones detectadas:**
- No hay propagación automática nativa. Requerirá la ejecución de `MatchEngine.propagateForward` explícita en JS, lo que significa que requiere de un cliente vivo para completarse (si falla, el árbol se rompe).

## 13. Data Integrity Risks

- **Corrupción de Árboles (Race conditions)**: Si dos administradores editan un resultado conflictivo a la vez y la propagación de árbol corre por separado en el frontend, el DAG puede sobreescribirse.
- **Formato del Resultado**: Cargar mal un string ("6-a") podría romper toda la evaluación matemática.
- **Borrado en Cascada**: Un error de frontend en la invocación de `MatchEngine.revertPropagation()` puede causar que partes del árbol queden "huérfanas" de equipos sin limpiar.
- **Relaciones Sueltas**: Sin constraints DB fuertes, se podrían borrar "pairs" que actualmente están jugando el torneo. (De hecho `ManagePairsModal` hace `delete()` sin chequear si ya tiene partidos vinculados).

## 14. Missing Concepts

- **Tournament**: Toda la base de datos corre para un solo evento.
- **Players**: No existen como entidad relacional. Modificar el nombre de un jugador en una categoría implica texto plano en un equipo. 
- **Sets**: Manejar `"6-4 4-6 6-2"` no permite medir estadísticas finas por jugador o set de forma eficiente.
- **Tournament Points**: No hay estructura para guardar un histórico o ranking nacional/anual.

## 15. Migration Candidates

Estas son propuestas, **NO IMPLEMENTADAS**, derivadas de la inspección:

1. **Crear tabla `tournaments`**. (Migrar `categories` atándolas a ese torneo).
2. **Crear tabla `players`**. (Migrar `pairs` a una tabla relacional `teams` que englobe dos `players`).
3. **Mover lógica de Bracket al servidor**. (Refactorizar `matches` quitando la dependencia de `group_` y `ko_` del round string a Enum de tipología y delegar propagaciones).
4. **Almacenar Sets independientemente** o usar un `JSONB`.
5. **Añadir constraint ON DELETE RESTRICT** sobre equipos que tengan partidos activos.
