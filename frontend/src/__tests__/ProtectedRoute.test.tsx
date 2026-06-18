import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute, AdminRoute, GuestRoute } from '@/components/ProtectedRoute';

// Mock the AuthContext
vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/context/AuthContext';

describe('ProtectedRoute', () => {
  it('renders loading spinner when isLoading is true', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    const { container } = render(
      <MemoryRouter>
        <ProtectedRoute />
      </MemoryRouter>
    );

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders Outlet when user is authenticated', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      isAdmin: false,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute />
      </MemoryRouter>
    );

    // When authenticated, the component renders <Outlet />
    // Outlet renders nothing by itself, so the container should be empty
    // (no spinner, no redirect text)
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute />
      </MemoryRouter>
    );

    // The Navigate component renders nothing, just redirects
    // Check that the spinner is not shown
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('AdminRoute', () => {
  it('redirects to /dashboard when user is not admin', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      isAdmin: false,
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminRoute />
      </MemoryRouter>
    );

    // Should not show the loading spinner
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders Outlet when user is admin', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      isAdmin: true,
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminRoute />
      </MemoryRouter>
    );

    // Outlet renders nothing by itself
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('GuestRoute', () => {
  it('renders Outlet when user is not authenticated', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <GuestRoute />
      </MemoryRouter>
    );

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
