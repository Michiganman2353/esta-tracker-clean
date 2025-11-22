import { useState } from 'react';
import type { User } from '@/types';

interface PTORequest {
  id: string;
  userId: string;
  employeeName: string;
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'approved' | 'denied';
  reason: string;
  hours: number;
}

interface CalendarProps {
  user?: User;
  ptoRequests?: PTORequest[];
  onDateClick?: (date: Date) => void;
}

type ViewMode = 'day' | 'week' | 'month';

export default function Calendar({ ptoRequests = [], onDateClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // Navigation
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get PTO requests for a specific date
  const getRequestsForDate = (date: Date): PTORequest[] => {
    return ptoRequests.filter((request) => {
      const reqStart = new Date(request.startDate);
      const reqEnd = new Date(request.endDate);
      reqStart.setHours(0, 0, 0, 0);
      reqEnd.setHours(23, 59, 59, 999);
      const checkDate = new Date(date);
      checkDate.setHours(12, 0, 0, 0);
      return checkDate >= reqStart && checkDate <= reqEnd;
    });
  };

  // Month view helpers
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  // Week view helpers
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      days.push(day);
    }

    return days;
  };

  // Formatting
  const formatMonthYear = () => {
    return currentDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.getDate().toString();
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date | null) => {
    if (!date) return true;
    return date.getMonth() === currentDate.getMonth();
  };

  // Render day cell
  const renderDayCell = (date: Date | null, isWeekView = false) => {
    if (!date) {
      return <div className="calendar-day empty"></div>;
    }

    const requests = getRequestsForDate(date);
    const approvedRequests = requests.filter((r) => r.status === 'approved');
    const pendingRequests = requests.filter((r) => r.status === 'pending');

    const hasConflict = approvedRequests.length > 1;
    const isLowStaffing = approvedRequests.length >= 3;

    return (
      <div
        className={`calendar-day ${isToday(date) ? 'today' : ''} ${
          !isCurrentMonth(date) ? 'other-month' : ''
        } ${hasConflict ? 'has-conflict' : ''} ${
          isLowStaffing ? 'low-staffing' : ''
        } ${isWeekView ? 'week-view' : ''}`}
        onClick={() => onDateClick && onDateClick(date)}
      >
        <div className="day-header">
          <span className="day-number">{formatDate(date)}</span>
          {isWeekView && (
            <span className="day-name">
              {date.toLocaleDateString('en-US', { weekday: 'short' })}
            </span>
          )}
        </div>

        <div className="day-content">
          {approvedRequests.map((request) => (
            <div
              key={request.id}
              className="pto-event approved"
              title={`${request.employeeName} - ${request.reason}`}
            >
              <span className="event-name">{request.employeeName}</span>
              {isWeekView && (
                <span className="event-hours">{request.hours}h</span>
              )}
            </div>
          ))}

          {pendingRequests.map((request) => (
            <div
              key={request.id}
              className="pto-event pending"
              title={`${request.employeeName} - ${request.reason} (Pending)`}
            >
              <span className="event-name">{request.employeeName}</span>
              <span className="event-status">⏳</span>
            </div>
          ))}

          {hasConflict && (
            <div className="conflict-warning" title="Multiple employees out">
              ⚠️ Conflict
            </div>
          )}

          {isLowStaffing && (
            <div className="staffing-warning" title="Low staffing">
              📉 Low Staff
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render views
  const renderMonthView = () => {
    const days = getMonthDays();
    const weeks: (Date | null)[][] = [];

    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div className="calendar-grid month-view">
        <div className="calendar-header">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="calendar-header-cell">
              {day}
            </div>
          ))}
        </div>
        <div className="calendar-body">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="calendar-week">
              {week.map((day, dayIndex) => (
                <div key={dayIndex}>{renderDayCell(day)}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const days = getWeekDays();

    return (
      <div className="calendar-grid week-view">
        <div className="calendar-header">
          {days.map((day) => (
            <div key={day.toISOString()} className="calendar-header-cell">
              <div>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div className="header-date">{day.getDate()}</div>
            </div>
          ))}
        </div>
        <div className="calendar-body">
          <div className="calendar-week">
            {days.map((day) => (
              <div key={day.toISOString()}>{renderDayCell(day, true)}</div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const requests = getRequestsForDate(currentDate);
    const approvedRequests = requests.filter((r) => r.status === 'approved');
    const pendingRequests = requests.filter((r) => r.status === 'pending');

    return (
      <div className="day-view">
        <div className="day-view-header">
          <h3>{currentDate.toLocaleDateString('en-US', { weekday: 'long' })}</h3>
          <p className="day-view-date">
            {currentDate.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>

        <div className="day-view-content">
          {approvedRequests.length === 0 && pendingRequests.length === 0 ? (
            <div className="no-events">
              <p>No time-off requests for this day</p>
            </div>
          ) : (
            <>
              {approvedRequests.length > 0 && (
                <div className="requests-section">
                  <h4>Approved Time Off</h4>
                  {approvedRequests.map((request) => (
                    <div key={request.id} className="request-card approved">
                      <div className="request-header">
                        <span className="employee-name">{request.employeeName}</span>
                        <span className="request-hours">{request.hours} hours</span>
                      </div>
                      <div className="request-details">
                        <span className="request-reason">{request.reason}</span>
                        <span className="request-dates">
                          {new Date(request.startDate).toLocaleDateString()} -{' '}
                          {new Date(request.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {pendingRequests.length > 0 && (
                <div className="requests-section">
                  <h4>Pending Approval</h4>
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="request-card pending">
                      <div className="request-header">
                        <span className="employee-name">{request.employeeName}</span>
                        <span className="request-hours">{request.hours} hours</span>
                      </div>
                      <div className="request-details">
                        <span className="request-reason">{request.reason}</span>
                        <span className="request-dates">
                          {new Date(request.startDate).toLocaleDateString()} -{' '}
                          {new Date(request.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-container">
      {/* Calendar Controls */}
      <div className="calendar-controls">
        <div className="calendar-nav">
          <button onClick={goToPrevious} className="btn btn-secondary">
            ←
          </button>
          <button onClick={goToToday} className="btn btn-secondary">
            Today
          </button>
          <button onClick={goToNext} className="btn btn-secondary">
            →
          </button>
        </div>

        <div className="calendar-title">
          <h2>{formatMonthYear()}</h2>
        </div>

        <div className="view-mode-selector">
          <button
            onClick={() => setViewMode('day')}
            className={`btn ${viewMode === 'day' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Day
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`btn ${viewMode === 'week' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`btn ${viewMode === 'month' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-color approved"></span>
          <span>Approved</span>
        </div>
        <div className="legend-item">
          <span className="legend-color pending"></span>
          <span>Pending</span>
        </div>
        <div className="legend-item">
          <span className="legend-color conflict"></span>
          <span>Conflict (Multiple Out)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color low-staffing"></span>
          <span>Low Staffing (3+ Out)</span>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}
    </div>
  );
}
