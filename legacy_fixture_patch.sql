-- legacy_fixture_patch.sql

-- 1. Normalización de estado Finalizado -> completed
UPDATE matches 
SET status = 'completed' 
WHERE status = 'Finalizado';

-- 2. Asignación retroactiva de next_match_slot
-- Usamos el round_name para inferir el slot. 
-- El torneo original guardaba los round_name como 'QF_match_1', 'QF_match_2', etc.
-- Los partidos impares (1, 3, 5) alimentaban el slot 1.
-- Los partidos pares (2, 4, 6) alimentaban el slot 2.

UPDATE matches
SET next_match_slot = CASE 
  WHEN (SUBSTRING(round_name FROM 'match_([0-9]+)')::INT % 2) = 1 THEN 1
  WHEN (SUBSTRING(round_name FROM 'match_([0-9]+)')::INT % 2) = 0 THEN 2
  ELSE NULL
END
WHERE phase = 'knockout' 
  AND next_match_id IS NOT NULL 
  AND next_match_slot IS NULL
  AND round_name LIKE '%match_%';

-- 3. Reporte de ambiguos (solo para visualización, no actualiza)
-- Partidos que aún no tienen next_match_slot
-- SELECT id, round_name, next_match_id 
-- FROM matches 
-- WHERE phase = 'knockout' AND next_match_id IS NOT NULL AND next_match_slot IS NULL;
