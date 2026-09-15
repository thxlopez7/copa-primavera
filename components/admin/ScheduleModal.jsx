"use client";

import React, { useState } from "react";
import { updateMatchSchedule } from "@/lib/actions/match.actions";

export default function ScheduleModal({ match, onClose }) {
  // Inicializamos con los datos actuales
  const formatForInput = (isoString) => {
    if (!isoString || isoString === "A definir" || isoString === "Automático") return { date: "", time: "" };
    try {
      const d = new Date(isoString);
      const tzOffset = d.getTimezoneOffset() * 60000; // offset in milliseconds
      const localISOTime = (new Date(d - tzOffset)).toISOString().slice(0, 16);
      return {
        date: localISOTime.split("T")[0],
        time: localISOTime.split("T")[1]
      };
    } catch {
      return { date: "", time: "" };
    }
  };

  const initialDateTime = formatForInput(match.scheduled_at || match.match_datetime);
  const [date, setDate] = useState(initialDateTime.date);
  const [time, setTime] = useState(initialDateTime.time);
  const [court, setCourt] = useState(match.court || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const scheduledAt = date && time ? `${date}T${time}` : null;
    const res = await updateMatchSchedule(match.id, scheduledAt, court);
    if (res.success) {
      onClose(); // Cierra el modal exitosamente
    } else {
      alert("Error al programar: " + res.error);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in-up">
      <div className="bg-navy-900 border border-navy-700 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-navy-800 hover:bg-navy-700 text-slate-400 hover:text-white transition-colors"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="mb-6">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center text-xl mb-4">
            <i className="fa-regular fa-calendar-days"></i>
          </div>
          <h3 className="text-2xl font-black text-white">Programar Partido</h3>
          <p className="text-slate-400 text-sm mt-1">Asigna fecha, hora y cancha.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fecha</label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={loading}
                className="w-full bg-navy-950 border border-navy-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hora</label>
              <input 
                type="time" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={loading}
                className="w-full bg-navy-950 border border-navy-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Lugar / Cancha</label>
            <input
              type="text"
              value={court}
              onChange={(e) => setCourt(e.target.value)}
              disabled={loading}
              placeholder="Ej: Cancha 1"
              className="w-full bg-navy-950 border border-navy-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:bg-navy-800 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-brand-500 hover:bg-brand-400 text-navy-950 font-black py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
