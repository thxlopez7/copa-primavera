"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useScrollLock } from "@/hooks/useScrollLock";
import { MatchEngine } from "@/lib/domain/MatchEngine";

export default function EditMatchModal({ isOpen, onClose, match, isAdmin, onSuccess }) {
  const [sets, setSets] = useState([
    { t1: "", t2: "" },
    { t1: "", t2: "" },
    { t1: "", t2: "" }
  ]);
  const [isWO, setIsWO] = useState(false);
  const [winnerWO, setWinnerWO] = useState(null); // 1 o 2
  
  const [status, setStatus] = useState("Programado");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // States for confirmation step
  const [showConfirm, setShowConfirm] = useState(false);
  const [tempFinalScore1, setTempFinalScore1] = useState("");
  const [tempFinalScore2, setTempFinalScore2] = useState("");
  const [tempWinnerId, setTempWinnerId] = useState(null);
  const [hasDescendants, setHasDescendants] = useState(false);

  useScrollLock(isOpen);

  useEffect(() => {
    if (match) {
      // Reset defaults
      setSets([{ t1: "", t2: "" }, { t1: "", t2: "" }, { t1: "", t2: "" }]);
      setIsWO(false);
      setWinnerWO(null);
      setShowConfirm(false);
      setHasDescendants(false);

      // Parse existing score
      if (match.score_team1 === "W.O." || match.score_team2 === "W.O.") {
        setIsWO(true);
        setWinnerWO(match.score_team1 === "W.O." ? 1 : 2);
      } else if (match.score_team1) {
        const parsedSets = [{ t1: "", t2: "" }, { t1: "", t2: "" }, { t1: "", t2: "" }];
        const parts = match.score_team1.split(' ');
        parts.forEach((part, i) => {
          if (i < 3) {
            const scores = part.split('-');
            if (scores.length >= 2) {
              parsedSets[i].t1 = scores[0];
              parsedSets[i].t2 = scores[1];
            }
          }
        });
        setSets(parsedSets);
      }
      
      setStatus(match.status || "Programado");

      // Verificar si ya tiene descendientes que hayan avanzado
      if (match.next_match_id && match.status === "Finalizado") {
        supabase.from('matches').select('*').eq('id', match.next_match_id).single()
          .then(({ data }) => {
            if (data && (data.status === "Finalizado" || data.score_team1)) {
              setHasDescendants(true);
            }
          });
      }
    }
  }, [match]);

  if (!isOpen || !match) return null;

  const updateSet = (index, team, value) => {
    if (value !== "" && !/^\d+$/.test(value)) return;
    if (value.length > 2) return;
    const newSets = [...sets];
    newSets[index][team] = value;
    setSets(newSets);
  };

  const handleSetWO = (winner) => {
    setIsWO(true);
    setWinnerWO(winner);
    setStatus("Finalizado");
  };

  const clearWO = () => {
    setIsWO(false);
    setWinnerWO(null);
  };

  const handleInitialSave = () => {
    if (!isAdmin) {
      alert("Necesitás ingresar como administrador.");
      return;
    }

    let finalScore1 = "";
    let finalScore2 = "";

    if (isWO) {
      finalScore1 = winnerWO === 1 ? "W.O." : "-";
      finalScore2 = winnerWO === 2 ? "W.O." : "-";
    } else {
      const validSets = sets.filter(s => s.t1 !== "" && s.t2 !== "");
      finalScore1 = validSets.map(s => `${s.t1}-${s.t2}`).join(' ');
      finalScore2 = validSets.map(s => `${s.t2}-${s.t1}`).join(' ');
    }

    setTempFinalScore1(finalScore1);
    setTempFinalScore2(finalScore2);

    if (status === "Finalizado" || hasDescendants) {
      const winnerId = MatchEngine.determineWinner(match, finalScore1, finalScore2);
      setTempWinnerId(winnerId);
      setShowConfirm(true);
    } else {
      executeSave(finalScore1, finalScore2, null);
    }
  };

  const executeSave = async (f1, f2, winnerId) => {
    setIsSubmitting(true);
    try {
      // Usamos match_datetime y court que ya estén, ya no se editan aquí, sino en TabProgramacion
      const { error } = await supabase
        .from('matches')
        .update({
          score_team1: f1 || null,
          score_team2: f2 || null,
          status: status
        })
        .eq('id', match.id);

      if (error) {
        console.error("Error DB:", error.message, error.details);
        alert("Error DB: " + error.message);
        throw error;
      }

      // Propagación Dominio DAG
      if (match.round.startsWith("KO_")) {
        if (status === "Finalizado") {
          if (winnerId) {
            await MatchEngine.propagateForward(match, winnerId);
          }
        } else {
          await MatchEngine.revertPropagation(match);
        }
      }

      if (onSuccess) {
        await onSuccess();
      }
      onClose();
    } catch (error) {
      console.error("Error al actualizar partido:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const team1Name = match.team1 ? `${match.team1.player1_name} / ${match.team1.player2_name}` : `A definir (1)`;
  const team2Name = match.team2 ? `${match.team2.player1_name} / ${match.team2.player2_name}` : `A definir (2)`;

  let tempWinnerName = "Nadie";
  if (tempWinnerId === match.team1_id) tempWinnerName = team1Name;
  if (tempWinnerId === match.team2_id) tempWinnerName = team2Name;

  return (
    <div className="fixed inset-0 bg-navy-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl max-h-[95vh] overflow-y-auto">
        
        {!showConfirm ? (
          <>
            <div>
              <span className="text-brand-500 text-[10px] font-bold uppercase block">{match.round}</span>
              <h3 className="text-lg font-bold text-white">Cargar Resultado</h3>
            </div>

            <div className="space-y-4">
              {/* GRILLA DE SETS INTUITIVA */}
              <div className="bg-navy-900 border border-navy-700 rounded-xl p-3">
                {!isWO && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-[1fr_40px_40px_40px] gap-2 items-center mb-1 text-center">
                      <div></div>
                      <span className="text-[10px] font-bold text-slate-400">S1</span>
                      <span className="text-[10px] font-bold text-slate-400">S2</span>
                      <span className="text-[10px] font-bold text-slate-400">S3</span>
                    </div>
                    
                    <div className="grid grid-cols-[1fr_40px_40px_40px] gap-2 items-center">
                      <span className="font-bold text-xs text-white truncate pr-2">{team1Name}</span>
                      {sets.map((s, i) => (
                        <input key={`t1-${i}`} type="text" value={s.t1} onChange={e => updateSet(i, 't1', e.target.value)}
                          className="w-full bg-navy-800 border border-navy-700 rounded-md py-1.5 text-center text-white font-mono font-bold text-xs outline-none focus:border-brand-500" />
                      ))}
                    </div>
                    <div className="grid grid-cols-[1fr_40px_40px_40px] gap-2 items-center">
                      <span className="font-bold text-xs text-white truncate pr-2">{team2Name}</span>
                      {sets.map((s, i) => (
                        <input key={`t2-${i}`} type="text" value={s.t2} onChange={e => updateSet(i, 't2', e.target.value)}
                          className="w-full bg-navy-800 border border-navy-700 rounded-md py-1.5 text-center text-white font-mono font-bold text-xs outline-none focus:border-brand-500" />
                      ))}
                    </div>
                  </div>
                )}

                {isWO && (
                  <div className="text-center py-6 border border-dashed border-brand-500/50 rounded-lg bg-brand-500/5">
                    <h4 className="text-brand-500 font-bold mb-1"><i className="fa-solid fa-trophy mr-1"></i> Partido resuelto por W.O.</h4>
                    <p className="text-xs text-white">Ganador: <strong className="text-brand-400">{winnerWO === 1 ? team1Name : team2Name}</strong></p>
                    <button onClick={clearWO} className="mt-3 text-[10px] text-slate-400 hover:text-white underline">Restablecer a carga por sets</button>
                  </div>
                )}
                
                {!isWO && (
                  <div className="mt-4 pt-3 border-t border-navy-800 grid grid-cols-2 gap-2">
                    <button onClick={() => handleSetWO(1)} className="text-[9px] font-bold text-orange-400 border border-dashed border-orange-400/30 rounded py-1 hover:bg-orange-400/10 transition-colors">
                      Ganó W.O. (Eq 1)
                    </button>
                    <button onClick={() => handleSetWO(2)} className="text-[9px] font-bold text-orange-400 border border-dashed border-orange-400/30 rounded py-1 hover:bg-orange-400/10 transition-colors">
                      Ganó W.O. (Eq 2)
                    </button>
                  </div>
                )}
              </div>

              <div className="text-xs">
                <label className="text-[10px] text-slate-400 block mb-0.5">Estado del Partido:</label>
                <select 
                  value={status} 
                  onChange={e => setStatus(e.target.value)}
                  className="w-full bg-navy-800 border border-navy-700 rounded-lg px-2.5 py-1.5 text-white font-semibold"
                >
                  <option value="Programado">Programado</option>
                  <option value="En Juego">En Juego</option>
                  <option value="Finalizado">Finalizado</option>
                </select>
              </div>

              <div className="pt-2 space-y-2">
                <button 
                  onClick={handleInitialSave} 
                  disabled={isSubmitting}
                  className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 text-navy-950 font-bold py-2.5 rounded-xl text-xs transition shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                >
                  Guardar Resultado
                </button>
                <button onClick={onClose} disabled={isSubmitting} className="w-full bg-transparent text-slate-400 hover:text-white py-1 text-xs">
                  Cancelar
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4 text-center">
            <h3 className="text-xl font-bold text-white mb-2">Confirmar Resultado</h3>
            
            <div className="bg-navy-900 border border-navy-700 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">El ganador del encuentro es:</p>
              <p className="text-lg font-bold text-brand-400">{tempWinnerName}</p>
              
              {status === "Finalizado" && match.round.startsWith("KO_") && (
                <p className="text-xs text-brand-500 mt-2 border-t border-navy-700 pt-2">
                  <i className="fa-solid fa-arrow-right mr-1"></i> Avanzará automáticamente a la siguiente ronda.
                </p>
              )}
            </div>

            {hasDescendants && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-left">
                <p className="text-xs font-bold text-red-400 mb-1"><i className="fa-solid fa-triangle-exclamation mr-1"></i> ¡Cuidado! Reversión Profunda</p>
                <p className="text-[10px] text-slate-300">Este partido ya afecta rondas posteriores (Cuartos, Semis o Final). Modificar el resultado causará que los participantes futuros de esa rama sean eliminados y deban reconstruirse. ¿Deseas continuar?</p>
              </div>
            )}

            <div className="pt-4 space-y-2">
              <button 
                onClick={() => executeSave(tempFinalScore1, tempFinalScore2, tempWinnerId)} 
                disabled={isSubmitting}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 text-navy-950 font-bold py-2.5 rounded-xl text-xs transition shadow-[0_0_15px_rgba(34,197,94,0.3)]"
              >
                {isSubmitting ? "Guardando..." : "Confirmar y Propagar"}
              </button>
              <button onClick={() => setShowConfirm(false)} disabled={isSubmitting} className="w-full bg-transparent text-slate-400 hover:text-white py-1 text-xs">
                Atrás
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
