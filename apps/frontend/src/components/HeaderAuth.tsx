"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";

export default function HeaderAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse"></div>;
  }

  if (!user) {
    return (
      <Link href="/login" className="text-xs font-medium px-4 py-2 rounded-full border border-primary/50 text-primary hover:bg-primary/10 transition-colors">
        Sign In
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button 
        onClick={handleSignOut}
        className="text-xs text-white/50 hover:text-white transition-colors hidden md:block"
      >
        Sign Out
      </button>
      <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-primary font-bold">
        {user.email?.[0].toUpperCase() || "U"}
      </div>
    </div>
  );
}
