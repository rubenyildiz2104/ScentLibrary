"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import PerfumeCard from "@/components/PerfumeCard";
import { useTranslation } from "@/context/LanguageContext";
import { API_URL } from "@/utils/api";

type Perfume = {
  id: string;
  name: string;
  brand: string | null;
  release_year: number | null;
  gender: string | null;
  image_url: string | null;
  rating: number | null;
};

const GENDER_FILTERS = ["All", "Men", "Women", "Unisex"] as const;
const LIMIT = 50;

export default function LibraryPage() {
  const { t, language } = useTranslation();
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [query, setQuery] = useState("");
  const [gender, setGender] = useState<string>("All");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  
  const [showSearch, setShowSearch] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 100) {
        setShowSearch(true);
      } else if (currentScrollY > lastScrollY) {
        setShowSearch(false);
      } else {
        setShowSearch(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Load Initial or Search
  const loadData = useCallback(async (reset = false) => {
    setLoading(true);
    const currentPage = reset ? 1 : page;
    const url = query.trim() 
      ? `${API_URL}/perfumes/search?q=${encodeURIComponent(query)}&page=${currentPage}&limit=${LIMIT}`
      : `${API_URL}/perfumes?page=${currentPage}&limit=${LIMIT}&gender=${gender}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      
      if (reset) {
        setPerfumes(data);
      } else {
        setPerfumes(prev => [...prev, ...data]);
      }
      setHasMore(data.length === LIMIT);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [query, gender, page]);

  // Handle Query Changes (Reset everything)
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadData(true);
    // Scroll to top when search or filters change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [query, gender]);

  // Handle Page Changes (Append)
  useEffect(() => {
    if (page > 1) {
      loadData(false);
    }
  }, [page]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <section className="pt-8 md:pt-20 pb-6 md:pb-10 px-4 md:px-6 max-w-7xl mx-auto w-full">
        <h1 className="text-3xl md:text-5xl font-heading font-bold mb-3 md:mb-4">
          {t('library_title').split(' ')[0]} <span className="text-primary">{t('library_title').split(' ').slice(1).join(' ')}</span>
        </h1>
        <p className="text-sm md:text-base text-white/50 max-w-2xl font-light">
          {t('library_subtitle')}
        </p>

        {/* Search + Filters - Smart Transparent */}
        <div className={`sticky top-[72px] z-30 -mx-4 px-4 md:-mx-6 md:px-6 py-6 mt-6 md:mt-8 mb-8 transition-transform duration-300 ease-in-out ${
          showSearch ? "translate-y-0" : "-translate-y-full"
        }`}>
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="relative w-full md:max-w-md group">
              <div className="absolute inset-y-0 left-0 pl-0 flex items-center pointer-events-none text-white/20 group-focus-within:text-primary transition-colors">
                 🔍
              </div>
              <input
                type="text"
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setIsSearching(true);
                }}
                placeholder={t('search_library')}
                className="w-full bg-transparent border-b border-white/10 rounded-none py-3 pl-8 pr-10 text-lg font-heading text-white placeholder-white/10 focus:outline-none focus:border-primary/50 transition-all"
              />
              {(query || isSearching) && (
                 <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    {isSearching ? <div className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin" /> : 
                    <button onClick={() => setQuery("")} className="text-white/20 hover:text-white transition-colors">✕</button>}
                 </div>
              )}
            </div>

            <div className="flex gap-3 flex-wrap justify-center md:justify-end">
              {GENDER_FILTERS.map(g => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${
                    gender === g ? "bg-primary text-black shadow-lg shadow-primary/20" : "text-white/20 hover:text-white/50 border border-white/5 bg-white/[0.02]"
                  }`}
                >
                  {t(g.toLowerCase())}
                </button>
              ))}
            </div>
          </div>
        </div>


      {/* Grid */}
      <div className="flex-1 px-4 md:px-6 pb-24 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {perfumes.map((perfume, idx) => (
            <PerfumeCard key={`${perfume.id}-${idx}`} perfume={perfume} />
          ))}
          
          {/* Skeletons while loading more */}
          {loading && [...Array(10)].map((_, i) => (
            <div key={`skeleton-${i}`} className="glass rounded-2xl aspect-[4/5] animate-pulse" />
          ))}
        </div>

        {/* Sentinel for Infinite Scroll */}
        <div ref={lastElementRef} className="h-20 flex items-center justify-center mt-10">
           {hasMore && !loading && (
             <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold">Scrolling for more scents...</p>
           )}
           {!hasMore && perfumes.length > 0 && (
             <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold">You've reached the end of the collection</p>
           )}
        </div>

        {!loading && perfumes.length === 0 && (
          <div className="py-20 text-center glass rounded-3xl border border-dashed border-white/10">
            <p className="text-4xl mb-4 opacity-20">🧴</p>
            <p className="text-white/40 mb-2">No fragrances found.</p>
            <button onClick={() => { setQuery(""); setGender("All"); }} className="text-primary text-sm font-bold hover:underline">Clear filters</button>
          </div>
        )}
        </div>
      </section>
    </div>
  );
}
