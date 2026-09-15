"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { TournamentBuilder } from "@/lib/domain/TournamentBuilder";
import { GroupStageService } from "@/lib/domain/GroupStageService";
import GroupStandings from "@/components/admin/GroupStandings";

export default function FaseGruposAdmin() {
  const [categories, setCategories] = useState([]);
  const [pairs, setPairs] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedZone, setSelectedZone] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [{ data: catData }, { data: pairsData }, { data: matchesData }] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('pairs').select('*'),
        supabase.from('matches').select('*')
      ]);
      setCategories(catData || []);
      setPairs(pairsData || []);
      setMatches(matchesData || []);
      if (catData && catData.length > 0 && !selectedCategory) {
        setSelectedCategory(catData[0].id);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line
    loadData();
  }, []);

  const categoryMatches = useMemo(() => {
    return matches.filter(m => m.category_id === selectedCategory);
  }, [matches, selectedCategory]);

  const graph = useMemo(() => {
    return TournamentBuilder.buildGraph(categoryMatches);
  }, [categoryMatches]);

  const categoryPairs = useMemo(() => {
    return pairs.filter(p => p.category_id === selectedCategory);
  }, [pairs, selectedCategory]);

  const standingsByZone = useMemo(() => {
    const standings = {};
    graph.groups.forEach(zone => {
      const zoneTeamsIds = new Set();
      zone.matches.forEach(m => {
        if (m.team1_id) zoneTeamsIds.add(m.team1_id);
        if (m.team2_id) zoneTeamsIds.add(m.team2_id);
      });
      const zoneTeams = categoryPairs.filter(p => zoneTeamsIds.has(p.id));
      standings[zone.id] = GroupStageService.getQualifiedTeams(zone.matches, zoneTeams);
    });
    return standings;
  }, [graph.groups, categoryPairs]);

  useEffect(() => {
    if (graph.groups.length > 0) {
      if (!selectedZone || !graph.groups.find(z => z.id === selectedZone)) {
        // eslint-disable-next-line
        setSelectedZone(graph.groups[0].id);
      }
    } else {
      setSelectedZone(null);
    }
  }, [graph.groups, selectedZone]);

  const getTeamName = (teamId, fallbackText = "Por definir") => {
    if (!teamId) return fallbackText;
    const team = pairs.find(p => p.id === teamId);
    return team ? `${team.player1_name} / ${team.player2_name}` : fallbackText;
  };

  if (loading) {
    return (
      <div className="p-10 flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeZone = graph.groups.find(z => z.id === selectedZone);
  const activeStandings = selectedZone ? standingsByZone[selectedZone] : [];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Fase de Grupos</h1>
          <p className="text-slate-400 font-medium mt-1">Supervisión y clasificación automática de zonas.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-bold uppercase tracking-widest">Categoría:</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)} 
            className="bg-navy-900 border border-navy-700 text-white font-bold rounded-xl px-4 py-2 text-sm outline-none focus:border-brand-500"
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </header>

      {graph.groups.length === 0 ? (
        <div className="bg-navy-900 border border-navy-800 rounded-3xl p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-navy-950 rounded-full flex items-center justify-center border border-navy-800 text-brand-500 mb-4 text-2xl">
            <i className="fa-solid fa-layer-group"></i>
          </div>
          <h2 className="text-white font-bold text-lg mb-2">No hay zonas generadas</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-md">La categoría actual no tiene una fase de grupos iniciada. Debes generarla en la sección de Fixtures.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Menu Zonas */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2 mb-3">Zonas Disponibles</h3>
            {graph.groups.map(zone => (
              <button 
                key={zone.id} 
                onClick={() => setSelectedZone(zone.id)}
                className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-between ${selectedZone === zone.id ? 'bg-brand-500/10 text-brand-400 border border-brand-500/30' : 'bg-navy-900 border border-navy-800 text-slate-300 hover:border-navy-700'}`}
              >
                <span>{zone.name}</span>
                <i className={`fa-solid fa-chevron-right text-[10px] transition-transform ${selectedZone === zone.id ? 'translate-x-1 text-brand-400' : 'text-slate-600'}`}></i>
              </button>
            ))}
          </div>

          {/* Detalles de la Zona Seleccionada */}
          {activeZone && (
            <div className="lg:col-span-3 space-y-6">
              <GroupStandings 
                activeZone={activeZone}
                activeStandings={activeStandings}
                getTeamName={getTeamName}
              />
            </div>
          )}

        </div>
      )}

    </div>
  );
}
