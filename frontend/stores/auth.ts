import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  isPremium: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      loading: false,
      
      login: async (email: string, password: string) => {
        set({ loading: true });
        try {
          const response = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to login');
          }
          
          const data = await response.json();
          set({
            user: data.user,
            accessToken: data.access_token,
            isAuthenticated: true,
            loading: false,
          });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },
      
      register: async (username: string, email: string, password: string) => {
        set({ loading: true });
        try {
          const response = await fetch('/api/v1/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to register');
          }
          
          const data = await response.json();
          // Note: We don't log the user in automatically after registration
          // They need to verify their email first
          set({ loading: false });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },
      
      logout: () => {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
        // Clear localStorage
        localStorage.removeItem('auth-storage');
      },
      
      refreshToken: async () => {
        const { accessToken } = get();
        if (!accessToken) return;
        
        try {
          const response = await fetch('/api/v1/auth/refresh', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });
          
          if (!response.ok) {
            // If token refresh fails, log the user out
            get().logout();
            return;
          }
          
          const data = await response.json();
          set({
            accessToken: data.access_token,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('Token refresh error:', error);
          get().logout();
        }
      },
      
      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (!user) return;
        
        set({
          user: { ...user, ...userData },
        });
      },
      
      requestPasswordReset: async (email: string) => {
        set({ loading: true });
        try {
          const response = await fetch('/api/v1/auth/forgot-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to request password reset');
          }
          
          set({ loading: false });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },
      
      resetPassword: async (token: string, newPassword: string) => {
        set({ loading: true });
        try {
          const response = await fetch('/api/v1/auth/reset-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token, password: newPassword }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to reset password');
          }
          
          set({ loading: false });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Authentication middleware for API calls
export const withAuth = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const { accessToken, refreshToken } = useAuth.getState();
  
  if (!accessToken) {
    throw new Error('Not authenticated');
  }
  
  // Set authorization header
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${accessToken}`,
  };
  
  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // If unauthorized, try to refresh token
  if (response.status === 401) {
    try {
      await refreshToken();
      const { accessToken: newToken } = useAuth.getState();
      
      if (!newToken) {
        throw new Error('Failed to refresh token');
      }
      
      // Retry the request with new token
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`,
        },
      });
    } catch (error) {
      console.error('Auth error:', error);
      throw error;
    }
  }
  
  return response;
};

// Setup token refresh on app load
export const initializeAuth = () => {
  const { isAuthenticated, refreshToken } = useAuth.getState();
  
  if (isAuthenticated) {
    refreshToken();
    
    // Set up a timer to refresh the token periodically (e.g., every 15 minutes)
    const intervalId = setInterval(() => {
      refreshToken();
    }, 15 * 60 * 1000);
    
    // Clean up interval on page unload
    window.addEventListener('beforeunload', () => {
      clearInterval(intervalId);
    });
  }
};
