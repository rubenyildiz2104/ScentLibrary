"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { api } from "@/utils/api";
import { useTranslation } from "@/context/LanguageContext";

type Perfume = {
  id: string;
  name: string;
  brand: string | null;
  release_year?: number | null;
  gender?: string | null;
  image_url: string | null;
  rating?: number | null;
  notes_top?: string[];
  notes_middle?: string[];
  notes_base?: string[];
  perfumer?: string | null;
  accords?: string[];
};

interface PerfumeCardProps {
  perfume: Perfume;
  forceOpen?: boolean;
  onClose?: () => void;
  collectionData?: {
    level: number;
    format: string;
    openedAt: string;
  };
}

export default function PerfumeCard({ perfume, forceOpen, onClose, collectionData }: PerfumeCardProps) {
  const { t, language } = useTranslation();
  const [isOpen, setIsOpen] = useState(forceOpen || false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [details, setDetails] = useState<Perfume | null>(null);
  const [showImageEdit, setShowImageEdit] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");

  const p = details || perfume;

  useEffect(() => {
    if (isOpen && (!p.notes_top || p.notes_top.length === 0 || !p.accords || p.accords.length === 0)) {
      fetchDetails();
    }
  }, [isOpen]);

  const fetchDetails = async () => {
    setLoadingDetails(true);
    try {
      const fullData = await api.getPerfume(perfume.id);
      setDetails(fullData);
    } catch (err) {
      console.error("Failed to fetch perfume details", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const oxidationInfo = useMemo(() => {
    if (!collectionData || !p.accords) return null;
    
    const daysOpen = Math.floor((Date.now() - new Date(collectionData.openedAt).getTime()) / (1000 * 60 * 60 * 24));
    let shelfLifeDays = 1460; // Default 4 years (1460 days)
    
    const highRisk = ["citrus", "fresh", "aquatic", "green", "ozonic", "marine", "fruity"];
    const lowRisk = ["woody", "amber", "oriental", "balsamic", "leather", "oud", "patchouli", "spicy", "vanilla", "musk"];
    
    const lowerAccords = p.accords.map(a => a.toLowerCase());
    
    if (lowerAccords.some(a => highRisk.includes(a))) {
      shelfLifeDays = 730; // 2 years for freshies
    } else if (lowerAccords.some(a => lowRisk.includes(a))) {
      shelfLifeDays = 2190; // 6 years for heavy base notes
    }
    
    const oxidation = Math.min(100, Math.round((daysOpen / shelfLifeDays) * 100));
    return { oxidation, daysOpen, shelfLifeDays };
  }, [collectionData, p.accords]);

  const handleOpenDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(true);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleUpdateImage = async () => {
    if (!newImageUrl) return;
    try {
      await api.updatePerfume(perfume.id, { image_url: newImageUrl });
      alert("Image updated!");
      setShowImageEdit(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Error updating image");
    }
  };

  const renderImage = (large = false) => {
    if (p.image_url) {
      return (
        <Image 
          src={p.image_url} 
          alt={p.name} 
          fill 
          className="object-cover group-hover:scale-110 transition-all duration-700 ease-out"
          sizes={large ? "400px" : "200px"}
        />
      );
    }
    return (
      <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex flex-col items-center justify-center p-4">
        <span className="text-4xl md:text-5xl opacity-20 mb-2">💧</span>
        <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] text-center">{p.brand || "Perfume"}</span>
      </div>
    );
  };

  return (
    <>
      {!forceOpen && (
        <div onClick={handleOpenDetail} className="group relative glass rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-white/5 hover:border-white/20">
          <div className="aspect-[4/5] relative">
            {renderImage()}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
            {p.rating && (
              <div className="absolute top-4 right-4 glass px-2.5 py-1 rounded-full flex items-center gap-1 border border-white/10 backdrop-blur-md">
                <span className="text-primary text-xs">★</span>
                <span className="text-white text-[10px] font-bold">{p.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          <div className="p-5">
            <p className="text-[9px] text-primary uppercase tracking-[0.2em] font-bold mb-1 opacity-60 truncate">{p.brand}</p>
            <h3 className="text-white font-heading font-bold text-base truncate leading-tight">{p.name}</h3>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-xl p-0 md:p-6" onClick={handleClose}>
          <div className="w-full max-w-4xl bg-[#0a0a0a] rounded-t-[2.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl border-t md:border border-white/10 max-h-[95vh] md:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-500 relative" onClick={e => e.stopPropagation()}>
            {/* Close Button Mobile */}
            <div className="absolute top-6 right-6 z-[110] md:hidden">
              <button 
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-xl backdrop-blur-md"
              >
                ×
              </button>
            </div>

            <div className="md:hidden flex justify-center py-4 cursor-pointer" onClick={handleClose}>
              <div className="w-12 h-1 bg-white/30 rounded-full" />
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-14 pb-32 md:pb-14">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
                {/* Left */}
                <div className="space-y-8">
                  <div className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 group/img">
                    {renderImage(true)}
                    <button onClick={() => setShowImageEdit(!showImageEdit)} className="absolute bottom-4 right-4 glass p-3 rounded-full opacity-0 group-hover/img:opacity-100 transition-all hover:bg-primary/20 text-white">📸</button>
                    {showImageEdit && (
                      <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
                        <p className="text-xs text-white/50 uppercase tracking-widest mb-4">Paste Image URL</p>
                        <input type="text" value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} placeholder="https://..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm mb-4" />
                        <div className="flex gap-2 w-full">
                           <button onClick={() => setShowImageEdit(false)} className="flex-1 py-3 glass text-xs font-bold rounded-xl">{t('cancel')}</button>
                           <button onClick={handleUpdateImage} className="flex-1 py-3 bg-primary text-black text-xs font-bold rounded-xl">{t('save')}</button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="glass rounded-2xl p-4 text-center">
                      <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">{t('rating')}</p>
                      <p className="text-xl font-heading font-bold text-primary">{p.rating?.toFixed(1) || "N/A"}</p>
                    </div>
                    <div className="glass rounded-2xl p-4 text-center">
                      <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">{t('release_year')}</p>
                      <p className="text-xl font-heading font-bold text-white">{p.release_year || "—"}</p>
                    </div>
                    <div className="glass rounded-2xl p-4 text-center">
                      <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">{t('gender')}</p>
                      <p className="text-[10px] font-heading font-bold text-white/70 uppercase">{p.gender ? t(p.gender.toLowerCase()) : t('unisex')}</p>
                    </div>
                  </div>
                </div>

                {/* Right */}
                <div className="flex flex-col">
                  <div className="mb-8">
                    <h2 className="text-4xl lg:text-5xl font-heading font-bold text-white mb-2 leading-tight">{p.name}</h2>
                    <p className="text-primary text-base md:text-lg uppercase tracking-[0.2em] font-bold">{p.brand}</p>
                    
                    {collectionData && (
                      <div className="mt-8 space-y-6">
                        <div className="flex flex-wrap gap-3">
                          <div className="px-4 py-3 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-3">
                             <span className="text-2xl">🍾</span>
                             <div>
                               <p className="text-[8px] text-primary/60 uppercase font-bold tracking-[0.2em]">{t('format')}</p>
                               <p className="text-sm text-primary font-bold">{collectionData.format}</p>
                             </div>
                          </div>
                          <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                             <span className="text-2xl">📅</span>
                             <div>
                               <p className="text-[8px] text-white/40 uppercase font-bold tracking-[0.2em]">{t('opening_date')}</p>
                               <p className="text-sm text-white font-bold">{new Date(collectionData.openedAt).toLocaleDateString()}</p>
                             </div>
                          </div>
                          <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                             <span className="text-2xl">💧</span>
                             <div>
                               <p className="text-[8px] text-white/40 uppercase font-bold tracking-[0.2em]">{t('remaining_level')}</p>
                               <p className="text-sm text-white font-bold">{collectionData.level}%</p>
                             </div>
                          </div>
                        </div>

                        {/* Oxidation Calculation Display */}
                        {oxidationInfo && (
                          <div className="glass rounded-2xl p-5 border border-white/5">
                             <div className="flex justify-between items-center mb-3">
                                <h4 className="text-[10px] text-white/30 uppercase tracking-[0.25em] font-bold">{t('oxidation_index')}</h4>
                                <span className={`text-xs font-bold ${oxidationInfo.oxidation > 70 ? "text-red-400" : oxidationInfo.oxidation > 40 ? "text-amber-400" : "text-green-400"}`}>
                                  {oxidationInfo.oxidation}%
                                </span>
                             </div>
                             <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-3">
                                <div 
                                  className={`h-full rounded-full transition-all duration-1000 ${oxidationInfo.oxidation > 70 ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]" : oxidationInfo.oxidation > 40 ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]" : "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]"}`}
                                  style={{ width: `${oxidationInfo.oxidation}%` }}
                                />
                             </div>
                             <p className="text-[10px] text-white/40 font-light leading-relaxed italic">
                                {oxidationInfo.oxidation > 70 
                                  ? t('oxidation_high') 
                                  : oxidationInfo.oxidation > 40 
                                  ? t('oxidation_mod') 
                                  : t('oxidation_stable')}
                             </p>
                          </div>
                        )}
                      </div>
                    )}

                    {p.perfumer && (
                      <p className="text-white/40 text-[10px] mt-8 italic font-light">{t('perfumer_phrase')} <span className="text-white/60 font-medium not-italic">{p.perfumer}</span></p>
                    )}
                  </div>

                  {/* Accords */}
                  {p.accords && p.accords.length > 0 && (
                    <div className="mb-10">
                      <div className="flex flex-wrap gap-2">
                        {p.accords.map((accord, idx) => (
                          <span key={idx} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/50 uppercase font-bold tracking-widest">
                            {t(accord.toLowerCase())}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {loadingDetails ? (
                    <div className="space-y-8 animate-pulse mt-4">
                      <div className="h-4 bg-white/5 rounded w-1/3" />
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-white/5 rounded-2xl w-full" />)}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-10">
                      <div className="space-y-8">
                        <h4 className="text-[10px] text-white/30 uppercase tracking-[0.25em] font-bold flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-primary" /> {t('scent_profile')}
                        </h4>
                        <div className="space-y-6">
                          {p.notes_top && p.notes_top.length > 0 && (
                            <div className="flex gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl shadow-inner flex-shrink-0">🍃</div>
                              <div>
                                <p className="text-[10px] text-white/20 font-bold uppercase mb-1 tracking-widest">{t('top_notes')}</p>
                                <p className="text-sm text-white/70 font-light leading-relaxed">{p.notes_top.map(n => t(n.toLowerCase())).join(" · ")}</p>
                              </div>
                            </div>
                          )}
                          {p.notes_middle && p.notes_middle.length > 0 && (
                            <div className="flex gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl shadow-inner flex-shrink-0">🌸</div>
                              <div>
                                <p className="text-[10px] text-white/20 font-bold uppercase mb-1 tracking-widest">{t('middle_notes')}</p>
                                <p className="text-sm text-white/70 font-light leading-relaxed">{p.notes_middle.map(n => t(n.toLowerCase())).join(" · ")}</p>
                              </div>
                            </div>
                          )}
                          {p.notes_base && p.notes_base.length > 0 && (
                            <div className="flex gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl shadow-inner flex-shrink-0">🪵</div>
                              <div>
                                <p className="text-[10px] text-white/20 font-bold uppercase mb-1 tracking-widest">{t('base_notes')}</p>
                                <p className="text-sm text-white/70 font-light leading-relaxed">{p.notes_base.map(n => t(n.toLowerCase())).join(" · ")}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button onClick={handleClose} className="hidden md:flex absolute top-8 right-8 w-12 h-12 glass rounded-full items-center justify-center text-xl hover:bg-white/10 transition-all border border-white/10">✕</button>
          </div>
        </div>
      )}
    </>
  );
}
