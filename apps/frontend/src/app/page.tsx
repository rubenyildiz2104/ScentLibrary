"use client";

import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full relative overflow-hidden py-16 md:py-32 flex items-center justify-center border-b border-white/5">
        {/* Background gradient blur */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[800px] h-[300px] md:h-[500px] bg-primary/20 blur-[100px] md:blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 text-center max-w-3xl px-6">
          <h1 className="text-5xl md:text-7xl font-heading font-bold mb-4 md:mb-6 leading-tight">
            {t('hero_title_1')} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-200">
              {t('hero_title_2')}
            </span>
          </h1>
          <p className="text-base md:text-xl text-white/60 mb-8 md:mb-10 max-w-2xl mx-auto font-light">
            {t('hero_desc')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/library" 
              className="w-full sm:w-auto px-8 py-4 bg-primary text-black font-medium rounded-full hover:bg-primary-hover transition-all duration-300 shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transform hover:-translate-y-1"
            >
              {t('btn_explore')}
            </Link>
            <Link 
              href="/collection" 
              className="w-full sm:w-auto px-8 py-4 glass text-white font-medium rounded-full glass-hover transition-all duration-300"
            >
              {t('btn_collection')}
            </Link>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="w-full max-w-7xl mx-auto py-16 md:py-24 px-6 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <div className="glass p-6 md:p-8 rounded-2xl flex flex-col items-start group hover:-translate-y-2 transition-transform duration-300">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">
            📚
          </div>
          <h3 className="text-2xl font-heading font-semibold mb-3 text-white">{t('feature_1_title')}</h3>
          <p className="text-white/50 leading-relaxed font-light">
            {t('feature_1_desc')}
          </p>
        </div>

        <div className="glass p-8 rounded-2xl flex flex-col items-start group hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] -z-10" />
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">
            💧
          </div>
          <h3 className="text-2xl font-heading font-semibold mb-3 text-white">{t('feature_2_title')}</h3>
          <p className="text-white/50 leading-relaxed font-light">
            {t('feature_2_desc')}
          </p>
        </div>

        <div className="glass p-8 rounded-2xl flex flex-col items-start group hover:-translate-y-2 transition-transform duration-300">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">
            ✨
          </div>
          <h3 className="text-2xl font-heading font-semibold mb-3 text-white">{t('feature_3_title')}</h3>
          <p className="text-white/50 leading-relaxed font-light">
            {t('feature_3_desc')}
          </p>
        </div>
      </section>
    </div>
  );
}
