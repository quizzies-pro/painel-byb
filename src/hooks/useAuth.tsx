import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  role: string | null;
  avatarUrl: string | null;
  permissions: Record<string, unknown> | null;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<string, unknown> | null>(null);
  const authCheckRef = useRef(0);

  const checkAdminRole = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role, avatar_url, permissions")
      .eq("user_id", userId)
      .maybeSingle();
    
    if (data) {
      setIsAdmin(true);
      setRole(data.role);
      setAvatarUrl((data as any).avatar_url ?? null);
      setPermissions((data.permissions as Record<string, unknown>) ?? null);
    } else {
      setIsAdmin(false);
      setRole(null);
      setAvatarUrl(null);
      setPermissions(null);
    }

    return { isAdmin: Boolean(data), error };
  };

  const refreshProfile = async () => {
    if (user) {
      await checkAdminRole(user.id);
    }
  };

  useEffect(() => {
    let active = true;

    const applySession = async (nextSession: Session | null) => {
      const checkId = ++authCheckRef.current;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        await checkAdminRole(nextSession.user.id);
      } else {
        setIsAdmin(false);
        setRole(null);
        setAvatarUrl(null);
        setPermissions(null);
      }

      if (active && checkId === authCheckRef.current) setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        window.setTimeout(() => void applySession(nextSession), 0);
      }
    );

    void supabase.auth.getSession().then(({ data: { session: currentSession } }) => applySession(currentSession));

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { error: error as Error | null };

    const adminCheck = await checkAdminRole(data.user.id);
    if (adminCheck.error || !adminCheck.isAdmin) {
      await supabase.auth.signOut();
      return { error: new Error("Acesso administrativo não autorizado.") };
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, role, avatarUrl, permissions, refreshProfile, signIn, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
