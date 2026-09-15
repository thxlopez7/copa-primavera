# COPA PRIMAVERA — CURRENT ARCHITECTURE

## 1. Executive Summary

El proyecto se encuentra en un estado de transición entre un frontend estático tradicional ("landing page") con modales de administración y una nueva arquitectura estructurada bajo `/app/admin` (Operations Center). Existe un esfuerzo claro por separar la lógica de dominio (`lib/domain/`) de los componentes de React, pero todavía hay mezcla de responsabilidades. La base de datos asume ciertos modelos implícitos (e.g., jugadores acoplados a parejas, ausencia de tabla de torneos) y depende de reglas de codificación de strings (ej: `round: 'GROUP_A_P1'`) para determinar jerarquías deportivas. No obstante, las bases para una propagación automática de brackets (DAG) a través del `MatchEngine` son prometedoras y funcionales a pequeña escala.

## 2. Stack

- **Framework**: Next.js (App Router, versión 16.3.4 as detected in package.json - likely 14 or 15 but labeled 16.3.4?)
- **UI Library**: React (19.2.8)
- **Styling**: Tailwind CSS (v4)
- **BaaS**: Supabase (supabase-js v2.116.0)
- **Linter**: ESLint (v9)

## 3. Project Structure

Estructura relevante del repositorio:

```text
/app
  /admin (Nueva interfaz de administración protegida)
  page.jsx (Landing page y legacy admin UI/tabs)
  layout.jsx (Layout público)
/components
  /admin (Componentes específicos de la administración)
  /Modals (Múltiples modales de interacción para carga y edición)
  Tab*.jsx (Vistas tabuladas usadas en page.jsx)
/lib
  /domain (Lógica de competición segregada de UI)
  supabase.js (Cliente Supabase)
/hooks (Custom hooks como useScrollLock)
```

## 4. Routes

| Ruta | Estado | Propósito | Problemas |
|------|--------|-----------|-----------|
| `/` | FUNCIONAL | Landing page pública, consumo de fixture, noticias, programación y modals de admin (legacy). | Lógica de sesión y admin modals conviviendo con UI pública. Fetch general de todo en `page.jsx`. |
| `/admin` | FUNCIONAL | Dashboard del Operations Center. | Layout intercepta carga si no hay auth, pero depende del lado cliente. |
| `/admin/equipos` | FUNCIONAL | CRUD de Categorías y Parejas. | - |
| `/admin/fase-grupos` | NO VERIFICADO | Gestión y generación de grupos. | Usa `GroupStageService`. |
| `/admin/fixtures` | FUNCIONAL | Generación de brackets eliminatorios. | - |
| `/admin/clasificacion` | FUNCIONAL | Vista de posiciones calculadas al vuelo. | Recalcula todo client-side en cada renderización. |
| `/admin/cuadro` | FUNCIONAL | Renderizado del Bracket. | - |
| `/admin/noticias` | FUNCIONAL | CRUD de noticias. | - |
| `/admin/resultados` | NO VERIFICADO | Inbox o interfaz centralizada de carga de resultados. | - |

## 5. Components

- **`Navbar.jsx` / `Footer.jsx` / `AdminBanner.jsx`**: Layout global y navegación pública, interceptan clicks para modales admin.
- **`TabInicio.jsx`, `TabFixture.jsx`, `TabNoticias.jsx`, `TabProgramacion.jsx`**: Vistas inyectadas en la home page. Prop-drilling fuerte desde `app/page.jsx`.
- **`ResultModal.jsx`**: Componente complejo. Maneja la carga de resultados, sets, W.O. Contiene un paso de confirmación ("Confirmar y Propagar") para alertar sobre sobrescritura de descendientes en el DAG. Se acopla a `MatchEngine`.
- **Modales (ManageCategories, ManagePairs, MatchDetail, etc.)**: Formularios flotantes, varios incluyen validaciones básicas y guardado directo a Supabase.

## 6. Domain Layer

- **`MatchEngine.js`**: Determina matemáticamente ganadores y maneja la propagación de avance (`propagateForward`) y regresión/anulación (`revertPropagation`) a través del grafo del bracket.
- **`TournamentBuilder.js`**: Hydration layer. Transforma la lista plana de `matches` desde DB en una estructura de grafos `groups` y `knockout` inteligible por la UI.
- **`GroupStageService.js`**: Genera zonas, programa partidos round-robin, y determina clasificados dinámicamente (`getQualifiedTeams`) calculando sets y partidos ganados.
- **`KnockoutStageService.js`**: Construye la estructura de llaves (bracket), ajusta byes (W.O. iniciales), y encadena relaciones de procedencia usando `next_match_id` y `next_match_slot`.

## 7. Data Flow

La aplicación consulta Supabase directamente desde los Server/Client Components.
El flujo típico actual:
1. **UI**: `app/page.jsx` o `app/admin/*/page.jsx` realiza el `supabase.from(...).select()`.
2. **Hooks/Services**: El array de datos viaja a servicios como `TournamentBuilder.buildGraph(matches)` para su formateo.
3. **Carga**: UI invoca modals (`ResultModal`).
4. **Supabase**: Modal actualiza registro en DB mediante `supabase.from('matches').update(...)`.
5. **Business Logic Side-effect**: En caso de un bracket (KO), el frontend modal (vía `MatchEngine`) ejecuta múltiples updates a DB para propagar al ganador a la siguiente ronda (o revertir).

## 8. Tournament Logic

Actualmente, la lógica deportiva no reside en DB ni en el backend, sino en el **Frontend (Cliente)** dentro de `lib/domain/`.
Las operaciones críticas de propagación (determinar ganadores, mover equipos por las rondas) suceden a través del navegador de un admin invocando `MatchEngine`. Si la conexión falla en el medio de una propagación recursiva de limpieza, el DAG queda inconsistente.

## 9. Fixture / Bracket

**Sí, existe un Bracket real y dinámico (Directed Acyclic Graph).**
- La base de datos tiene `next_match_id` y `next_match_slot` para construir relaciones uno-a-uno directas.
- Soporta *winner propagation*. Funciona actualizando explícitamente el slot (`team1_id` o `team2_id`) del `next_match_id` destino.
- Representa correctamente R16, QF, SF, FINAL gracias al generador recursivo en `KnockoutStageService.js`.
- Los partidos de grupos no se relacionan; los partidos de Knockout sí.

## 10. Classification

La clasificación no se persiste. Es **calculada on-the-fly** por la UI en memoria:
- Ocurre en `GroupStageService.getQualifiedTeams`.
- Reglas: Partidos ganados, luego diferencia de sets, no considera puntos clásicos (3 victorias, 1 empate).
- Se utiliza en `TabFixture.jsx` y `/admin/clasificacion/page.jsx`.
- Problema: Es pesada de calcular cliente por cliente, render por render.

## 11. Results

Los resultados se almacenan en formato String de manera literal, Ej: `"6-4 4-6 6-2"` o `"W.O."`.
- La aplicación (en `MatchEngine` y `ResultModal`) parsea el string usando `split(' ')` y `split('-')` repetidamente.
- Esta persistencia debilita la capacidad de realizar querys analíticas en la DB.
- Soporta 3 sets explícitamente.

## 12. Authentication

Usa **Supabase Auth**.
- No existe un control basado en roles visible en el código analizado, depende de `!!session` (si hay alguien logueado, es Admin).
- Se confía que el backend esté aplicando RLS, pero el cliente no hace checks granulares. Protege la UI escondiendo botones y validando que los modales tengan `isAdmin`.

## 13. Error Handling

- **Básico/Intermedio**: La app envuelve llamadas de DB en `try/catch` y usa `console.error` o `alert()`.
- Faltan `error.jsx` formales de Next.js.
- Errores de red durante la propagación del bracket (`MatchEngine`) pueden llevar a estados de campeonato rotos y requerirán intervención manual vía DB.
- Se manejan *loading states* básicos, y empty states adecuados en la clasificación y fixture.

## 14. Hardcoded Data

- **Estructura de Rondas**: Constantes en código, ej. `KO_R16_P1`, `GROUP_A_P1`.
- **Cálculo de Sets**: Limitado matemáticamente al máximo de 3 en `ResultModal`.
- **Canchas**: En la creación inicial, asigna hardcoded `court: "A definir"` o `court: "PP1"`.

| Hallazgo | Clasificación |
|----------|---------------|
| `court: "PP1"` al generar grupos | HARDCODED PROBLEMÁTICO |
| Prefijos `KO_` y `GROUP_` incrustados en `round` | HARDCODED PROVISIONAL (Coupling) |

## 15. UX / Responsive

- **Mobile First / Tabbed Interface**: `app/page.jsx` inyecta tabs pesadas, pero la interfaz responde bien en móviles según inspección de clases.
- **Advertencias UX Avanzadas**: El `ResultModal` tiene avisos en rojo cuando editar un resultado implicará borrar de forma recursiva a los equipos en rondas subsecuentes, excelente alerta de seguridad operativa.

## 16. Technical Debt

| Deuda | Severidad | Razón |
|-------|-----------|-------|
| Resultados en Strings | HIGH | Limita la escalabilidad estadística, requiere parseos costosos y propensos a errores. |
| Entidades Faltantes (Torneo, Jugador real) | CRITICAL | No permite historizar y aislar múltiples torneos; los jugadores están pegados a la pareja y repetidos (desnormalizado). |
| Propagación Mutativa desde Cliente | CRITICAL | Si falla una cascada de DB desde el navegador admin, la red de partidos queda corrupta. Esto pertenece al Backend. |
| Fetch Masivo Inicial | MEDIUM | La página principal (`/`) se trae todos los `matches`, `pairs`, `categories` y `news` para renderizar tabs. No escalará. |

## 17. Reusable Code

El Domain Layer (particularmente la matemática de torneos y el sistema de árboles):
- Lógica de Byes y cálculo W.O.
- Determinación matemática de ganadores de sets.
- Construcción local del DAG (`TournamentBuilder.js`).
- Interfaces de Admin (buenas directivas de navegación en `app/admin/layout.jsx`).

## 18. Candidates for Refactor

- **`ResultModal`**: Desacoplar la UI de la invocación de `MatchEngine`.
- **Modelo de Datos de `pairs`**: Romper a `players` + `teams`.
- **Modelo de `matches.score`**: Migrar de string a JSON o a tabla relacional `match_sets`.
- **Clasificación**: Se debería materializar en una tabla (caché) para no recalcularla front-end side constantemente.
- **Mover Domain a Server Actions**: La lógica `MatchEngine` debe ser una Next.js API o Edge Function en Supabase.

## 19. Risks

- Modificar el sistema de almacenamiento actual de puntuación romperá las RegExp/Parsers existentes.
- Refactorizar las URLs/Tabs afectará severamente cómo se pasa el State a través de la aplicación (prop-drilling pesado en `page.jsx`).
- No hay aislamiento de ambientes: todo parece referir a un solo torneo tácito en la Base de Datos.

## 20. Recommended Next Steps

1. Estabilizar la DB: Proponer una migración SQL que introduzca `tournaments`, normalice `players`, y mueva el string de puntuación a algo estructurado, manteniendo compatibilidad o una ventana de migración.
2. Refactorizar la recolección de datos públicos, introduciendo Server Components reales que fetcheen directamente.
3. Desplazar toda acción de `MatchEngine` a Server Actions de Next.js u operaciones de Backend (RPC en Supabase).
4. No alterar el aspecto visual ni UX actual (que es bueno), sino la cañería debajo.

---

## 21. Matriz de Funcionalidades

| Funcionalidad | Existe | Funciona | Fuente de datos | Estado | Riesgo |
| ------------- | ------ | -------- | --------------- | ------ | ------ |
| Torneos       | NO     | N/A      | N/A             | NO EXISTE | CRITICAL |
| Categorías    | SÍ     | SÍ       | Supabase: `categories` | FUNCIONAL | LOW |
| Jugadores     | PARCIAL| N/A      | Text fields en `pairs` | NO FUNCIONAL | HIGH |
| Parejas       | SÍ     | SÍ       | Supabase: `pairs` | FUNCIONAL | MEDIUM |
| Grupos        | SÍ     | SÍ       | Lógica sobre `matches` | FUNCIONAL | MEDIUM |
| Partidos      | SÍ     | SÍ       | Supabase: `matches` | FUNCIONAL | LOW |
| Resultados    | SÍ     | SÍ       | Text field `score_teamX` | FUNCIONAL | HIGH |
| Clasificación | SÍ     | SÍ       | Client-side calculation | FUNCIONAL | HIGH |
| Fixture       | SÍ     | SÍ       | React UI on `matches` | FUNCIONAL | MEDIUM |
| Bracket       | SÍ     | SÍ       | DAG sobre `matches` | FUNCIONAL | LOW |
| Programación  | SÍ     | SÍ       | `court` & `datetime` | FUNCIONAL | LOW |
| Noticias      | SÍ     | SÍ       | Supabase: `news` | FUNCIONAL | LOW |
| Auth          | SÍ     | SÍ       | Supabase Auth | FUNCIONAL | LOW |
| RLS           | PARCIAL| DUDOSO   | INFORMACIÓN NO DISPONIBLE | DUDOSA | HIGH |

---

## 22. Matriz de Problemas

| ID           | Problema | Severidad | Archivo/Tabla | Impacto | Recomendación |
| ------------ | -------- | --------- | ------------- | ------- | ------------- |
| ARCH-001     | Lógica de negocio (Bracket/Propagación) ejecutada en el cliente web. | CRITICAL | `MatchEngine.js` | Alta posibilidad de corrupción de datos si hay fallos de red durante secuencias de cascada. | Trasladar Domain Actions a Server Actions (Next.js) o Postgres Functions. |
| ARCH-002     | Fetch único masivo en `app/page.jsx` para alimentar componentes tabulados. | HIGH | `app/page.jsx` | Lentitud de renderizado, sobrecarga innecesaria en red y RAM cliente. | Migrar tabs a rutas con SSR o hidratación lazy segmentada. |
| DB-001       | Puntajes almacenados como strings concatenados (`"6-4 3-6"`). | HIGH | `matches` | Imposibilidad de querys analíticas, alta dependencia de split strings. | Migrar a formato estructurado (e.g., campo JSONB o tabla `sets`). |
| DB-002       | Ausencia de tabla real `tournaments`. | CRITICAL | Toda la App | El sistema soporta un (1) único torneo de forma implícita. No escalable. | Crear `tournaments` y atar `categories` y entidades root al mismo. |
| DB-003       | Jugadores inexistentes, fusionados como strings en tabla `pairs`. | MEDIUM | `pairs` | Imposible hacer perfiles de jugador, stats, cruzamiento de torneos pasados. | Normalizar a tabla `players` y de ahí pivotar a `pairs`. |
| UX-001       | Calculo de posición ejecutado masivamente en client side al montar vista. | MEDIUM | `GroupStageService.js` | En categorías grandes trabará el hilo principal (main thread UI). | Materializar tabla de posiciones, o recalcular on-save de partido en el server. |
