import { getAccessToken } from './googleAuth';

export interface SendEmailPayload {
  to: string;
  subject: string;
  messageText: string;
  htmlContent?: string;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet?: string;
  date?: string;
}

/**
 * Encodes a string in RFC 4648 Base64URL format without padding.
 */
function base64UrlEncode(str: string): string {
  // Use UTF-8 bytes to handle international characters properly
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Builds an RFC 2822 email message.
 */
function createMimeMessage(
  to: string,
  subject: string,
  messageText: string,
  htmlContent?: string
): string {
  const boundary = `====_NextPart_${Date.now()}_====`;
  const cleanTo = to.trim();
  const cleanSubject = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;

  if (!htmlContent) {
    return [
      `To: ${cleanTo}`,
      `Subject: ${cleanSubject}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: 8bit',
      '',
      messageText,
    ].join('\r\n');
  }

  return [
    `To: ${cleanTo}`,
    `Subject: ${cleanSubject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    messageText,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    htmlContent,
    '',
    `--${boundary}--`,
  ].join('\r\n');
}

/**
 * Sends an email using the Gmail REST API.
 * Requires user confirmation prior to execution as per workspace guidelines.
 */
export async function sendGmailMessage(
  payload: SendEmailPayload
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const token = await getAccessToken();
    if (!token) {
      return {
        success: false,
        error: 'Требуется авторизация в Google аккаунте',
      };
    }

    const mimeMessage = createMimeMessage(
      payload.to,
      payload.subject,
      payload.messageText,
      payload.htmlContent
    );

    const raw = base64UrlEncode(mimeMessage);

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const msg = errJson.error?.message || `HTTP ${res.status}: Ошибка отправки`;
      return { success: false, error: msg };
    }

    const data = await res.json();
    return { success: true, messageId: data.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Сбой при отправке email' };
  }
}

/**
 * Fetches recent sent messages or calculator notes from Gmail.
 */
export async function fetchRecentGmailMessages(
  query: string = 'subject:ВексКалькулятор OR subject:VexCalculator'
): Promise<GmailMessageSummary[]> {
  try {
    const token = await getAccessToken();
    if (!token) return [];

    const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
    url.searchParams.set('maxResults', '10');
    if (query) url.searchParams.set('q', query);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (!data.messages) return [];

    // Fetch snippet for each
    const list: GmailMessageSummary[] = [];
    for (const m of data.messages.slice(0, 5)) {
      try {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=minimal`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (detailRes.ok) {
          const detail = await detailRes.json();
          list.push({
            id: detail.id,
            threadId: detail.threadId,
            snippet: detail.snippet,
          });
        }
      } catch {
        // Skip
      }
    }

    return list;
  } catch (err) {
    console.error('Error fetching gmail messages:', err);
    return [];
  }
}
