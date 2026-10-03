import { useEffect, useState } from 'react';
import { supabase } from './supabase';

const PIN_SESSION_KEY = 'premiere_admin_ok';

/** PIN untuk mode demo lokal (tanpa Supabase). */
export const DEMO_ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN?.trim() || '2027';

/** Mode login: email+password (Supabase Auth) atau PIN (demo lokal). */
export const authMode: 'supabase' | 'pin' = supabase ? 'supabase' : 'pin';

function pinUnlocked(): boolean {
  try {
    return sessionStorage.getItem(PIN_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

/** Status login admin; `null` selama masih dicek. */
export function useAdminAuth(): { signedIn: boolean | null; email: string | null } {
  const [signedIn, setSignedIn] = useState<boolean | null>(supabase ? null : pinUnlocked());
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      const onChange = () => setSignedIn(pinUnlocked());
      window.addEventListener('premiere-auth', onChange);
      return () => window.removeEventListener('premiere-auth', onChange);
    }
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
      setEmail(data.session?.user.email ?? null);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session);
      setEmail(session?.user.email ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return { signedIn, email };
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi');
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(error.message.includes('Invalid login') ? 'Email atau password salah.' : error.message);
  }
}

export function signInWithPin(pin: string): boolean {
  if (pin !== DEMO_ADMIN_PIN) return false;
  try {
    sessionStorage.setItem(PIN_SESSION_KEY, '1');
  } catch {
    // abaikan
  }
  window.dispatchEvent(new Event('premiere-auth'));
  return true;
}

export async function signOut(): Promise<void> {
  if (supabase) {
    await supabase.auth.signOut();
    return;
  }
  try {
    sessionStorage.removeItem(PIN_SESSION_KEY);
  } catch {
    // abaikan
  }
  window.dispatchEvent(new Event('premiere-auth'));
}
