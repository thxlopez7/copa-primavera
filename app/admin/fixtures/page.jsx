"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { GroupStageService } from "@/lib/domain/GroupStageService";
import { KnockoutStageService } from "@/lib/domain/KnockoutStageService";
import Link from "next/link";

export default function FixturesAdmin() {
  const [categories, setCategories] = useState([]);
  const [pairs, setPairs] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [filterState, setFilterState] = useState("ALL");
  
  const [updatingMatch, setUpdatingMatch] = useState(null);

  // Generator State
  const [generatorMode, setGeneratorMode] = useState("NONE"); // NONE, ZONAS, KNOCKOUT
  const [previewData, setPreviewData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

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
    loadData();
  }, []);

  const categoryMatches = matches.filter(m => m.category_id === selectedCategory);
  const categoryPairs = pairs.filter(p => p.category_id === selectedCategory);
  
  const filteredMatches = categoryMatches.filter(m => {
    if (filterState === "ALL") return true;
    return m.status === filterState;
  }).sort((a, b) => {
    const tA = a.match_datetime === "A definir" ? "ZZZ" : a.match_datetime;
    const tB = b.match_datetime === "A definir" ? "ZZZ" : b.match_datetime;
    return tA.localeCompare(tB);
  });

  const getTeamName = (teamId) => {
    if (!teamId) return "Por definir";
    const team = pairs.find(p => p.id === teamId);
    return team ? `${team.player1_name} / ${team.player2_name}` : "Por definir";
  };

  const handleUpdateSchedule = async (matchId, newDate, newTime, newCourt) => {
    setUpdatingMatch(matchId);
    let datetime = newDate;
    if (newDate !== "A definir" && newDate !== "Automático" && newTime) {
      datetime = `${newDate} - ${newTime}`;
    }

    try {
      const { error } = await supabase.from('matches').update({
        match_datetime: datetime,
        court: newCourt
      }).eq('id', matchId);

      if (error) throw error;
      
      // Update local state instead of full reload for speed
      setMatches(matches.map(m => m.id === matchId ? { ...m, match_datetime: datetime, court: newCourt } : m));
    } catch (err) {
      alert("Error al guardar programación: " + err.message);
    } finally {
      setUpdatingMatch(null);
    }
  };

  // --- GENERATOR LOGIC ---
  const handlePreviewGeneration = () => {
    if (generatorMode === "ZONAS") {
      if (categoryPairs.length < 3) {
        alert("Se necesitan al menos 3 parejas para armar zonas.");
        return;
      }
      const existingZonas = categoryMatches.filter(m => m.round.startsWith("GROUP_"));
      if (existingZonas.length > 0) {
        if (!confirm("⚠️ ADVERTENCIA: Ya existen partidos de zonas para esta categoría. Si generas nuevamente, se SOBRESCRIBIRÁ todo el fixture histórico de grupos. ¿Continuar?")) return;
      }
      
      setPreviewData({
        type: "ZONAS",
        teamsCount: categoryPairs.length,
        estimatedMatches: Math.floor(categoryPairs.length / 3) * 3, // rough estimate
        message: `Se crearán zonas de 3-4 equipos usando las ${categoryPairs.length} parejas inscritas. Todos jugarán contra todos en su respectiva zona.`
      });
    } else if (generatorMode === "KNOCKOUT") {
      const existingKnockout = categoryMatches.filter(m => m.round.startsWith("KO_"));
      if (existingKnockout.length > 0) {
        if (!confirm("⚠️ ADVERTENCIA: Ya existe un cuadro eliminatorio. Si generas nuevamente, se ELIMINARÁ el cuadro actual. ¿Continuar?")) return;
      }
      setPreviewData({
        type: "KNOCKOUT",
        message: `Se construirá el árbol DAG eliminatorio (Octavos, Cuartos, Semis, Final).`
      });
    }
  };

  const handleConfirmGeneration = async () => {
    if (!previewData) return;
    setIsGenerating(true);
    try {
      if (previewData.type === "ZONAS") {
        const success = await GroupStageService.generateGroups(selectedCategory, categoryPairs, 3);
        if (success) {
          alert("Zonas generadas exitosamente.");
        }
      } else if (previewData.type === "KNOCKOUT") {
        const teamIds = categoryPairs.map(p => p.id); // In a real scenario, this should be the qualified teams from zones.
        if (teamIds.length === 0) throw new Error("No hay equipos para el cuadro.");
        const success = await KnockoutStageService.generateKnockout(selectedCategory, teamIds);
        if (success) {
          alert("Cuadro Eliminatorio (DAG) generado exitosamente.");
        }
      }
      setGeneratorMode("NONE");
      setPreviewData(null);
      await loadData();
    } catch (error) {
      alert("Error en generación: " + error.message);
    } finally {
      setIsGenerating(false);
    }
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
          <h1 className="text-3xl font-black text-white tracking-tight">Fixtures y Programación</h1>
          <p className="text-slate-400 font-medium mt-1">Genera y programa partidos.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-bold uppercase tracking-widest">Categoría:</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => { setSelectedCategory(e.target.value); setGeneratorMode("NONE"); setPreviewData(null); }} 
            className="bg-navy-900 border border-navy-700 text-white font-bold rounded-xl px-4 py-2 text-sm outline-none focus:border-brand-500"
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </header>

      {/* GENERATOR SECTION */}
      <section className="bg-navy-900 border border-navy-800 rounded-3xl overflow-hidden shadow-lg p-5">
        <h2 className="font-bold text-white mb-4"><i className="fa-solid fa-wand-magic-sparkles text-brand-500 mr-2"></i> Generador Asistido de Fixtures</h2>
        
        {generatorMode === "NONE" ? (
          <div className="flex gap-4">
            <button onClick={() => setGeneratorMode("ZONAS")} className="flex-1 bg-navy-950 border border-navy-800 hover:border-brand-500 rounded-xl p-4 text-left group transition-colors">
              <i className="fa-solid fa-layer-group text-2xl text-slate-600 group-hover:text-brand-500 mb-2 block transition-colors"></i>
              <h3 className="font-bold text-white text-sm">Generar Fase de Zonas</h3>
              <p className="text-xs text-slate-400 mt-1">Crea los grupos "Round Robin" iniciales con los equipos inscritos.</p>
            </button>
            <button onClick={() => setGeneratorMode("KNOCKOUT")} className="flex-1 bg-navy-950 border border-navy-800 hover:border-brand-500 rounded-xl p-4 text-left group transition-colors">
              <i className="fa-solid fa-sitemap text-2xl text-slate-600 group-hover:text-brand-500 mb-2 block transition-colors"></i>
              <h3 className="font-bold text-white text-sm">Generar Cuadro Eliminatorio</h3>
              <p className="text-xs text-slate-400 mt-1">Construye el DAG (Octavos, Cuartos, Semi, Final) enlazado matemáticamente.</p>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-brand-400">
                {generatorMode === "ZONAS" ? "Asistente: Fase de Zonas" : "Asistente: Cuadro Eliminatorio"}
              </h3>
              <button onClick={() => { setGeneratorMode("NONE"); setPreviewData(null); }} className="text-xs font-bold text-slate-400 hover:text-white">Cancelar</button>
            </div>

            {!previewData ? (
              <div className="bg-navy-950 border border-navy-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Categoría: {categories.find(c => c.id === selectedCategory)?.name}</p>
                  <p className="text-xs text-slate-400">{categoryPairs.length} equipos inscritos disponibles.</p>
                </div>
                <button onClick={handlePreviewGeneration} className="bg-navy-800 hover:bg-navy-700 text-white font-bold px-4 py-2 rounded-lg text-sm border border-navy-700 transition-colors">
                  Generar Previsualización
                </button>
              </div>
            ) : (
              <div className="bg-brand-500/10 border border-brand-500/30 rounded-xl p-4 space-y-4">
                <div>
                  <h4 className="font-black text-brand-400 text-sm mb-1"><i className="fa-solid fa-eye mr-2"></i> Previsualización</h4>
                  <p className="text-xs font-medium text-slate-300">{previewData.message}</p>
                </div>
                <div className="flex gap-3 justify-end pt-2 border-t border-brand-500/20">
                  <button onClick={() => setPreviewData(null)} className="text-xs font-bold text-slate-400 hover:text-white px-3 py-2">Modificar</button>
                  <button onClick={handleConfirmGeneration} disabled={isGenerating} className="bg-brand-500 hover:bg-brand-600 text-navy-950 font-black px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2">
                    {isGenerating ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-check"></i>}
                    Confirmar e Impactar BD
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* SCHEDULE LIST SECTION */}
      <section className="bg-navy-900 border border-navy-800 rounded-3xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-navy-800 bg-navy-950/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="font-bold text-white"><i className="fa-solid fa-calendar-day text-blue-500 mr-2"></i> Partidos Existentes ({filteredMatches.length})</h3>
          <div className="flex bg-navy-900 rounded-lg p-1 border border-navy-800">
            {["ALL", "Pendiente", "Programado", "Finalizado"].map(state => (
              <button 
                key={state}
                onClick={() => setFilterState(state)}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-md transition-colors ${filterState === state ? 'bg-brand-500 text-navy-950' : 'text-slate-400 hover:text-white'}`}
              >
                {state === "ALL" ? "TODOS" : state}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-800/50 text-slate-400 border-b border-navy-800">
              <tr>
                <th className="px-4 py-3 font-bold">Fase/Ronda</th>
                <th className="px-4 py-3 font-bold">Equipos</th>
                <th className="px-4 py-3 font-bold">Día</th>
                <th className="px-4 py-3 font-bold">Hora</th>
                <th className="px-4 py-3 font-bold">Cancha</th>
                <th className="px-4 py-3 font-bold text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800">
              {filteredMatches.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    <i className="fa-solid fa-inbox text-2xl mb-2 block opacity-50"></i>
                    No hay partidos que coincidan.
                  </td>
                </tr>
              )}
              {filteredMatches.map(m => {
                let currentDay = "A definir";
                let currentTime = "";
                if (m.match_datetime !== "A definir" && m.match_datetime !== "Automático") {
                  const parts = m.match_datetime.split(" - ");
                  currentDay = parts[0] || "A definir";
                  currentTime = parts[1] || "";
                } else if (m.match_datetime === "Automático") {
                  currentDay = "Automático";
                }

                return (
                  <tr key={m.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-4 py-3 align-middle">
                      <span className="bg-navy-950 border border-navy-700 text-brand-400 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider block w-max">
                        {m.round}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-white truncate max-w-[180px]">{getTeamName(m.team1_id)}</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">vs</span>
                        <span className="font-bold text-white truncate max-w-[180px]">{getTeamName(m.team2_id)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <select 
                        disabled={currentDay === "Automático"}
                        value={currentDay}
                        onChange={(e) => handleUpdateSchedule(m.id, e.target.value, currentTime, m.court)}
                        className="bg-navy-950 border border-navy-700 rounded-md px-2 py-1.5 text-white disabled:opacity-50 text-xs w-full max-w-[130px]"
                      >
                        <option value="A definir">A definir</option>
                        <option value="Jueves 8 Oct">Jueves 8 Oct</option>
                        <option value="Viernes 9 Oct">Viernes 9 Oct</option>
                        <option value="Sábado 10 Oct">Sábado 10 Oct</option>
                        <option value="Domingo 11 Oct">Domingo 11 Oct</option>
                        <option value="Automático" disabled>Automático (BYE)</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <select 
                        disabled={currentDay === "A definir" || currentDay === "Automático"}
                        value={currentTime}
                        onChange={(e) => handleUpdateSchedule(m.id, currentDay, e.target.value, m.court)}
                        className="bg-navy-950 border border-navy-700 rounded-md px-2 py-1.5 text-white font-mono disabled:opacity-50 w-full max-w-[90px]"
                      >
                        <option value="">-</option>
                        <option value="18:00">18:00</option>
                        <option value="19:00">19:00</option>
                        <option value="20:00">20:00</option>
                        <option value="21:00">21:00</option>
                        <option value="22:00">22:00</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <select 
                        disabled={currentDay === "Automático"}
                        value={m.court || "PP1"}
                        onChange={(e) => handleUpdateSchedule(m.id, currentDay, currentTime, e.target.value)}
                        className="bg-navy-950 border border-navy-700 rounded-md px-2 py-1.5 text-white font-semibold disabled:opacity-50 text-[11px] w-full max-w-[120px]"
                      >
                        <option value="PP1">1 - PP1</option>
                        <option value="PP2">2 - PP2</option>
                        <option value="PP3">3 - PP3</option>
                        <option value="PP4">4 - PP4</option>
                        <option value="SPORT P 1">5 - SPORT P 1</option>
                        <option value="SPORT P 2">6 - SPORT P 2</option>
                        <option value="SPORT P 3">7 - SPORT P 3</option>
                        <option value="QUINTIN PADEL">8 - QUINTIN PADEL</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 align-middle text-center">
                      {updatingMatch === m.id ? (
                        <i className="fa-solid fa-spinner fa-spin text-brand-500"></i>
                      ) : (
                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${m.status === 'Finalizado' ? 'bg-brand-500/10 text-brand-400' : m.status === 'En Juego' ? 'bg-orange-500/10 text-orange-400' : 'bg-slate-800 text-slate-400'}`}>
                          {m.status}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
