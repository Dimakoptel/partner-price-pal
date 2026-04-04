import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: { full_name: string; phone?: string; telegram?: string; pending_role?: string | null } | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, phone?: string, telegram?: string, pendingRole?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isPartner: boolean;
  isApproved: boolean;
  partnerClientId: string | null;
  pendingRole: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPartner, setIsPartner] = useState(false);
  const [partnerClientId, setPartnerClientId] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [pendingRole, setPendingRole] = useState<string | null>(null);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, phone, telegram, is_approved, pending_role")
      .eq("user_id", userId)
      .single();
    if (data) {
      setProfile({
        full_name: data.full_name || "",
        phone: data.phone || undefined,
        telegram: data.telegram || undefined,
        pending_role: (data as any).pending_role || null,
      });
      setIsApproved(data.is_approved === true);
      setPendingRole((data as any).pending_role || null);
    }
  };

  const fetchRole = async (userId: string) => {
    const { data: adminData } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    setIsAdmin(adminData === true);

    const { data: partnerData } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "partner" as any,
    });
    setIsPartner(partnerData === true);

    if (partnerData === true) {
      const { data: clientData } = await (supabase
        .from("clients") as any)
        .select("id")
        .eq("user_id", userId)
        .single();
      setPartnerClientId(clientData?.id || null);
    } else {
      setPartnerClientId(null);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
          fetchRole(session.user.id);
        }, 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
        setIsPartner(false);
        setPartnerClientId(null);
        setIsApproved(false);
        setPendingRole(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, phone?: string, telegram?: string, pendingRole?: string) => {
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });
    if (!error && signUpData.user) {
      await supabase.from("profiles").update({
        phone,
        telegram,
        pending_role: pendingRole || null,
      } as any).eq("user_id", signUpData.user.id);
    }
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, profile, signIn, signUp, signOut, isAdmin, isPartner, partnerClientId, isApproved, pendingRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
