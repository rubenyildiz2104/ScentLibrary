"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/utils/api";
import Link from "next/link";
import Image from "next/image";

type DiscoveryItem = {
  id: string;
  perfumeName: string | null;
  perfumeBrand: string | null;
  status: string;
  sillage: number | null;
  longevity: number | null;
  verdict: string | null;
  perfumeId?: string | null;
};

type SearchPerfume = {
  id: string;
  name: string;
  brand: string | null;
  image_url: string | null;
};

const STATUS_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  ToTest:       { label: "To Test",   emoji: "🧪", color: "text-blue-400 border-blue-400/30 bg-blue-400/10" },
  Wishlist:     { label: "Wishlist",  emoji: "💛", color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10" },
  Archived:     { label: "Archived", emoji: "📦", color: "text-white/40 border-white/10 bg-white/5" },
};

const VERDICT_ICONS: Record<string, string> = {
  Heart: "❤️", Neutral: "😐", Disappointment: "💔",
};

const VERDICTS = [
  { id: "Heart", label: "Coup de Coeur", emoji: "❤️" },
  { id: "Neutral", label: "Pas Mal", emoji: "😐" },
  { id: "Disappointment", label: "Déçu", emoji: "💔" },
];

function StarRating({ value, label }: { value: number | null; label: string }) {
  return (
    <div>
      <span className="text-[10px] text-white/40 uppercase tracking-wider">{label}</span>
      <div className="flex gap-0.5 mt-0.5">
        {[1,2,3,4,5].map(n => (
          <span key={n} className={`text-xs ${n <= (value ?? 0) ? "text-primary" : "text-white/15"}`}>★</span>
        ))}
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [fetching, setFetching] = useState(false);
  const [activeTab, setActiveTab] = useState<"Wishlist" | "ToTest" | "Archived">("Wishlist");
  
  // Modal State
  const [showAdd, setShowAdd] = useState(false);
  const [showRate, setShowRate] = useState<DiscoveryItem | null>(null);
  const [mode, setMode] = useState<"search" | "manual">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchPerfume[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Form State
  const [newName, setNewName] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [selectedPerfumeId, setSelectedPerfumeId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<"Wishlist" | "ToTest">("Wishlist");
  
  // Rating State
  const [ratingSillage, setRatingSillage] = useState(3);
  const [ratingLongevity, setRatingLongevity] = useState(3);
  const [ratingVerdict, setRatingVerdict] = useState("Neutral");
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFetching(true);
    api.getDiscovery()
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [user]);

  // Search Logic
  useEffect(() => {
    if (mode !== "search" || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await api.searchPerfumes(searchQuery);
        setSearchResults(results.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, mode]);

  const handleSelectPerfume = (p: SearchPerfume) => {
    setNewName(p.name);
    setNewBrand(p.brand || "");
    setSelectedPerfumeId(p.id);
    setMode("manual");
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const created = await api.addDiscovery({ 
        perfumeName: newName, 
        perfumeBrand: newBrand,
        perfumeId: selectedPerfumeId || undefined,
        status: newStatus 
      });
      setItems(prev => [created, ...prev]);
      resetForm();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRate) return;
    setSaving(true);
    try {
      await api.updateDiscovery(showRate.id, {
        sillage: ratingSillage,
        longevity: ratingLongevity,
        verdict: ratingVerdict,
        status: "Archived" // Auto archive once rated? Or let user choose? 
      });
      // Refresh list
      const data = await api.getDiscovery();
      setItems(data);
      setShowRate(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setShowAdd(false);
    setNewName("");
    setNewBrand("");
    setSelectedPerfumeId(null);
    setSearchQuery("");
    setMode("search");
  };

  const handleRemove = async (id: string) => {
    await api.removeDiscovery(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleStatusChange = async (id: string, status: string) => {
    await api.updateDiscovery(id, { status });
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  };

  const filtered = items.filter(i => i.status === activeTab);

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="text-6xl mb-4">💛</div>
        <h1 className="text-4xl font-heading font-bold text-white">My Wishlist</h1>
        <p className="text-white/40 max-w-sm font-light leading-relaxed">Sign in to track fragrances you want to discover.</p>
        <Link href="/login" className="px-10 py-4 bg-primary text-black font-bold rounded-2xl hover:scale-105 transition-all shadow-xl shadow-primary/10">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <section className="pt-8 md:pt-20 pb-24 px-4 md:px-6 max-w-2xl mx-auto w-full">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-white">
              My <span className="text-primary">Discovery</span>
            </h1>
            <p className="text-[10px] text-white/30 uppercase tracking-[0.25em] font-bold mt-2">
              {items.length} Scents to Explore
            </p>
          </div>
          <button 
            onClick={() => setShowAdd(true)} 
            className="w-12 h-12 bg-primary/10 border border-primary/30 text-primary flex items-center justify-center rounded-2xl hover:bg-primary/20 transition-all shadow-lg"
          >
            <span className="text-2xl font-light">+</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-10 p-1 bg-white/5 rounded-2xl">
          {(["Wishlist", "ToTest", "Archived"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === tab ? "bg-white/10 text-primary shadow-sm" : "text-white/30 hover:text-white/50"}`}>
              {STATUS_LABELS[tab].emoji} {STATUS_LABELS[tab].label}
            </button>
          ))}
        </div>

        {/* Add modal */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-xl px-0 md:px-4" onClick={resetForm}>
            <div className="w-full max-w-md bg-[#0a0a0a] rounded-t-[2.5rem] md:rounded-[2.5rem] p-8 md:p-10 border-t md:border border-white/10 shadow-2xl animate-in slide-in-from-bottom duration-500" onClick={e => e.stopPropagation()}>
              <h2 className="text-3xl font-heading font-bold text-white mb-8">
                {mode === "search" ? "Find a" : "Add"} <span className="text-primary">Fragrance</span>
              </h2>

              {mode === "search" ? (
                <div className="space-y-6">
                  <div className="relative">
                    <input 
                      type="text" 
                      autoFocus
                      placeholder="Search the library..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-all shadow-inner"
                    />
                    {isSearching && <div className="absolute right-4 top-4 w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />}
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                    {searchResults.map(p => (
                      <button key={p.id} onClick={() => handleSelectPerfume(p)} className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all text-left border border-transparent hover:border-white/5">
                        <div className="w-12 h-14 bg-black/40 rounded-xl overflow-hidden flex-shrink-0 border border-white/5 relative">
                          {p.image_url ? <Image src={p.image_url} alt={p.name} fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl opacity-20">💧</div>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-bold truncate">{p.name}</p>
                          <p className="text-[10px] text-white/30 uppercase tracking-widest">{p.brand}</p>
                        </div>
                      </button>
                    ))}
                    {searchQuery.trim() && searchResults.length === 0 && !isSearching && (
                      <div className="py-4 text-center">
                        <p className="text-white/30 text-sm mb-4">No results found in library.</p>
                        <button onClick={() => { setNewName(searchQuery); setMode("manual"); }} className="text-primary text-xs font-bold uppercase tracking-widest hover:underline">Add Manually Instead</button>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setMode("manual")} className="w-full py-4 text-white/20 hover:text-white/40 text-[10px] font-bold uppercase tracking-widest transition-all">Skip Search — Manual Entry</button>
                </div>
              ) : (
                <form onSubmit={handleAdd} className="space-y-6">
                  <div className="space-y-5">
                    <div>
                      <label className="text-[10px] text-white/30 uppercase tracking-[0.25em] font-bold mb-3 block">Brand / House</label>
                      <input type="text" placeholder="e.g. Chanel" value={newBrand} onChange={e => setNewBrand(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/30 uppercase tracking-[0.25em] font-bold mb-3 block">Fragrance Name</label>
                      <input type="text" placeholder="e.g. Bleu de Chanel" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-all" required />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/30 uppercase tracking-[0.25em] font-bold mb-3 block">Category</label>
                      <div className="flex gap-3">
                        {(["Wishlist", "ToTest"] as const).map(s => (
                          <button key={s} type="button" onClick={() => setNewStatus(s)} className={`flex-1 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider border transition-all ${newStatus === s ? "border-primary bg-primary text-black shadow-lg shadow-primary/20" : "border-white/5 bg-white/5 text-white/40 hover:border-white/20"}`}>
                            {STATUS_LABELS[s].emoji} {STATUS_LABELS[s].label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setMode("search")} className="flex-1 py-5 glass rounded-2xl text-white/60 font-bold text-sm">Back</button>
                    <button type="submit" disabled={saving || !newName.trim()} className="flex-[2] bg-primary text-black font-bold py-5 rounded-2xl shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50">{saving ? "Saving..." : "Add to List"}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Rate modal */}
        {showRate && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-xl px-0 md:px-4" onClick={() => setShowRate(null)}>
            <div className="w-full max-w-md bg-[#0a0a0a] rounded-t-[2.5rem] md:rounded-[2.5rem] p-8 md:p-10 border-t md:border border-white/10 shadow-2xl animate-in slide-in-from-bottom duration-500" onClick={e => e.stopPropagation()}>
              <h2 className="text-3xl font-heading font-bold text-white mb-8">Rate your <span className="text-primary">Discovery</span></h2>
              <form onSubmit={handleUpdateRating} className="space-y-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] text-white/30 uppercase tracking-[0.25em] font-bold mb-4 block">Verdict</label>
                    <div className="grid grid-cols-3 gap-2">
                      {VERDICTS.map(v => (
                        <button key={v.id} type="button" onClick={() => setRatingVerdict(v.id)} className={`flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all ${ratingVerdict === v.id ? "border-primary bg-primary/10 text-primary" : "border-white/5 bg-white/5 text-white/30"}`}>
                          <span className="text-2xl">{v.emoji}</span>
                          <span className="text-[9px] font-bold uppercase tracking-tight">{v.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-3">
                       <label className="text-[10px] text-white/30 uppercase tracking-[0.25em] font-bold">Sillage</label>
                       <span className="text-primary text-xs font-bold">{ratingSillage}/5</span>
                    </div>
                    <input type="range" min="1" max="5" value={ratingSillage} onChange={e => setRatingSillage(parseInt(e.target.value))} className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                       <label className="text-[10px] text-white/30 uppercase tracking-[0.25em] font-bold">Longevity</label>
                       <span className="text-primary text-xs font-bold">{ratingLongevity}/5</span>
                    </div>
                    <input type="range" min="1" max="5" value={ratingLongevity} onChange={e => setRatingLongevity(parseInt(e.target.value))} className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary" />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowRate(null)} className="flex-1 py-5 glass rounded-2xl text-white/60 font-bold">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-[2] bg-primary text-black font-bold py-5 rounded-2xl shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all">
                    {saving ? "Archiving..." : "Complete & Archive"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* List */}
        {fetching ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="glass rounded-3xl h-32 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center glass rounded-3xl border border-dashed border-white/10 flex flex-col items-center">
            <div className="text-6xl mb-6 opacity-20">💛</div>
            <p className="text-white/40 mb-8 font-medium">Your {activeTab.toLowerCase()} is empty.</p>
            <button onClick={() => setShowAdd(true)} className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-all">Add your first scent</button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(item => (
              <div key={item.id} className="group glass rounded-3xl p-5 md:p-6 flex items-start gap-5 hover:border-white/10 transition-all shadow-lg relative overflow-hidden">
                <div className="w-14 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl shadow-inner border border-white/5">
                  {STATUS_LABELS[item.status]?.emoji || "✨"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-primary uppercase tracking-[0.2em] font-bold mb-1 opacity-60">
                    {item.perfumeBrand || "Private Collection"}
                  </p>
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="font-heading font-bold text-lg md:text-xl text-white truncate leading-tight">{item.perfumeName}</h3>
                    {item.verdict && <span className="text-lg flex-shrink-0">{VERDICT_ICONS[item.verdict]}</span>}
                  </div>
                  
                  <div className="flex items-center gap-6 mb-5">
                    <StarRating value={item.sillage} label="Sillage" />
                    <StarRating value={item.longevity} label="Longevity" />
                  </div>

                  <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {activeTab === "ToTest" ? (
                      <button 
                        onClick={() => setShowRate(item)}
                        className="bg-primary text-black text-[10px] font-bold uppercase tracking-widest px-6 py-2 rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/10"
                      >
                        Rate Experience
                      </button>
                    ) : (
                      Object.entries(STATUS_LABELS).map(([s, v]) => (
                        <button key={s} onClick={() => handleStatusChange(item.id, s)}
                          className={`text-[9px] font-bold uppercase tracking-[0.1em] px-4 py-2 rounded-xl border transition-all whitespace-nowrap ${item.status === s ? "border-primary bg-primary text-black" : "border-white/5 text-white/20 hover:border-white/20"}`}>
                          {v.label}
                        </button>
                      ))
                    )}
                  </div>
                </div>
                <button onClick={() => handleRemove(item.id)} className="text-white/5 hover:text-red-500/50 transition-colors p-2 mt-1">✕</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
