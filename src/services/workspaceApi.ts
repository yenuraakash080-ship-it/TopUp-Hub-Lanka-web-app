import { Order } from '../types';

export interface DriveReceiptFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime?: string;
  webViewLink?: string;
  size?: string;
}

export interface GmailPaymentMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export async function sendOrderReceiptViaGmail(params: {
  accessToken: string;
  toEmail: string;
  order: Order;
  receiptPngBlob: Blob;
}): Promise<{ id: string }> {
  const { accessToken, toEmail, order, receiptPngBlob } = params;
  const cleanRecipient = toEmail.trim();
  if (!cleanRecipient || !cleanRecipient.includes('@')) {
    throw new Error('Please enter a valid recipient email address.');
  }

  const boundary = `topuphub_${Date.now()}`;
  const attachmentB64 = await blobToBase64(receiptPngBlob);
  const statusLabel =
    order.status === 'completed'
      ? 'Paid / Approved'
      : order.status === 'rejected'
      ? 'Rejected'
      : 'Pending Verification';

  const textBody = [
    'TopUp Hub Lanka — Official Order Receipt',
    '========================================',
    `Order ID: ${order.id}`,
    `Status: ${statusLabel}`,
    `Date: ${new Date(order.createdAt).toLocaleString()}`,
    `Game: ${order.gameName}`,
    `Package: ${order.packageName}`,
    `Player UID: ${order.playerUid}`,
    `Player Name: ${order.playerIgn} (Level ${order.playerLevel})`,
    `Payment Method: ${order.paymentMethodLabel || order.paymentMethod}`,
    `Reference ID: ${order.transactionReference}`,
    `Amount Paid: Rs. ${order.totalPaidLKR.toFixed(2)}`,
    '',
    'For verification or support, contact WhatsApp 0758500536.',
  ].join('\r\n');

  const safeOrderFile = order.id.replace(/[^a-zA-Z0-9_-]/g, '');
  const mimeMessage = [
    `To: ${cleanRecipient}`,
    `Subject: TopUp Hub Lanka Receipt — ${order.id} (${order.gameName})`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    textBody,
    '',
    `--${boundary}`,
    `Content-Type: image/png; name="TopUpHub-Receipt-${safeOrderFile}.png"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="TopUpHub-Receipt-${safeOrderFile}.png"`,
    '',
    attachmentB64.replace(/(.{76})/g, '$1\r\n'),
    `--${boundary}--`,
  ].join('\r\n');

  const encodedRaw = toBase64Url(new TextEncoder().encode(mimeMessage));
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encodedRaw }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to send email via Gmail.');
  }

  return await res.json();
}

export async function searchGmailPaymentMessages(
  accessToken: string,
  searchQuery: string
): Promise<GmailPaymentMessage[]> {
  const q = encodeURIComponent(
    searchQuery.trim() || 'TopUp Hub Lanka OR eZ Cash OR BOC'
  );
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=6&q=${q}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!listRes.ok) {
    const err = await listRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Unable to read Gmail messages.');
  }

  const listData = await listRes.json();
  const messageRefs: Array<{ id: string; threadId: string }> = listData.messages || [];
  if (messageRefs.length === 0) return [];

  const details = await Promise.all(
    messageRefs.slice(0, 6).map(async (msg) => {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (!msgRes.ok) return null;
      const msgJson = await msgRes.json();
      const headers: Array<{ name: string; value: string }> =
        msgJson?.payload?.headers || [];
      const findHeader = (name: string) =>
        headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      return {
        id: msg.id,
        threadId: msg.threadId,
        subject: findHeader('Subject') || '(No Subject)',
        from: findHeader('From') || 'Unknown Sender',
        date: findHeader('Date') || '',
        snippet: msgJson.snippet || '',
      } as GmailPaymentMessage;
    })
  );

  return details.filter(Boolean) as GmailPaymentMessage[];
}

async function getOrCreateReceiptsFolder(accessToken: string): Promise<string> {
  const folderName = 'TopUp Hub Lanka Receipts';
  const query = encodeURIComponent(
    `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!searchRes.ok) {
    const err = await searchRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Unable to access Google Drive.');
  }
  const searchData = await searchRes.json();
  if (Array.isArray(searchData.files) && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });
  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Unable to create receipts folder in Drive.');
  }
  const created = await createRes.json();
  return created.id;
}

export async function saveReceiptToGoogleDrive(params: {
  accessToken: string;
  order: Order;
  receiptPngBlob: Blob;
}): Promise<DriveReceiptFile> {
  const { accessToken, order, receiptPngBlob } = params;
  const folderId = await getOrCreateReceiptsFolder(accessToken);
  const safeOrderFile = order.id.replace(/[^a-zA-Z0-9_-]/g, '');
  const fileName = `TopUpHub-Receipt-${safeOrderFile}.png`;

  const metadata = {
    name: fileName,
    mimeType: 'image/png',
    parents: [folderId],
    description: `${order.gameName} | ${order.packageName} | UID ${order.playerUid} | Rs. ${order.totalPaidLKR.toFixed(2)}`,
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', receiptPngBlob, fileName);

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,createdTime,webViewLink,size',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to upload receipt to Google Drive.');
  }

  return await uploadRes.json();
}

export async function listDriveReceiptFiles(
  accessToken: string
): Promise<DriveReceiptFile[]> {
  const q = encodeURIComponent(
    "name contains 'TopUpHub-Receipt-' and trashed=false"
  );
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=createdTime desc&pageSize=12&fields=files(id,name,mimeType,createdTime,webViewLink,size)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to list Google Drive receipts.');
  }
  const data = await res.json();
  return Array.isArray(data.files) ? data.files : [];
}

export async function deleteDriveReceiptFile(
  accessToken: string,
  fileId: string
): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to delete receipt from Google Drive.');
  }
}
