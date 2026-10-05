import { request } from './apiClient';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ACTION';
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

export const notificationApi = {
  getAll: (unreadOnly = false) =>
    request<{ success: boolean; data: Notification[]; unreadCount: number }>(
      `/notifications${unreadOnly ? '?unread=true' : ''}`
    ),

  markRead: (id: string) =>
    request<{ success: boolean; data: Notification }>(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllRead: () =>
    request<{ success: boolean; message: string }>('/notifications/read-all', { method: 'PATCH' }),

  delete: (id: string) =>
    request<{ success: boolean; message: string }>(`/notifications/${id}`, { method: 'DELETE' }),
};
