"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Utilidad simple para slugificar si no existe un campo slug en DB
const slugify = (text) => 
  text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w-]+/g, '');

export default function CategorySelector({ categories, basePath = "/fixture/" }) {
  const pathname = usePathname();
  // Obtener los search params si estamos en un componente cliente que los necesite, 
  // pero Next.js requiere useSearchParams. Para simplificar, asumiremos que si
  // basePath incluye '?', estamos usando query params.

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
      <div className="flex gap-3 min-w-max">
        {categories.map((cat) => {
          const slug = slugify(cat.name);
          const isQueryMode = basePath.includes('?');
          const href = isQueryMode ? `${basePath}${slug}` : `${basePath}${slug}`;
          
          // La verificación de activo cambia si es query o path
          let isActive = false;
          if (isQueryMode) {
            // Un chequeo simple visual (en un entorno real usaríamos useSearchParams)
            isActive = typeof window !== 'undefined' && window.location.search.includes(slug);
          } else {
            isActive = pathname === href;
          }

          return (
            <Link 
              key={cat.id} 
              href={href}
              className={`
                px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm
                ${isActive 
                  ? 'bg-brand-500 text-navy-950 shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
                  : 'bg-navy-900 border border-navy-700/50 text-slate-300 hover:bg-navy-800 hover:text-white hover:border-brand-500/50'
                }
              `}
            >
              {cat.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
