# Phase 5 Implementation Guide: Digital PDF E-Tickets & Gatekeeper QR Check-In System

## 📌 Executive Overview

This document provides a comprehensive technical breakdown of **Phase 5** of the **Event Booking Platform**. This module handles digital ticketing, server-side PDF generation, embedded high-density QR codes, user PDF downloads, and an anti-fraud venue gatekeeper check-in scanner.

---

## 🏗️ System Architecture & Workflow

```
+-----------------------------------------------------------------------------------+
|                                EVENT BOOKING PLATFORM                             |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  1. User Buys Ticket (Razorpay Verified)                                           |
|     +-------------------------------------------------------------+               |
|     | Booking Status: "confirmed"                                 |               |
|     | bookingCode: "EB-FH15J6"                                    |               |
|     | isCheckedIn: false                                          |               |
|     +------------------------------+------------------------------+               |
|                                    |                                              |
|                                    v                                              |
|  2. User Requests Ticket Download (My Bookings)                                   |
|     +-------------------------------------------------------------+               |
|     | Client GET /api/bookings/:id/pdf                            |               |
|     +------------------------------+------------------------------+               |
|                                    |                                              |
|                                    v                                              |
|  3. Backend PDF Engine                                                            |
|     +-------------------------------------------------------------+               |
|     | QRCode.toBuffer() -> Generates PNG QR in memory              |               |
|     | PDFKit -> Renders A4 Ticket (Header, Code Badge, QR, Details)|               |
|     | Streams binary application/pdf -> Browser auto-downloads    |               |
|     +------------------------------+------------------------------+               |
|                                    |                                              |
|                                    v                                              |
|  4. Gatekeeper QR Scan at Venue Gate (Admin Dashboard)                            |
|     +-------------------------------------------------------------+               |
|     | POST /api/bookings/check-in with bookingCode "EB-FH15J6"    |               |
|     +------------------------------+------------------------------+               |
|                                    |                                              |
|                   +----------------+----------------+                             |
|                   |                                 |                             |
|                   v                                 v                             |
|       [1st Scan: Valid]                  [2nd Scan: Duplicate / Fake]             |
|  +---------------------------------+  +-----------------------------------------+ |
|  | isCheckedIn = true              |  | isCheckedIn == true                       | |
|  | checkedInAt = Timestamp         |  | REJECTED!                               | |
|  | 🎉 GREEN: ENTRY GRANTED!        |  | ⚠️ RED: DUPLICATE ENTRY ALERT           | |
|  +---------------------------------+  +-----------------------------------------+ |
+-----------------------------------------------------------------------------------+
```

---

## 📦 1. Dependencies Installed

Two core npm packages were added to the backend (`/backend`):

1. **`pdfkit`**: Node.js vector graphics and PDF document creation library.
2. **`qrcode`**: High-performance QR code generator used to encode ticket payloads into PNG buffers.

```bash
cd backend
npm install pdfkit qrcode
```

---

## 🗄️ 2. Database Schema Updates

### File: `backend/src/models/bookingModel.js`

We added three check-in tracking fields and a pre-save hook for automatic code generation:

```javascript
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    hold: { type: mongoose.Schema.Types.ObjectId, ref: 'SeatHold', required: true },
    tierId: { type: mongoose.Schema.Types.ObjectId, required: true },
    tierName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    totalAmount: { type: Number, required: true },
    bookingCode: { type: String, unique: true },
    razorpayOrderId: { type: String, required: true, index: true },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },

    // --- PHASE 5: GATE CHECK-IN TRACKING FIELDS ---
    isCheckedIn: {
      type: Boolean,
      default: false,
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Pre-save hook: Generates unique Booking Confirmation Code (e.g. EB-FH15J6)
bookingSchema.pre('save', function (next) {
  if (!this.bookingCode) {
    this.bookingCode = 'EB-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
```

---

## 📄 3. Backend Logic & PDF Engine

### File: `backend/src/controllers/ticketController.js`

Contains PDF ticket generation and Gatekeeper verification endpoints:

```javascript
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const Booking = require('../models/bookingModel');

/**
 * @desc    Generate & Stream downloadable PDF E-Ticket with embedded QR code
 * @route   GET /api/bookings/:id/pdf
 * @access  Private (User/Admin)
 */
const downloadTicketPDF = async (req, res, next) => {
  try {
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId)
      .populate('event', 'title venue dateTime category bannerImage')
      .populate('user', 'name email');

    if (!booking) {
      res.status(404);
      return next(new Error('Booking not found'));
    }

    // Auth & Status Checks
    if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      return next(new Error('Not authorized to access this ticket'));
    }

    if (booking.status !== 'confirmed') {
      res.status(400);
      return next(new Error(`Cannot generate PDF for unconfirmed booking`));
    }

    // 1. Generate QR Code Image Buffer
    const qrPayload = JSON.stringify({
      bookingCode: booking.bookingCode,
      bookingId: booking._id,
      eventId: booking.event._id,
      eventTitle: booking.event.title,
      userName: booking.user.name,
      tierName: booking.tierName,
      quantity: booking.quantity,
    });

    const qrImageBuffer = await QRCode.toBuffer(qrPayload, {
      errorCorrectionLevel: 'H',
      type: 'png',
      margin: 2,
      width: 200,
    });

    // 2. Instantiate PDF Document
    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="EventTicket_${booking.bookingCode}.pdf"`);

    doc.pipe(res);

    // 3. Render Header, Code Badge, Event Details & QR Code
    doc.rect(0, 0, doc.page.width, 110).fill('#0f172a');
    doc.fillColor('#ec4899').fontSize(24).font('Helvetica-Bold').text('EVENTBOOK DIGITAL ENTRY PASS', 40, 35);
    doc.fillColor('#94a3b8').fontSize(11).font('Helvetica').text('Official Event Access Ticket', 40, 68);

    doc.rect(doc.page.width - 200, 30, 160, 45).fillAndStroke('#1e1b4b', '#818cf8');
    doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text(booking.bookingCode, doc.page.width - 190, 52);

    doc.fillColor('#0f172a').fontSize(18).font('Helvetica-Bold').text(booking.event.title, 60, 155);
    doc.fillColor('#64748b').fontSize(10).font('Helvetica').text(`Category: ${booking.event.category || 'General'}`, 60, 180);

    // Write Details Grid
    const addDetailField = (label, value, y) => {
      doc.fillColor('#64748b').fontSize(9).font('Helvetica-Bold').text(label.toUpperCase(), 60, y);
      doc.fillColor('#0f172a').fontSize(12).font('Helvetica').text(value || 'N/A', 60, y + 12);
    };

    addDetailField('Venue / Location', booking.event.venue, 220);
    addDetailField('Date & Time', new Date(booking.event.dateTime).toLocaleString(), 260);
    addDetailField('Ticket Tier', booking.tierName, 300);
    addDetailField('Quantity', `${booking.quantity} Ticket(s)`, 340);
    addDetailField('Total Paid', `INR ₹${booking.totalAmount}`, 380);
    addDetailField('Attendee Name', booking.user.name, 420);

    // Embed QR Code
    doc.image(qrImageBuffer, doc.page.width - 240, 220, { width: 170, height: 170 });

    // Status Badge
    if (booking.isCheckedIn) {
      doc.rect(doc.page.width - 225, 440, 140, 25).fill('#dc2626');
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('CHECKED IN (USED)', doc.page.width - 225, 447, { width: 140, align: 'center' });
    } else {
      doc.rect(doc.page.width - 225, 440, 140, 25).fill('#059669');
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('VALID FOR ENTRY', doc.page.width - 225, 447, { width: 140, align: 'center' });
    }

    doc.end();
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Gatekeeper QR Code / Code Check-in Verification
 * @route   POST /api/bookings/check-in
 * @access  Private (Admin / Gatekeeper)
 */
const verifyAndCheckInTicket = async (req, res, next) => {
  try {
    const { bookingCode } = req.body;

    const booking = await Booking.findOne({ bookingCode: bookingCode.trim().toUpperCase() })
      .populate('event', 'title venue dateTime')
      .populate('user', 'name email');

    if (!booking) {
      res.status(404);
      return next(new Error('🛑 INVALID TICKET: Booking code not found.'));
    }

    if (booking.status !== 'confirmed') {
      res.status(400);
      return next(new Error(`⛔ ACCESS DENIED: Ticket status is "${booking.status}". Payment not completed.`));
    }

    // ANTI-FRAUD IDEMPOTENCY CHECK
    if (booking.isCheckedIn) {
      const formattedTime = new Date(booking.checkedInAt).toLocaleTimeString();
      res.status(400);
      return next(new Error(`⚠️ DUPLICATE ENTRY ALERT: Ticket was ALREADY CHECKED IN today at ${formattedTime}!`));
    }

    // Grant Entry
    booking.isCheckedIn = true;
    booking.checkedInAt = new Date();
    booking.checkedInBy = req.user.id;
    await booking.save();

    res.status(200).json({
      success: true,
      message: '🎉 ENTRY GRANTED! Ticket verified & attendee checked in successfully.',
      booking: {
        bookingCode: booking.bookingCode,
        attendeeName: booking.user.name,
        eventTitle: booking.event.title,
        tierName: booking.tierName,
        checkedInAt: booking.checkedInAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { downloadTicketPDF, verifyAndCheckInTicket };
```

---

## 🛣️ 4. API Routes & Server Mount

### File: `backend/src/routes/ticketRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { downloadTicketPDF, verifyAndCheckInTicket } = require('../controllers/ticketController');

router.get('/:id/pdf', authenticate, downloadTicketPDF);
router.post('/check-in', authenticate, authorize('admin'), verifyAndCheckInTicket);

module.exports = router;
```

### File: `backend/src/server.js`

```javascript
const ticketRoutes = require('./routes/ticketRoutes');
app.use('/api/bookings', ticketRoutes);
```

---

## 💻 5. Frontend PDF Downloader

### File: `frontend/src/pages/MyBookingsPage.jsx`

```javascript
const handleDownloadPDF = async (bookingId, bookingCode) => {
  try {
    setDownloadingId(bookingId);
    
    // Request PDF binary stream
    const response = await client.get(`/bookings/${bookingId}/pdf`, {
      responseType: 'blob',
    });

    // Trigger browser file download
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `EventTicket_${bookingCode}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
  } finally {
    setDownloadingId(null);
  }
};
```

---

## 🖥️ 6. Admin Gatekeeper Console

### File: `frontend/src/pages/AdminDashboard.jsx`

```javascript
const handleGatekeeperCheckIn = async (e) => {
  e.preventDefault();
  setCheckInLoading(true);

  try {
    const res = await client.post('/bookings/check-in', { bookingCode: checkInCode });
    setScanResult({
      status: 'SUCCESS',
      message: res.data.message,
      booking: res.data.booking,
    });
  } catch (err) {
    const errMsg = err.response?.data?.message;
    const isDuplicate = errMsg.includes('ALREADY CHECKED IN');
    setScanResult({
      status: isDuplicate ? 'DUPLICATE' : 'INVALID',
      message: errMsg,
    });
  } finally {
    setCheckInLoading(false);
  }
};
```

---

## 🧪 7. Automated Test Verification

### File: `backend/test_phase5_tickets.js`

```bash
cd backend
node test_phase5_tickets.js
```

### Verification Output:
```text
🚀 Phase 5: Starting Digital PDF Ticket & Gatekeeper QR Check-in Test...

1. User Authenticated: Phase5 User
   Admin Authenticated: Phase5 Admin
2. Target Event: "Tech Summit 2026" | Tier: "VIP" (₹200)
3. Seat Hold Response: Successfully held 1 seat(s) for 10 minutes
4. Razorpay Order Created: order_TXasi3qx8XVuS1 (20000 paise)
5. Payment Verified & Booking Confirmed! Code: EB-FH15J6

6. Requesting Digital PDF E-Ticket Stream from GET /api/bookings/:id/pdf ...
   Header Content-Type: application/pdf
   Header Content-Disposition: attachment; filename="EventTicket_EB-FH15J6.pdf"
   PDF Binary Buffer Size: 6111 bytes
   ✅ PDF E-Ticket Engine generated valid PDF document with embedded QR code!

7. Testing Gatekeeper Gate Check-In (Admin)...
   Gatekeeper Check-in Response: 🎉 ENTRY GRANTED! Ticket verified & attendee checked in successfully.
   Attendee: Phase5 User
   Checked In At: 2026-09-03T14:17:01.283Z
   ✅ FIRST GATE CHECK-IN PASSED PERFECTLY!

8. Testing Anti-Fraud Duplicate Check-In Prevention (Second scan with same code)...
   Duplicate Check-in Response: ⚠️ DUPLICATE ENTRY ALERT: Ticket was ALREADY CHECKED IN today at 7:47:01 pm!
   ✅ ANTI-FRAUD TEST PASSED: Duplicate entry attempt caught & blocked successfully!

🎉 ALL PHASE 5 DIGITAL PDF TICKET & GATEKEEPER QR CHECK-IN TESTS PASSED 100%!
```
