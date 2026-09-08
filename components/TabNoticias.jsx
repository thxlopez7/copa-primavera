"use client";

export default function TabNoticias({ news, isAdmin, openNewsModal, handleDeleteNews }) {
  return (
    <section className="tab-content space-y-6">
      <div className="flex items-center justify-between border-b border-navy-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Noticias del Torneo</h1>
          <p className="text-xs text-slate-400">Información sobre fixtures, avisos y fotos del torneo.</p>
        </div>
        {isAdmin && (
        <div className="flex justify-end">
          <button onClick={openNewsModal} className="bg-transparent border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-white text-xs px-4 py-2 rounded-lg font-bold transition-colors">
            <i className="fa-solid fa-plus mr-2"></i> Redactar Nueva Noticia
          </button>
        </div>
      )}</div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {news.map(n => (
          <div key={n.id} className="bg-navy-900 border border-navy-800 rounded-2xl overflow-hidden shadow-lg flex flex-col">
            <div className="h-40 overflow-hidden relative">
              <img src={n.image_url} alt={n.title} className="w-full h-full object-cover transition duration-500 hover:scale-110" />
              <div className="absolute top-2 right-2 bg-navy-950/80 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-brand-400 border border-navy-700">
                <i className="fa-regular fa-calendar mr-1"></i> {new Date(n.created_at || Date.now()).toLocaleDateString()}
              </div>
            </div>
            <div className="p-4 flex-grow flex flex-col justify-between space-y-2">
              <div>
                <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">{n.title}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{n.content}</p>
              </div>
              {isAdmin && (
                <div className="pt-2 border-t border-navy-800 flex justify-end">
                  <button 
                    onClick={() => handleDeleteNews(n.id)}
                    className="text-rose-400 hover:text-rose-300 text-xs font-bold transition"
                  >
                    <i className="fa-solid fa-trash mr-1"></i> Borrar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
