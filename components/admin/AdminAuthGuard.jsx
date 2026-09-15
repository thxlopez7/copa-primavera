"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminAuthGuard({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        if (mounted) router.push("/login");
      } else {
        if (mounted) {
          setIsAuthenticated(true);
          setLoading(false);
        }
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          if (mounted) router.push("/login");
        } else if (session) {
          if (mounted) {
            setIsAuthenticated(true);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <i className="fa-solid fa-spinner animate-spin text-brand-500 text-4xl"></i>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Evitar flash antes del redireccionamiento
  }

  return <>{children}</>;
}
