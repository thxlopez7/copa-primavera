"use client";

import React from "react";

export default function GroupStandings({ activeZone, activeStandings, getTeamName }) {
  if (!activeZone) return null;

  return (
    <div className="space-y-6">
      <section className="bg-navy-900 border border-navy-800 rounded-3xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-navy-800 bg-navy-950/50">
          <h3 className="font-bold text-white"><i className="fa-solid fa-list-ol text-brand-500 mr-2"></i> Clasificación Actual — {activeZone.name}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-800/50 text-slate-400 border-b border-navy-800">
              <tr>
                <th className="px-4 py-3 font-bold">Pos</th>
                <th className="px-4 py-3 font-bold">Equipo</th>
                <th className="px-4 py-3 font-bold text-center" title="Partidos Jugados">PJ</th>
                <th className="px-4 py-3 font-bold text-center" title="Partidos Ganados">PG</th>
                <th className="px-4 py-3 font-bold text-center" title="Partidos Perdidos">PP</th>
                <th className="px-4 py-3 font-bold text-center" title="Sets a Favor">SF</th>
                <th className="px-4 py-3 font-bold text-center" title="Sets en Contra">SC</th>
                <th className="px-4 py-3 font-bold text-center" title="Diferencia de Games">DIF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800/50">
              {activeStandings.map((stat, idx) => (
                <tr key={stat.id} className={`hover:bg-white/5 transition-colors ${idx < 2 ? 'bg-brand-500/5' : ''}`}>
                  <td className={`px-4 py-3 font-black ${idx < 2 ? 'text-brand-400' : 'text-slate-500'}`}>{idx + 1}</td>
                  <td className="px-4 py-3 font-bold text-white">{getTeamName(stat.id)}</td>
                  <td className="px-4 py-3 text-center text-slate-300 font-bold">{stat.matchesPlayed}</td>
                  <td className="px-4 py-3 text-center text-brand-400 font-bold">{stat.matchesWon}</td>
                  <td className="px-4 py-3 text-center text-orange-400">{stat.matchesLost}</td>
                  <td className="px-4 py-3 text-center text-slate-400">{stat.setsWon}</td>
                  <td className="px-4 py-3 text-center text-slate-400">{stat.setsLost}</td>
                  <td className="px-4 py-3 text-center text-white font-black">{stat.gamesDiff > 0 ? `+${stat.gamesDiff}` : stat.gamesDiff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-navy-900 border border-navy-800 rounded-3xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-navy-800 bg-navy-950/50">
          <h3 className="font-bold text-white"><i className="fa-regular fa-calendar-check text-blue-500 mr-2"></i> Partidos de la Zona</h3>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeZone.matches.map(m => {
            const isFinished = m.status === 'completed' || m.status === 'Finalizado';
            const inProgress = m.status === 'in_progress' || m.status === 'En Juego';
            const t1Score = m.result?.sets?.[0]?.team1 ?? (isFinished ? "0" : "-");
            const t2Score = m.result?.sets?.[0]?.team2 ?? (isFinished ? "0" : "-");

            return (
              <div key={m.id} className="bg-navy-950 border border-navy-800 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{m.round_name}</span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${isFinished ? 'bg-brand-500/10 text-brand-400' : inProgress ? 'bg-orange-500/10 text-orange-400' : 'bg-slate-800 text-slate-400'}`}>
                    {m.status}
                  </span>
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex justify-between items-center bg-navy-900 p-2 rounded-lg border border-navy-800">
                    <span className={`text-xs font-bold truncate max-w-[150px] ${isFinished && m.winner_id === m.team1_id ? 'text-white' : 'text-slate-300'}`}>{getTeamName(m.team1_id)}</span>
                    <span className="font-mono text-brand-400 font-bold text-xs">{t1Score}</span>
                  </div>
                  <div className="flex justify-between items-center bg-navy-900 p-2 rounded-lg border border-navy-800">
                    <span className={`text-xs font-bold truncate max-w-[150px] ${isFinished && m.winner_id === m.team2_id ? 'text-white' : 'text-slate-300'}`}>{getTeamName(m.team2_id)}</span>
                    <span className="font-mono text-brand-400 font-bold text-xs">{t2Score}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
