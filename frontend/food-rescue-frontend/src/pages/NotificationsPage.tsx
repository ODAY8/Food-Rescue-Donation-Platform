import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, Trash2, Info, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { notificationApi, type Notification } from '../services/notificationApi';
import { useApi } from '../hooks/useApi';

const typeMeta = {
  INFO:    { icon: Info,       color: 'text-blue-500', bg: 'bg-blue-50' },
  SUCCESS: { icon: CheckCircle2, color: 'text-[#2d6a4f]', bg: 'bg-[#d8f3dc]' },
  WARNING: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
  ACTION:  { icon: Zap,        color: 'text-[#f4845f]', bg: 'bg-[#fde8df]' },
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data, loading, refetch } = useApi(
    () => notificationApi.getAll(),
    [user?.id]
  );

  const notifications: Notification[] = data?.data ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const handleMarkRead = useCallback(async (id: string) => {
    try {
      await notificationApi.markRead(id);
      refetch();
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Failed to mark as read', 'error');
    }
  }, [refetch, toast]);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await notificationApi.markAllRead();
      toast('All notifications marked as read', 'success');
      refetch();
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Failed', 'error');
    }
  }, [refetch, toast]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await notificationApi.delete(id);
      refetch();
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Failed to delete', 'error');
    }
  }, [refetch, toast]);

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1c1c1e] flex items-center gap-2">
              <Bell size={22} className="text-[#2d6a4f]" /> Notifications
            </h1>
            <p className="text-[#6b7280] text-sm mt-1">
              {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck size={14} /> Mark all read
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-sm text-[#6b7280] py-12 text-center">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <Bell size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-[#6b7280] text-sm">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n, i) => {
              const meta = typeMeta[n.type] ?? typeMeta.INFO;
              const Icon = meta.icon;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`bg-white rounded-2xl border p-4 flex items-start gap-3 ${n.isRead ? 'border-gray-100 opacity-70' : 'border-gray-200 shadow-sm'}`}
                >
                  <div className={`w-9 h-9 rounded-xl ${meta.bg} ${meta.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={17} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#1c1c1e]">{n.title}</span>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#f4845f]" />}
                    </div>
                    <p className="text-xs text-[#6b7280] mt-0.5">{n.message}</p>
                    <span className="text-[11px] text-gray-400 mt-1 block">{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!n.isRead && (
                      <button onClick={() => handleMarkRead(n.id)} aria-label="Mark as read"
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-[#6b7280]">
                        <CheckCheck size={15} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(n.id)} aria-label="Delete"
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
