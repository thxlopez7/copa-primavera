"use client";

import React, { useState } from "react";

export default function ShareButton({ title, text, url }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: title || "Partido - Copa Primavera",
      text: text || "Mira el resultado de este partido",
      url: url || window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error al compartir:", err);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Error al copiar al portapapeles:", err);
      }
    }
  };

  return (
    <button 
      onClick={handleShare}
      className="flex items-center gap-2 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/30 font-bold py-2 px-6 rounded-xl transition-all w-full md:w-auto justify-center"
    >
      <i className="fa-solid fa-share-nodes"></i>
      {copied ? "¡Enlace copiado!" : "Compartir Partido"}
    </button>
  );
}
