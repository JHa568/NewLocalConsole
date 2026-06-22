/** Shared Google Calendar shapes used by the dashboard, calendar and pomodoro. */

export interface GEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
}

export interface GTask {
  id: string;
  title?: string;
  due?: string;
  status?: string;
  notes?: string;
}
