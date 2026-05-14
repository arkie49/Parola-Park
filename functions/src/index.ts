import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';
import * as nodemailer from 'nodemailer';

admin.initializeApp();

type BookingItem = {
  id: string;
  name: string;
  price: number;
  type: 'tour' | 'facility';
  quantity?: number;
};

type BookingData = {
  bookingId: string | null;
  receiptNo: string;
  userId: string;
  userEmail: string;
  customer?: {
    fullName?: string | null;
    phoneNumber?: string | null;
    address?: string | null;
  };
  items: BookingItem[];
  total: number;
  currency?: string;
  tourDate?: string;
  payment?: {
    method?: string;
    provider?: string | null;
    referenceNumber?: string | null;
    ewalletMode?: string | null;
  };
  timestamp: admin.firestore.Timestamp;
  status: string;
};

const escapeHtml = (input: string) => {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
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

const formatMoney = (amount: number) => {
  if (amount === 0) return 'FREE';
  return amount.toLocaleString('en-PH');
};

const buildReceiptHtml = (booking: BookingData) => {
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
        <div style="font-size:20px; font-weight:900; color:#0b2b2e;">₱${formatMoney(booking.total)}</div>
      </div>
    </div>

    <div style="margin-top:18px; font-size:12px; color:#6b7280; line-height:1.6;">
      Keep this email as proof of booking. Present your receipt number at the park if requested.
    </div>
  </div>`;
};

const sendEmail = async (to: string, subject: string, html: string) => {
  // Try Resend first
  if (isConfiguredValue(process.env.RESEND_API_KEY)) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY!);
      const result = await resend.emails.send({
        from: process.env.MAIL_FROM || 'noreply@parolapark.com',
        to,
        subject,
        html,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      console.log('Email sent via Resend:', result.data?.id);
      return { success: true, provider: 'resend', id: result.data?.id };
    } catch (error) {
      console.warn('Resend failed:', error);
    }
  } else {
    console.warn('Resend API key missing or placeholder, skipping Resend provider.');
  }

  // Fallback to SMTP
  if (process.env.SMTP_HOST && isConfiguredValue(process.env.SMTP_USER) && isConfiguredValue(process.env.SMTP_PASS)) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.MAIL_FROM || 'noreply@parolapark.com',
        to,
        subject,
        html,
      });

      console.log('Email sent via SMTP');
      return { success: true, provider: 'smtp' };
    } catch (error) {
      console.warn('SMTP failed:', error);
    }
  } else {
    console.warn('SMTP configuration missing or placeholder values detected.');
  }

  // Development fallback - log to console
  console.log('--- DEVELOPMENT EMAIL LOG ---');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('HTML Content:');
  console.log(html);
  console.log('-----------------------------');

  return { success: true, provider: 'console' };
};

export const sendBookingConfirmation = functions.firestore
  .document('bookings/{bookingId}')
  .onCreate(async (snap, context) => {
    const booking = snap.data() as BookingData;

    console.log('New booking created:', booking.receiptNo);

    try {
      const subject = `Parola Park Booking Confirmation • ${booking.receiptNo}`;
      const html = buildReceiptHtml(booking);

      const emailResult = await sendEmail(booking.userEmail, subject, html);

      // Update the booking with email status
      await snap.ref.update({
        email: {
          sent: true,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          provider: emailResult.provider,
          id: emailResult.id || null,
        }
      });

      console.log('Email sent successfully for booking:', booking.receiptNo);
    } catch (error) {
      console.error('Failed to send email for booking:', booking.receiptNo, error);

      // Update with failure status
      await snap.ref.update({
        email: {
          sent: false,
          error: error.message,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
        }
      });
    }
  });