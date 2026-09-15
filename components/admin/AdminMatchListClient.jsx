"use client";

import { useState, useEffect } from "react";
import ResultModal from "@/components/admin/ResultModal";
import { useSearchParams, useRouter } from "next/navigation";

export default function AdminMatchListClient({ initialCategories, initialPairs, initialMatches }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoMatchId = searchParams.get('match');

  const [selectedCategory, setSelectedCategory] = useState(
    initialCategories && initialCategories.length > 0 ? initialCategories[0].id : ""
  );
  const [filterState, setFilterState] = useState("Programado"); // Programado, Finalizado, ALL
  
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (autoMatchId && initialMatches) {
      const m = initialMatches.find(x => x.id === autoMatchId);
      if (m) {
        setSelectedCategory(m.category_id);
        const matchWithTeams = {
          ...m,
          team1: initialPairs.find(p => p.id === m.team1_id) || null,
          team2: initialPairs.find(p => p.id === m.team2_id) || null
        };
        setSelectedMatch(matchWithTeams);
        setIsModalOpen(true);
      }
    }
  }, [autoMatchId, initialMatches, initialPairs]);

  const categoryMatches = (initialMatches || []).filter(m => m !== null && m.category_id === selectedCategory);
  
  const filteredMatches = categoryMatches.filter(m => {
    if (filterState === "ALL") return true;
    return m.status === filterState;
  }).sort((a, b) => {
    // 1. Priorizar partidos que ya tienen los contrincantes definidos
    const aHasTeams = a.team1_id && a.team2_id ? 0 : 1;
    const bHasTeams = b.team1_id && b.team2_id ? 0 : 1;
    if (aHasTeams !== bHasTeams) {
      return aHasTeams - bHasTeams;
    }
    
    // 2. Secundariamente, ordenar por fecha
    const tA = a.scheduled_at || "A definir";
    const tB = b.scheduled_at || "A definir";
    return tA.localeCompare(tB);
  });

  const getTeamName = (teamId) => {
    if (!teamId) return "Por definir";
    const team = initialPairs.find(p => p.id === teamId);
    return team ? `${team.player1?.last_name || 'J1'} / ${team.player2?.last_name || 'J2'}` : "Por definir";
  };

  const formatRoundName = (roundName) => {
    if (!roundName) return "Ronda";
    if (roundName.includes("FINAL")) return "Final";
    if (roundName.includes("SF")) return "Semifinal";
    if (roundName.includes("QF")) return "Cuartos de Final";
    if (roundName.includes("R16")) return "Octavos de Final";
    if (roundName.includes("R32")) return "Dieciseisavos";
    return roundName;
  };

  const openResultModal = (m) => {
    const matchWithTeams = {
      ...m,
      team1: initialPairs.find(p => p.id === m.team1_id) || null,
      team2: initialPairs.find(p => p.id === m.team2_id) || null
    };
    setSelectedMatch(matchWithTeams);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    setSelectedMatch(null);
    router.refresh();
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Resultados</h1>
          <p className="text-slate-400 font-medium mt-1">Carga resultados. El sistema actualizará todo lo demás automáticamente.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-bold uppercase tracking-widest">Categoría:</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)} 
            className="bg-navy-900 border border-navy-700 text-white font-bold rounded-xl px-4 py-2 text-sm outline-none focus:border-brand-500"
          >
            {initialCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </header>

      <section className="bg-navy-900 border border-navy-800 rounded-3xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-navy-800 bg-navy-950/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="font-bold text-white"><i className="fa-solid fa-pen text-brand-500 mr-2"></i> Partidos Listos para Cargar</h3>
          <div className="flex bg-navy-900 rounded-lg p-1 border border-navy-800">
            {["Programado", "Finalizado", "ALL"].map(state => (
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {filteredMatches.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400">
              <i className="fa-solid fa-check-double text-2xl mb-2 block opacity-50"></i>
              No hay partidos en este estado para esta categoría.
            </div>
          ) : (
            filteredMatches.map(m => {
              const hasTeams = m.team1_id && m.team2_id;
              
              return (
                <div key={m.id} className={`bg-navy-950 border rounded-2xl p-4 flex flex-col justify-between transition-colors ${m.status === 'Finalizado' || m.status === 'completed' ? 'border-brand-500/30' : 'border-navy-800 hover:border-navy-600'}`}>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{formatRoundName(m.round_name)}</span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${m.status === 'Finalizado' || m.status === 'completed' ? 'bg-brand-500/10 text-brand-400' : 'bg-orange-500/10 text-orange-400'}`}>
                        {m.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-bold truncate max-w-[150px] ${(m.status === 'Finalizado' || m.status === 'completed') && m.result?.winner_id === m.team1_id ? 'text-white' : 'text-slate-300'}`}>{getTeamName(m.team1_id)}</span>
                        <span className="font-mono text-brand-400 font-bold text-sm">{(m.result?.sets || []).map(s => s.team1_score).join(' ') || "-"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-bold truncate max-w-[150px] ${(m.status === 'Finalizado' || m.status === 'completed') && m.result?.winner_id === m.team2_id ? 'text-white' : 'text-slate-300'}`}>{getTeamName(m.team2_id)}</span>
                        <span className="font-mono text-brand-400 font-bold text-sm">{(m.result?.sets || []).map(s => s.team2_score).join(' ') || "-"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-navy-800 flex items-center justify-between mt-auto">
                    <span className="text-[10px] text-slate-500 font-medium">{m.scheduled_at || "A definir"}</span>
                    <button 
                      onClick={() => openResultModal(m)}
                      disabled={!hasTeams}
                      className={`font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-colors shadow-sm ${!hasTeams ? 'bg-navy-800 text-slate-500 opacity-50 cursor-not-allowed' : 'bg-brand-500 hover:bg-brand-600 text-navy-950'}`}
                    >
                      {m.status === 'Finalizado' || m.status === 'completed' ? 'Editar Resultado' : 'Cargar Resultado'}
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </section>

      {isModalOpen && (
        <ResultModal 
          onClose={() => { setIsModalOpen(false); setSelectedMatch(null); }} 
          match={selectedMatch} 
          onSuccess={handleSuccess} 
        />
      )}

    </div>
  );
}
