import { useState, useEffect, useCallback } from 'react';
import { notificationApi } from '../services/notificationApi';
import { tokenStorage } from '../services/apiClient';

// Polls the unread notification count while the user is logged in.
// Lightweight: a single request every 30s, plus immediate refetch on demand.
export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!tokenStorage.get()) return;
    try {
      setLoading(true);
      const res = await notificationApi.getAll(true);
      setUnreadCount(res.unreadCount);
    } catch {
      // ignore transient failures — next poll will retry
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 30_000);
    return () => clearInterval(timer);
  }, [refresh]);

  return { unreadCount, loading, refresh };
}
