"use client";

import "./globals.css";
import Link from "next/link";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider, useTranslation } from "@/context/LanguageContext";
import HeaderAuth from "@/components/HeaderAuth";
import LanguageSwitcher from "@/components/LanguageSwitcher";

function NavContent() {
  const { t } = useTranslation();
  return (
    <>
      {/* Navigation Bar (Top) */}
      <nav className="sticky top-0 z-50 glass border-b border-white/5 px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl md:text-2xl font-heading font-bold text-primary tracking-wide">
            Scent<span className="text-white">Library</span>
          </Link>
          
          {/* Desktop Links */}
          <div className="hidden md:flex gap-8 text-sm font-medium text-white/70">
            <Link href="/library" className="hover:text-primary transition-colors">{t('nav_library')}</Link>
            <Link href="/collection" className="hover:text-primary transition-colors">{t('nav_collection')}</Link>
            <Link href="/wishlist" className="hover:text-primary transition-colors">{t('nav_wishlist')}</Link>
            <Link href="/discovery" className="hover:text-primary transition-colors">{t('nav_picker')}</Link>
          </div>
          
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <HeaderAuth />
          </div>
        </div>
      </nav>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-white/5 px-4 py-2 flex justify-between items-center pb-[calc(8px+env(safe-area-inset-bottom))]">
        <Link href="/" className="flex flex-col items-center gap-0.5 text-white/50 hover:text-primary transition-colors">
          <span className="text-xl">🏠</span>
          <span className="text-[10px] font-medium">{t('nav_home')}</span>
        </Link>
        <Link href="/library" className="flex flex-col items-center gap-0.5 text-white/50 hover:text-primary transition-colors">
          <span className="text-xl">📚</span>
          <span className="text-[10px] font-medium">{t('nav_library')}</span>
        </Link>
        <Link href="/collection" className="flex flex-col items-center gap-0.5 text-white/50 hover:text-primary transition-colors">
          <span className="text-xl">💧</span>
          <span className="text-[10px] font-medium">{t('nav_collection')}</span>
        </Link>
        <Link href="/wishlist" className="flex flex-col items-center gap-0.5 text-white/50 hover:text-primary transition-colors">
          <span className="text-xl">💛</span>
          <span className="text-[10px] font-medium">{t('nav_wishlist')}</span>
        </Link>
        <Link href="/discovery" className="flex flex-col items-center gap-0.5 text-white/50 hover:text-primary transition-colors">
          <span className="text-xl">✨</span>
          <span className="text-[10px] font-medium">{t('nav_picker')}</span>
        </Link>
      </nav>
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#D4AF37" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ScentLibrary" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="min-h-screen flex flex-col antialiased pb-20 md:pb-0" suppressHydrationWarning>
        <LanguageProvider>
          <AuthProvider>
            <NavContent />
            <main className="flex-1 flex flex-col">
              {children}
            </main>
            <footer className="hidden md:block py-8 text-center text-xs text-white/40 border-t border-white/5 mt-auto">
              <p>© {new Date().getFullYear()} ScentLibrary. Crafted for fragrance enthusiasts.</p>
            </footer>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
