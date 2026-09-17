const { generateTicketPDFBuffer } = require('../src/utils/pdfGenerator');
const { sendTicketEmail } = require('../src/utils/emailService');

describe('Utils Unit Tests: PDF Generator & Email Service', () => {
  describe('generateTicketPDFBuffer', () => {
    it('should generate a valid binary PDF buffer for a booking', async () => {
      const mockBooking = {
        bookingCode: 'EB-TEST12',
        tierName: 'VIP Platinum',
        quantity: 1,
        totalAmount: 499,
        selectedSeats: ['Row A - 12'],
        user: { name: 'Dev Tester', email: 'dev@test.com' },
        event: {
          title: 'Coldplay India Tour',
          venue: 'DY Patil Stadium, Mumbai',
          dateTime: new Date(Date.now() + 86400000),
          category: 'Concert',
        },
      };

      const buffer = await generateTicketPDFBuffer(mockBooking);

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(1000);
      // PDF documents always start with %PDF-
      const header = buffer.toString('utf8', 0, 5);
      expect(header).toBe('%PDF-');
    });
  });

  describe('sendTicketEmail', () => {
    it('should fail gracefully when booking or user email is missing', async () => {
      const result = await sendTicketEmail(null);
      expect(result.success).toBe(false);
      expect(result.reason).toMatch(/Missing recipient/i);

      const resultWithoutEmail = await sendTicketEmail({ user: {} });
      expect(resultWithoutEmail.success).toBe(false);
    });
  });
});
