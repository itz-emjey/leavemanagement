import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Skeleton } from '@/components/Skeleton';
import { CalendarDays, Users, Info, Download, Link as LinkIcon } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    status: string;
    employeeName: string;
    leaveType: string;
    department: string;
  };
}

export default function TeamCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await api.get('/leave-requests/calendar?month=' + currentMonth + '&team=true');
        setEvents(res.data.events || []);
      } catch (err) {
        console.error('Failed to fetch team calendar:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [currentMonth]);

  const handleEventClick = (info: any) => {
    const event = info.event;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.startStr,
      end: event.endStr,
      backgroundColor: event.backgroundColor,
      borderColor: event.borderColor,
      textColor: event.textColor,
      extendedProps: event.extendedProps,
    });
  };

  const handleExportICS = () => {
    const token = localStorage.getItem('token');
    window.open('/api/calendar/export?year=' + currentYear + '&team=true&token=' + (token || ''), '_blank');
  };

  const handleCopySubscribeUrl = () => {
    const token = localStorage.getItem('token');
    const isHttps = window.location.protocol === 'https:';
    const scheme = isHttps ? 'webcal' : window.location.protocol.slice(0, -1);
    const baseUrl = scheme + '://' + window.location.host;
    const webcalUrl = baseUrl + '/api/calendar/webcal?token=' + (token || '');
    navigator.clipboard.writeText(webcalUrl).then(() => {
      alert('Calendar subscription URL copied to clipboard!');
    }).catch(() => {
      alert('Copy this URL: ' + webcalUrl);
    });
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Team Calendar</h1>
          <p className="text-gray-500 mt-0.5">View your team's approved and pending leaves</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
            Approved
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            Pending
          </span>
          <button
            onClick={handleExportICS}
            className="ml-3 flex items-center gap-1.5 px-3 py-1.5 bg-[#5B5FEF] text-white rounded-lg text-xs font-medium hover:bg-[#4B4FDF] transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export iCal
          </button>
          <button
            onClick={handleCopySubscribeUrl}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E8ECF1] text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition-all"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Subscribe
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-[#E8ECF1] shadow-sm p-4">
            {loading ? (
              <div className="p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-8 w-48" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
                <Skeleton className="h-[500px] w-full rounded-xl" />
              </div>
            ) : (
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                events={events}
                eventClick={handleEventClick}
                height="auto"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,dayGridWeek',
                }}
                datesSet={(info) => {
                  setCurrentMonth(info.start.getMonth() + 1);
                }}
                buttonText={{
                  today: 'Today',
                  month: 'Month',
                  week: 'Week',
                }}
                eventDisplay="block"
                displayEventTime={false}
                dayMaxEvents={3}
                moreLinkText={(num) => '+ ' + num + ' more'}
                dayCellClassNames="hover:bg-gray-50 cursor-pointer transition-colors"
                eventClassNames="rounded-md text-xs font-medium px-1.5 py-0.5 border-0 shadow-sm"
              />
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Calendar Sync Card */}
          <div className="bg-white rounded-xl border border-[#E8ECF1] shadow-sm p-4">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="w-4 h-4 text-[#5B5FEF]" />
              <h3 className="text-sm font-semibold text-gray-900">Calendar Sync</h3>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-gray-500 leading-relaxed">
                Export leaves to your calendar app or subscribe for auto-updates.
              </p>
              <button
                onClick={handleExportICS}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5B5FEF] text-white rounded-lg text-sm font-medium hover:bg-[#4B4FDF] transition-all"
              >
                <Download className="w-4 h-4" />
                Download .ics File
              </button>
              <button
                onClick={handleCopySubscribeUrl}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-[#E8ECF1] text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all"
              >
                <LinkIcon className="w-4 h-4" />
                Copy Subscribe URL
              </button>
              <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                Paste this URL into Google Calendar, Apple Calendar, or Outlook to subscribe.
              </p>
            </div>
          </div>

          {/* Event Details */}
          <div className="bg-white rounded-xl border border-[#E8ECF1] shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-[#5B5FEF]" />
              Event Details
            </h3>
            {selectedEvent ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-gray-50">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{selectedEvent.extendedProps.employeeName}</p>
                    <p className="text-xs text-gray-400">
                      {selectedEvent.extendedProps.department}
                    </p>
                  </div>
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedEvent.backgroundColor }}
                  />
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-400">Leave Type</p>
                  <p className="font-medium text-gray-900">{selectedEvent.extendedProps.leaveType}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-400">Status</p>
                  <span className={'inline-block px-2 py-0.5 rounded-full text-xs font-medium ' + (
                    selectedEvent.extendedProps.status === 'approved'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-amber-50 text-amber-700'
                  )}>
                    {selectedEvent.extendedProps.status.charAt(0).toUpperCase() + selectedEvent.extendedProps.status.slice(1)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-400">Start</p>
                    <p className="font-medium text-gray-900 text-xs">
                      {new Date(selectedEvent.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-400">End</p>
                    <p className="font-medium text-gray-900 text-xs">
                      {new Date(selectedEvent.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarDays className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">Click on an event to see details</p>
              </div>
            )}
          </div>

          {/* Monthly Overview */}
          <div className="bg-white rounded-xl border border-[#E8ECF1] shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#5B5FEF]" />
              {monthNames[currentMonth - 1]} Overview
            </h3>
            {events.length > 0 ? (
              <div className="space-y-1">
                {Array.from(new Set(events.map((e) => e.extendedProps.employeeName))).slice(0, 10).map((name) => {
                  const employeeEvents = events.filter((e) => e.extendedProps.employeeName === name);
                  const totalDays = employeeEvents.reduce((sum, e) => {
                    const start = new Date(e.start);
                    const end = new Date(e.end);
                    return sum + Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                  }, 0);
                  return (
                    <div key={name} className="flex items-center justify-between py-1.5 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#5B5FEF]/10 flex items-center justify-center">
                          <span className="text-[10px] font-medium text-[#5B5FEF]">{name.split(' ').map((n) => n[0]).join('')}</span>
                        </div>
                        <span className="text-gray-700 text-xs">{name}</span>
                      </div>
                      <span className="text-xs text-gray-400">{totalDays} day{totalDays !== 1 ? 's' : ''}</span>
                    </div>
                  );
                })}
                {new Set(events.map((e) => e.extendedProps.employeeName)).size > 10 && (
                  <p className="text-xs text-gray-400 text-center pt-1">+{new Set(events.map((e) => e.extendedProps.employeeName)).size - 10} more</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">No leaves this month</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
