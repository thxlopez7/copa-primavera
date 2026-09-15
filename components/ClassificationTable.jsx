import React from "react";

export default function ClassificationTable({ standings }) {
  if (!standings || standings.length === 0) {
    return (
      <div className="bg-navy-900/50 border border-navy-800 rounded-3xl p-12 text-center max-w-2xl mx-auto mt-8">
        <div className="w-16 h-16 bg-navy-950 rounded-full flex items-center justify-center border border-navy-800 mx-auto text-slate-600 mb-6 text-3xl">
          <i className="fa-solid fa-ranking-star"></i>
        </div>
        <h2 className="text-white font-bold text-xl mb-2">Tabla Vacía</h2>
        <p className="text-slate-400 text-sm">
          Aún no hay partidos finalizados para esta categoría.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-navy-900 border border-navy-800 rounded-2xl overflow-hidden shadow-lg animate-fade-in-up">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-navy-950/80 text-slate-400 border-b border-navy-800">
            <tr>
              <th className="px-4 py-4 font-black w-12 text-center">POS</th>
              <th className="px-4 py-4 font-bold min-w-[180px]">PAREJA</th>
              <th className="px-3 py-4 font-bold text-center" title="Partidos Jugados">PJ</th>
              <th className="px-3 py-4 font-bold text-center text-brand-500" title="Partidos Ganados">PG</th>
              <th className="px-3 py-4 font-bold text-center text-orange-400" title="Partidos Perdidos">PP</th>
              <th className="px-3 py-4 font-bold text-center border-l border-navy-800/50 pl-4" title="Sets Ganados">SG</th>
              <th className="px-3 py-4 font-bold text-center" title="Sets Perdidos">SP</th>
              <th className="px-3 py-4 font-bold text-center border-l border-navy-800/50 pl-4" title="Juegos Ganados">JG</th>
              <th className="px-3 py-4 font-bold text-center" title="Juegos Perdidos">JP</th>
              <th className="px-4 py-4 font-black text-center text-white border-l border-navy-800/80 pl-5">PTS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-800/50">
            {standings.map((stat, idx) => {
              // Zona de clasificación: primeros 2
              const isQualified = idx < 2;

              return (
                <tr 
                  key={stat.team_id} 
                  className={`
                    transition-colors hover:bg-navy-800/50
                    ${isQualified ? 'bg-brand-500/5' : 'bg-transparent'}
                  `}
                >
                  {/* Posición */}
                  <td className="px-4 py-3 text-center">
                    <span className={`
                      inline-flex items-center justify-center w-6 h-6 rounded-md font-black text-xs
                      ${isQualified ? 'bg-brand-500/20 text-brand-400' : 'text-slate-500'}
                    `}>
                      {idx + 1}
                    </span>
                  </td>

                  {/* Nombre del Equipo */}
                  <td className="px-4 py-3 font-bold text-white truncate max-w-[250px]">
                    {stat.teamName}
                  </td>

                  {/* Estadísticas Base */}
                  <td className="px-3 py-3 text-center text-slate-300 font-medium">{stat.PJ}</td>
                  <td className="px-3 py-3 text-center text-brand-400 font-bold">{stat.PG}</td>
                  <td className="px-3 py-3 text-center text-orange-400 font-medium">{stat.PP}</td>
                  
                  {/* Estadísticas de Sets */}
                  <td className="px-3 py-3 text-center text-slate-300 font-medium border-l border-navy-800/50 pl-4">{stat.SG}</td>
                  <td className="px-3 py-3 text-center text-slate-400 font-medium">{stat.SP}</td>
                  
                  {/* Estadísticas de Juegos */}
                  <td className="px-3 py-3 text-center text-slate-300 font-medium border-l border-navy-800/50 pl-4">{stat.JG}</td>
                  <td className="px-3 py-3 text-center text-slate-400 font-medium">{stat.JP}</td>
                  
                  {/* Puntos */}
                  <td className="px-4 py-3 text-center text-white font-black border-l border-navy-800/80 pl-5">
                    {stat.PTS}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Footer informativo */}
      <div className="bg-navy-950/50 p-3 border-t border-navy-800 text-[10px] text-slate-400 flex flex-wrap gap-4 font-medium justify-center">
        <span><strong className="text-brand-500">PJ</strong>: Partidos Jugados</span>
        <span><strong className="text-brand-500">PG</strong>: Ganados</span>
        <span><strong className="text-orange-400">PP</strong>: Perdidos</span>
        <span><strong className="text-slate-300">SG/SP</strong>: Sets</span>
        <span><strong className="text-slate-300">JG/JP</strong>: Juegos</span>
        <span><strong className="text-white">PTS</strong>: Puntos (3 por PG)</span>
      </div>
    </div>
  );
}
