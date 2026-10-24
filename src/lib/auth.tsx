"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type AuthState = { user: User | null; loading: boolean; signOut: () => Promise<void> };
const Ctx = createContext<AuthState>({ user: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ user: User | null; loading: boolean }>({ user: null, loading: true });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setState({ user: data.session?.user ?? null, loading: false }));
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      setState({ user: session?.user ?? null, loading: false }),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await createClient().auth.signOut();
  };

  return <Ctx.Provider value={{ ...state, signOut }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
