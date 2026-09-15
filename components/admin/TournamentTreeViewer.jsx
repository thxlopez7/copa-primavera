"use client";

import React, { useState, useEffect } from "react";
import { fetchCategoryMatches } from "@/lib/actions/tournament.actions";
import Bracket from "@/components/Bracket";

export default function TournamentTreeViewer({ categoryId, onReset }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadMatches() {
      setLoading(true);
      const res = await fetchCategoryMatches(categoryId);
      if (res.success) {
        setMatches(res.data);
      } else {
        setError(res.error);
      }
      setLoading(false);
    }
    
    if (categoryId) {
      loadMatches();
    }
  }, [categoryId]);

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <i className="fa-solid fa-spinner animate-spin text-brand-500 text-4xl mb-4"></i>
        <p className="text-slate-400 font-bold">Cargando el cuadro generado...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl text-center">
        <i className="fa-solid fa-triangle-exclamation text-red-400 text-2xl mb-2"></i>
        <p className="text-red-400 font-bold">{error}</p>
        <button onClick={onReset} className="mt-4 px-4 py-2 bg-navy-800 text-slate-300 rounded hover:text-white hover:bg-navy-700">
          Volver al Inicio
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-white">Cuadro del Torneo</h2>
          <p className="text-slate-400 text-sm">Visualización de los partidos generados en la base de datos.</p>
        </div>
        <button 
          onClick={onReset}
          className="px-4 py-2 bg-navy-800 border border-navy-700 rounded-lg text-slate-300 font-bold hover:text-white hover:bg-navy-700 transition-colors flex items-center gap-2"
        >
          <i className="fa-solid fa-arrow-rotate-left"></i>
          Generar Otro
        </button>
      </div>
      
      {/* Reutilizamos el Bracket público, que ya sabe renderizar el árbol */}
      <Bracket matches={matches} />
    </div>
  );
}
