"use client";

import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import ResultModal from "@/components/admin/ResultModal";
import { useSearchParams } from "next/navigation";

function ResultadosContent() {
  const searchParams = useSearchParams();
  const autoMatchId = searchParams.get('match');

  const [categories, setCategories] = useState([]);
  const [pairs, setPairs] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [filterState, setFilterState] = useState("Programado"); // Programado, Finalizado, ALL
  
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

      // Si venimos con id en query param, autoseleccionamos ese match
      if (autoMatchId && matchesData) {
        const m = matchesData.find(x => x.id === autoMatchId);
        if (m) {
          setSelectedCategory(m.category_id);
          setSelectedMatch(m);
          setIsModalOpen(true);
          return; // Saltamos la selección default
        }
      }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMatchId]);

  const categoryMatches = matches.filter(m => m.category_id === selectedCategory);
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

  const openResultModal = (m) => {
    // Add nested teams objects for the modal to use
    const matchWithTeams = {
      ...m,
      team1: pairs.find(p => p.id === m.team1_id) || null,
      team2: pairs.find(p => p.id === m.team2_id) || null
    };
    setSelectedMatch(matchWithTeams);
    setIsModalOpen(true);
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
            {categories.map(cat => (
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
            filteredMatches.map(m => (
              <div key={m.id} className={`bg-navy-950 border rounded-2xl p-4 flex flex-col justify-between transition-colors ${m.status === 'Finalizado' ? 'border-brand-500/30' : 'border-navy-800 hover:border-navy-600'}`}>
                
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{m.round}</span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${m.status === 'Finalizado' ? 'bg-brand-500/10 text-brand-400' : 'bg-orange-500/10 text-orange-400'}`}>
                      {m.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-bold truncate max-w-[150px] ${m.status === 'Finalizado' && m.score_team1 !== "W.O." && m.score_team1 > m.score_team2 ? 'text-white' : 'text-slate-300'}`}>{getTeamName(m.team1_id)}</span>
                      <span className="font-mono text-brand-400 font-bold text-sm">{m.score_team1 || "-"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-bold truncate max-w-[150px] ${m.status === 'Finalizado' && m.score_team2 !== "W.O." && m.score_team2 > m.score_team1 ? 'text-white' : 'text-slate-300'}`}>{getTeamName(m.team2_id)}</span>
                      <span className="font-mono text-brand-400 font-bold text-sm">{m.score_team2 || "-"}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-navy-800 flex items-center justify-between mt-auto">
                  <span className="text-[10px] text-slate-500 font-medium">{m.match_datetime}</span>
                  <button 
                    onClick={() => openResultModal(m)}
                    className="bg-brand-500 hover:bg-brand-600 text-navy-950 font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-colors shadow-sm"
                  >
                    {m.status === 'Finalizado' ? 'Editar Resultado' : 'Cargar Resultado'}
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      </section>

      <ResultModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedMatch(null); }} 
        match={selectedMatch} 
        isAdmin={true} 
        onSuccess={loadData} 
      />

    </div>
  );
}

export default function ResultadosAdmin() {
  return (
    <Suspense fallback={<div className="p-10 flex justify-center items-center h-full"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <ResultadosContent />
    </Suspense>
  );
}
