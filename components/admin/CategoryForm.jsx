"use client";

import React, { useState } from "react";
import { createCategory } from "@/lib/actions/admin.actions";

export default function CategoryForm() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setFeedback(null);

    const res = await createCategory(name.trim());

    if (res.success) {
      setFeedback({ type: "success", message: "Categoría creada con éxito." });
      setName(""); // Reset
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback({ type: "error", message: res.error || "Error al crear la categoría." });
    }

    setLoading(false);
  };

  return (
    <div className="bg-navy-900 border border-navy-800 p-6 rounded-2xl mb-8">
      <h3 className="text-xl font-bold text-white mb-4">Nueva Categoría</h3>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 w-full">
          <input
            type="text"
            placeholder="Ej: 5ta Masculino"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="w-full bg-navy-950 border border-navy-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="bg-brand-500 hover:bg-brand-400 text-navy-950 font-black px-6 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap w-full sm:w-auto"
        >
          {loading ? (
            <span className="flex items-center gap-2"><i className="fa-solid fa-spinner animate-spin"></i> Guardando...</span>
          ) : (
            <span className="flex items-center gap-2"><i className="fa-solid fa-plus"></i> Crear Categoría</span>
          )}
        </button>
      </form>

      {/* Feedback Visual */}
      {feedback && (
        <div className={`mt-4 px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-2 animate-fade-in-up
          ${feedback.type === 'success' ? 'bg-brand-500/10 text-brand-400 border border-brand-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}
        `}>
          <i className={feedback.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation'}></i>
          {feedback.message}
        </div>
      )}
    </div>
  );
}
