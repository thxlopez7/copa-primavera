"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useScrollLock } from "@/hooks/useScrollLock";

export default function NewsModal({ isOpen, onClose, news, setNews, isAdmin }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useScrollLock(isOpen);

  if (!isOpen) return null;

  const handleAdd = async () => {
    if (!isAdmin) {
      alert("Necesitás ingresar como administrador.");
      return;
    }

    if (title.trim() && content.trim()) {
      setIsSubmitting(true);
      try {
        const insertData = {
          title: title.trim(),
          content: content.trim(),
          image_url: image.trim() || "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&auto=format&fit=crop&q=80",
          tournament_id: null // Fallback
        };

        const { data, error } = await supabase
          .from('news')
          .insert([insertData])
          .select();
          
        if (error) {
          console.error("Error DB:", error.message, error.details);
          alert("Error DB: " + error.message);
          return;
        }
        
        const newArticleFromDB = data && data[0] ? data[0] : { ...insertData, id: Date.now(), created_at: new Date().toISOString() };

        setNews([newArticleFromDB, ...news]);
        setTitle(""); setContent(""); setImage("");
        onClose();
      } catch (error) {
        console.error("Error al publicar noticia:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-navy-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 max-w-md w-full space-y-3 shadow-2xl">
        <h3 className="text-lg font-bold text-white">Publicar Noticia</h3>
        <div className="space-y-3 text-xs">
          <input type="text" placeholder="Título de la noticia..." value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-navy-800 border border-navy-700 rounded-xl px-3 py-2 text-white outline-none" />
          
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Subir Imagen desde Galería / Archivo (Simulado):</label>
            <input type="file" accept="image/*" className="w-full bg-navy-800 border border-navy-700 rounded-xl px-2 py-1 text-slate-300 text-xs outline-none" />
          </div>

          <input type="text" placeholder="O pegar URL de imagen aquí..." value={image} onChange={e => setImage(e.target.value)} className="w-full bg-navy-800 border border-navy-700 rounded-xl px-3 py-2 text-white outline-none" />
          <textarea rows="3" placeholder="Detalles de la noticia..." value={content} onChange={e => setContent(e.target.value)} className="w-full bg-navy-800 border border-navy-700 rounded-xl p-3 text-white outline-none"></textarea>
          
          <div className="pt-1 space-y-2">
            <button 
              onClick={handleAdd} 
              disabled={isSubmitting}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 disabled:cursor-not-allowed text-navy-950 font-bold py-2.5 rounded-xl text-xs transition"
            >
              {isSubmitting ? "Publicando..." : "Publicar"}
            </button>
            <button onClick={onClose} disabled={isSubmitting} className="w-full bg-transparent text-slate-400 hover:text-white py-1 text-xs">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
