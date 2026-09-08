"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useScrollLock } from "@/hooks/useScrollLock";

export default function ManagePairsModal({ isOpen, onClose, selectedCategory, pairs, setPairs, isAdmin, categories }) {
  const [j1, setJ1] = useState("");
  const [j2, setJ2] = useState("");
  const [photo, setPhoto] = useState("");
  const [phone, setPhone] = useState("");

  useScrollLock(isOpen);

  if (!isOpen) return null;

  const currentPairs = pairs[selectedCategory] || [];
  const currentCategoryObj = categories && categories.find(c => c.id === selectedCategory);
  const categoryName = currentCategoryObj ? currentCategoryObj.name : selectedCategory;

  const handleAdd = async () => {
    if (!isAdmin) {
      alert("Necesitás ingresar como administrador.");
      return;
    }

    if (j1.trim() && j2.trim()) {
      try {
        const insertData = {
          category_id: selectedCategory, // UUID
          player1_name: j1.trim(),
          player2_name: j2.trim(),
          photo_url: photo.trim() || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          phone: phone.trim()
        };

        const { data, error } = await supabase
          .from('pairs')
          .insert([insertData])
          .select();
          
        if (error) {
          console.error("Error DB:", error.message, error.details);
          alert("Error DB: " + error.message);
          return;
        }
        
        const newPairFromDB = data && data[0] ? data[0] : { ...insertData, id: "p" + Date.now() };

        setPairs({
          ...pairs,
          [selectedCategory]: [...currentPairs, newPairFromDB]
        });

        setJ1(""); setJ2(""); setPhoto(""); setPhone("");
      } catch (error) {
        console.error("Error al crear pareja:", error);
      }
    }
  };

  const handleRemove = async (id) => {
    if (!isAdmin) {
      alert("Necesitás ingresar como administrador.");
      return;
    }

    if (confirm("¿Estás seguro de eliminar esta pareja?")) {
      try {
        const { error } = await supabase
          .from('pairs')
          .delete()
          .eq('id', id);
          
        if (error) {
          console.error("Error DB:", error.message, error.details);
          alert("Error DB: " + error.message);
          return;
        }
        
        setPairs({
          ...pairs,
          [selectedCategory]: currentPairs.filter(p => p.id !== id)
        });
      } catch (error) {
        console.error("Error al eliminar pareja:", error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-navy-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] flex flex-col justify-between">
        <div className="space-y-4 overflow-y-auto pr-1">
          <div>
            <h3 className="text-lg font-bold text-white">Inscribir Parejas - <span className="text-brand-500">{categoryName}</span></h3>
            <p className="text-xs text-slate-400">La llave de esta categoría se actualizará automáticamente.</p>
          </div>

          <div className="bg-navy-800/80 p-3 rounded-xl border border-navy-700 space-y-3">
            <span className="text-xs font-bold text-white block">Nueva Pareja</span>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="Jugador 1..." value={j1} onChange={e => setJ1(e.target.value)} className="w-full bg-navy-900 border border-navy-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none" />
              <input type="text" placeholder="Jugador 2..." value={j2} onChange={e => setJ2(e.target.value)} className="w-full bg-navy-900 border border-navy-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="URL Foto (opcional)..." value={photo} onChange={e => setPhoto(e.target.value)} className="w-full bg-navy-900 border border-navy-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none" />
              <input type="text" placeholder="Teléfono..." value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-navy-900 border border-navy-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none" />
            </div>
            <button onClick={handleAdd} className="w-full bg-brand-500 hover:bg-brand-600 text-navy-950 font-bold py-2 rounded-lg text-xs transition">
              + Guardar Pareja
            </button>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 block">Parejas Inscriptas ({currentPairs.length})</span>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {currentPairs.map(p => (
                <div key={p.id} className="bg-navy-900 border border-navy-700 rounded-lg p-2 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <img src={p.photo_url} alt="Foto" className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <span className="text-white text-xs font-semibold block">{p.player1_name} & {p.player2_name}</span>
                      <span className="text-slate-400 text-[10px] block">{p.phone}</span>
                    </div>
                  </div>
                  <button onClick={() => handleRemove(p.id)} className="text-rose-400 hover:text-rose-300 p-2 transition">
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
