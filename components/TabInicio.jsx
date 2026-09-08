"use client";

export default function TabInicio({ categories, news, setActiveTab, openContactModal, selectCategory }) {
  const damasCategories = categories.filter(c => c.name && c.name.toLowerCase().includes('damas'));
  const caballerosCategories = categories.filter(c => c.name && (c.name.toLowerCase().includes('caballeros') || c.name.toLowerCase().includes('mixto')));

  const handleCategoryClick = (catId) => {
    selectCategory(catId);
    setActiveTab("fixture");
  };

  return (
    <section className="tab-content space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-navy-900 border border-navy-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 bg-copaBlue-500/10 border border-copaBlue-500/30 text-copaBlue-500 text-xs font-bold px-3 py-1 rounded-full uppercase">
            <i className="fa-solid fa-location-dot"></i> Pilar - Paraguay | 8 al 11 de Octubre
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Torneo <span className="bg-clip-text text-transparent bg-gradient-to-r from-copaBlue-400 to-brand-400">Copa Primavera</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Bienvenido a la plataforma oficial del torneo. Seleccioná cualquier categoría para ver su llave de partidos o comunicate directamente para inscribirte.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-navy-800/90 border border-navy-700/60 p-3.5 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Fechas Oficiales</span>
              <span className="text-base font-bold text-white block mt-0.5">8 al 11 de Octubre</span>
            </div>
          </div>

          <div className="pt-2">
            <button onClick={openContactModal} className="w-full sm:w-auto bg-brand-500 hover:bg-brand-600 text-navy-950 font-extrabold px-8 py-4 rounded-xl transition flex items-center justify-center gap-3 text-base shadow-lg shadow-brand-500/20">
              <i className="fa-brands fa-whatsapp text-2xl"></i>
              <span>Inscribirme por WhatsApp (3 Contactos)</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 flex justify-center">
          <div className="relative rounded-2xl overflow-hidden border-2 border-copaBlue-500/40 shadow-2xl group max-w-sm">
            <img src="https://images.unsplash.com/photo-1622163642988-1ea32b023948?w=800&auto=format&fit=crop&q=80" alt="Afiche Oficial" className="w-full h-auto object-cover rounded-2xl" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent flex items-end p-4">
              <span className="text-xs font-bold text-white bg-copaBlue-500/90 px-3 py-1 rounded-lg backdrop-blur-sm">
                Afiche Oficial Torneo Copa Primavera
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-navy-800 pb-3">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Acceso Directo a Llaves por Categoría</h2>
            <p className="text-xs text-slate-400">Tocá cualquier categoría para ir directo a su llave de partidos o administrarla</p>
          </div>
          <span className="text-xs bg-brand-500/10 text-brand-500 border border-brand-500/20 px-3 py-1 rounded-full font-bold">
            <i className="fa-solid fa-sitemap mr-1"></i> Fixtures
          </span>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-pink-400 flex items-center gap-2">
              <i className="fa-solid fa-venus"></i> Categorías Damas
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {damasCategories.map(cat => (
                <button key={cat.id} onClick={() => handleCategoryClick(cat.id)} className="bg-navy-900 border border-navy-800 hover:border-pink-500 text-left p-3 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(236,72,153,0.2)] group">
                  <span className="text-xs font-bold text-white block truncate">{cat.name}</span>
                  <span className="text-[10px] text-slate-400 mt-1 block">Ver Llave <i className="fa-solid fa-arrow-right ml-1 text-pink-500 group-hover:translate-x-1 transition-transform"></i></span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-copaBlue-500 flex items-center gap-2">
              <i className="fa-solid fa-mars"></i> Categorías Caballeros & Mixtos
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {caballerosCategories.map(cat => (
                <button key={cat.id} onClick={() => handleCategoryClick(cat.id)} className="bg-navy-900 border border-navy-800 hover:border-copaBlue-500 text-left p-3 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] group">
                  <span className="text-xs font-bold text-white block truncate">{cat.name}</span>
                  <span className="text-[10px] text-slate-400 mt-1 block">Ver Llave <i className="fa-solid fa-arrow-right ml-1 text-copaBlue-500 group-hover:translate-x-1 transition-transform"></i></span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-white">Contactos Oficiales de Inscripción</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="https://wa.me/595975748033?text=Hola%20Facu,%20quiero%20inscribirme%20al%20Torneo%20Copa%20Primavera" target="_blank" rel="noreferrer" className="bg-navy-900 border border-navy-800 hover:border-brand-500 rounded-2xl p-4 flex items-center justify-between transition group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-navy-800 text-brand-500 flex items-center justify-center text-xl group-hover:bg-brand-500 group-hover:text-navy-950 transition">
                <i className="fa-brands fa-whatsapp"></i>
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Facu Aguilera</h3>
                <p className="text-xs text-slate-400 font-mono">+595 975 748 033</p>
              </div>
            </div>
            <i className="fa-solid fa-arrow-right text-xs text-slate-500 group-hover:text-brand-500 transition"></i>
          </a>
          <a href="https://wa.me/595975620833?text=Hola%20Ferchu,%20quiero%20inscribirme%20al%20Torneo%20Copa%20Primavera" target="_blank" rel="noreferrer" className="bg-navy-900 border border-navy-800 hover:border-brand-500 rounded-2xl p-4 flex items-center justify-between transition group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-navy-800 text-brand-500 flex items-center justify-center text-xl group-hover:bg-brand-500 group-hover:text-navy-950 transition">
                <i className="fa-brands fa-whatsapp"></i>
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Ferchu Martinez</h3>
                <p className="text-xs text-slate-400 font-mono">+595 975 620 833</p>
              </div>
            </div>
            <i className="fa-solid fa-arrow-right text-xs text-slate-500 group-hover:text-brand-500 transition"></i>
          </a>
          <a href="https://wa.me/595995619918?text=Hola%20Jere,%20quiero%20inscribirme%20al%20Torneo%20Copa%20Primavera" target="_blank" rel="noreferrer" className="bg-navy-900 border border-navy-800 hover:border-brand-500 rounded-2xl p-4 flex items-center justify-between transition group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-navy-800 text-brand-500 flex items-center justify-center text-xl group-hover:bg-brand-500 group-hover:text-navy-950 transition">
                <i className="fa-brands fa-whatsapp"></i>
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Jere Caceres</h3>
                <p className="text-xs text-slate-400 font-mono">+595 995 619 918</p>
              </div>
            </div>
            <i className="fa-solid fa-arrow-right text-xs text-slate-500 group-hover:text-brand-500 transition"></i>
          </a>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Últimas Noticias</h2>
          <button onClick={() => setActiveTab('noticias')} className="text-copaBlue-500 hover:underline text-xs font-semibold">Ver todas</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {news.slice(0, 3).map(n => (
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
