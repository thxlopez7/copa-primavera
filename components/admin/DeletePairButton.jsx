"use client";

import React, { useState } from "react";
import { deletePair } from "@/lib/actions/admin.actions";

export default function DeletePairButton({ pairId }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (window.confirm("¿Estás seguro de eliminar esta pareja? Esta acción no se puede deshacer.")) {
      setLoading(true);
      const res = await deletePair(pairId);
      if (!res.success) {
        alert(res.error);
      }
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={loading}
      className="text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50" 
      title="Eliminar Pareja"
    >
      {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-trash"></i>}
    </button>
  );
}
