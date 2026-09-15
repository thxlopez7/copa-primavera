# Admin Architecture (Tournament Operations Center)

## 1. Topología del Frontend (App Router)
El centro de operaciones está diseñado bajo el enrutador de Next.js (`app/admin/*`), completamente segregado de la vista pública. Esto garantiza que la lógica administrativa no pese en el bundle del usuario general.

### Rutas
- `/admin` (Dashboard)
- `/admin/equipos` (Gestión de Parejas y Categorías)
- `/admin/fase-grupos` (Gestión de Zonas y Clasificación local)
- `/admin/fixtures` (Programación y Generador Asistido de Fixtures)
- `/admin/resultados` (Inbox centralizado de carga de resultados)
- `/admin/clasificacion` (Tabla de posiciones global)
- `/admin/cuadro` (Renderizado del DAG eliminatorio)
- `/admin/noticias` (Gestión de contenido)

## 2. Flujo de Datos y Fuentes de Verdad
Se respeta estrictamente el principio: **El administrador gestiona entidades; el sistema calcula consecuencias.**

```text
RESULTADO (vía /admin/resultados)
   ↓
MATCH ENGINE (lib/domain/MatchEngine.js)
   ↓
CLASIFICACIÓN (lib/domain/GroupStageService.js)
   ↓
KNOCKOUT PROPAGATION (next_match_id)
   ↓
SIGUIENTE RONDA (UI)
```

## 3. Seguridad
La arquitectura de seguridad actual funciona bajo:
1. **Protección de Ruta (Client-side):** `app/admin/layout.jsx` escucha el estado de `supabase.auth` y redirige a `/` si no hay sesión.
2. **Recomendación de Backend (RLS):** Supabase requiere políticas activas para evitar mutaciones vía API directa. (A revisar en consola Supabase).

## 4. Reutilización de Dominio
Todo el cálculo deportivo reside en `/lib/domain/`. La UI de `/admin` simplemente lee de estas clases estáticas.

- **`TournamentBuilder`**: Construye el grafo para mostrar el cuadro eliminatorio en `/admin/cuadro`.
- **`GroupStageService`**: Calcula posiciones matemáticas al vuelo para `/admin/clasificacion`.
- **`KnockoutStageService`**: Orquesta el enlazado físico de Partidos en `/admin/fixtures` (Generador Asistido).
