import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AdminAuthState {
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthState>({
  session: null,
  loading: true,
  isAdmin: false,
  signOut: async () => {},
});

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        checkAdmin(data.session.user.id);
      } else {
        setLoading(false);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess) {
        checkAdmin(sess.user.id);
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function checkAdmin(userId: string) {
    if (!supabase) return;
    const { data } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    setIsAdmin(Boolean(data));
    setLoading(false);
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setIsAdmin(false);
  }

  return (
    <AdminAuthContext.Provider value={{ session, loading, isAdmin, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
