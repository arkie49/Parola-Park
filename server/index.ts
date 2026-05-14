import dotenv from 'dotenv';
import express from 'express';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

type BookingItem = {
  id: string;
  name: string;
  price: number;
  type: 'tour' | 'facility';
  quantity?: number;
};

type BookingPayload = {
  bookingId: string | null;
  receiptNo: string;
  customer?: {
    fullName?: string | null;
    phoneNumber?: string | null;
    address?: string | null;
    email?: string | null;
  };
  items: BookingItem[];
  total: number;
  currency?: string;
  payment?: {
    method?: string;
    provider?: string | null;
    referenceNumber?: string | null;
    accountNumber?: string | null;
  };
};

const PLACEHOLDER_ENV_VALUES = new Set([
  'your_resend_api_key_here',
  'your_email@gmail.com',
  'your_app_password',
  'replace_with_your_api_key',
  'replace_me',
  'replaceme',
  'xxx',
]);

const isConfiguredValue = (value?: string) => {
  if (!value) return false;
  return !PLACEHOLDER_ENV_VALUES.has(value.trim().toLowerCase());
};

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass || !isConfiguredValue(user) || !isConfiguredValue(pass)) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

const formatMoney = (amount: number) => {
  if (amount === 0) return 'FREE';
  return amount.toLocaleString('en-PH');
};

const buildReceiptHtml = (booking: BookingPayload) => {
  const lines = booking.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee;">
            <div style="font-weight:700; color:#0b2b2e;">
              ${escapeHtml(i.name)}
              ${i.quantity && i.quantity > 1 ? `<span style="font-size:12px; color:#6b7280; font-weight:normal;"> x${i.quantity}</span>` : ''}
            </div>
            <div style="font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:0.12em; font-weight:700;">${escapeHtml(i.type)}</div>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #eee; text-align:right; font-weight:800; color:#f97316;">₱${escapeHtml(formatMoney(i.price * (i.quantity || 1)))}</td>
        </tr>`
    )
    .join('');

  const customerName = booking.customer?.fullName ? escapeHtml(booking.customer.fullName) : 'Guest';
  const receiptNo = escapeHtml(booking.receiptNo);
  const method = booking.payment?.method ? escapeHtml(booking.payment.method) : 'card';
  const provider = booking.payment?.provider ? escapeHtml(booking.payment.provider) : '—';
  const reference = booking.payment?.referenceNumber ? escapeHtml(booking.payment.referenceNumber) : 'N/A';
  const accountNumber = booking.payment?.accountNumber ? escapeHtml(booking.payment.accountNumber) : 'N/A';
  const total = escapeHtml(formatMoney(booking.total));

  return `
  <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; max-width:640px; margin:0 auto; padding:24px; color:#111827;">
    <div style="padding:20px; border-radius:18px; background:#0b2b2e; color:#fff;">
      <div style="font-size:12px; letter-spacing:0.18em; text-transform:uppercase; opacity:0.8; font-weight:800;">Parola Park</div>
      <div style="font-size:28px; font-weight:900; margin-top:6px;">Booking Confirmation</div>
      <div style="margin-top:10px; font-size:14px; opacity:0.9;">Receipt: <span style="font-weight:900;">${receiptNo}</span></div>
    </div>

    <div style="margin-top:18px; padding:18px; border-radius:18px; background:#fff; border:1px solid #eee;">
      <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap;">
        <div style="min-width:180px;">
          <div style="font-size:12px; text-transform:uppercase; letter-spacing:0.14em; color:#6b7280; font-weight:800;">Customer</div>
          <div style="margin-top:6px; font-size:16px; font-weight:800; color:#0b2b2e;">${customerName}</div>
        </div>
        <div style="min-width:180px;">
          <div style="font-size:12px; text-transform:uppercase; letter-spacing:0.14em; color:#6b7280; font-weight:800;">Payment</div>
          <div style="margin-top:6px; font-size:14px; font-weight:800; color:#0b2b2e;">${method} • ${provider}</div>
        </div>
        <div style="min-width:180px;">
          <div style="font-size:12px; text-transform:uppercase; letter-spacing:0.14em; color:#6b7280; font-weight:800;">Reference</div>
          <div style="margin-top:6px; font-size:14px; font-weight:800; color:#0b2b2e;">${reference}</div>
        </div>
        <div style="min-width:180px;">
          <div style="font-size:12px; text-transform:uppercase; letter-spacing:0.14em; color:#6b7280; font-weight:800;">Account</div>
          <div style="margin-top:6px; font-size:14px; font-weight:800; color:#0b2b2e;">${accountNumber}</div>
        </div>
      </div>
    </div>

    <div style="margin-top:18px; padding:18px; border-radius:18px; background:#fff; border:1px solid #eee;">
      <div style="font-size:12px; text-transform:uppercase; letter-spacing:0.14em; color:#6b7280; font-weight:800; margin-bottom:10px;">Items</div>
      <table style="width:100%; border-collapse:collapse;">
        <tbody>
          ${lines}
        </tbody>
      </table>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; padding-top:14px; border-top:1px solid #eee;">
        <div style="font-size:12px; text-transform:uppercase; letter-spacing:0.14em; color:#6b7280; font-weight:800;">Total</div>
        <div style="font-size:20px; font-weight:900; color:#0b2b2e;">₱${total}</div>
      </div>
    </div>

    <div style="margin-top:18px; font-size:12px; color:#6b7280; line-height:1.6;">
      Keep this email as proof of booking. Present your receipt number at the park if requested.
    </div>
  </div>`;
};

const escapeHtml = (input: string) => {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
};

const sendWithResend = async ({
  to,
  from,
  replyTo,
  subject,
  html,
}: {
  to: string;
  from: string;
  replyTo?: string;
  subject: string;
  html: string;
}) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!isConfiguredValue(apiKey)) {
    return { ok: false as const, error: 'RESEND_API_KEY is not configured or is a placeholder' };
  }

  const resend = new Resend(apiKey!);
  const result = await resend.emails.send({
    from,
    to,
    ...(replyTo ? { replyTo } : {}),
    subject,
    html,
  });

  if (result.error) {
    return { ok: false as const, error: result.error.message || 'Resend API error' };
  }

  return { ok: true as const, id: result.data?.id };
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/send-booking-confirmation', async (req, res) => {
  const to = typeof req.body?.to === 'string' ? req.body.to : null;
  const booking = req.body?.booking as BookingPayload | undefined;

  if (!to || !booking || !booking.receiptNo || !Array.isArray(booking.items)) {
    res.status(400).json({ ok: false, error: 'Invalid payload' });
    return;
  }

  const fromEmail = process.env.MAIL_FROM || 'noreply@parolapark.com';
  const fromAddr = extractEmailAddress(fromEmail);
  const fromDomain = extractDomain(fromAddr);
  const shouldUseResendFallbackFrom = Boolean(fromDomain && WEBMAIL_DOMAINS.has(fromDomain));
  const resendFrom = shouldUseResendFallbackFrom ? (process.env.RESEND_FROM || 'onboarding@resend.dev') : fromEmail;
  const replyTo = process.env.MAIL_REPLY_TO || (shouldUseResendFallbackFrom ? fromAddr : undefined);

  if (process.env.RESEND_API_KEY) {
    const result = await sendWithResend({
      to,
      from: resendFrom,
      replyTo,
      subject: `Parola Park Booking Confirmation • ${booking.receiptNo}`,
      html: buildReceiptHtml(booking),
    });

    if (!result.ok) {
      res.status(500).json({ ok: false, error: result.error, provider: 'resend', from: resendFrom });
      return;
    }

    res.status(200).json({ ok: true, provider: 'resend', id: result.id || null, from: resendFrom });
    return;
  }

  const transporter = createTransporter();

  if (!transporter) {
    console.log('--- DEVELOPMENT MODE: EMAIL LOG ---');
    console.log(`To: ${to}`);
    console.log(`Subject: Parola Park Booking Confirmation • ${booking.receiptNo}`);
    console.log('Content (HTML):');
    console.log(buildReceiptHtml(booking));
    console.log('-----------------------------------');

    res.status(200).json({ ok: true, provider: 'console-log' });
    return;
  }

  try {
    await transporter.sendMail({
      from: fromEmail,
      to,
      subject: `Parola Park Booking Confirmation • ${booking.receiptNo}`,
      html: buildReceiptHtml(booking),
    });

    res.status(200).json({ ok: true, provider: 'smtp' });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'Failed to send email', provider: 'smtp' });
  }
});

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(port, '0.0.0.0', () => {
  console.log(`Email server listening on http://localhost:${port}`);
});

