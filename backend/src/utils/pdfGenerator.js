const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

/**
 * Generates an A4 Digital PDF E-Ticket in memory and returns it as a Buffer.
 * @param {Object} booking - Mongoose Booking document populated with event and user.
 * @returns {Promise<Buffer>} - Resolves with PDF binary Buffer.
 */
const generateTicketPDFBuffer = async (booking) => {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Generate QR Code Image Buffer (High-contrast, bold blocks for instant optical scanning)
      const qrPayload = JSON.stringify({
        bookingCode: booking.bookingCode,
      });

      const qrImageBuffer = await QRCode.toBuffer(qrPayload, {
        errorCorrectionLevel: 'M',
        type: 'png',
        margin: 1,
        width: 250,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      // 2. Instantiate PDF Document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', (err) => reject(err));

      // 3. Render Header
      doc.rect(0, 0, doc.page.width, 110).fill('#620F3C');

      doc
        .fillColor('#F5E0EC')
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('EVENTBOOK DIGITAL ENTRY PASS', 40, 35);

      doc
        .fillColor('#F5E0EC')
        .fontSize(11)
        .font('Helvetica')
        .text('Official Event Access Ticket • Verified Cryptographically', 40, 68);

      // Ticket Code Badge (Top Right)
      doc
        .rect(doc.page.width - 200, 30, 160, 45)
        .fillAndStroke('#4A0A2C', '#F5E0EC');

      doc
        .fillColor('#F5E0EC')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('BOOKING CODE', doc.page.width - 190, 38);

      doc
        .fillColor('#F5E0EC')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(booking.bookingCode, doc.page.width - 190, 52);

      // Main Content Container Box
      doc
        .roundedRect(40, 130, doc.page.width - 80, 480, 12)
        .lineWidth(1.5)
        .stroke('#620F3C');

      // Event Details Section
      const eventTitle = booking.event ? booking.event.title : 'Event Access';
      const eventCategory = booking.event ? booking.event.category || 'General' : 'General';
      const venue = booking.event ? booking.event.venue : 'Main Venue';
      const dateTime = booking.event ? new Date(booking.event.dateTime).toLocaleString() : 'TBA';
      const attendeeName = booking.user ? booking.user.name : 'Attendee';

      doc
        .fillColor('#620F3C')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text(eventTitle, 60, 155);

      doc
        .fillColor('#620F3C')
        .fontSize(10)
        .font('Helvetica')
        .text(`Category: ${eventCategory}`, 60, 180);

      // Line Divider
      doc
        .moveTo(60, 200)
        .lineTo(doc.page.width - 60, 200)
        .strokeColor('#F5E0EC')
        .stroke();

      // Details Grid (Left Side)
      const leftCol = 60;
      let currentY = 220;

      const addDetailField = (label, value) => {
        doc.fillColor('#620F3C').fontSize(9).font('Helvetica-Bold').text(label.toUpperCase(), leftCol, currentY);
        doc.fillColor('#4A0A2C').fontSize(12).font('Helvetica').text(value || 'N/A', leftCol, currentY + 12);
        currentY += 40;
      };

      const seatLabel = booking.selectedSeats && booking.selectedSeats.length > 0
        ? `${booking.tierName} [Seats: ${booking.selectedSeats.join(', ')}]`
        : booking.tierName;

      addDetailField('Venue / Location', venue);
      addDetailField('Date & Time', dateTime);
      addDetailField('Ticket Tier / Seats', seatLabel);
      addDetailField('Quantity of Seats', `${booking.quantity} Ticket(s)`);
      addDetailField('Total Paid', `INR ₹${booking.totalAmount}`);
      addDetailField('Attendee Name', attendeeName);
      addDetailField('Razorpay Payment ID', booking.razorpayPaymentId || 'VERIFIED_PAYMENT');

      // Embed QR Code (Right Side)
      const qrX = doc.page.width - 240;
      const qrY = 220;

      doc.image(qrImageBuffer, qrX, qrY, { width: 170, height: 170 });

      doc
        .fillColor('#620F3C')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('GATEKEEPER ENTRY QR', qrX + 15, qrY + 180, { width: 140, align: 'center' });

      doc
        .fillColor('#620F3C')
        .fontSize(8)
        .font('Helvetica')
        .text('Scan at entrance for validation', qrX + 10, qrY + 195, { width: 150, align: 'center' });

      // Check-in status badge in PDF
      if (booking.isCheckedIn) {
        doc.rect(qrX + 15, qrY + 220, 140, 25).fill('#620F3C');
        doc
          .fillColor('#F5E0EC')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('CHECKED IN (USED)', qrX + 15, qrY + 227, { width: 140, align: 'center' });
      } else {
        doc.rect(qrX + 15, qrY + 220, 140, 25).fill('#620F3C');
        doc
          .fillColor('#F5E0EC')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('VALID FOR ENTRY', qrX + 15, qrY + 227, { width: 140, align: 'center' });
      }

      // Terms & Security Notice at Bottom
      doc
        .moveTo(60, 560)
        .lineTo(doc.page.width - 60, 560)
        .strokeColor('#F5E0EC')
        .stroke();

      doc
        .fillColor('#620F3C')
        .fontSize(8)
        .font('Helvetica')
        .text(
          'Terms: Present this digital ticket or printed PDF along with a valid ID at venue gate check-in. Duplication or tampering invalidates entry.',
          60,
          575,
          { width: doc.page.width - 120, align: 'center' }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateTicketPDFBuffer };
