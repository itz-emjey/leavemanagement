import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Mock axios
vi.mock('@/lib/axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

import api from '@/lib/axios';

// Helper component to test useAuth
function TestConsumer() {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="is-authenticated">{String(auth.isAuthenticated)}</div>
      <div data-testid="is-admin">{String(auth.isAdmin)}</div>
      <div data-testid="is-loading">{String(auth.isLoading)}</div>
      {auth.user && <div data-testid="user-email">{auth.user.email}</div>}
      <button data-testid="login-btn" onClick={() => auth.login('test@test.com', 'password')}>
        Login
      </button>
      <button data-testid="logout-btn" onClick={() => auth.logout()}>
        Logout
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('loads user from localStorage on mount', async () => {
    const mockUser = { id: 1, email: 'admin@test.com', role: 'admin', employee: null };
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
      expect(screen.getByTestId('user-email')).toHaveTextContent('admin@test.com');
    });
  });

  it('starts unauthenticated with no stored data', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    });
  });

  it('login sets user and token', async () => {
    const mockResponse = {
      data: {
        token: 'new-token',
        user: { id: 2, email: 'user@test.com', role: 'employee', employee: null },
      },
    };
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    });

    // Click login button
    await act(async () => {
      screen.getByTestId('login-btn').click();
    });

    // Check login was called
    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@test.com',
      password: 'password',
    });

    // Check localStorage was updated
    expect(localStorage.getItem('token')).toBe('new-token');
    expect(localStorage.getItem('user')).toContain('user@test.com');
  });

  it('logout clears user and token', async () => {
    const mockUser = { id: 1, email: 'admin@test.com', role: 'admin', employee: null };
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    // Click logout button
    await act(async () => {
      screen.getByTestId('logout-btn').click();
    });

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
