"use client";

import { useTranslation } from "@/context/LanguageContext";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();

  return (
    <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
      <button
        onClick={() => setLanguage("fr")}
        className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${
          language === "fr" ? "bg-primary text-black" : "text-white/40 hover:text-white/60"
        }`}
      >
        FR
      </button>
      <button
        onClick={() => setLanguage("en")}
        className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${
          language === "en" ? "bg-primary text-black" : "text-white/40 hover:text-white/60"
        }`}
      >
        EN
      </button>
    </div>
  );
}
