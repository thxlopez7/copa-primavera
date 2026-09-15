"use client";

import React, { useState } from "react";
import { createPair } from "@/lib/actions/admin.actions";

export default function PairForm({ categories }) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  
  // Estado del formulario
  const [categoryId, setCategoryId] = useState("");
  const [p1FirstName, setP1FirstName] = useState("");
  const [p1LastName, setP1LastName] = useState("");
  const [p2FirstName, setP2FirstName] = useState("");
  const [p2LastName, setP2LastName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryId || !p1FirstName || !p1LastName || !p2FirstName || !p2LastName) {
      setFeedback({ type: "error", message: "Todos los campos son obligatorios." });
      return;
    }

    setLoading(true);
    setFeedback(null);

    const player1Data = { first_name: p1FirstName.trim(), last_name: p1LastName.trim() };
    const player2Data = { first_name: p2FirstName.trim(), last_name: p2LastName.trim() };

    const res = await createPair(player1Data, player2Data, categoryId);

    if (res.success) {
      setFeedback({ type: "success", message: "Pareja inscrita con éxito." });
      
      // Resetear solo jugadores para permitir carga ágil en la misma categoría
      setP1FirstName("");
      setP1LastName("");
      setP2FirstName("");
      setP2LastName("");
      
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback({ type: "error", message: res.error || "Error al inscribir la pareja." });
    }

    setLoading(false);
  };

  return (
    <div className="bg-navy-900 border border-navy-800 p-6 rounded-2xl mb-8">
      <h3 className="text-xl font-bold text-white mb-4">Inscribir Nueva Pareja</h3>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        {/* Selector de Categoría */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Categoría</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={loading || categories.length === 0}
            className="w-full bg-navy-950 border border-navy-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors"
            required
          >
            <option value="" disabled>Seleccione una categoría</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Jugador 1 */}
          <div className="bg-navy-950/50 p-4 rounded-xl border border-navy-800">
            <h4 className="text-brand-400 font-bold mb-3 flex items-center gap-2">
              <i className="fa-solid fa-user"></i> Jugador 1
            </h4>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Nombre"
                value={p1FirstName}
                onChange={(e) => setP1FirstName(e.target.value)}
                disabled={loading}
                className="w-full bg-navy-900 border border-navy-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                required
              />
              <input
                type="text"
                placeholder="Apellido"
                value={p1LastName}
                onChange={(e) => setP1LastName(e.target.value)}
                disabled={loading}
                className="w-full bg-navy-900 border border-navy-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                required
              />
            </div>
          </div>

          {/* Jugador 2 */}
          <div className="bg-navy-950/50 p-4 rounded-xl border border-navy-800">
            <h4 className="text-brand-400 font-bold mb-3 flex items-center gap-2">
              <i className="fa-solid fa-user"></i> Jugador 2
            </h4>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Nombre"
                value={p2FirstName}
                onChange={(e) => setP2FirstName(e.target.value)}
                disabled={loading}
                className="w-full bg-navy-900 border border-navy-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                required
              />
              <input
                type="text"
                placeholder="Apellido"
                value={p2LastName}
                onChange={(e) => setP2LastName(e.target.value)}
                disabled={loading}
                className="w-full bg-navy-900 border border-navy-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                required
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-brand-500 hover:bg-brand-400 text-navy-950 font-black px-6 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto self-end mt-2"
        >
          {loading ? (
            <span className="flex items-center gap-2"><i className="fa-solid fa-spinner animate-spin"></i> Guardando...</span>
          ) : (
            <span className="flex items-center gap-2"><i className="fa-solid fa-check"></i> Inscribir Pareja</span>
          )}
        </button>
      </form>

      {/* Feedback Visual */}
      {feedback && (
        <div className={`mt-6 px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-2 animate-fade-in-up
          ${feedback.type === 'success' ? 'bg-brand-500/10 text-brand-400 border border-brand-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}
        `}>
          <i className={feedback.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation'}></i>
          {feedback.message}
        </div>
      )}
    </div>
  );
}
