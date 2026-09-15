"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { TournamentBuilder } from "@/lib/domain/TournamentBuilder";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ResultModal from "@/components/admin/ResultModal";

function CuadroContent() {
  const searchParams = useSearchParams();
  const autoCategoryId = searchParams.get('category');

  const [categories, setCategories] = useState([]);
  const [pairs, setPairs] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState("");
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
      
      if (autoCategoryId) {
        setSelectedCategory(autoCategoryId);
      } else if (catData && catData.length > 0 && !selectedCategory) {
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
  }, [autoCategoryId]);

  const categoryMatches = useMemo(() => {
    return matches.filter(m => m.category_id === selectedCategory);
  }, [matches, selectedCategory]);

  const graph = useMemo(() => {
    return TournamentBuilder.buildGraph(categoryMatches);
  }, [categoryMatches]);

  const getTeamName = (teamObj, fallbackText) => {
    if (teamObj) return `${teamObj.player1_name} / ${teamObj.player2_name}`;
    return fallbackText;
  };

  const openResultModal = (m) => {
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
          <h1 className="text-3xl font-black text-white tracking-tight">Cuadro Eliminatorio</h1>
          <p className="text-slate-400 font-medium mt-1">Grafo interactivo de la fase final.</p>
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

      {graph.knockout.length === 0 ? (
        <div className="bg-navy-900 border border-navy-800 rounded-3xl p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-navy-950 rounded-full flex items-center justify-center border border-navy-800 text-slate-600 mb-4 text-2xl">
            <i className="fa-solid fa-sitemap"></i>
          </div>
          <h2 className="text-white font-bold text-lg mb-2">Cuadro no generado</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-md">Esta categoría no tiene su cuadro eliminatorio generado aún.</p>
          <Link href="/admin/fixtures" className="bg-brand-500 hover:bg-brand-600 text-navy-950 font-black px-5 py-2.5 rounded-xl text-sm transition-colors shadow-[0_0_15px_rgba(34,197,94,0.3)]">
            Ir al Generador
          </Link>
        </div>
      ) : (
        <section className="bg-navy-900 border border-navy-800 rounded-3xl p-6 overflow-hidden shadow-lg">
          <div className="bg-navy-950 border border-navy-800 rounded-2xl p-4 overflow-x-auto scroll-smooth touch-pan-x min-h-[500px]">
            <div className="flex gap-12 py-4 px-2 min-w-max">
              {graph.knockout.map(round => (
                <div key={round.id} className="flex flex-col justify-around min-w-[280px] space-y-6">
                  <div className="text-center mb-6">
                    <span className="bg-navy-900 text-brand-400 text-xs font-black px-4 py-1.5 rounded-full border border-navy-800 uppercase tracking-widest shadow-md">
                      {round.name}
                    </span>
                  </div>
                  
                  {round.matches.map(m => {
                    const isPlaying = m.status === "En Juego";
                    const isFinished = m.status === "Finalizado";
                    const isWO = m.score_team1 === "W.O." || m.score_team2 === "W.O.";
                    const team1 = pairs.find(p => p.id === m.team1_id);
                    const team2 = pairs.find(p => p.id === m.team2_id);
                    
                    return (
                      <div key={m.id} className={`bg-navy-900 border rounded-xl p-4 relative transition-all group ${isPlaying ? 'border-brand-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'border-navy-700 hover:border-navy-500'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] text-slate-400 font-bold bg-navy-950 px-2 py-0.5 rounded border border-navy-800">Partido {m.metadata.position}</span>
                          <div className="flex items-center gap-1">
                            {isPlaying && <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.8)]"></span>}
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${isFinished ? 'bg-brand-500/10 text-brand-500' : isPlaying ? 'bg-orange-500/10 text-orange-400' : 'bg-slate-800 text-slate-500'}`}>
                              {isWO ? 'W.O.' : m.status}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className={`flex justify-between items-center bg-navy-950 p-2 rounded-lg border ${isFinished && m.score_team1 !== "W.O." && m.score_team1 > m.score_team2 ? 'border-brand-500/30 bg-brand-500/5' : 'border-navy-800'}`}>
                            <span className={`font-bold truncate max-w-[170px] ${isFinished && m.score_team1 !== "W.O." && m.score_team1 > m.score_team2 ? 'text-white' : 'text-slate-300'}`}>
                              {getTeamName(team1, m.metadata.sourceLabel1)}
                            </span>
                            <span className="font-mono text-brand-400 font-bold ml-2">{m.score_team1 || "-"}</span>
                          </div>
                          <div className={`flex justify-between items-center bg-navy-950 p-2 rounded-lg border ${isFinished && m.score_team2 !== "W.O." && m.score_team2 > m.score_team1 ? 'border-brand-500/30 bg-brand-500/5' : 'border-navy-800'}`}>
                            <span className={`font-bold truncate max-w-[170px] ${isFinished && m.score_team2 !== "W.O." && m.score_team2 > m.score_team1 ? 'text-white' : 'text-slate-300'}`}>
                              {getTeamName(team2, m.metadata.sourceLabel2)}
                            </span>
                            <span className="font-mono text-brand-400 font-bold ml-2">{m.score_team2 || "-"}</span>
                          </div>
                        </div>

                        <button onClick={() => openResultModal(m)} className="w-full mt-3 bg-navy-950 border border-navy-700 text-slate-400 hover:text-white hover:border-brand-500 hover:bg-brand-500/10 text-[10px] font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                          <i className="fa-solid fa-pen"></i> {isFinished ? 'Modificar Resultado' : 'Cargar Resultado'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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

export default function CuadroAdmin() {
  return (
    <Suspense fallback={<div className="p-10 flex justify-center items-center h-full"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <CuadroContent />
    </Suspense>
  );
}
