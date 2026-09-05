const nodemailer = require('nodemailer');
const { generateTicketPDFBuffer } = require('./pdfGenerator');

let transporter = null;

/**
 * Get or initialize Nodemailer Transporter
 */
const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development / Automated Test Fallback using Nodemailer Ethereal or Mock Transport
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`✉️ Ethereal Test Email Account Initialized: ${testAccount.user}`);
    } catch (err) {
      // JSON Transport fallback if offline
      transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }

  return transporter;
};

/**
 * Send Booking Confirmation & PDF Ticket Email to User
 * @param {Object} booking - Mongoose Booking document populated with event and user
 * @returns {Promise<Object>} Delivery info
 */
const sendTicketEmail = async (booking) => {
  try {
    if (!booking || !booking.user || !booking.user.email) {
      console.warn('⚠️ Cannot send ticket email: Missing recipient user or email.');
      return { success: false, reason: 'Missing recipient email' };
    }

    const mailTransporter = await getTransporter();

    // 1. Generate PDF Ticket Binary Buffer
    const pdfBuffer = await generateTicketPDFBuffer(booking);

    const eventTitle = booking.event ? booking.event.title : 'Your Event Access';
    const venue = booking.event ? booking.event.venue : 'Event Venue';
    const dateTime = booking.event ? new Date(booking.event.dateTime).toLocaleString() : 'As Scheduled';
    const recipientEmail = booking.user.email;
    const recipientName = booking.user.name || 'Valued Attendee';

    // 2. HTML Email Content
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #620F3C; color: #F5E0EC; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #4A0A2C; border-radius: 14px; overflow: hidden; border: 1px solid rgba(245, 224, 236, 0.3); }
          .header { background: #620F3C; padding: 32px 20px; text-align: center; border-bottom: 3px solid #F5E0EC; }
          .header h1 { color: #F5E0EC; font-size: 26px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px; }
          .header p { color: #F5E0EC; font-size: 14px; margin: 0; font-weight: 500; }
          .body { padding: 30px; color: #F5E0EC; }
          .body p { color: #F5E0EC; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0; }
          .code-badge { background: #32061D; border: 2px dashed #F5E0EC; padding: 18px; text-align: center; border-radius: 10px; margin: 24px 0; }
          .code-title { color: #F5E0EC; font-size: 12px; text-transform: uppercase; font-weight: bold; margin-bottom: 6px; letter-spacing: 1px; }
          .code-value { color: #F5E0EC; font-size: 24px; font-weight: 800; letter-spacing: 3px; font-family: 'Courier New', monospace; }
          .grid { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .grid td { padding: 12px 0; border-bottom: 1px solid rgba(245, 224, 236, 0.2); font-size: 14px; }
          .label { color: #F5E0EC; opacity: 0.7; font-weight: bold; width: 38%; }
          .val { color: #F5E0EC; font-weight: 600; }
          .footer { background-color: #620F3C; padding: 20px; text-align: center; font-size: 12px; color: #F5E0EC; opacity: 0.8; border-top: 1px solid rgba(245, 224, 236, 0.2); }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Booking Confirmed!</h1>
            <p>Your official digital entry ticket is attached below</p>
          </div>
          <div class="body">
            <p>Hi <strong style="color: #F5E0EC;">${recipientName}</strong>,</p>
            <p>Thank you for booking with <strong style="color: #F5E0EC;">EventBook</strong>. Your transaction was verified successfully. Please find your ticket details below and the attached official PDF E-Ticket.</p>
            
            <div class="code-badge">
              <div class="code-title">Booking Confirmation Code</div>
              <div class="code-value">${booking.bookingCode}</div>
            </div>

            <table class="grid">
              <tr>
                <td class="label">Event Title:</td>
                <td class="val" style="color: #F5E0EC; font-size: 16px;"><strong>${eventTitle}</strong></td>
              </tr>
              <tr>
                <td class="label">Venue:</td>
                <td class="val">${venue}</td>
              </tr>
              <tr>
                <td class="label">Date & Time:</td>
                <td class="val">${dateTime}</td>
              </tr>
              <tr>
                <td class="label">Ticket Tier:</td>
                <td class="val" style="color: #F5E0EC;">${booking.tierName}</td>
              </tr>
              <tr>
                <td class="label">Quantity:</td>
                <td class="val">${booking.quantity} Ticket(s)</td>
              </tr>
              <tr>
                <td class="label">Total Paid:</td>
                <td class="val" style="color: #F5E0EC; font-size: 16px;"><strong>INR ₹${booking.totalAmount}</strong></td>
              </tr>
            </table>

            <p style="margin-top: 25px; font-size: 13px; color: #F5E0EC; background: #32061D; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #F5E0EC;">
              💡 <strong>Gate Instructions:</strong> Please present the attached PDF E-Ticket (printed or on mobile) at the venue entrance for fast-track QR scanning.
            </p>
          </div>
          <div class="footer">
            © 2026 EventBook Platform. All rights reserved. • High-Speed Cryptographic Ticketing Engine
          </div>
        </div>
      </body>
      </html>
    `;

    // 3. Send Email Options
    const mailOptions = {
      from: process.env.SMTP_FROM || '"EventBook Platform" <tickets@eventbook.com>',
      to: recipientEmail,
      subject: `🎟️ Your E-Ticket for ${eventTitle} [Code: ${booking.bookingCode}]`,
      html: htmlTemplate,
      attachments: [
        {
          filename: `EventTicket_${booking.bookingCode}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    const info = await mailTransporter.sendMail(mailOptions);
    const testUrl = nodemailer.getTestMessageUrl(info);

    console.log(`✅ E-Ticket Email dispatched to ${recipientEmail} (Msg ID: ${info.messageId})`);
    if (testUrl) {
      console.log(`🔗 Preview Ethereal Email: ${testUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: testUrl || null,
    };
  } catch (error) {
    console.error('❌ Error dispatching ticket email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendTicketEmail };
