import { create } from 'zustand';

// User structure matching DB model
export interface UserSession {
  id: string;
  username: string;
  name: string;
  role: 'Admin' | 'Coordinator' | 'Sponsor';
  phone: string;
  token?: string;
}

// Notification structures
export interface SystemNotification {
  id: string;
  type: 'System' | 'GPS Alert' | 'Donation';
  message: string;
  timestamp: string;
  status: 'Read' | 'Unread';
}

interface AppState {
  // Theme state
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // Auth state
  user: UserSession | null;
  otpCode: string | null;
  otpPhone: string | null;
  isLoading: boolean;
  login: (user: UserSession) => void;
  logout: () => void;
  setOtpCode: (code: string | null, phone: string | null) => void;
  setLoading: (loading: boolean) => void;

  // Notifications state
  notifications: SystemNotification[];
  setNotifications: (notifications: SystemNotification[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Theme default (will be synced in layout client component)
  theme: 'light',
  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      localStorage.setItem('theme', theme);
    }
  },
  toggleTheme: () => {
    const nextTheme = get().theme === 'light' ? 'dark' : 'light';
    get().setTheme(nextTheme);
  },

  // Auth state
  user: null,
  otpCode: null,
  otpPhone: null,
  isLoading: false,
  login: (user) => {
    set({ user });
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_session', JSON.stringify(user));
    }
  },
  logout: () => {
    set({ user: null });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_session');
    }
  },
  setOtpCode: (otpCode, otpPhone) => set({ otpCode, otpPhone }),
  setLoading: (isLoading) => set({ isLoading }),

  // Notifications state
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, status: 'Read' as const } : n
      ),
    }));
  },
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        status: 'Read' as const,
      })),
    }));
  },
}));
