"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TabProgramacion({ categories, matches, pairs, isAdmin, onProgramacionUpdated }) {
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || "");
  const [filterState, setFilterState] = useState("ALL"); // ALL, Programado, Pendiente, Finalizado
  const [updatingMatch, setUpdatingMatch] = useState(null);

  const categoryMatches = matches.filter(m => m.category_id === selectedCategory);
  
  const filteredMatches = categoryMatches.filter(m => {
    if (filterState === "ALL") return true;
    return m.status === filterState;
  }).sort((a, b) => {
    // Ordenar por fecha/hora si existe, sino por id
    const tA = a.match_datetime === "A definir" ? "ZZZ" : a.match_datetime;
    const tB = b.match_datetime === "A definir" ? "ZZZ" : b.match_datetime;
    return tA.localeCompare(tB);
  });

  const getTeamName = (teamId) => {
    if (!teamId) return "Por definir";
    const catPairs = pairs[selectedCategory] || [];
    const team = catPairs.find(p => p.id === teamId);
    return team ? `${team.player1_name} / ${team.player2_name}` : "Por definir";
  };

  const handleUpdateSchedule = async (matchId, newDate, newTime, newCourt) => {
    if (!isAdmin) return;
    setUpdatingMatch(matchId);
    
    let datetime = newDate;
    if (newDate !== "A definir" && newDate !== "Automático" && newTime) {
      datetime = `${newDate} - ${newTime}`;
    }

    try {
      const { error } = await supabase
        .from('matches')
        .update({
          match_datetime: datetime,
          court: newCourt
        })
        .eq('id', matchId);

      if (error) throw error;

      if (onProgramacionUpdated) {
        await onProgramacionUpdated();
      }
    } catch (err) {
      console.error("Error updating schedule:", err);
      alert("Error al guardar programación.");
    } finally {
      setUpdatingMatch(null);
    }
  };

  return (
    <section className="tab-content space-y-6">
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-5 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-brand-500 text-[10px] font-bold uppercase tracking-wider block">Scheduling Module</span>
            <h1 className="text-2xl font-bold text-white">Programación de Partidos</h1>
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

        <div className="pt-3 border-t border-navy-800 flex items-center gap-2">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Filtro:</label>
          <div className="flex bg-navy-950 rounded-lg p-1 border border-navy-800">
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
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-900 border-b border-navy-800 text-slate-400">
              <tr>
                <th className="px-4 py-3">Ronda / ID</th>
                <th className="px-4 py-3">Partido</th>
                <th className="px-4 py-3">Día</th>
                <th className="px-4 py-3">Hora</th>
                <th className="px-4 py-3">Cancha</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800">
              {filteredMatches.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                    No hay partidos que coincidan con los filtros en esta categoría.
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
                      <span className="bg-navy-950 border border-navy-700 text-brand-400 px-2 py-1 rounded text-[10px] font-bold uppercase block w-max">
                        {m.round}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-white truncate max-w-[200px]">{getTeamName(m.team1_id)}</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">vs</span>
                        <span className="font-bold text-white truncate max-w-[200px]">{getTeamName(m.team2_id)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <select 
                        disabled={!isAdmin || currentDay === "Automático"}
                        value={currentDay}
                        onChange={(e) => handleUpdateSchedule(m.id, e.target.value, currentTime, m.court)}
                        className="bg-navy-950 border border-navy-700 rounded-md px-2 py-1.5 text-white disabled:opacity-50 min-w-[120px]"
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
                        disabled={!isAdmin || currentDay === "A definir" || currentDay === "Automático"}
                        value={currentTime}
                        onChange={(e) => handleUpdateSchedule(m.id, currentDay, e.target.value, m.court)}
                        className="bg-navy-950 border border-navy-700 rounded-md px-2 py-1.5 text-white font-mono disabled:opacity-50"
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
                        disabled={!isAdmin || currentDay === "Automático"}
                        value={m.court || "PP1"}
                        onChange={(e) => handleUpdateSchedule(m.id, currentDay, currentTime, e.target.value)}
                        className="bg-navy-950 border border-navy-700 rounded-md px-2 py-1.5 text-white font-semibold disabled:opacity-50 min-w-[140px]"
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
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${m.status === 'Finalizado' ? 'bg-brand-500/10 text-brand-400' : m.status === 'En Juego' ? 'bg-orange-500/10 text-orange-400' : 'bg-slate-800 text-slate-400'}`}>
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
      </div>
    </section>
  );
}
