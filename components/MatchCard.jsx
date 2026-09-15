import React from "react";

export default function MatchCard({ match }) {
  if (!match) return null;

  const {
    category_name = "Categoría",
    round_name = "Ronda",
    status = "scheduled",
    scheduled_at = "A definir",
    court = "A definir",
    result = null,
    team1 = null,
    team2 = null
  } = match;

  // Renderizadores de Equipo
  const renderTeamName = (team) => {
    if (!team) return <span className="text-slate-500 italic text-sm">Por definir</span>;
    if (team?.player1 || team?.player2) {
      return (
        <span className="text-white font-bold text-sm truncate">
          {team.player1?.last_name || 'J1'} <span className="text-slate-400 font-normal">/</span> {team.player2?.last_name || 'J2'}
        </span>
      );
    }
    // Fallback si trae un nombre de equipo unificado
    return <span className="text-white font-bold text-sm truncate">{team.name || "Equipo"}</span>;
  };

  const isCompleted = status === 'completed' || status === 'Finalizado';
  const isWalkover = result?.is_walkover || status === 'walkover';
  const winnerId = result?.winner_id;

  const isTeam1Winner = isCompleted && winnerId && team1 && winnerId === team1.id;
  const isTeam2Winner = isCompleted && winnerId && team2 && winnerId === team2.id;

  return (
    <div className="bg-navy-900 border border-navy-700/50 rounded-xl overflow-hidden shadow-lg flex flex-col w-full max-w-sm transition-all hover:border-navy-600">
      
      {/* Header: Categoría, Ronda y Estado */}
      <div className="bg-navy-950/50 px-4 py-2 border-b border-navy-800/80 flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider font-black text-brand-500">
            {category_name}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            {round_name}
          </span>
        </div>
        <div>
          {status === 'scheduled' && (
            <span className="bg-navy-800 text-slate-400 text-xs px-2 py-1 rounded font-bold uppercase tracking-wider">Por jugar</span>
          )}
          {status === 'in_progress' && (
            <span className="text-[10px] font-bold text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-1 rounded-md flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              En vivo
            </span>
          )}
          {isWalkover && (
            <span className="text-[10px] font-bold text-orange-400 bg-orange-400/10 border border-orange-400/20 px-2 py-1 rounded-md">
              W.O.
            </span>
          )}
          {isCompleted && !isWalkover && (
            <span className="text-[10px] font-bold text-brand-400 bg-brand-400/10 border border-brand-400/20 px-2 py-1 rounded-md">
              Finalizado
            </span>
          )}
        </div>
      </div>

      {/* Body: Equipos y Resultado */}
      <div className="p-4 flex flex-col gap-3">
        {/* Equipo 1 */}
        <div className="flex justify-between items-center">
          <div className={`flex items-center gap-2 flex-1 min-w-0 ${isTeam2Winner ? 'opacity-50' : ''}`}>
            {isTeam1Winner && <i className="fa-solid fa-caret-right text-brand-500 text-xs"></i>}
            {!isTeam1Winner && <div className="w-2"></div>}
            <div className="flex-1 min-w-0">
              {renderTeamName(team1)}
            </div>
          </div>
          
          {/* Sets Equipo 1 */}
          <div className="flex gap-1.5 ml-3">
            {isCompleted && result?.sets?.map((set, idx) => (
              <div key={idx} className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold ${set.team1_score > set.team2_score ? 'bg-brand-500/20 text-brand-400' : 'bg-navy-800 text-slate-400'}`}>
                {set.team1_score}
              </div>
            ))}
            {isWalkover && isTeam1Winner && (
              <div className="text-xs font-black text-brand-500 ml-1 flex items-center">W</div>
            )}
          </div>
        </div>

        {/* Separador sutil */}
        <div className="h-px w-full bg-navy-800/50"></div>

        {/* Equipo 2 */}
        <div className="flex justify-between items-center">
          <div className={`flex items-center gap-2 flex-1 min-w-0 ${isTeam1Winner ? 'opacity-50' : ''}`}>
            {isTeam2Winner && <i className="fa-solid fa-caret-right text-brand-500 text-xs"></i>}
            {!isTeam2Winner && <div className="w-2"></div>}
            <div className="flex-1 min-w-0">
              {renderTeamName(team2)}
            </div>
          </div>
          
          {/* Sets Equipo 2 */}
          <div className="flex gap-1.5 ml-3">
            {isCompleted && result?.sets?.map((set, idx) => (
              <div key={idx} className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold ${set.team2_score > set.team1_score ? 'bg-brand-500/20 text-brand-400' : 'bg-navy-800 text-slate-400'}`}>
                {set.team2_score}
              </div>
            ))}
            {isWalkover && isTeam2Winner && (
              <div className="text-xs font-black text-brand-500 ml-1 flex items-center">W</div>
            )}
          </div>
        </div>
      </div>

      {/* Footer: Fecha y Cancha */}
      <div className="bg-navy-950/30 px-4 py-2 border-t border-navy-800 flex justify-between items-center text-[10px] text-slate-400 font-medium">
        <div className="flex items-center gap-1.5">
          <i className="fa-regular fa-calendar"></i>
          {scheduled_at || "A definir"}
        </div>
        <div className="flex items-center gap-1.5">
          <i className="fa-solid fa-location-dot"></i>
          {court || "A definir"}
        </div>
      </div>

    </div>
  );
}
