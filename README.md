# 🎾 Copa Primavera - Tournament Management System

![Next.js](https://img.shields.io/badge/Next.js-14+-black?logo=next.js)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?logo=supabase)

Copa Primavera es una aplicación web avanzada para la gestión de torneos de Pádel. Fue diseñada para manejar competiciones con una lógica estructurada tipo **Federación (FEP)**, utilizando un motor propio de generación de Fixtures basado en un **Grafo Acíclico Dirigido (DAG)**.

## ✨ Características Principales

* **Autenticación Segura**: Panel de administración protegido mediante Supabase Auth y Row Level Security (RLS).
* **Gestión de Categorías y Parejas**: Operaciones CRUD completas para administrar las inscripciones.
* **Motor de Torneos Determinista (Domain-Driven)**:
  * **Fase de Zonas**: Creación automática de llaves Round Robin y cálculo de Tabla de Posiciones al instante (puntos, sets, partidos).
  * **Cuadro Eliminatorio (Knockout)**: Generación dinámica del bracket perfecto calculando automáticamente potencias de 2 e inyectando *BYEs* cruzados.
  * **Propagación Automática**: El motor identifica y propaga a los ganadores a sus *slots* correspondientes de manera estructural (sin parseo mágico de strings).
  * **Reversión Profunda**: Sistema anti-errores que borra en cascada los resultados futuros si un administrador corrige un partido previo.
* **Módulo de Programación (Scheduling)**: Asignación de días, horarios y canchas separada del árbol lógico del fixture.
* **UI/UX Dark Sports Tech**: Interfaz inmersiva con estilo Glassmorphism, animaciones fluidas y diseño móvil-first optimizado para jugadores y espectadores.

## 🏗️ Arquitectura Técnica

El core de la aplicación reside en la carpeta `lib/domain/`, donde la lógica de negocio ha sido completamente desacoplada de la base de datos:

* `GroupStageService.js`: Calcula y enruta los grupos y posiciones.
* `KnockoutStageService.js`: Diseña el esqueleto matemático del torneo.
* `MatchEngine.js`: Regla los ganadores, perdedores (Sets o W.O.) y propaga estados usando `next_match_id`.
* `TournamentBuilder.js`: Clase hidratadora que extrae los datos planos de la DB y teje el Grafo JSON para que el Frontend (React) simplemente lo renderice.

## 🚀 Instalación y Despliegue Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/copa-primavera.git
cd copa-primavera
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
Crea un archivo `.env.local` en la raíz del proyecto y añade tus credenciales de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
```

### 4. Configurar Base de Datos (Supabase)
La aplicación requiere tablas específicas para funcionar (`categories`, `pairs`, `matches`, `news`).
> **Importante:** Ejecuta el archivo `migration.sql` ubicado en la raíz del proyecto dentro de la consola SQL de Supabase para añadir las columnas clave del motor de grafos.

### 5. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🛡️ Seguridad y Contribución

Todo el sistema de mutaciones del proyecto está diseñado bajo **Row Level Security (RLS)** de PostgreSQL. Si el usuario no posee una sesión administrativa válida, las operaciones de edición en el frontend no solo se bloquean a nivel UI, sino que son rechazadas en backend.

## 📄 Licencia

Desarrollado para la Copa Primavera - Pilar, Paraguay.
