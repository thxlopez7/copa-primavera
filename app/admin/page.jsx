"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { MatchEngine } from "@/lib/domain/MatchEngine";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    teamsCount: 0,
    matchesTotal: 0,
    matchesPlayed: 0,
    matchesPending: 0
  });
  const [attentionRequired, setAttentionRequired] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);

        const { data: pairsData, error: pairsError } = await supabase.from('pairs').select('id, category_id, player1_name, player2_name');
        if (pairsError) throw pairsError;

        const { data: matchesData, error: matchesError } = await supabase.from('matches').select(`
          *,
          category:category_id (name)
        `);
        if (matchesError) throw matchesError;

        // Metrics
        const matchesPlayed = matchesData.filter(m => m.status === 'Finalizado').length;
        const matchesPending = matchesData.filter(m => m.status === 'Programado' || m.status === 'Pendiente').length;
        
        setStats({
          teamsCount: pairsData.length,
          matchesTotal: matchesData.length,
          matchesPlayed,
          matchesPending
        });

        // Attention Required Logic (Simple checks)
        const attention = [];
        const finishedNoResult = matchesData.filter(m => m.status === 'Finalizado' && !m.score_team1 && !m.score_team2);
        if (finishedNoResult.length > 0) {
          attention.push({
            type: 'warning',
            message: `${finishedNoResult.length} partidos marcados como Finalizados no tienen resultado cargado.`,
            action: '/admin/resultados'
          });
        }
        
        const scheduledNoCourt = matchesData.filter(m => m.status === 'Programado' && m.match_datetime !== 'A definir' && m.match_datetime !== 'Automático' && !m.court);
        if (scheduledNoCourt.length > 0) {
          attention.push({
            type: 'warning',
            message: `${scheduledNoCourt.length} partidos programados no tienen cancha asignada.`,
            action: '/admin/fixtures'
          });
        }

        setAttentionRequired(attention);

        // Upcoming Matches
        const getTeamName = (teamId) => {
          if (!teamId) return "Por definir";
          const p = pairsData.find(p => p.id === teamId);
          return p ? `${p.player1_name} / ${p.player2_name}` : "Por definir";
        };

        const upcoming = matchesData
          .filter(m => m.status === 'Programado')
          .sort((a, b) => {
            const tA = a.match_datetime === "A definir" ? "ZZZ" : a.match_datetime;
            const tB = b.match_datetime === "A definir" ? "ZZZ" : b.match_datetime;
            return tA.localeCompare(tB);
          })
          .slice(0, 5)
          .map(m => ({
            ...m,
            team1Name: getTeamName(m.team1_id),
            team2Name: getTeamName(m.team2_id),
          }));

        setUpcomingMatches(upcoming);

      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Dashboard</h1>
          <p className="text-slate-400 font-medium mt-1">Resumen general del torneo.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/fixtures" className="bg-navy-800 hover:bg-navy-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors border border-navy-700 shadow-sm">
            Ver Programación
          </Link>
          <Link href="/admin/resultados" className="bg-brand-500 hover:bg-brand-600 text-navy-950 font-black px-5 py-2 rounded-xl text-sm transition-colors shadow-[0_0_15px_rgba(34,197,94,0.3)]">
            <i className="fa-solid fa-bolt mr-1"></i> Cargar Resultado
          </Link>
        </div>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-navy-900 border border-navy-800 p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <i className="fa-solid fa-users text-4xl text-brand-500"></i>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Equipos Inscritos</p>
          <p className="text-3xl font-black text-white">{stats.teamsCount}</p>
        </div>
        <div className="bg-navy-900 border border-navy-800 p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <i className="fa-solid fa-table text-4xl text-blue-500"></i>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Partidos</p>
          <p className="text-3xl font-black text-white">{stats.matchesTotal}</p>
        </div>
        <div className="bg-navy-900 border border-navy-800 p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <i className="fa-solid fa-check-double text-4xl text-brand-500"></i>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Partidos Jugados</p>
          <p className="text-3xl font-black text-brand-400">{stats.matchesPlayed}</p>
        </div>
        <div className="bg-navy-900 border border-navy-800 p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <i className="fa-solid fa-clock text-4xl text-orange-500"></i>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Partidos Pendientes</p>
          <p className="text-3xl font-black text-orange-400">{stats.matchesPending}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-navy-900 border border-navy-800 rounded-3xl overflow-hidden">
            <div className="p-5 border-b border-navy-800 flex items-center justify-between">
              <h2 className="font-bold text-white"><i className="fa-regular fa-calendar-days text-brand-500 mr-2"></i> Próximos Partidos</h2>
              <Link href="/admin/fixtures" className="text-xs font-bold text-brand-400 hover:text-brand-300">Ver todos</Link>
            </div>
            <div className="divide-y divide-navy-800/50">
              {upcomingMatches.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">
                  No hay partidos programados próximos.
                </div>
              ) : (
                upcomingMatches.map(m => (
                  <div key={m.id} className="p-4 hover:bg-white/5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[9px] font-black bg-navy-950 border border-navy-700 text-slate-400 px-2 py-0.5 rounded-full uppercase">{m.category?.name || "Sin Cat."}</span>
                        <span className="text-[9px] font-black text-brand-500 uppercase">{m.round}</span>
                      </div>
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <span className="text-white truncate max-w-[150px]">{m.team1Name}</span>
                        <span className="text-slate-500 text-[10px] uppercase">vs</span>
                        <span className="text-white truncate max-w-[150px]">{m.team2Name}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-1/3">
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-300">{m.match_datetime}</p>
                        <p className="text-[10px] text-slate-500 font-medium">Cancha: {m.court || "TBD"}</p>
                      </div>
                      <Link href={`/admin/resultados?match=${m.id}`} className="w-8 h-8 rounded-full bg-navy-800 hover:bg-brand-500 hover:text-navy-950 flex items-center justify-center transition-colors border border-navy-700 hover:border-brand-500 text-slate-400">
                        <i className="fa-solid fa-pen text-xs"></i>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <section className="bg-navy-900 border border-navy-800 rounded-3xl overflow-hidden p-5">
            <h2 className="font-bold text-white mb-4"><i className="fa-solid fa-triangle-exclamation text-orange-500 mr-2"></i> Requiere Atención</h2>
            
            {attentionRequired.length === 0 ? (
              <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-check"></i>
                </div>
                <p className="text-xs font-bold text-brand-400 leading-tight">Todo en orden. No hay problemas detectados.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {attentionRequired.map((item, idx) => (
                  <div key={idx} className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 flex flex-col gap-2">
                    <p className="text-xs font-medium text-orange-200 leading-tight">{item.message}</p>
                    {item.action && (
                      <Link href={item.action} className="text-[10px] font-bold text-orange-400 uppercase tracking-widest hover:text-orange-300">
                        Resolver <i className="fa-solid fa-arrow-right ml-1"></i>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-navy-900 border border-navy-800 rounded-3xl p-5 text-center">
             <div className="w-12 h-12 mx-auto bg-navy-950 rounded-full flex items-center justify-center border border-navy-800 mb-3 text-slate-500">
               <i className="fa-solid fa-trophy"></i>
             </div>
             <h3 className="text-sm font-bold text-white mb-1">Estado del Torneo</h3>
             <p className="text-xs text-slate-400 mb-4">El sistema controla la clasificación y las fases automáticamente según los resultados.</p>
             <Link href="/admin/cuadro" className="text-xs font-bold text-brand-400 hover:text-brand-300 underline">Ir al Cuadro Final</Link>
          </section>
        </div>

      </div>
    </div>
  );
}
