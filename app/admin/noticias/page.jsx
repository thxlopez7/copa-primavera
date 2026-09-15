"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function NoticiasAdmin() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
      setNews(data || []);
    } catch (error) {
      console.error("Error loading news:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('news').insert([{
        title: title.trim(),
        content: content.trim(),
        image_url: image.trim() || "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&auto=format&fit=crop&q=80",
        tournament_id: null
      }]);
      if (error) throw error;
      
      setTitle("");
      setContent("");
      setImage("");
      await loadData();
    } catch (err) {
      alert("Error al crear noticia: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar esta noticia permanentemente?")) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('news').delete().eq('id', id);
      if (error) throw error;
      await loadData();
    } catch (err) {
      alert("Error al eliminar: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      
      <header>
        <h1 className="text-3xl font-black text-white tracking-tight">Noticias y Contenido</h1>
        <p className="text-slate-400 font-medium mt-1">Administra los avisos y publicaciones del torneo.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Editor de Noticias */}
        <div className="space-y-6">
          <section className="bg-navy-900 border border-navy-800 rounded-3xl p-5 shadow-lg">
            <h2 className="font-bold text-white mb-4"><i className="fa-solid fa-pen-nib text-brand-500 mr-2"></i> Redactar Noticia</h2>
            
            <div className="space-y-3">
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Título de la noticia..." 
                className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand-500 transition-colors"
              />
              <textarea 
                value={content} 
                onChange={e => setContent(e.target.value)} 
                placeholder="Contenido principal..." 
                rows={4}
                className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand-500 transition-colors resize-none"
              />
              <input 
                type="text" 
                value={image} 
                onChange={e => setImage(e.target.value)} 
                placeholder="URL de la imagen (opcional)..." 
                className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand-500 transition-colors"
              />
              
              <button 
                onClick={handleCreate} 
                disabled={isSubmitting || !title.trim() || !content.trim()}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 text-navy-950 font-bold py-2.5 rounded-xl text-sm transition shadow-[0_0_15px_rgba(34,197,94,0.3)] mt-2 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
                Publicar Noticia
              </button>
            </div>
          </section>
        </div>

        {/* Lista de Noticias */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {news.length === 0 ? (
              <div className="col-span-full p-12 text-center flex flex-col items-center bg-navy-900 border border-navy-800 rounded-3xl">
                <div className="w-16 h-16 bg-navy-950 rounded-full flex items-center justify-center border border-navy-800 text-slate-600 mb-4 text-2xl">
                  <i className="fa-regular fa-newspaper"></i>
                </div>
                <p className="text-slate-400 font-medium">No hay noticias publicadas.</p>
              </div>
            ) : (
              news.map(n => (
                <div key={n.id} className="bg-navy-900 border border-navy-800 rounded-2xl overflow-hidden shadow-lg flex flex-col">
                  <div className="h-32 overflow-hidden relative">
                    <img src={n.image_url} alt={n.title} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-navy-950/80 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-brand-400 border border-navy-700 shadow-sm">
                      <i className="fa-regular fa-calendar mr-1"></i> {new Date(n.created_at || Date.now()).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">{n.title}</h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-3">{n.content}</p>
                    </div>
                    <div className="pt-3 border-t border-navy-800 flex justify-end">
                      <button 
                        onClick={() => handleDelete(n.id)}
                        disabled={isSubmitting}
                        className="text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 border border-transparent hover:border-red-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <i className="fa-solid fa-trash"></i> Borrar
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
