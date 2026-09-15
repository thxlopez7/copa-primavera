import React, { useMemo } from "react";
import MatchCard from "./MatchCard";

export default function Bracket({ matches }) {
  // 1. Agrupar partidos por ronda
  // Usamos useMemo para no recalcular en cada render a menos que cambien los partidos
  const rounds = useMemo(() => {
    if (!matches || matches.length === 0) return [];

    // Filtramos solo los de la fase eliminatoria por si acaso (programación defensiva)
    const knockoutMatches = matches.filter(m => m.match_type === 'knockout');

    const grouped = {};
    knockoutMatches.forEach(m => {
      const rName = m.round_name || "Ronda";
      if (!grouped[rName]) grouped[rName] = [];
      grouped[rName].push(m);
    });

    // 2. Ordenar las rondas lógicamente
    // En un árbol binario perfecto, la primera ronda tiene más partidos que las siguientes.
    // Ej: 4vos (4), Semis (2), Final (1).
    // Ordenamos descendente por la cantidad de partidos para garantizar la dirección Izq -> Der.
    return Object.entries(grouped)
      .map(([name, matchArray]) => ({
        name,
        matches: matchArray
      }))
      .sort((a, b) => b.matches.length - a.matches.length);
  }, [matches]);

  if (rounds.length === 0) {
    return (
      <div className="w-full p-12 flex flex-col items-center justify-center bg-navy-900 border border-navy-800 rounded-2xl">
        <i className="fa-solid fa-sitemap text-3xl text-navy-700 mb-4"></i>
        <h3 className="text-white font-bold text-lg">Cuadro vacío</h3>
        <p className="text-slate-500 text-sm mt-1">Todavía no hay partidos en la fase eliminatoria.</p>
      </div>
    );
  }

  return (
    <div className="w-full relative bg-navy-950 rounded-2xl border border-navy-800/50 p-4 md:p-8">
      {/* 
        Contenedor Scrolleable 
        Desktop: flex-row normal (hasta donde dé el ancho).
        Mobile: overflow-x-auto con snap para UX táctil.
      */}
      <div className="flex flex-row overflow-x-auto snap-x snap-mandatory gap-8 md:gap-16 pb-8 custom-scrollbar items-stretch">
        
        {rounds.map((round, roundIndex) => (
          <div 
            key={round.name} 
            // Cada columna es un "snap-center" en móviles para centrarla al scrollear
            className="flex flex-col min-w-[300px] sm:min-w-[340px] snap-center shrink-0"
          >
            {/* Título de la Ronda */}
            <div className="bg-navy-900/80 border border-navy-800 rounded-lg py-2 mb-6 text-center shadow-sm backdrop-blur-sm sticky top-0 z-10">
              <h3 className="text-brand-500 font-black text-xs tracking-widest uppercase">
                {round.name}
              </h3>
              <p className="text-slate-500 text-[10px] font-medium mt-0.5">
                {round.matches.length} Partido{round.matches.length > 1 ? 's' : ''}
              </p>
            </div>
            
            {/* 
              Contenedor de Tarjetas 
              Usamos justify-around para que visualmente intenten espaciarse y alinearse 
              toscamente con los centros de la columna anterior.
            */}
            <div className="flex flex-col justify-around flex-1 gap-6">
              {round.matches.map(match => (
                <div key={match.id} className="relative group">
                  <MatchCard match={match} />
                  
                  {/* Pistas visuales simples (no-conectores-SVG aún) */}
                  {roundIndex < rounds.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-8 w-8 h-px bg-navy-700/50 group-hover:bg-brand-500/30 transition-colors"></div>
                  )}
                  {roundIndex > 0 && (
                    <div className="hidden md:block absolute top-1/2 -left-8 w-8 h-px bg-navy-700/50 group-hover:bg-brand-500/30 transition-colors"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
