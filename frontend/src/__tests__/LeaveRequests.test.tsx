import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LeaveRequests from '@/pages/LeaveRequests';

// Mock AuthContext
vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock axios
vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';

const mockLeaveRequests = [
  {
    id: 1,
    employeeId: 1,
    leaveTypeId: 1,
    startDate: '2026-07-10',
    endDate: '2026-07-12',
    duration: 3,
    reason: 'Family vacation',
    status: 'pending',
    rejectionReason: null,
    createdAt: '2026-07-01T10:00:00Z',
    employee: {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      employeeId: 'EMP001',
      department: { name: 'Engineering' },
      position: 'Developer',
    },
    leaveType: {
      id: 1,
      name: 'Annual Leave',
      color: '#5B5FEF',
    },
    approver: null,
  },
  {
    id: 2,
    employeeId: 2,
    leaveTypeId: 2,
    startDate: '2026-07-15',
    endDate: '2026-07-15',
    duration: 1,
    reason: 'Doctor appointment',
    status: 'approved',
    rejectionReason: null,
    createdAt: '2026-07-02T10:00:00Z',
    employee: {
      id: 2,
      firstName: 'Jane',
      lastName: 'Smith',
      employeeId: 'EMP002',
      department: { name: 'Marketing' },
      position: 'Manager',
    },
    leaveType: {
      id: 2,
      name: 'Sick Leave',
      color: '#22C55E',
    },
    approver: {
      id: 1,
      firstName: 'Admin',
      lastName: 'User',
    },
  },
  {
    id: 3,
    employeeId: 3,
    leaveTypeId: 3,
    startDate: '2026-07-20',
    endDate: '2026-07-21',
    duration: 2,
    reason: 'Personal matter',
    status: 'rejected',
    rejectionReason: 'Insufficient leave balance',
    createdAt: '2026-07-03T10:00:00Z',
    employee: {
      id: 3,
      firstName: 'Bob',
      lastName: 'Johnson',
      employeeId: 'EMP003',
      department: { name: 'Engineering' },
      position: 'Senior Developer',
    },
    leaveType: {
      id: 3,
      name: 'Personal Leave',
      color: '#F59E0B',
    },
    approver: {
      id: 1,
      firstName: 'Admin',
      lastName: 'User',
    },
  },
];

function renderLeaveRequests() {
  return render(
    <BrowserRouter>
      <LeaveRequests />
    </BrowserRouter>
  );
}

describe('LeaveRequests Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAdmin: true,
      isManager: false,
    });
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        requests: mockLeaveRequests,
        pagination: { totalPages: 1, page: 1, total: 3 },
      },
    });
  });

  it('renders the page header', async () => {
    renderLeaveRequests();

    await waitFor(() => {
      expect(screen.getByText('Leave Requests')).toBeInTheDocument();
      expect(screen.getByText(/Manage and review all leave requests/i)).toBeInTheDocument();
    });
  });

  it('renders status filter tabs', async () => {
    renderLeaveRequests();

    await waitFor(() => {
      // Use getAllByText to avoid ambiguity with status badges in the table
      expect(screen.getAllByText('Pending').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Approved').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Rejected').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Cancelled').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('All')).toBeInTheDocument();
    });
  });

  it('renders search input', async () => {
    renderLeaveRequests();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search employee...')).toBeInTheDocument();
    });
  });

  it('fetches and displays leave requests', async () => {
    renderLeaveRequests();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/leave-requests'));
  });

  it('displays leave type names', async () => {
    renderLeaveRequests();

    await waitFor(() => {
      expect(screen.getByText('Annual Leave')).toBeInTheDocument();
      expect(screen.getByText('Sick Leave')).toBeInTheDocument();
      expect(screen.getByText('Personal Leave')).toBeInTheDocument();
    });
  });

  it('displays status badges', async () => {
    renderLeaveRequests();

    await waitFor(() => {
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Approved')).toBeInTheDocument();
      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });
  });

  it('displays employee IDs', async () => {
    renderLeaveRequests();

    await waitFor(() => {
      expect(screen.getByText('EMP001')).toBeInTheDocument();
      expect(screen.getByText('EMP002')).toBeInTheDocument();
      expect(screen.getByText('EMP003')).toBeInTheDocument();
    });
  });

  it('shows approve/reject buttons for admin', async () => {
    renderLeaveRequests();

    await waitFor(() => {
      // Approve and reject buttons should exist for pending requests
      const approveButtons = screen.getAllByTitle('Approve');
      expect(approveButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows view details button for admin', async () => {
    renderLeaveRequests();

    await waitFor(() => {
      const viewButtons = screen.getAllByTitle('View Details');
      expect(viewButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows print button for each request', async () => {
    renderLeaveRequests();

    await waitFor(() => {
      const printButtons = screen.getAllByTitle('Print Application');
      expect(printButtons.length).toBe(3);
    });
  });

  it('filters by status when clicked', async () => {
    renderLeaveRequests();

    await waitFor(() => {
      expect(screen.getByText('Leave Requests')).toBeInTheDocument();
    });

    // Use getAllByText and pick the filter button (first occurrence is the tab)
    const pendingButtons = screen.getAllByText('Pending');
    // The first 'Pending' text is the filter tab button
    await userEvent.click(pendingButtons[0]);

    // Should have fetched again with status filter
    await waitFor(() => {
      expect(api.get).toHaveBeenLastCalledWith(expect.stringContaining('status=pending'));
    });
  });

  it('opens detail modal on view button click', async () => {
    renderLeaveRequests();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const viewButton = screen.getAllByTitle('View Details')[0];
    await userEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByText('Leave Request Details')).toBeInTheDocument();
    });
  });

  it('shows rejection reason in detail modal for rejected requests', async () => {
    renderLeaveRequests();

    await waitFor(() => {
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    // Find the view button for Bob Johnson (rejected request)
    const viewButtons = screen.getAllByTitle('View Details');
    // The third request in the list is Bob Johnson
    await userEvent.click(viewButtons[2]);

    await waitFor(() => {
      expect(screen.getByText('Leave Request Details')).toBeInTheDocument();
      expect(screen.getByText('Insufficient leave balance')).toBeInTheDocument();
    });
  });

  it('shows reject button with prompt for admin', async () => {
    renderLeaveRequests();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const rejectButton = screen.getAllByTitle('Reject')[0];
    expect(rejectButton).toBeInTheDocument();
  });

  it('does not show approve/reject buttons for employee role', async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAdmin: false,
      isManager: false,
    });

    renderLeaveRequests();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.queryByTitle('Approve')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Reject')).not.toBeInTheDocument();
  });

  it('shows cancel button only for pending requests for non-admin users', async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAdmin: false,
      isManager: false,
    });

    renderLeaveRequests();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const cancelButtons = screen.getAllByTitle('Cancel Request');
    // Only pending requests show cancel - there's 1 pending in our mock data
    expect(cancelButtons.length).toBe(1);
  });

  it('handles empty state', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        requests: [],
        pagination: { totalPages: 0, page: 1, total: 0 },
      },
    });

    renderLeaveRequests();

    await waitFor(() => {
      expect(screen.getByText('No leave requests found')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (api.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    renderLeaveRequests();

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('shows initial search from URL params', async () => {
    // Mock URLSearchParams to simulate URL search param
    const originalGet = URLSearchParams.prototype.get;
    URLSearchParams.prototype.get = vi.fn().mockReturnValue('John');

    renderLeaveRequests();

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    // Restore
    URLSearchParams.prototype.get = originalGet;
  });

  it('shows re-apply button in detail modal for rejected requests', async () => {
    renderLeaveRequests();

    await waitFor(() => {
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    // Open detail modal for rejected request (Bob Johnson)
    const viewButtons = screen.getAllByTitle('View Details');
    await userEvent.click(viewButtons[2]);

    await waitFor(() => {
      expect(screen.getByText('Re-apply')).toBeInTheDocument();
    });
  });

  it('shows cancel button for pending requests for non-admin employees', async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAdmin: false,
      isManager: false,
    });

    renderLeaveRequests();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const cancelButton = screen.getByTitle('Cancel Request');
    expect(cancelButton).toBeInTheDocument();
  });

  it('paginates correctly', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        requests: mockLeaveRequests.slice(0, 1),
        pagination: { totalPages: 3, page: 1, total: 3 },
      },
    });

    renderLeaveRequests();

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
    });

    // Next button should be enabled
    const nextButton = screen.getByText('Next');
    expect(nextButton).not.toBeDisabled();
  });
});
