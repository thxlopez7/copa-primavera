"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useScrollLock } from "@/hooks/useScrollLock";

export default function ManageCategoriesModal({ isOpen, onClose, categories, setCategories, isAdmin }) {
  const [newCat, setNewCat] = useState("");

  useScrollLock(isOpen);

  if (!isOpen) return null;

  const handleAdd = async () => {
    if (!isAdmin) {
      alert("Necesitás ingresar como administrador.");
      return;
    }
    const catName = newCat.trim();
    if (catName && !categories.find(c => c.name === catName)) {
      try {
        const insertData = { 
          name: catName,
          tournament_id: null // Dejamos null como fallback por si no hay tabla o id aún
        };

        const { data, error } = await supabase
          .from('categories')
          .insert([insertData])
          .select();
          
        if (error) {
          console.error("Error DB:", error.message, error.details);
          alert("Error DB: " + error.message);
          return;
        }
        
        const insertedCat = data && data[0] ? data[0] : { id: "temp_" + Date.now(), ...insertData };
        setCategories([...categories, insertedCat]);
        setNewCat("");
      } catch (error) {
        console.error("Error al crear categoría:", error);
      }
    }
  };

  const handleRemove = async (catId) => {
    if (!isAdmin) {
      alert("Necesitás ingresar como administrador.");
      return;
    }
    
    const catObj = categories.find(c => c.id === catId);
    
    if (confirm(`¿Estás seguro de eliminar la categoría "${catObj?.name}"? Se podrían perder las parejas y partidos asociados.`)) {
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', catId);
          
        if (error) {
          console.error("Error DB:", error.message, error.details);
          alert("Error DB: " + error.message);
          return;
        }
        
        setCategories(categories.filter(c => c.id !== catId));
      } catch (error) {
        console.error("Error al eliminar categoría:", error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-navy-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl max-h-[90vh] flex flex-col justify-between">
        <div className="space-y-4 overflow-y-auto pr-1">
          <div>
            <h3 className="text-lg font-bold text-white">Administrar Categorías</h3>
            <p className="text-xs text-slate-400">Agregá o eliminá las categorías disponibles del torneo.</p>
          </div>

          <div className="bg-navy-800/80 p-3 rounded-xl border border-navy-700 space-y-2">
            <span className="text-xs font-bold text-white block">Nueva Categoría</span>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Ej. Mixto Suma 10..." 
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="flex-1 bg-navy-900 border border-navy-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
              />
              <button onClick={handleAdd} className="bg-brand-500 hover:bg-brand-600 text-navy-950 font-bold px-3 py-1.5 rounded-lg text-xs transition">
                + Agregar
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 block">Categorías Actuales ({categories.length})</span>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {categories.map(cat => (
                <div key={cat.id} className="bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 flex justify-between items-center">
                  <span className="text-white text-xs font-semibold">{cat.name}</span>
                  <button onClick={() => handleRemove(cat.id)} className="text-rose-400 hover:text-rose-300 transition">
                    <i className="fa-solid fa-trash text-xs"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-navy-800">
          <button onClick={onClose} className="w-full bg-copaBlue-500 hover:bg-copaBlue-600 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2">
            <i className="fa-solid fa-check"></i> Listo (Guardar y Cerrar)
          </button>
        </div>
      </div>
    </div>
  );
}
