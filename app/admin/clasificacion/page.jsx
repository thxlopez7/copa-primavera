"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { TournamentBuilder } from "@/lib/domain/TournamentBuilder";
import { GroupStageService } from "@/lib/domain/GroupStageService";

export default function ClasificacionAdmin() {
  const [categories, setCategories] = useState([]);
  const [pairs, setPairs] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState("");

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
    const standings = [];
    graph.groups.forEach(zone => {
      const zoneTeamsIds = new Set();
      zone.matches.forEach(m => {
        if (m.team1_id) zoneTeamsIds.add(m.team1_id);
        if (m.team2_id) zoneTeamsIds.add(m.team2_id);
      });
      const zoneTeams = categoryPairs.filter(p => zoneTeamsIds.has(p.id));
      standings.push({
        zoneName: zone.name,
        zoneId: zone.id,
        standings: GroupStageService.getQualifiedTeams(zone.matches, zoneTeams)
      });
    });
    return standings;
  }, [graph.groups, categoryPairs]);

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

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Clasificación Global</h1>
          <p className="text-slate-400 font-medium mt-1">Vista general informativa de las posiciones por zona.</p>
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

      {standingsByZone.length === 0 ? (
        <div className="bg-navy-900 border border-navy-800 rounded-3xl p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-navy-950 rounded-full flex items-center justify-center border border-navy-800 text-slate-600 mb-4 text-2xl">
            <i className="fa-solid fa-list-ol"></i>
          </div>
          <h2 className="text-white font-bold text-lg mb-2">Sin clasificación</h2>
          <p className="text-slate-400 text-sm max-w-md">No hay grupos ni partidos jugados para calcular la clasificación de esta categoría.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {standingsByZone.map(zoneData => (
            <section key={zoneData.zoneId} className="bg-navy-900 border border-navy-800 rounded-3xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-navy-800 bg-navy-950/50 flex justify-between items-center">
                <h3 className="font-bold text-white"><i className="fa-solid fa-layer-group text-brand-500 mr-2"></i> {zoneData.zoneName}</h3>
                <span className="text-[10px] bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded font-black uppercase">En Vivo</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-navy-800/50 text-slate-400 border-b border-navy-800">
                    <tr>
                      <th className="px-4 py-3 font-bold">Pos</th>
                      <th className="px-4 py-3 font-bold">Equipo</th>
                      <th className="px-4 py-3 font-bold text-center">PJ</th>
                      <th className="px-4 py-3 font-bold text-center">PG</th>
                      <th className="px-4 py-3 font-bold text-center">PP</th>
                      <th className="px-4 py-3 font-bold text-center">DIF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-800/50">
                    {zoneData.standings.map((stat, idx) => (
                      <tr key={stat.id} className={`hover:bg-white/5 transition-colors ${idx < 2 ? 'bg-brand-500/5' : ''}`}>
                        <td className={`px-4 py-3 font-black ${idx < 2 ? 'text-brand-400' : 'text-slate-500'}`}>{idx + 1}</td>
                        <td className="px-4 py-3 font-bold text-white truncate max-w-[150px]">{getTeamName(stat.id)}</td>
                        <td className="px-4 py-3 text-center text-slate-300 font-bold">{stat.matchesWon + stat.matchesLost}</td>
                        <td className="px-4 py-3 text-center text-brand-400 font-bold">{stat.matchesWon}</td>
                        <td className="px-4 py-3 text-center text-orange-400">{stat.matchesLost}</td>
                        <td className="px-4 py-3 text-center text-white font-black">{stat.setsWon - stat.setsLost}</td>
                      </tr>
                    ))}
                    {zoneData.standings.length === 0 && (
                       <tr>
                         <td colSpan="6" className="px-4 py-6 text-center text-slate-400 font-medium">No hay equipos asignados a esta zona todavía.</td>
                       </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-3 bg-navy-950/30 border-t border-navy-800 text-[10px] text-slate-500 font-medium text-center">
                Los primeros 2 equipos clasifican por defecto al Cuadro Eliminatorio.
              </div>
            </section>
          ))}
        </div>
      )}

    </div>
  );
}
