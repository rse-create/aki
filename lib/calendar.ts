import { google } from "googleapis";

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) {
    throw new Error("Google service account credentials are not set");
  }
  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/calendar.events"],
  });
}

function getCalendarClient() {
  return google.calendar({ version: "v3", auth: getAuth() });
}

/** Google Calendar's all-day end.date is exclusive, so the stored end date needs +1 day. */
function nextDay(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Creates an all-day event spanning [startDate, endDate] (both YYYY-MM-DD, inclusive). Returns the created event's id, or null if calendar sync isn't configured. */
export async function createProjectPeriodEvent(params: {
  title: string;
  startDate: string;
  endDate: string;
}): Promise<string | null> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) return null;

  const { title, startDate } = params;
  const endDate = params.endDate || startDate;

  const calendar = getCalendarClient();
  const res = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: title,
      start: { date: startDate },
      end: { date: nextDay(endDate) },
    },
  });
  return res.data.id ?? null;
}
