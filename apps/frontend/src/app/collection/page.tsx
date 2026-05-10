"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/LanguageContext";
import { api } from "@/utils/api";
import Link from "next/link";
import Image from "next/image";
import PerfumeCard from "@/components/PerfumeCard";

type CollectionItem = {
  id: string;
  format: string;
  level: number;
  openedAt: string;
  perfume: {
    id: string;
    name: string;
    brand: string | null;
    image_url: string | null;
    notes_top: string[];
  };
};

type SearchPerfume = {
  id: string;
  name: string;
  brand: string | null;
  image_url: string | null;
};

const FORMAT_EMOJIS: Record<string, string> = {
  "Flacon": "🍾",
  "Decant": "🧪",
  "Echantillon": "💧",
  "Bottle": "🍾",
  "Sample": "💧"
};

function OxidationBar({ level, openedAt, onDateClick }: { level: number; openedAt: string; onDateClick?: (e: React.MouseEvent) => void }) {
  const { t, language } = useTranslation();
  const daysOpen = Math.floor((Date.now() - new Date(openedAt).getTime()) / (1000 * 60 * 60 * 24));
  const color = level > 60 ? "bg-primary" : level > 30 ? "bg-amber-500" : "bg-red-500";
  const dateStr = new Date(openedAt).toLocaleDateString(language === "fr" ? 'fr-FR' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1 text-[9px] uppercase font-bold tracking-wider">
        <span className="text-white/30">{level}% {t('remaining_level')}</span>
        <button onClick={onDateClick} className="text-primary hover:underline flex items-center gap-1">
           🗓️ {dateStr} ({daysOpen}{t('days_open')})
        </button>
      </div>
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden shadow-inner">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${level}%` }}
        />
      </div>
    </div>
  );
}

export default function CollectionPage() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [fetching, setFetching] = useState(false);
  
  // Modals
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<CollectionItem | null>(null);
  const [detailItem, setDetailItem] = useState<CollectionItem | null>(null);
  
  // Search-First Add State
  const [mode, setMode] = useState<"search" | "manual">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchPerfume[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Form States
  const [formBrand, setFormBrand] = useState("");
  const [formName, setFormName] = useState("");
  const [formFormat, setFormFormat] = useState("Flacon");
  const [formOpenedAt, setFormOpenedAt] = useState("");
  const [formLevel, setFormLevel] = useState(100);
  const [selectedPerfumeId, setSelectedPerfumeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchCollection();
  }, [user]);

  const fetchCollection = async () => {
    setFetching(true);
    try {
      const data = await api.getCollection();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  // Search Logic (same as Wishlist)
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
    setFormName(p.name);
    setFormBrand(p.brand || "");
    setSelectedPerfumeId(p.id);
    setMode("manual");
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setSaving(true);
    try {
      await api.addToCollection({
        perfumeName: formName,
        perfumeBrand: formBrand,
        perfumeId: selectedPerfumeId || undefined,
        format: formFormat,
        level: 100,
        openedAt: new Date().toISOString(),
      });
      fetchCollection();
      resetForm();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setShowAdd(false);
    setFormName("");
    setFormBrand("");
    setSelectedPerfumeId(null);
    setSearchQuery("");
    setMode("search");
  };

  const openEdit = (e: React.MouseEvent, item: CollectionItem) => {
    e.stopPropagation();
    setEditingItem(item);
    setFormLevel(item.level);
    setFormFormat(item.format);
    setFormOpenedAt(new Date(item.openedAt).toISOString().split('T')[0]);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setSaving(true);
    try {
      await api.updateCollectionItem(editingItem.id, {
        level: formLevel,
        format: formFormat,
        openedAt: new Date(formOpenedAt).toISOString(),
      });
      fetchCollection();
      setEditingItem(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Remove this fragrance from your collection?")) return;
    await api.removeFromCollection(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="text-6xl mb-4">🧴</div>
        <h1 className="text-4xl font-heading font-bold text-white">{t('vault_title')}</h1>
        <p className="text-white/40 max-w-sm font-light leading-relaxed">Sign in to manage your personal fragrance library.</p>
        <Link href="/login" className="px-10 py-4 bg-primary text-black font-bold rounded-2xl hover:scale-105 transition-all shadow-xl shadow-primary/10">{t('sign_in')}</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <section className="pt-8 md:pt-20 pb-24 px-4 md:px-6 max-w-2xl mx-auto w-full">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-white">
              {t('vault_title').split(' ')[0]} <span className="text-primary">{t('vault_title').split(' ')[1] || ""}</span>
            </h1>
            <p className="text-[10px] text-white/30 uppercase tracking-[0.25em] font-bold mt-2">
              {items.length} {t('vault_subtitle')}
            </p>
          </div>
          <button onClick={() => setShowAdd(true)} className="w-12 h-12 bg-primary/10 border border-primary/30 text-primary flex items-center justify-center rounded-2xl hover:bg-primary/20 transition-all shadow-lg">
            <span className="text-2xl font-light">+</span>
          </button>
        </div>

        {fetching ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="glass rounded-3xl h-32 animate-pulse" />)}</div>
        ) : items.length === 0 ? (
          <div className="py-24 text-center glass rounded-3xl border border-dashed border-white/10 flex flex-col items-center">
             <div className="text-6xl mb-6 opacity-20">🧴</div>
             <p className="text-white/40 mb-8 font-medium">{t('vault_empty')}</p>
             <Link href="/library" className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-all">{t('nav_library')}</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <div 
                key={item.id} 
                onClick={() => setDetailItem(item)}
                className="group glass rounded-3xl p-5 flex gap-5 items-start hover:border-white/10 transition-all shadow-lg relative overflow-hidden cursor-pointer active:scale-[0.98]"
              >
                <div className="flex flex-col gap-2 items-center flex-shrink-0">
                  <div className="relative w-16 h-20 md:w-20 md:h-24 rounded-2xl overflow-hidden bg-black/40 border border-white/5 shadow-inner">
                    {item.perfume.image_url ? (
                      <Image src={item.perfume.image_url} alt={item.perfume.name} fill className="object-cover group-hover:scale-110 transition-all duration-500" sizes="80px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">💧</div>
                    )}
                  </div>
                  <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-lg text-[7px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-1">
                     {FORMAT_EMOJIS[item.format] || "🧴"} {item.format}
                  </span>
                </div>

                <div className="flex-1 min-w-0 flex flex-col py-1">
                  <div className="mb-4 pr-12">
                    <div className="mb-1">
                      <p className="text-[10px] text-primary uppercase tracking-[0.2em] font-bold opacity-60">
                        {item.perfume.brand || "Private Collection"}
                      </p>
                    </div>
                    <h3 className="font-heading font-bold text-lg text-white truncate leading-tight">
                      {item.perfume.name}
                    </h3>
                  </div>

                  <OxidationBar level={item.level} openedAt={item.openedAt} onDateClick={(e) => openEdit(e, item)} />
                </div>

                {/* Actions Overlay */}
                <div className="absolute top-3 right-3 flex gap-2">
                   <button 
                     onClick={(e) => openEdit(e, item)} 
                     className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-[10px] hover:bg-primary hover:text-black transition-all shadow-xl"
                   >
                     ✏️
                   </button>
                   <button 
                     onClick={(e) => handleRemove(e, item.id)} 
                     className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-[10px] hover:bg-red-500 hover:text-white transition-all shadow-xl"
                   >
                     ✕
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Search-First Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-xl px-0 md:px-4" onClick={resetForm}>
            <div className="flex-1 overflow-y-auto p-8 md:p-10 border-t md:border border-white/10 shadow-2xl animate-in slide-in-from-bottom duration-500 pb-32 md:pb-10" onClick={e => e.stopPropagation()}>
            <h2 className="text-3xl font-heading font-bold text-white mb-8">
              {mode === "search" ? "Find in" : "Add to"} <span className="text-primary">{t('nav_collection')}</span>
            </h2>

            {mode === "search" ? (
              <div className="space-y-6">
                <div className="relative">
                  <input 
                    type="text" 
                    autoFocus
                    placeholder={t('search_library')}
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
                      <p className="text-white/30 text-sm mb-4">No results found.</p>
                      <button onClick={() => { setFormName(searchQuery); setMode("manual"); }} className="text-primary text-xs font-bold uppercase tracking-widest hover:underline">{t('add_manually')}</button>
                    </div>
                  )}
                </div>
                <button onClick={() => setMode("manual")} className="w-full py-4 text-white/20 hover:text-white/40 text-[10px] font-bold uppercase tracking-widest transition-all">Skip Search</button>
              </div>
            ) : (
              <form onSubmit={handleAdd} className="space-y-6">
                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] text-white/30 uppercase tracking-[0.25em] font-bold mb-3 block">{t('brand')}</label>
                    <input type="text" value={formBrand} onChange={e => setFormBrand(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/30 uppercase tracking-[0.25em] font-bold mb-3 block">{t('name')}</label>
                    <input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white" required />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/30 uppercase tracking-[0.25em] font-bold mb-3 block">{t('format')}</label>
                    <div className="flex gap-2">
                      {["Flacon", "Decant", "Echantillon"].map(f => (
                        <button key={f} type="button" onClick={() => setFormFormat(f)} className={`flex-1 py-3 rounded-xl text-[9px] font-bold border transition-all ${formFormat === f ? "border-primary bg-primary text-black" : "border-white/5 bg-white/5 text-white/40"}`}>{f}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setMode("search")} className="flex-1 py-5 glass rounded-2xl text-white/60 font-bold">{t('cancel')}</button>
                  <button type="submit" disabled={saving} className="flex-[2] bg-primary text-black font-bold py-5 rounded-2xl">{saving ? "..." : t('add_to_vault')}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-xl px-0 md:px-4" onClick={() => setEditingItem(null)}>
          <div className="w-full max-w-md bg-[#0a0a0a] rounded-t-[2.5rem] md:rounded-[2.5rem] p-8 md:p-10 border-t md:border border-white/10 shadow-2xl pb-32 md:pb-10" onClick={e => e.stopPropagation()}>
            <h2 className="text-3xl font-heading font-bold text-white mb-2">{t('edit_details').split(' ')[0]} <span className="text-primary">{t('edit_details').split(' ')[1] || ""}</span></h2>
            <p className="text-white/30 text-xs mb-8">{editingItem.perfume.name}</p>
            <form onSubmit={handleUpdate} className="space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] text-white/30 uppercase tracking-[0.25em] font-bold mb-3 block">{t('opening_date')}</label>
                  <input type="date" value={formOpenedAt} onChange={e => setFormOpenedAt(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white [color-scheme:dark]" />
                </div>
                <div>
                  <label className="text-[10px] text-white/30 uppercase tracking-[0.25em] font-bold mb-3 block">{t('remaining_level')} ({formLevel}%)</label>
                  <input type="range" min="0" max="100" value={formLevel} onChange={e => setFormLevel(parseInt(e.target.value))} className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary" />
                </div>
                <div>
                  <label className="text-[10px] text-white/30 uppercase tracking-[0.25em] font-bold mb-3 block">{t('format')}</label>
                  <div className="flex gap-2">
                    {["Flacon", "Decant", "Echantillon"].map(f => (
                      <button key={f} type="button" onClick={() => setFormFormat(f)} className={`flex-1 py-3 rounded-xl text-[9px] font-bold border transition-all ${formFormat === f ? "border-primary bg-primary text-black" : "border-white/5 bg-white/5 text-white/30"}`}>{f}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setEditingItem(null)} className="flex-1 py-5 glass rounded-2xl text-white/60 font-bold">{t('cancel')}</button>
                <button type="submit" disabled={saving} className="flex-[2] bg-primary text-black font-bold py-5 rounded-2xl">{saving ? "..." : t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal (PerfumeCard) */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDetailItem(null)}>
           <PerfumeCard 
             perfume={{
               ...detailItem.perfume,
               id: detailItem.perfume.id,
               accords: [],
               notes_top: [],
               notes_middle: [],
               notes_base: []
             }}
             forceOpen={true}
             onClose={() => setDetailItem(null)}
             collectionData={{
               level: detailItem.level,
               format: detailItem.format,
               openedAt: detailItem.openedAt
             }}
           />
        </div>
      )}
    </div>
  );
}
