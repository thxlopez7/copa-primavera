/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function EquiposAdmin() {
  const [categories, setCategories] = useState([]);
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [newCatName, setNewCatName] = useState("");

  const [j1, setJ1] = useState("");
  const [j2, setJ2] = useState("");
  const [phone, setPhone] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [{ data: catData }, { data: pairsData }] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('pairs').select('*')
      ]);
      setCategories(catData || []);
      setPairs(pairsData || []);
      if (catData && catData.length > 0 && !selectedCategory) {
        setSelectedCategory(catData[0].id);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line
    loadData();
  }, []);

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('categories').insert([{ name: newCatName.trim(), tournament_id: null }]);
      if (error) throw error;
      setNewCatName("");
      await // eslint-disable-next-line
    loadData();
    } catch (error) {
      alert("Error al crear categoría: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPair = async () => {
    if (!j1.trim() || !j2.trim() || !selectedCategory) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('pairs').insert([{
        category_id: selectedCategory,
        player1_name: j1.trim(),
        player2_name: j2.trim(),
        phone: phone.trim(),
        photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
      }]);
      if (error) throw error;
      setJ1(""); setJ2(""); setPhone("");
      await // eslint-disable-next-line
    loadData();
    } catch (error) {
      alert("Error al inscribir equipo: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePair = async (id) => {
    if (!confirm("¿Eliminar este equipo? Asegúrate de que no haya jugado partidos, o romperás el fixture histórico.")) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('pairs').delete().eq('id', id);
      if (error) throw error;
      await // eslint-disable-next-line
    loadData();
    } catch (error) {
      alert("Error al eliminar: " + error.message);
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

  const currentPairs = pairs.filter(p => p.category_id === selectedCategory);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      
      <header>
        <h1 className="text-3xl font-black text-white tracking-tight">Equipos y Categorías</h1>
        <p className="text-slate-400 font-medium mt-1">Administra las inscripciones del torneo.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form & Categories */}
        <div className="space-y-6">
          <section className="bg-navy-900 border border-navy-800 rounded-3xl p-5">
            <h2 className="font-bold text-white mb-4"><i className="fa-solid fa-layer-group text-brand-500 mr-2"></i> Categorías</h2>
            
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={newCatName} 
                onChange={e => setNewCatName(e.target.value)} 
                placeholder="Nueva categoría..." 
                className="flex-1 bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand-500 transition-colors"
              />
              <button 
                onClick={handleAddCategory} 
                disabled={isSubmitting || !newCatName.trim()}
                className="bg-brand-500 text-navy-950 font-bold px-3 rounded-xl hover:bg-brand-600 disabled:opacity-50 transition-colors"
              >
                +
              </button>
            </div>

            <div className="space-y-1">
              {categories.map(cat => (
                <button 
                  key={cat.id} 
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-colors flex justify-between items-center ${selectedCategory === cat.id ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' : 'text-slate-300 hover:bg-white/5 border border-transparent'}`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] bg-navy-950 px-2 py-0.5 rounded-md text-slate-500">
                    {pairs.filter(p => p.category_id === cat.id).length} eq.
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-navy-900 border border-navy-800 rounded-3xl p-5">
            <h2 className="font-bold text-white mb-4"><i className="fa-solid fa-user-plus text-brand-500 mr-2"></i> Inscribir Equipo</h2>
            {categories.length === 0 ? (
              <p className="text-xs text-orange-400">Crea una categoría primero.</p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={j1} onChange={e => setJ1(e.target.value)} placeholder="Jugador 1" className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand-500 transition-colors" />
                  <input type="text" value={j2} onChange={e => setJ2(e.target.value)} placeholder="Jugador 2" className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand-500 transition-colors" />
                </div>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Teléfono de contacto" className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand-500 transition-colors" />
                
                <button 
                  onClick={handleAddPair} 
                  disabled={isSubmitting || !j1.trim() || !j2.trim()}
                  className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 text-navy-950 font-bold py-2.5 rounded-xl text-sm transition shadow-[0_0_15px_rgba(34,197,94,0.3)] mt-2"
                >
                  <i className="fa-solid fa-check mr-1"></i> Confirmar Inscripción
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Teams List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              Equipos de la categoría
            </h2>
            <span className="bg-navy-900 border border-navy-700 text-brand-400 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
              {currentPairs.length} inscritos
            </span>
          </div>

          <div className="bg-navy-900 border border-navy-800 rounded-3xl overflow-hidden shadow-lg">
            {currentPairs.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-navy-950 rounded-full flex items-center justify-center border border-navy-800 text-slate-600 mb-4 text-2xl">
                  <i className="fa-solid fa-users-slash"></i>
                </div>
                <p className="text-slate-400 font-medium">No hay equipos inscritos en esta categoría.</p>
              </div>
            ) : (
              <div className="divide-y divide-navy-800/50">
                {currentPairs.map(p => (
                  <div key={p.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-4">
                      <img src={p.photo_url} alt="Team" className="w-10 h-10 rounded-full object-cover border border-navy-700" />
                      <div>
                        <p className="text-white font-bold text-sm leading-tight">{p.player1_name} & {p.player2_name}</p>
                        <p className="text-slate-500 text-[10px] mt-0.5"><i className="fa-brands fa-whatsapp text-brand-500/70 mr-1"></i> {p.phone || "Sin teléfono"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleDeletePair(p.id)} disabled={isSubmitting} className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors border border-transparent hover:border-red-400 opacity-0 group-hover:opacity-100 focus:opacity-100">
                        <i className="fa-solid fa-trash text-[10px]"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
