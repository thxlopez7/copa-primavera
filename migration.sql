-- migration.sql
-- Ejecutar en Supabase SQL Editor para agregar las relaciones directas del DAG.

ALTER TABLE matches
ADD COLUMN next_match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
ADD COLUMN next_match_slot INTEGER; -- 1 para team1, 2 para team2
