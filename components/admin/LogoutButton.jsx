"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button 
      onClick={handleLogout}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors font-bold text-sm text-slate-400 mt-2"
    >
      <i className="fa-solid fa-arrow-right-from-bracket w-5"></i> Salir
    </button>
  );
}
