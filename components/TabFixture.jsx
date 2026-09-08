"use client";

import { useState, useMemo } from "react";
import { TournamentBuilder } from "@/lib/domain/TournamentBuilder";
import { KnockoutStageService } from "@/lib/domain/KnockoutStageService";
import { GroupStageService } from "@/lib/domain/GroupStageService";

export default function TabFixture({ 
  categories, 
  selectedCategory, 
  setSelectedCategory, 
  isAdmin, 
  openManageCategoriesModal, 
  openManagePairsModal,
  pairs,
  matches,
  onFixtureRegenerated,
  openEditMatch
}) {
  const [subTab, setSubTab] = useState("zonas"); // 'zonas', 'posiciones', 'knockout'
  const [isGenerating, setIsGenerating] = useState(false);

  const activeCatObj = categories.find(c => c.id === selectedCategory);
  const categoryMatches = matches.filter(m => m.category_id === selectedCategory);
  const categoryPairs = pairs[selectedCategory] || [];
  
  // Hidratamos el grafo
  const graph = useMemo(() => TournamentBuilder.buildGraph(categoryMatches), [categoryMatches]);

  // Calculamos la tabla de posiciones por Zona
  const standingsByZone = useMemo(() => {
    const standings = {};
    graph.groups.forEach(zone => {
      // Obtenemos los equipos únicos en esta zona
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

  const getTeamName = (teamObj, fallbackText) => {
    if (teamObj) return `${teamObj.player1_name} / ${teamObj.player2_name}`;
    return fallbackText;
  };

  const handleGenerateGroups = async () => {
    if (!isAdmin) return;
    if (confirm(`¿Generar Fase de Zonas para "${activeCatObj?.name}"? Se borrarán las zonas actuales y sus resultados.`)) {
      setIsGenerating(true);
      const success = await GroupStageService.generateGroups(selectedCategory, categoryPairs);
      if (success && onFixtureRegenerated) {
        await onFixtureRegenerated();
      }
      setIsGenerating(false);
    }
  };

  const handleGenerateKnockout = async () => {
    if (!isAdmin) return;
    
    // Recolectar clasificados automáticamente (los 2 mejores de cada zona, o todos si no hay zonas)
    let qualifiedTeams = [];
    
    if (graph.groups.length > 0) {
      Object.keys(standingsByZone).forEach(zoneId => {
        const zoneStandings = standingsByZone[zoneId];
        // Tomar top 2
        qualifiedTeams.push(...zoneStandings.slice(0, 2).map(t => t.id));
      });
    } else {
      qualifiedTeams = categoryPairs.map(p => p.id);
    }

    if (confirm(`¿Generar Cuadro Eliminatorio (DAG) para "${activeCatObj?.name}" con ${qualifiedTeams.length} participantes? Se borrará el cuadro actual y sus resultados.`)) {
      setIsGenerating(true);
      const success = await KnockoutStageService.generateBracket(selectedCategory, qualifiedTeams);
      if (success && onFixtureRegenerated) {
        setSubTab('knockout');
        await onFixtureRegenerated();
      }
      setIsGenerating(false);
    }
  };

  return (
    <section className="tab-content space-y-6">
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-5 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-brand-500 text-[10px] font-bold uppercase tracking-wider block">Domain-Driven Engine</span>
            <h1 className="text-2xl font-bold text-white">Fixture de Competición</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-medium">Categoría:</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)} 
              className="bg-navy-800 text-white text-xs font-bold border border-navy-700 rounded-xl px-3 py-2.5 outline-none focus:border-brand-500"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {isAdmin && (
          <div className="pt-3 border-t border-navy-800 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-brand-400 font-semibold">Administrando: <strong className="text-white underline">{activeCatObj?.name}</strong></span>
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={handleGenerateGroups} 
                disabled={isGenerating}
                className="bg-transparent border border-dashed border-slate-600 disabled:opacity-50 text-slate-400 hover:text-white hover:border-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                <i className="fa-solid fa-layer-group mr-1"></i> 1. Generar Zonas
              </button>
              <button 
                onClick={handleGenerateKnockout} 
                disabled={isGenerating}
                className="bg-transparent border border-dashed border-brand-500/50 disabled:opacity-50 text-brand-400 hover:text-brand-300 hover:border-brand-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-[0_0_10px_rgba(34,197,94,0.1)]"
              >
                <i className="fa-solid fa-sitemap mr-1"></i> 2. Generar Knockout
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex border-b border-navy-800 gap-2 overflow-x-auto">
        <button 
          onClick={() => setSubTab('zonas')} 
          className={`text-xs font-bold px-4 py-2 border-b-2 transition whitespace-nowrap ${subTab === 'zonas' ? 'border-brand-500 text-brand-500' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          Fase de Zonas
        </button>
        <button 
          onClick={() => setSubTab('posiciones')} 
          className={`text-xs font-bold px-4 py-2 border-b-2 transition whitespace-nowrap ${subTab === 'posiciones' ? 'border-brand-500 text-brand-500' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          Tabla de Posiciones
        </button>
        <button 
          onClick={() => setSubTab('knockout')} 
          className={`text-xs font-bold px-4 py-2 border-b-2 transition whitespace-nowrap ${subTab === 'knockout' ? 'border-brand-500 text-brand-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          Cuadro Eliminatorio
        </button>
      </div>

      {subTab === 'zonas' && (
        <div className="space-y-6">
          {graph.groups.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400 bg-white/5 border border-white/10 rounded-2xl w-full">
              No hay fase de zonas generada para esta categoría.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {graph.groups.map(zone => (
                <div key={zone.id} className="bg-navy-900 border border-navy-800 rounded-2xl overflow-hidden">
                  <div className="bg-navy-950 p-3 border-b border-navy-800">
                    <h3 className="font-bold text-brand-500 text-sm uppercase tracking-widest">{zone.name}</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {zone.matches.map(m => {
                      const isPlaying = m.status === "En Juego";
                      const isFinished = m.status === "Finalizado";
                      const isWO = m.score_team1 === "W.O." || m.score_team2 === "W.O.";
                      
                      return (
                      <div key={m.id} className={`border rounded-xl p-3 space-y-2 transition-all ${isPlaying ? 'bg-navy-800 border-brand-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'bg-navy-800 border-navy-700'}`}>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className={`font-bold uppercase ${isFinished ? 'text-brand-500' : isPlaying ? 'text-orange-400' : 'text-slate-500'}`}>{isWO ? 'W.O.' : m.status}</span>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between items-center bg-navy-900 p-1.5 rounded-lg">
                            <span className={`font-bold truncate max-w-[150px] transition-all ${isFinished && m.score_team1 !== "W.O." && m.score_team1 > m.score_team2 ? 'text-white' : 'text-slate-300'}`}>{getTeamName(m.team1, "TBD")}</span>
                            <span className="font-mono text-brand-400 font-bold">{m.score_team1 || "-"}</span>
                          </div>
                          <div className="flex justify-between items-center bg-navy-900 p-1.5 rounded-lg">
                            <span className={`font-bold truncate max-w-[150px] transition-all ${isFinished && m.score_team2 !== "W.O." && m.score_team2 > m.score_team1 ? 'text-white' : 'text-slate-300'}`}>{getTeamName(m.team2, "TBD")}</span>
                            <span className="font-mono text-brand-400 font-bold">{m.score_team2 || "-"}</span>
                          </div>
                        </div>
                        {isAdmin && (
                          <button onClick={() => openEditMatch(m)} className="w-full mt-2 bg-transparent border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-white text-[9px] font-bold py-1.5 rounded-lg transition-colors">
                            Editar Resultado
                          </button>
                        )}
                      </div>
                    )})}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {subTab === 'posiciones' && (
        <div className="space-y-6">
          {graph.groups.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400 bg-white/5 border border-white/10 rounded-2xl w-full">
              Las tablas de posiciones se generan junto con la fase de zonas.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {graph.groups.map(zone => {
                const standings = standingsByZone[zone.id] || [];
                return (
                <div key={zone.id} className="bg-navy-900 border border-navy-800 rounded-2xl overflow-hidden">
                  <div className="bg-navy-950 p-3 border-b border-navy-800">
                    <h3 className="font-bold text-brand-500 text-sm uppercase tracking-widest">{zone.name}</h3>
                  </div>
                  <div className="p-0 overflow-x-auto">
                    <table className="w-full text-[10px] text-left">
                      <thead className="bg-navy-800 text-slate-400 border-b border-navy-700">
                        <tr>
                          <th className="px-3 py-2">Pos</th>
                          <th className="px-3 py-2">Pareja</th>
                          <th className="px-3 py-2 text-center">PG</th>
                          <th className="px-3 py-2 text-center">PP</th>
                          <th className="px-3 py-2 text-center">SF</th>
                          <th className="px-3 py-2 text-center">SC</th>
                          <th className="px-3 py-2 text-center">DIF</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy-700">
                        {standings.map((stat, idx) => {
                          const pair = categoryPairs.find(p => p.id === stat.id);
                          const isQualified = idx < 2; // Top 2 clasifica (ejemplo)
                          return (
                            <tr key={stat.id} className={`hover:bg-white/5 transition-colors ${isQualified ? 'bg-brand-500/5' : ''}`}>
                              <td className="px-3 py-2 font-bold text-slate-400">{idx + 1}</td>
                              <td className={`px-3 py-2 font-bold ${isQualified ? 'text-white' : 'text-slate-300'}`}>{getTeamName(pair, "Desconocido")}</td>
                              <td className="px-3 py-2 text-center text-brand-400 font-bold">{stat.matchesWon}</td>
                              <td className="px-3 py-2 text-center text-orange-400">{stat.matchesLost}</td>
                              <td className="px-3 py-2 text-center text-slate-300">{stat.setsWon}</td>
                              <td className="px-3 py-2 text-center text-slate-300">{stat.setsLost}</td>
                              <td className="px-3 py-2 text-center font-bold text-white">{stat.setsWon - stat.setsLost}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      )}

      {subTab === 'knockout' && (
        <div className="space-y-4">
          {graph.knockout.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400 bg-white/5 border border-white/10 rounded-2xl w-full">
              El cuadro eliminatorio no se ha generado aún.
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 overflow-x-auto scroll-smooth touch-pan-x min-h-[500px]">
              <div className="flex gap-12 py-4 px-2 min-w-max">
                {graph.knockout.map(round => (
                  <div key={round.id} className="flex flex-col justify-around min-w-[260px] space-y-4">
                    <div className="text-center mb-4">
                      <span className="bg-navy-800 text-brand-400 text-xs font-bold px-3 py-1 rounded-full border border-navy-700 uppercase tracking-widest shadow-md">
                        {round.name}
                      </span>
                    </div>
                    
                    {round.matches.map(m => {
                      const isPlaying = m.status === "En Juego";
                      const isFinished = m.status === "Finalizado";
                      const isWO = m.score_team1 === "W.O." || m.score_team2 === "W.O.";
                      
                      return (
                        <div key={m.id} className={`bg-navy-900 border rounded-xl p-3 relative transition-all group ${isPlaying ? 'border-brand-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'border-white/10 hover:border-white/20'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-slate-400 font-bold">Partido {m.metadata.position}</span>
                            <div className="flex items-center gap-1">
                              {isPlaying && <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.8)]"></span>}
                              <span className={`text-[9px] font-bold uppercase ${isFinished ? 'text-brand-500' : isPlaying ? 'text-orange-400' : 'text-slate-500'}`}>
                                {isWO ? 'W.O.' : m.status}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between items-center bg-navy-950 p-1.5 rounded-lg border border-white/5">
                              <span className={`font-bold truncate max-w-[150px] transition-all ${isFinished && m.score_team1 !== "W.O." && m.score_team1 > m.score_team2 ? 'text-white' : 'text-slate-300'}`}>
                                {getTeamName(m.team1, m.metadata.sourceLabel1)}
                              </span>
                              <span className="font-mono text-brand-400 font-bold">{m.score_team1 || "-"}</span>
                            </div>
                            <div className="flex justify-between items-center bg-navy-950 p-1.5 rounded-lg border border-white/5">
                              <span className={`font-bold truncate max-w-[150px] transition-all ${isFinished && m.score_team2 !== "W.O." && m.score_team2 > m.score_team1 ? 'text-white' : 'text-slate-300'}`}>
                                {getTeamName(m.team2, m.metadata.sourceLabel2)}
                              </span>
                              <span className="font-mono text-brand-400 font-bold">{m.score_team2 || "-"}</span>
                            </div>
                          </div>

                          {isAdmin && (
                            <button onClick={() => openEditMatch(m)} className="w-full mt-3 bg-transparent border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-white text-[10px] font-bold py-1.5 rounded-lg transition-colors">
                              Editar Resultado
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
