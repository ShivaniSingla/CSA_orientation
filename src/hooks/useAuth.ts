import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

/**
 * Hook for managing Supabase anonymous auth.
 * On mount: tries getSession() first, then signInAnonymously() if no session.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const initAuth = useCallback(async () => {
    try {
      // Try to recover existing session
      const { data: { session: existingSession } } = await supabase.auth.getSession();

      if (existingSession?.user) {
        setSession(existingSession);
        setUser(existingSession.user);
        setLoading(false);
        return;
      }

      // No session — sign in anonymously
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;

      setSession(data.session);
      setUser(data.user);
    } catch (err) {
      console.error('Auth initialization failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();

    // Listen for auth state changes (e.g., token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [initAuth]);

  return { user, session, loading };
}
