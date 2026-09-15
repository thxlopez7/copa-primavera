"use client";

import React, { useState, useMemo } from "react";
import { publishTournamentPhase } from "@/lib/actions/tournament.actions";
import TournamentTreeViewer from "./TournamentTreeViewer";

export default function TournamentWizard({ categories, allPairs }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Estados del Wizard
  const [categoryId, setCategoryId] = useState("");
  const [selectedPairIds, setSelectedPairIds] = useState([]);
  const [format, setFormat] = useState("groups"); // 'groups', 'knockout', 'both'
  const [groupsCount, setGroupsCount] = useState(1);
  const [qualifiedCount, setQualifiedCount] = useState(4); // Para bracket

  // Filtra las parejas por la categoría seleccionada
  const categoryPairs = useMemo(() => {
    if (!categoryId) return [];
    return allPairs.filter(p => p.category_id === categoryId);
  }, [categoryId, allPairs]);

  // Manejador del paso 1
  const handleCategorySelect = (id) => {
    setCategoryId(id);
    // Pre-seleccionar todas las parejas de esta categoría
    const pairsInCat = allPairs.filter(p => p.category_id === id);
    setSelectedPairIds(pairsInCat.map(p => p.id));
    setStep(2);
  };

  const togglePairSelection = (id) => {
    setSelectedPairIds(prev => 
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const handlePublish = async () => {
    setLoading(true);
    setFeedback(null);

    // Preparar el array de parejas (objetos) que requiere el Domain Service
    const pairsToProcess = categoryPairs.filter(p => selectedPairIds.includes(p.id));

    const config = {
      categoryId,
      pairs: pairsToProcess,
      format,
      settings: {
        groupsCount: parseInt(groupsCount) || 1,
        qualifiedCount: parseInt(qualifiedCount) || pairsToProcess.length
      }
    };

    const res = await publishTournamentPhase(config);

    if (res.success) {
      setFeedback({ type: 'success', message: '¡Torneo generado con éxito!' });
      // En lugar de resetear, pasamos al paso 5 para ver el cuadro
      setTimeout(() => {
        setStep(5);
        setFeedback(null);
      }, 1500);
    } else {
      setFeedback({ type: 'error', message: res.error || 'Error al generar el torneo.' });
    }
    setLoading(false);
  };

  // Renderizadores de pasos
  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8 relative">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-navy-800 z-0"></div>
      <div 
        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-500 z-0 transition-all duration-500"
        style={{ width: `${((step - 1) / 3) * 100}%` }}
      ></div>
      
      {[1, 2, 3, 4].map(num => (
        <div key={num} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm relative z-10 transition-colors ${step >= num ? 'bg-brand-500 text-navy-950' : 'bg-navy-800 text-slate-500'}`}>
          {num}
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto bg-navy-900 border border-navy-800 p-6 md:p-10 rounded-3xl shadow-xl animate-fade-in-up">
      {renderStepIndicator()}

      {/* PASO 1: Categoría */}
      {step === 1 && (
        <div className="animate-fade-in-up">
          <h2 className="text-2xl font-black text-white mb-2">1. Seleccionar Categoría</h2>
          <p className="text-slate-400 mb-6">¿Para qué categoría deseas generar el fixture?</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className="p-4 rounded-xl border border-navy-700 bg-navy-950/50 hover:border-brand-500 hover:bg-brand-500/10 text-left transition-all group"
              >
                <div className="font-bold text-white group-hover:text-brand-400 transition-colors">{cat.name}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {allPairs.filter(p => p.category_id === cat.id).length} parejas inscritas
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PASO 2: Participantes */}
      {step === 2 && (
        <div className="animate-fade-in-up">
          <h2 className="text-2xl font-black text-white mb-2">2. Confirmar Parejas</h2>
          <p className="text-slate-400 mb-6">Selecciona las parejas que participarán. Por defecto, todas están marcadas.</p>
          
          <div className="bg-navy-950 border border-navy-800 rounded-xl p-4 max-h-[400px] overflow-y-auto mb-6 custom-scrollbar flex flex-col gap-2">
            {categoryPairs.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No hay parejas en esta categoría.</p>
            ) : (
              categoryPairs.map(pair => (
                <label key={pair.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-navy-900 cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    checked={selectedPairIds.includes(pair.id)}
                    onChange={() => togglePairSelection(pair.id)}
                    className="w-5 h-5 accent-brand-500 rounded bg-navy-800 border-navy-700"
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-white">
                      {pair.player1?.last_name} / {pair.player2?.last_name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {pair.player1?.first_name} & {pair.player2?.first_name}
                    </span>
                  </div>
                </label>
              ))
            )}
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="px-6 py-2 rounded-lg font-bold text-slate-400 hover:text-white transition-colors">Atrás</button>
            <button 
              onClick={() => setStep(3)} 
              disabled={selectedPairIds.length < 2}
              className="px-6 py-2 rounded-lg font-black bg-brand-500 text-navy-950 hover:bg-brand-400 transition-colors disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* PASO 3: Formato y Configuración */}
      {step === 3 && (
        <div className="animate-fade-in-up">
          <h2 className="text-2xl font-black text-white mb-2">3. Formato del Torneo</h2>
          <p className="text-slate-400 mb-6">Define cómo se cruzarán las {selectedPairIds.length} parejas seleccionadas.</p>

          <div className="flex flex-col gap-6 mb-8">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sistema de Competencia</label>
              <select 
                value={format} 
                onChange={(e) => setFormat(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500"
              >
                <option value="groups">Solo Fase de Grupos (Todos contra Todos)</option>
                <option value="knockout">Solo Eliminación Directa (Llave)</option>
                <option value="both">Fase de Grupos + Llave Eliminatoria Final</option>
              </select>
            </div>

            {(format === 'groups' || format === 'both') && (
              <div className="p-4 bg-navy-950/50 rounded-xl border border-navy-800 animate-fade-in-up">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cantidad de Grupos (Zonas)</label>
                <input 
                  type="number" 
                  min="1" 
                  value={groupsCount}
                  onChange={(e) => setGroupsCount(e.target.value)}
                  className="w-full bg-navy-900 border border-navy-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            )}

            {(format === 'knockout' || format === 'both') && (
              <div className="p-4 bg-navy-950/50 rounded-xl border border-navy-800 animate-fade-in-up">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {format === 'both' ? '¿Cuántos clasifican a la llave final?' : 'Tamaño del Cuadro (Equipos)'}
                </label>
                <select 
                  value={qualifiedCount}
                  onChange={(e) => setQualifiedCount(e.target.value)}
                  className="w-full bg-navy-900 border border-navy-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="2">2 (Directo a Final)</option>
                  <option value="4">4 (Semifinales)</option>
                  <option value="8">8 (Cuartos de Final)</option>
                  <option value="16">16 (Octavos)</option>
                  <option value="32">32 (Dieciseisavos)</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="px-6 py-2 rounded-lg font-bold text-slate-400 hover:text-white transition-colors">Atrás</button>
            <button 
              onClick={() => setStep(4)}
              className="px-6 py-2 rounded-lg font-black bg-brand-500 text-navy-950 hover:bg-brand-400 transition-colors"
            >
              Revisar y Generar
            </button>
          </div>
        </div>
      )}

      {/* PASO 4: Resumen y Confirmación */}
      {step === 4 && (
        <div className="animate-fade-in-up">
          <h2 className="text-2xl font-black text-white mb-6">4. Resumen de Generación</h2>
          
          <div className="bg-navy-950 border border-navy-800 rounded-xl p-6 mb-8 text-sm">
            <ul className="space-y-4">
              <li className="flex justify-between border-b border-navy-800 pb-2">
                <span className="text-slate-400">Categoría</span>
                <span className="font-bold text-white">{categories.find(c => c.id === categoryId)?.name}</span>
              </li>
              <li className="flex justify-between border-b border-navy-800 pb-2">
                <span className="text-slate-400">Parejas Participantes</span>
                <span className="font-bold text-brand-400">{selectedPairIds.length} parejas</span>
              </li>
              <li className="flex justify-between border-b border-navy-800 pb-2">
                <span className="text-slate-400">Formato</span>
                <span className="font-bold text-white uppercase">
                  {format === 'both' ? 'Grupos + Llave' : format === 'groups' ? 'Grupos' : 'Llave Directa'}
                </span>
              </li>
              {(format === 'groups' || format === 'both') && (
                <li className="flex justify-between border-b border-navy-800 pb-2">
                  <span className="text-slate-400">Zonas</span>
                  <span className="font-bold text-white">{groupsCount} Grupos</span>
                </li>
              )}
              {(format === 'knockout' || format === 'both') && (
                <li className="flex justify-between border-b border-navy-800 pb-2">
                  <span className="text-slate-400">Tamaño del Bracket</span>
                  <span className="font-bold text-white">{qualifiedCount} clasificados</span>
                </li>
              )}
            </ul>
            
            <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg flex gap-3 text-orange-400">
              <i className="fa-solid fa-triangle-exclamation mt-0.5"></i>
              <p>Al confirmar, los partidos se crearán en la base de datos y aparecerán inmediatamente en la sección pública del Fixture.</p>
            </div>
          </div>

          {feedback && (
            <div className={`mb-6 p-4 rounded-xl font-bold flex items-center justify-center gap-2 ${feedback.type === 'success' ? 'bg-brand-500/10 text-brand-400 border border-brand-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
              <i className={feedback.type === 'success' ? 'fa-solid fa-check' : 'fa-solid fa-xmark'}></i>
              {feedback.message}
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep(3)} disabled={loading} className="px-6 py-2 rounded-lg font-bold text-slate-400 hover:text-white transition-colors disabled:opacity-50">Atrás</button>
            <button 
              onClick={handlePublish}
              disabled={loading || feedback?.type === 'success'}
              className="px-8 py-3 rounded-xl font-black bg-brand-500 text-navy-950 hover:bg-brand-400 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
            >
              {loading ? (
                <span><i className="fa-solid fa-spinner animate-spin mr-2"></i> Generando...</span>
              ) : (
                <span><i className="fa-solid fa-rocket mr-2"></i> Confirmar y Generar</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* PASO 5: Resultado / Visor de Árbol */}
      {step === 5 && (
        <TournamentTreeViewer 
          categoryId={categoryId} 
          onReset={() => {
            setStep(1);
            setCategoryId("");
          }}
        />
      )}
    </div>
  );
}
