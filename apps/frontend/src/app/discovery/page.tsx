"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/api";
import { useTranslation } from "@/context/LanguageContext";

type Weather = {
  temp: number;
  condition: string;
};

type Perfume = {
  id: string;
  name: string;
  brand: string | null;
  gender: string | null;
  notes_top: string[];
  notes_middle: string[];
  notes_base: string[];
  rating: number | null;
  image_url: string | null;
};

const MOODS = [
  { id: "energetic", key: "mood_energetic", emoji: "⚡" },
  { id: "romantic",  key: "mood_romantic",  emoji: "🌹" },
  { id: "casual",    key: "mood_casual",    emoji: "😊" },
  { id: "formal",    key: "mood_formal",    emoji: "👔" },
  { id: "fresh",     key: "mood_fresh",     emoji: "💨" },
  { id: "cozy",      key: "mood_cozy",      emoji: "🕯️" },
] as const;

const WEATHER_CONDITIONS = [
  { id: "sunny",  key: "weather_sunny",  emoji: "☀️" },
  { id: "cloudy", key: "weather_cloudy", emoji: "☁️" },
  { id: "rainy",  key: "weather_rainy",  emoji: "🌧️" },
  { id: "snowy",  key: "weather_snowy",  emoji: "❄️" },
  { id: "stormy", key: "weather_stormy", emoji: "⛈️" },
] as const;

// Recommendation engine
function scorePerfume(perfume: Perfume, weather: Weather, mood: string): number {
  let score = perfume.rating ?? 3;
  const allNotes = [
    ...(perfume.notes_top || []),
    ...(perfume.notes_middle || []),
    ...(perfume.notes_base || []),
  ].map(n => n.toLowerCase());

  const hasNote = (keywords: string[]) =>
    keywords.some(k => allNotes.some(n => n.includes(k)));

  const temp = weather.temp;
  const cond = weather.condition.toLowerCase();

  if (temp < 10) {
    if (hasNote(["vanilla", "amber", "oud", "musk", "wood", "sandalwood", "patchouli", "spice", "cinnamon", "nutmeg"])) score += 2;
    if (hasNote(["citrus", "aquatic", "marine", "light"])) score -= 1;
  } else if (temp > 25) {
    if (hasNote(["citrus", "lemon", "bergamot", "aquatic", "marine", "sea", "ozonic", "green"])) score += 2;
    if (hasNote(["oud", "amber", "vanilla", "heavy"])) score -= 1;
  } else {
    if (hasNote(["rose", "jasmine", "iris", "cedar", "vetiver"])) score += 1;
  }

  if (cond === "rainy" || cond === "stormy") {
    if (hasNote(["petrichor", "earthy", "vetiver", "oakmoss", "green"])) score += 1.5;
  }

  const moodMap: Record<string, string[]> = {
    energetic: ["citrus", "ginger", "mint", "bergamot", "pepper", "juniper"],
    romantic:  ["rose", "jasmine", "iris", "oud", "vanilla", "musk", "amber"],
    casual:    ["musk", "apple", "melon", "fresh", "clean", "light"],
    formal:    ["leather", "cedar", "vetiver", "iris", "neroli", "tobacco"],
    fresh:     ["citrus", "marine", "aquatic", "sea", "melon", "green", "mint"],
    cozy:      ["vanilla", "amber", "sandalwood", "musk", "tonka", "praline", "coffee"],
  };

  if (moodMap[mood]) {
    if (hasNote(moodMap[mood])) score += 1.5;
  }

  return score;
}

export default function DiscoveryPage() {
  const { t } = useTranslation();
  const [temp, setTemp] = useState(20);
  const [condition, setCondition] = useState("sunny");
  const [mood, setMood] = useState("casual");
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [picks, setPicks] = useState<Perfume[]>([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.getCollection().then(data => {
      const collectionPerfumes = data.map((item: any) => ({
        id: item.perfume.id,
        name: item.perfume.name,
        brand: item.perfume.brand,
        gender: item.perfume.gender,
        notes_top: item.perfume.notes_top || [],
        notes_middle: item.perfume.notes_middle || [],
        notes_base: item.perfume.notes_base || [],
        rating: item.perfume.rating,
        image_url: item.perfume.image_url
      }));
      setPerfumes(collectionPerfumes);
    }).catch(console.error);
  }, []);

  const generatePicks = () => {
    if (perfumes.length === 0) return;
    setGenerating(true);
    setTimeout(() => {
      const weather: Weather = { temp, condition };
      const scored = perfumes
        .map(p => ({ perfume: p, score: scorePerfume(p, weather, mood) }))
        .sort((a, b) => b.score - a.score);
      setPicks(scored.slice(0, 5).map(s => s.perfume));
      setGenerating(false);
    }, 600);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <section className="pt-8 md:pt-20 pb-24 px-4 md:px-6 max-w-2xl mx-auto w-full">
        <h1 className="text-3xl md:text-5xl font-heading font-bold mb-2 text-center md:text-left">
          {t('picker_title').split(' ')[0]} <span className="text-primary">{t('picker_title').split(' ')[1] || ""}</span>
        </h1>
        <p className="text-sm text-white/50 mb-8 text-center md:text-left">
          {t('picker_subtitle')}
        </p>

        <div className="glass rounded-3xl p-6 mb-6 shadow-xl border border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">1</div>
            <h2 className="font-heading text-xl font-semibold">{t('weather_outside')}</h2>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-5 gap-2">
              {WEATHER_CONDITIONS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCondition(c.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                    condition === c.id
                      ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/5"
                      : "border-white/5 bg-white/5 text-white/40 hover:border-white/20"
                  }`}
                >
                  <span className="text-2xl">{c.emoji}</span>
                  <span className="text-[10px] font-medium uppercase tracking-tighter">{t(c.key)}</span>
                </button>
              ))}
            </div>

            <div className="px-2">
              <div className="flex justify-between items-end mb-4">
                <label className="text-sm font-medium text-white/60">{t('outside_temp')}</label>
                <span className="text-3xl font-heading font-bold text-primary">{temp}°C</span>
              </div>
              <input
                type="range"
                min="-10"
                max="45"
                value={temp}
                onChange={(e) => setTemp(parseInt(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between mt-2 text-[10px] text-white/30 font-medium">
                <span>-10°C</span>
                <span>45°C</span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-6 mb-8 shadow-xl border border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">2</div>
            <h2 className="font-heading text-xl font-semibold">{t('your_mood')}</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {MOODS.map(m => (
              <button
                key={m.id}
                onClick={() => setMood(m.id)}
                className={`flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all ${
                  mood === m.id
                    ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/5"
                    : "border-white/5 bg-white/5 text-white/40 hover:border-white/20"
                }`}
              >
                <span className="text-3xl mb-1">{m.emoji}</span>
                <span className="text-xs font-medium">{t(m.key)}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={generatePicks}
          disabled={generating || perfumes.length === 0}
          className="w-full py-5 bg-primary text-black font-bold rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(212,175,55,0.2)] disabled:opacity-50 disabled:cursor-not-allowed mb-12 flex items-center justify-center gap-3"
        >
          {generating ? (
            <>
              <span className="w-5 h-5 border-3 border-black/20 border-t-black rounded-full animate-spin" />
              <span>{t('analyzing')}</span>
            </>
          ) : (
            <>
              <span className="text-lg">✨</span>
              <span className="uppercase tracking-widest text-sm">{t('find_signature')}</span>
            </>
          )}
        </button>

        {picks.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
              <h2 className="font-heading text-2xl font-bold">{t('recommended_picks').split(' ')[0]} <span className="text-primary">{t('recommended_picks').split(' ')[1] || ""}</span></h2>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
            </div>
            <div className="space-y-4">
              {picks.map((p, i) => (
                <div key={p.id} className="group glass rounded-2xl p-5 flex items-center gap-5 hover:border-primary/30 transition-all cursor-pointer">
                  <div className="relative">
                    <span className="absolute -top-3 -left-3 w-8 h-8 rounded-full glass border border-white/10 flex items-center justify-center text-sm font-bold text-primary shadow-lg z-10">
                      {i + 1}
                    </span>
                    {p.image_url ? (
                      <div className="w-16 h-20 rounded-xl overflow-hidden bg-black/20 border border-white/5 shadow-inner">
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                    ) : (
                      <div className="w-16 h-20 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-2xl opacity-20">💧</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold text-lg text-white truncate group-hover:text-primary transition-colors">{p.name}</h3>
                    <p className="text-[10px] md:text-xs text-white/40 uppercase tracking-[0.2em] font-semibold mb-2">{p.brand}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {p.rating && (
                      <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-lg border border-primary/20">
                        <span className="text-primary text-[10px]">★</span>
                        <span className="text-primary text-xs font-bold">{p.rating}</span>
                      </div>
                    )}
                    <span className="text-white/20 group-hover:text-primary transition-colors">→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
