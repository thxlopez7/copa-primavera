"use client";

import React, { useState } from "react";
import ScheduleModal from "./ScheduleModal";
import ResultModal from "./ResultModal";

export default function MatchManagerCard({ match }) {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);

  if (!match) return null;

  const getTeamName = (teamObj) => {
    if (!teamObj) return "Por definir";
    if (teamObj?.player1 || teamObj?.player2) {
      return `${teamObj.player1?.last_name || 'J1'} / ${teamObj.player2?.last_name || 'J2'}`;
    }
    return teamObj.name || "Equipo";
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

  const isCompleted = match.status === 'completed' || match.status === 'walkover' || match.status === 'Finalizado' || match.status === 'W.O.';
  const hasTeams = match.team1_id && match.team2_id;
  
  return (
    <>
      <div className={`bg-navy-900 border rounded-2xl overflow-hidden shadow-lg flex flex-col transition-all hover:border-navy-700
        ${isCompleted ? 'border-navy-800 opacity-80' : 'border-brand-500/20'}
      `}>
        
        {/* Cabecera info del partido */}
        <div className="bg-navy-950/80 px-4 py-3 border-b border-navy-800 flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-brand-500 uppercase tracking-wider block">
              {match.category?.name || "Categoría"} • {match.phase === 'group' ? 'Fase de Grupos' : 'Llave Eliminatoria'}
            </span>
            <span className="text-sm font-medium text-slate-300">
              {formatRoundName(match.round_name) || match.round || 'Jornada'}
            </span>
          </div>
          <div className="text-right">
            <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider ${
              match.status === 'in_progress' || match.status === 'En Juego' ? 'bg-red-500/20 text-red-400' :
              isCompleted ? 'bg-brand-500/10 text-brand-500' :
              'bg-navy-800 text-slate-400'
            }`}>
              {match.status}
            </span>
          </div>
        </div>

        {/* Equipos */}
        <div className="p-4 flex-1 flex flex-col justify-center gap-2">
          <div className="flex items-center justify-between bg-navy-950 px-3 py-2 rounded-lg border border-navy-800">
            <span className="font-bold text-white truncate max-w-[200px]">
              {getTeamName(match.team1)}
            </span>
            {isCompleted && match.result?.sets && (
              <span className="text-brand-400 font-mono font-bold text-sm">
                {match.result.sets.map(s => s.team1_score).join(' ')}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between bg-navy-950 px-3 py-2 rounded-lg border border-navy-800">
            <span className="font-bold text-white truncate max-w-[200px]">
              {getTeamName(match.team2)}
            </span>
            {isCompleted && match.result?.sets && (
              <span className="text-brand-400 font-mono font-bold text-sm">
                {match.result.sets.map(s => s.team2_score).join(' ')}
              </span>
            )}
          </div>
        </div>

        {/* Detalles de Programación */}
        <div className="px-4 pb-4 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
            <i className="fa-regular fa-clock text-brand-500"></i>
            {match.scheduled_at && match.scheduled_at !== 'A definir' ? new Date(match.scheduled_at).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Sin Fecha'}
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <i className="fa-solid fa-location-dot text-brand-500"></i>
            {match.court || 'Sin Cancha'}
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="grid grid-cols-2 border-t border-navy-800">
          <button 
            onClick={() => setShowScheduleModal(true)}
            disabled={!hasTeams}
            className={`py-3 text-sm font-bold transition-colors border-r border-navy-800 ${!hasTeams ? 'text-slate-500 opacity-50 cursor-not-allowed' : 'text-slate-300 hover:text-white hover:bg-navy-800'}`}
          >
            <i className="fa-regular fa-calendar-days mr-2 text-brand-500"></i>
            Programar
          </button>
          
          <button 
            onClick={() => setShowResultModal(true)}
            disabled={!hasTeams}
            className={`py-3 text-sm font-bold transition-colors ${!hasTeams ? 'text-slate-500 opacity-50 cursor-not-allowed' : 'text-slate-300 hover:text-white hover:bg-navy-800'}`}
          >
            <i className="fa-solid fa-pen mr-2 text-brand-500"></i>
            Resultado
          </button>
        </div>
      </div>

      {showScheduleModal && (
        <ScheduleModal match={match} onClose={() => setShowScheduleModal(false)} />
      )}
      
      {showResultModal && (
        <ResultModal match={match} onClose={() => setShowResultModal(false)} />
      )}
    </>
  );
}
