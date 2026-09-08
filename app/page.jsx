"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

import Navbar from "@/components/Navbar";
import AdminBanner from "@/components/AdminBanner";
import Footer from "@/components/Footer";
import TabInicio from "@/components/TabInicio";
import TabNoticias from "@/components/TabNoticias";
import TabFixture from "@/components/TabFixture";
import TabProgramacion from "@/components/TabProgramacion";

import ContactModal from "@/components/Modals/ContactModal";
import AdminLoginModal from "@/components/Modals/AdminLoginModal";
import MatchDetailModal from "@/components/Modals/MatchDetailModal";
import ManageCategoriesModal from "@/components/Modals/ManageCategoriesModal";
import ManagePairsModal from "@/components/Modals/ManagePairsModal";
import EditMatchModal from "@/components/Modals/EditMatchModal";
import NewsModal from "@/components/Modals/NewsModal";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("inicio");
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  
  const [categories, setCategories] = useState([]);
  const [pairs, setPairs] = useState({});
  const [news, setNews] = useState([]);
  const [matches, setMatches] = useState([]);

  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isMatchDetailOpen, setIsMatchDetailOpen] = useState(false);
  const [isManageCatOpen, setIsManageCatOpen] = useState(false);
  const [isManagePairsOpen, setIsManagePairsOpen] = useState(false);
  const [isEditMatchOpen, setIsEditMatchOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);

  const openEditMatch = (match) => {
    setSelectedMatch(match);
    setIsEditMatchOpen(true);
  };

  useEffect(() => {
    // Escuchar cambios de sesión
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAdmin(!!session);
    });

    // Check inicial de sesión
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdmin(!!session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchMatches = async () => {
    try {
      // Usamos el join para traer la info de player1 y player2
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          team1:team1_id (id, player1_name, player2_name),
          team2:team2_id (id, player1_name, player2_name)
        `);
      if (error) {
        console.error("Error DB al fetchMatches:", error.message, error.details);
        throw error;
      }
      setMatches(data || []);
    } catch (error) {
      console.error("Error fetching matches:", error);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch Categories
        const { data: categoriesData, error: catError } = await supabase
          .from('categories')
          .select('*');
        
        if (catError) {
          console.error("Error DB (categories):", catError.message, catError.details);
          throw catError;
        }
        setCategories(categoriesData || []);
        if (categoriesData && categoriesData.length > 0) {
          setSelectedCategory(categoriesData[0].id);
        }

        // Fetch Pairs
        const { data: pairsData, error: pairsError } = await supabase
          .from('pairs')
          .select('*');
          
        if (pairsError) {
          console.error("Error DB (pairs):", pairsError.message, pairsError.details);
          throw pairsError;
        }
        const groupedPairs = {};
        if (pairsData) {
          pairsData.forEach(p => {
            if (!groupedPairs[p.category_id]) {
              groupedPairs[p.category_id] = [];
            }
            groupedPairs[p.category_id].push(p);
          });
        }
        setPairs(groupedPairs);

        // Fetch News
        const { data: newsData, error: newsError } = await supabase
          .from('news')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (newsError) {
          console.error("Error DB (news):", newsError.message, newsError.details);
          throw newsError;
        }
        setNews(newsData || []);

        await fetchMatches();

      } catch (error) {
        console.error("Error fetching data from Supabase:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-navy-950 text-white">
        <div className="w-12 h-12 border-4 border-copaBlue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold text-slate-300">Cargando datos del torneo...</p>
      </div>
    );
  }

  const handleDeleteNews = async (id) => {
    if (!isAdmin) return;
    if (confirm("¿Estás seguro de eliminar esta noticia?")) {
      try {
        const { error } = await supabase.from('news').delete().eq('id', id);
        if (error) {
          console.error("Error DB:", error.message, error.details);
          alert("Error DB: " + error.message);
          return;
        }
        setNews(news.filter(n => n.id !== id));
      } catch (error) {
        console.error("Error al eliminar noticia:", error);
      }
    }
  };

  return (
    <>
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isAdmin={isAdmin} 
        openContactModal={() => setIsContactOpen(true)} 
        openAdminModal={() => setIsAdminLoginOpen(true)} 
      />
      
      <AdminBanner isAdmin={isAdmin} logoutAdmin={handleLogout} />
      
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "inicio" && (
          <TabInicio 
            categories={categories} 
            news={news} 
            setActiveTab={setActiveTab} 
            openContactModal={() => setIsContactOpen(true)}
            selectCategory={setSelectedCategory}
          />
        )}
        
        {activeTab === "noticias" && (
          <TabNoticias 
            news={news} 
            isAdmin={isAdmin} 
            openNewsModal={() => setIsNewsModalOpen(true)} 
            handleDeleteNews={handleDeleteNews}
          />
        )}
        
        {activeTab === "fixture" && (
          <TabFixture 
            categories={categories} 
            selectedCategory={selectedCategory} 
            setSelectedCategory={setSelectedCategory} 
            isAdmin={isAdmin} 
            openManageCategoriesModal={() => setIsManageCatOpen(true)}
            openManagePairsModal={() => setIsManagePairsOpen(true)}
            pairs={pairs}
            matches={matches}
            onFixtureRegenerated={fetchMatches}
            openEditMatch={openEditMatch}
          />
        )}

        {isAdmin && activeTab === "programacion" && (
          <TabProgramacion 
            categories={categories} 
            matches={matches}
            pairs={pairs}
            isAdmin={isAdmin} 
            onProgramacionUpdated={fetchMatches}
          />
        )}
      </main>

      <Footer 
        openContactModal={() => setIsContactOpen(true)} 
        openAdminModal={() => setIsAdminLoginOpen(true)} 
      />

      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
      <AdminLoginModal isOpen={isAdminLoginOpen} onClose={() => setIsAdminLoginOpen(false)} />
      <MatchDetailModal isOpen={isMatchDetailOpen} onClose={() => setIsMatchDetailOpen(false)} />
      <ManageCategoriesModal isOpen={isManageCatOpen} onClose={() => setIsManageCatOpen(false)} categories={categories} setCategories={setCategories} isAdmin={isAdmin} />
      <ManagePairsModal isOpen={isManagePairsOpen} onClose={() => setIsManagePairsOpen(false)} selectedCategory={selectedCategory} pairs={pairs} setPairs={setPairs} isAdmin={isAdmin} />
      <EditMatchModal isOpen={isEditMatchOpen} onClose={() => setIsEditMatchOpen(false)} match={selectedMatch} isAdmin={isAdmin} onSuccess={fetchMatches} />
      <NewsModal isOpen={isNewsModalOpen} onClose={() => setIsNewsModalOpen(false)} news={news} setNews={setNews} isAdmin={isAdmin} />
    </>
  );
}
