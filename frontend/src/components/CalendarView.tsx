import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

export interface CalendarEvent {
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
  };
}

export interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}

export default function CalendarView({ events, onEventClick }: CalendarViewProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Leave Calendar</h3>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
            Approved
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            Pending
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            Rejected
          </span>
        </div>
      </div>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={(info) => {
          if (onEventClick) {
            onEventClick(info.event as unknown as CalendarEvent);
          }
        }}
        height="auto"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek',
        }}
        buttonText={{
          today: 'Today',
          month: 'Month',
          week: 'Week',
        }}
        eventDisplay="block"
        displayEventTime={false}
        dayMaxEvents={2}
        moreLinkText={(num) => `+${num} more`}
        dayCellClassNames="hover:bg-gray-50 cursor-pointer transition-colors"
        eventClassNames="rounded-md text-xs font-medium px-1.5 py-0.5 border-0 shadow-sm"
      />
    </div>
  );
}
