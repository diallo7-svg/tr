import { getAccessToken } from "./googleAuth";

export interface GmailSendResult {
  id: string;
  threadId: string;
}

export interface GoogleSheetResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

export interface GoogleDriveResult {
  fileId: string;
  fileUrl: string;
}

export interface GoogleCalendarResult {
  eventId: string;
  htmlLink: string;
}

/**
 * Encode string to Base64URL for Gmail API
 */
function base64UrlEncode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * 1. Gmail API — Send Email
 */
export async function sendEmailViaGmail(
  to: string,
  subject: string,
  bodyText: string
): Promise<GmailSendResult> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Veuillez vous connecter à Google Workspace pour envoyer un e-mail via Gmail.");
  }

  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const rawMime = [
    `To: ${to}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: ${utf8Subject}`,
    "",
    bodyText,
  ].join("\r\n");

  const encodedRaw = base64UrlEncode(rawMime);

  const res = await fetch("https://gmail.googleapis.com/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encodedRaw }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Erreur d'envoi Gmail (code ${res.status})`);
  }

  return await res.json();
}

/**
 * 2. Google Sheets API — Export 13-Week Cashflow Forecast
 */
export async function exportToGoogleSheets(
  title: string,
  weeklyForecast: Array<{
    weekIndex: number;
    weekName: string;
    startDate: string;
    inflows: number;
    outflows: number;
    net: number;
    closingCash: number;
  }>
): Promise<GoogleSheetResult> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Veuillez vous connecter à Google Workspace pour exporter vers Google Sheets.");
  }

  const headerRow = [
    "Semaine N°",
    "Période",
    "Date Début",
    "Encaissements (EUR)",
    "Décaissements (EUR)",
    "Flux Net (EUR)",
    "Solde Clôture (EUR)",
  ];

  const dataRows = weeklyForecast.map((w) => [
    `Semaine ${w.weekIndex}`,
    w.weekName,
    w.startDate,
    w.inflows,
    w.outflows,
    w.net,
    w.closingCash,
  ]);

  const body = {
    properties: {
      title: `${title} - ${new Date().toLocaleDateString("fr-FR")}`,
    },
    sheets: [
      {
        properties: {
          title: "Plan de Trésorerie 13S",
          gridProperties: {
            frozenRowCount: 1,
          },
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: headerRow.map((h) => ({
                  userEnteredValue: { stringValue: h },
                  userEnteredFormat: {
                    textFormat: { bold: true },
                    backgroundColor: { red: 0.05, green: 0.35, blue: 0.25 },
                  },
                })),
              },
              ...dataRows.map((row) => ({
                values: row.map((val) =>
                  typeof val === "number"
                    ? { userEnteredValue: { numberValue: val } }
                    : { userEnteredValue: { stringValue: String(val) } }
                ),
              })),
            ],
          },
        ],
      },
    ],
  };

  const res = await fetch("https://sheets.googleapis.com/v1/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Erreur d'export Google Sheets (code ${res.status})`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * 3. Google Drive API — Upload Factur-X / PDF Invoice JSON
 */
export async function uploadInvoiceToDrive(
  filename: string,
  invoiceContent: string
): Promise<GoogleDriveResult> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Veuillez vous connecter à Google Workspace pour archiver sur Google Drive.");
  }

  const metadata = {
    name: filename,
    mimeType: "text/plain",
    description: "Facture Factur-X / Archiving Trésorerie Anti-Crise",
  };

  const boundary = "foo_bar_baz_tresorerie";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartBody =
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    delimiter +
    "Content-Type: text/plain; charset=UTF-8\r\n\r\n" +
    invoiceContent +
    closeDelimiter;

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Erreur de téléversement Google Drive (code ${res.status})`);
  }

  const data = await res.json();
  const fileId = data.id;
  const fileUrl = `https://drive.google.com/file/d/${fileId}/view`;

  return { fileId, fileUrl };
}

/**
 * 4. Google Calendar API — Add Critical Due Date Reminder
 */
export async function addDueDateToCalendar(
  summary: string,
  description: string,
  dueDateString: string
): Promise<GoogleCalendarResult> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Veuillez vous connecter à Google Workspace pour ajouter un événement Google Calendar.");
  }

  // Ensure format YYYY-MM-DD
  let dateFormatted = dueDateString;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDateString)) {
    const d = new Date(dueDateString);
    if (!isNaN(d.getTime())) {
      dateFormatted = d.toISOString().split("T")[0];
    } else {
      dateFormatted = new Date().toISOString().split("T")[0];
    }
  }

  const event = {
    summary,
    description,
    start: { date: dateFormatted },
    end: { date: dateFormatted },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 1440 }, // 1 day before
        { method: "email", minutes: 2880 }, // 2 days before
      ],
    },
  };

  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Erreur de création Google Calendar (code ${res.status})`);
  }

  const data = await res.json();
  return {
    eventId: data.id,
    htmlLink: data.htmlLink || `https://calendar.google.com/calendar/r`,
  };
}
