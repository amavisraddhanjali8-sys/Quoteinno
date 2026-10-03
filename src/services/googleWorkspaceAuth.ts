import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
  'https://www.googleapis.com/auth/gmail.addons.current.message.action',
  'https://www.googleapis.com/auth/gmail.addons.current.message.metadata',
  'https://www.googleapis.com/auth/gmail.addons.current.message.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.insert',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/gmail.settings.sharing',
  'https://www.googleapis.com/auth/calendar.events'
];

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach(scope => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  prompt: 'consent'
});

// In-memory access token cache ONLY (never persisted to localStorage or sessionStorage)
let isSigningIn = false;
let cachedAccessToken: string | null = null;
let cachedGoogleUser: User | null = null;
const authListeners = new Set<(state: { user: User | null; hasToken: boolean }) => void>();

function notifyListeners() {
  const snapshot = {
    user: cachedGoogleUser,
    hasToken: Boolean(cachedAccessToken)
  };
  authListeners.forEach(listener => {
    try {
      listener(snapshot);
    } catch {}
  });
}

export const subscribeGoogleAuth = (
  listener: (state: { user: User | null; hasToken: boolean }) => void
): (() => void) => {
  authListeners.add(listener);
  listener({
    user: cachedGoogleUser,
    hasToken: Boolean(cachedAccessToken)
  });
  return () => {
    authListeners.delete(listener);
  };
};

// Initialize auth state listener on app load
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      cachedGoogleUser = user;
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedGoogleUser = null;
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
    notifyListeners();
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Gmail OAuth access token from Google Sign-In.');
    }

    cachedAccessToken = credential.accessToken;
    cachedGoogleUser = result.user;
    notifyListeners();
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getConnectedGoogleUser = (): User | null => {
  return cachedGoogleUser;
};

export const logoutGoogle = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  cachedGoogleUser = null;
  notifyListeners();
};

// --- GMAIL REST API HELPERS ---

export interface GmailProfileInfo {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  labelIds: string[];
  bodyPreview?: string;
}

export function encodeBase64Url(input: string): string {
  const utf8Bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < utf8Bytes.byteLength; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function buildMimeEmail(params: {
  fromName?: string;
  fromEmail?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  plainText: string;
  htmlBody: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}): string {
  const boundary = `innovista_mime_${Date.now().toString(36)}`;
  const headers: string[] = [];

  if (params.fromEmail) {
    headers.push(
      params.fromName
        ? `From: "${params.fromName.replace(/"/g, '')}" <${params.fromEmail}>`
        : `From: ${params.fromEmail}`
    );
  }
  headers.push(`To: ${params.to.join(', ')}`);
  if (params.cc && params.cc.length > 0) {
    headers.push(`Cc: ${params.cc.join(', ')}`);
  }
  if (params.bcc && params.bcc.length > 0) {
    headers.push(`Bcc: ${params.bcc.join(', ')}`);
  }

  // Encode UTF-8 subject safely
  const encodedSubject = `=?UTF-8?B?${btoa(
    Array.from(new TextEncoder().encode(params.subject))
      .map(b => String.fromCharCode(b))
      .join('')
  )}?=`;
  headers.push(`Subject: ${encodedSubject}`);
  headers.push('MIME-Version: 1.0');

  if (params.priority === 'critical' || params.priority === 'high') {
    headers.push('X-Priority: 1 (Highest)');
    headers.push('Importance: High');
  }

  headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);

  const mimeLines = [
    ...headers,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    params.plainText,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    params.htmlBody,
    '',
    `--${boundary}--`
  ];

  return mimeLines.join('\r\n');
}

export async function fetchGmailProfile(): Promise<GmailProfileInfo | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    throw new Error(`Gmail profile fetch failed (${res.status})`);
  }
  return await res.json();
}

export async function fetchGmailMessages(
  query = '',
  maxResults = 15
): Promise<GmailMessageSummary[]> {
  const token = await getAccessToken();
  if (!token) return [];

  const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
  url.searchParams.set('maxResults', String(maxResults));
  if (query.trim()) {
    url.searchParams.set('q', query.trim());
  }

  const listRes = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!listRes.ok) {
    throw new Error(`Failed to list Gmail messages (${listRes.status})`);
  }

  const listData = await listRes.json();
  const messages: { id: string; threadId: string }[] = listData.messages || [];

  const details = await Promise.all(
    messages.slice(0, maxResults).map(async msg => {
      try {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        if (!msgRes.ok) return null;
        const data = await msgRes.json();
        const headers: { name: string; value: string }[] = data.payload?.headers || [];
        const getHeader = (name: string) =>
          headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        return {
          id: data.id,
          threadId: data.threadId,
          snippet: data.snippet || '',
          subject: getHeader('Subject') || '(No Subject)',
          from: getHeader('From') || '',
          to: getHeader('To') || '',
          date: getHeader('Date') || '',
          labelIds: data.labelIds || []
        } as GmailMessageSummary;
      } catch {
        return null;
      }
    })
  );

  return details.filter((d): d is GmailMessageSummary => d !== null);
}

export async function sendGmailViaApi(params: {
  fromName?: string;
  fromEmail?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  plainText: string;
  htmlBody: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}): Promise<{ id: string; threadId: string; labelIds?: string[] }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google OAuth token not active. Please sign in with Google first.');
  }

  const rawMime = buildMimeEmail(params);
  const rawEncoded = encodeBase64Url(rawMime);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: rawEncoded })
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gmail API send error (${res.status}): ${errText || res.statusText}`);
  }

  return await res.json();
}

export async function createGmailDraftViaApi(params: {
  fromName?: string;
  fromEmail?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  plainText: string;
  htmlBody: string;
}): Promise<{ id: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google OAuth token not active. Please sign in with Google first.');
  }

  const rawMime = buildMimeEmail(params);
  const rawEncoded = encodeBase64Url(rawMime);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: { raw: rawEncoded }
    })
  });

  if (!res.ok) {
    throw new Error(`Gmail Draft creation failed (${res.status})`);
  }

  return await res.json();
}

export async function trashGmailMessageViaApi(messageId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google OAuth token not active. Please sign in with Google first.');
  }

  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to move Gmail message to trash (${res.status})`);
  }
}

// --- GOOGLE CALENDAR REST API HELPERS ---

export interface GoogleCalendarEventInput {
  summary: string;
  description: string;
  startIso: string;
  endIso: string;
  location?: string;
  attendeeEmails?: string[];
  reminderMinutesBefore?: number[];
}

export interface GoogleCalendarEventResult {
  id: string;
  htmlLink: string;
  status: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

export async function createGoogleCalendarEvent(
  input: GoogleCalendarEventInput
): Promise<GoogleCalendarEventResult> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Calendar access token not active. Please sign in with Google first.');
  }

  const reminderOverrides = (input.reminderMinutesBefore || [10, 30]).map(minutes => ({
    method: 'popup',
    minutes
  }));

  const body: Record<string, any> = {
    summary: input.summary,
    description: input.description,
    location: input.location || 'Innovista ERP — Factory & Quality Control Portal',
    start: {
      dateTime: new Date(input.startIso).toISOString()
    },
    end: {
      dateTime: new Date(input.endIso).toISOString()
    },
    reminders: {
      useDefault: false,
      overrides: reminderOverrides
    }
  };

  if (input.attendeeEmails && input.attendeeEmails.length > 0) {
    body.attendees = input.attendeeEmails
      .filter(e => e && e.includes('@'))
      .map(email => ({ email: email.trim() }));
  }

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Google Calendar API error (${res.status}): ${errText || res.statusText}`);
  }

  return await res.json();
}

export async function updateGoogleCalendarEvent(
  eventId: string,
  input: Partial<GoogleCalendarEventInput>
): Promise<GoogleCalendarEventResult> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Calendar access token not active. Please sign in with Google first.');
  }

  const patchBody: Record<string, any> = {};
  if (input.summary !== undefined) patchBody.summary = input.summary;
  if (input.description !== undefined) patchBody.description = input.description;
  if (input.location !== undefined) patchBody.location = input.location;
  if (input.startIso) {
    patchBody.start = { dateTime: new Date(input.startIso).toISOString() };
  }
  if (input.endIso) {
    patchBody.end = { dateTime: new Date(input.endIso).toISOString() };
  }
  if (input.reminderMinutesBefore) {
    patchBody.reminders = {
      useDefault: false,
      overrides: input.reminderMinutesBefore.map(minutes => ({
        method: 'popup',
        minutes
      }))
    };
  }

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(patchBody)
    }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Google Calendar update error (${res.status}): ${errText || res.statusText}`);
  }

  return await res.json();
}

export async function listUpcomingGoogleCalendarEvents(
  maxResults = 15
): Promise<GoogleCalendarEventResult[]> {
  const token = await getAccessToken();
  if (!token) return [];

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('maxResults', String(maxResults));
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('timeMin', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Google Calendar events (${res.status})`);
  }

  const data = await res.json();
  return data.items || [];
}

