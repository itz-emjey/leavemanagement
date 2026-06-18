/**
 * iCal/ICS file generator for calendar sync.
 * Produces valid RFC 5545 iCalendar files that can be imported into
 * Google Calendar, Apple Calendar, Outlook, etc.
 */

interface CalendarEvent {
  uid: string;
  summary: string;
  description: string;
  location?: string;
  dtStart: string;   // YYYYMMDD
  dtEnd: string;     // YYYYMMDD (exclusive, per RFC 5545 for all-day)
  status: string;    // CONFIRMED, TENTATIVE, CANCELLED
}

let sequence = 0;

function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function formatDateTime(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${y}${m}${day}T${h}${min}${s}`;
}

/**
 * Fold long lines per RFC 5545 (max 75 octets per line).
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  parts.push(line.substring(0, 75));
  let remaining = line.substring(75);
  while (remaining.length > 0) {
    parts.push(' ' + remaining.substring(0, 74));
    remaining = remaining.substring(74);
  }
  return parts.join('\r\n');
}

/**
 * Generate an ICS calendar string for a list of leave events.
 */
export function generateICS(params: {
  events: CalendarEvent[];
  calendarName?: string;
  calScale?: string;
  method?: string;
}): string {
  const {
    events,
    calendarName = 'Leave Management',
    calScale = 'GREGORIAN',
    method = 'PUBLISH',
  } = params;

  sequence++;

  const now = formatDateTime(new Date());
  const lines: string[] = [];

  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//LeaveMS//Leave Management System//EN');
  lines.push('CALSCALE:' + calScale);
  lines.push('METHOD:' + method);
  lines.push('X-WR-CALNAME:' + escapeText(calendarName));
  lines.push('X-WR-CALDESC:Leave Management System Calendar');
  lines.push('X-PUBLISHED-TTL:PT1H');

  for (const event of events) {
    // Map internal status to iCal status
    let icalStatus: string;
    switch (event.status) {
      case 'approved':
        icalStatus = 'CONFIRMED';
        break;
      case 'pending':
        icalStatus = 'TENTATIVE';
        break;
      case 'cancelled':
        icalStatus = 'CANCELLED';
        break;
      default:
        icalStatus = 'CONFIRMED';
    }

    lines.push('BEGIN:VEVENT');
    lines.push('UID:' + event.uid);
    lines.push('DTSTAMP:' + now);
    lines.push('DTSTART;VALUE=DATE:' + event.dtStart);
    // For all-day events, DTEND is the exclusive end date (day after last day)
    lines.push('DTEND;VALUE=DATE:' + event.dtEnd);
    lines.push('SUMMARY:' + escapeText(event.summary));
    if (event.description) {
      lines.push('DESCRIPTION:' + escapeText(event.description));
    }
    if (event.location) {
      lines.push('LOCATION:' + escapeText(event.location));
    }
    lines.push('STATUS:' + icalStatus);
    lines.push('SEQUENCE:' + sequence);
    lines.push('TRANSP:TRANSPARENT'); // Mark as transparent (doesn't block time)
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  // Fold long lines
  return lines.map(foldLine).join('\r\n');
}

export default generateICS;

export type { CalendarEvent };
