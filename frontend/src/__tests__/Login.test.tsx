import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '@/pages/Login';

// Mock AuthContext
vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import { useAuth } from '@/context/AuthContext';

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      login: vi.fn(),
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('renders login form', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Submit without filling fields
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      // Should show validation messages
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('calls login on form submission', async () => {
    const mockLogin = vi.fn();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      login: mockLogin,
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'admin@test.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@test.com', 'password123');
    });
  });

  it('renders login form even when authenticated (redirect via GuestRoute)', () => {
    // Login component itself doesn't redirect — that's handled by GuestRoute wrapper
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      login: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Login page renders regardless of auth state
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  });
});
