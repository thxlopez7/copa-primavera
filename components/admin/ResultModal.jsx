"use client";

import React, { useState } from "react";
import { updateMatchResult } from "@/lib/actions/match.actions";

export default function ResultModal({ match, onClose, onSuccess }) {
  const [sets, setSets] = useState([
    { team1_score: "", team2_score: "" },
    { team1_score: "", team2_score: "" },
    { team1_score: "", team2_score: "" },
  ]);
  const [isWalkover, setIsWalkover] = useState(false);
  const [woWinnerId, setWoWinnerId] = useState("");
  const [loading, setLoading] = useState(false);

  if (!match) return null;

  const getTeamName = (teamObj) => {
    if (!teamObj) return "Por definir";
    if (teamObj?.player1 || teamObj?.player2) {
      return `${teamObj.player1?.last_name || 'J1'} / ${teamObj.player2?.last_name || 'J2'}`;
    }
    return teamObj.name || "Equipo";
  };

  const t1Name = getTeamName(match?.team1);
  const t2Name = getTeamName(match?.team2);

  const handleScoreChange = (setIndex, field, value) => {
    const newSets = [...sets];
    // Permitir vacío para borrar, si no parsear a entero
    newSets[setIndex][field] = value === "" ? "" : parseInt(value) || 0;
    setSets(newSets);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Filtramos los sets que realmente se jugaron (ambos scores numéricos)
    const playedSets = sets.filter(
      s => typeof s.team1_score === 'number' && typeof s.team2_score === 'number'
    );

    // Armamos el JSONB requerido por el motor de dominio
    const resultJson = {
      sets: playedSets,
      winner_id: isWalkover ? woWinnerId : null,
      is_walkover: isWalkover
    };

    const res = await updateMatchResult(match?.id, resultJson);
    
    if (res.success) {
      onClose();
      if (onSuccess) onSuccess();
    } else {
      alert("Error al guardar resultado: " + res.error);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in-up">
      <div className="bg-navy-900 border border-navy-700 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-navy-800 hover:bg-navy-700 text-slate-400 hover:text-white transition-colors"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="mb-8">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center text-xl mb-4">
            <i className="fa-solid fa-table-tennis-paddle-ball"></i>
          </div>
          <h3 className="text-2xl font-black text-white">Cargar Resultado</h3>
          <p className="text-slate-400 text-sm mt-1">
            Ingresa los games por set. El sistema calculará automáticamente al ganador y lo avanzará si es necesario.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Cabecera del Marcador */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            <div>Equipos</div>
            <div className="w-12 text-center">S1</div>
            <div className="w-12 text-center">S2</div>
            <div className="w-12 text-center">S3</div>
          </div>

          {/* Fila Equipo 1 */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
            <div className="bg-navy-950 px-4 py-3 rounded-xl border border-navy-800 font-bold text-white truncate">
              {t1Name}
            </div>
            {[0, 1, 2].map(idx => (
              <input
                key={`t1-s${idx}`}
                type="number"
                min="0"
                max="7"
                value={sets[idx].team1_score}
                onChange={(e) => handleScoreChange(idx, 'team1_score', e.target.value)}
                disabled={loading || isWalkover}
                className="w-12 h-12 bg-navy-950 border border-navy-700 rounded-xl text-center text-white font-bold focus:outline-none focus:border-brand-500 transition-colors disabled:opacity-50"
              />
            ))}
          </div>

          {/* Fila Equipo 2 */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
            <div className="bg-navy-950 px-4 py-3 rounded-xl border border-navy-800 font-bold text-white truncate">
              {t2Name}
            </div>
            {[0, 1, 2].map(idx => (
              <input
                key={`t2-s${idx}`}
                type="number"
                min="0"
                max="7"
                value={sets[idx].team2_score}
                onChange={(e) => handleScoreChange(idx, 'team2_score', e.target.value)}
                disabled={loading || isWalkover}
                className="w-12 h-12 bg-navy-950 border border-navy-700 rounded-xl text-center text-white font-bold focus:outline-none focus:border-brand-500 transition-colors disabled:opacity-50"
              />
            ))}
          </div>

          {/* Walkover */}
          <div className="pt-4 border-t border-navy-800">
            <label className="flex items-center gap-3 cursor-pointer group w-fit mb-3">
              <input
                type="checkbox"
                checked={isWalkover}
                onChange={(e) => {
                  setIsWalkover(e.target.checked);
                  if (e.target.checked && match?.team1_id) setWoWinnerId(match.team1_id);
                }}
                className="w-5 h-5 accent-red-500 rounded bg-navy-800 border-navy-700"
              />
              <span className="text-slate-300 font-medium group-hover:text-white transition-colors">
                Marcar como Walkover (W.O.)
              </span>
            </label>
            
            {isWalkover && (
              <div className="pl-8 space-y-3">
                <p className="text-xs text-orange-400 font-bold mb-2">Selecciona el ganador por W.O.:</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="woWinner" 
                    value={match?.team1_id || ""} 
                    checked={woWinnerId === match?.team1_id}
                    onChange={(e) => setWoWinnerId(e.target.value)}
                    className="accent-brand-500 w-4 h-4"
                  />
                  <span className="text-slate-300 text-sm">{t1Name}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="woWinner" 
                    value={match?.team2_id || ""} 
                    checked={woWinnerId === match?.team2_id}
                    onChange={(e) => setWoWinnerId(e.target.value)}
                    className="accent-brand-500 w-4 h-4"
                  />
                  <span className="text-slate-300 text-sm">{t2Name}</span>
                </label>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:bg-navy-800 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-brand-500 hover:bg-brand-400 text-navy-950 font-black py-3 rounded-xl transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
            >
              {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : "Guardar y Procesar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
