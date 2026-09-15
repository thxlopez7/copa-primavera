"use client";

import React, { useState } from "react";
import { deleteCategory } from "@/lib/actions/admin.actions";

export default function DeleteCategoryButton({ categoryId }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (window.confirm("¿Estás seguro de eliminar esta categoría? Esta acción no se puede deshacer.")) {
      setLoading(true);
      const res = await deleteCategory(categoryId);
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
      title="Eliminar Categoría"
    >
      {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-trash"></i>}
    </button>
  );
}
