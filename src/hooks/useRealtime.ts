import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeOptions {
  table: string;
  filter?: string; // e.g., 'team_id=eq.abc-123'
  event?: RealtimeEvent;
  enabled?: boolean;
}

/**
 * Hook for subscribing to Supabase Realtime changes on a specific table,
 * filtered by team_id or other filter.
 *
 * @param options Configuration for the subscription
 * @param callback Called whenever a matching event occurs
 */
export function useRealtime<T = Record<string, unknown>>(
  options: UseRealtimeOptions,
  callback: (payload: { eventType: string; new: T; old: T }) => void
) {
  const { table, filter, event = '*', enabled = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref current
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    const channelName = `realtime:${table}:${filter || 'all'}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as never,
        {
          event,
          schema: 'public',
          table,
          ...(filter ? { filter } : {}),
        },
        (payload: { eventType: string; new: T; old: T }) => {
          callbackRef.current(payload);
        }
      )
      .subscribe((status: string) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, filter, event, enabled]);

  return { isConnected };
}

/**
 * Hook for tracking overall connection status across multiple channels.
 */
export function useConnectionStatus() {
  const [status, setStatus] = useState<'connected' | 'reconnecting' | 'offline'>('reconnecting');

  useEffect(() => {
    const handleOnline = () => setStatus('connected');
    const handleOffline = () => setStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setStatus(navigator.onLine ? 'connected' : 'offline');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return status;
}
