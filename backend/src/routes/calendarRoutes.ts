import { Router } from 'express';
import { exportCalendarICS, webcalSubscription } from '../controllers/calendarController';

const router = Router();

// Export route — returns downloadable ICS. Auth is handled inside the controller
// via Authorization header OR ?token= query param (for window.open compatibility).
router.get('/export', exportCalendarICS);

// Webcal subscription — returns ICS for live subscriptions.
// Auth is handled via ?token= query param for calendar app compatibility.
// URL format: webcal://host/api/calendar/webcal?token=JWT_TOKEN
router.get('/webcal', webcalSubscription);

export default router;
