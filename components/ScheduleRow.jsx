import React from "react";
import Link from "next/link";

export default function ScheduleRow({ match }) {
  if (!match) return null;

  const {
    id,
    category_name = "Categoría",
    round_name = "Ronda",
    status = "scheduled",
    scheduled_at = "A definir",
    court = "A definir",
    team1 = null,
    team2 = null
  } = match;

  const renderTeamName = (team) => {
    if (!team) return <span className="text-slate-500 italic">Por definir</span>;
    if (team?.player1 || team?.player2) {
      return (
        <span className="font-bold text-white">
          {team.player1?.last_name || 'J1'} <span className="text-slate-400 font-normal">/</span> {team.player2?.last_name || 'J2'}
        </span>
      );
    }
    return <span className="font-bold text-white">{team.name || "Equipo"}</span>;
  };

  // Solo parseamos la hora, ya que la fecha agrupa el bloque superior
  const extractTime = (datetimeStr) => {
    if (!datetimeStr || datetimeStr === "A definir") return "--:--";
    // Si viene como "Sábado 15 - 21:00", podríamos extraer el final.
    // Si es ISO 8601, parsear. Asumiremos que el string puede contener una hora al final o ser ISO.
    if (datetimeStr.includes("T")) {
      return new Date(datetimeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const parts = datetimeStr.split('-');
    return parts.length > 1 ? parts[parts.length - 1].trim() : datetimeStr;
  };

  const timeStr = extractTime(scheduled_at);

  return (
    <Link href={`/partido/${id}`} className="block group">
      <div className="bg-navy-900 border border-navy-700/50 hover:border-brand-500/50 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
        
        {/* Hora y Cancha */}
        <div className="flex items-center gap-4 min-w-[120px]">
          <div className="flex flex-col">
            <span className="text-brand-400 font-black text-lg">{timeStr}</span>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{court}</span>
          </div>
          {status === 'in_progress' && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-2" title="En vivo"></span>
          )}
        </div>

        {/* Equipos */}
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-center gap-2 sm:gap-6 text-sm">
          <div className="flex-1 text-left sm:text-right truncate">
            {renderTeamName(team1)}
          </div>
          <div className="hidden sm:flex w-6 h-6 rounded-full bg-navy-800 items-center justify-center text-slate-500 text-[10px] font-black shrink-0">
            VS
          </div>
          <div className="sm:hidden text-slate-500 text-xs font-black">VS</div>
          <div className="flex-1 text-left truncate">
            {renderTeamName(team2)}
          </div>
        </div>

        {/* Categoría e Ícono */}
        <div className="flex items-center justify-between md:justify-end gap-4 min-w-[140px] border-t md:border-t-0 border-navy-800 pt-3 md:pt-0 mt-1 md:mt-0">
          <div className="flex flex-col text-left md:text-right">
            <span className="text-slate-300 font-bold text-xs">{category_name}</span>
            <span className="text-slate-500 text-[10px] uppercase">{round_name}</span>
          </div>
          <i className="fa-solid fa-chevron-right text-navy-600 group-hover:text-brand-500 transition-colors"></i>
        </div>

      </div>
    </Link>
  );
}
