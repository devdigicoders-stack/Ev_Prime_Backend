const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const PDFDocument = require('pdfkit');

// Helper: generate invoice number
const generateInvoiceNumber = async () => {
  const count = await Invoice.countDocuments();
  const year = new Date().getFullYear();
  return `INV-${year}-${String(count + 1).padStart(5, '0')}`;
};

// Called internally when booking is marked Completed
const createInvoiceForBooking = async (booking) => {
  try {
    const existing = await Invoice.findOne({ booking: booking._id });
    if (existing) return existing;

    const populated = await Booking.findById(booking._id)
      .populate('user', 'name mobile email')
      .populate('station', 'name city address partner location');

    const base = populated.estimatedCost || 0;
    const gst = parseFloat((base * 0.18).toFixed(2));
    const total = parseFloat((base + gst).toFixed(2));

    const invoice = await Invoice.create({
      invoiceNumber: await generateInvoiceNumber(),
      booking: populated._id,
      user: populated.user._id,
      station: populated.station._id,
      userName: populated.user?.name || '',
      userMobile: populated.user?.mobile || '',
      userEmail: populated.user?.email || '',
      stationName: populated.station?.name || '',
      stationCity: populated.station?.city || '',
      stationAddress: populated.station?.address || populated.station?.location || '',
      stationPartner: populated.station?.partner || '',
      connectorType: populated.connectorType || '',
      connectorPower: populated.connectorPower || '',
      scheduledDate: populated.scheduledDate || '',
      scheduledTime: populated.scheduledTime || '',
      chargeUpTo: populated.chargeUpTo || 80,
      estimatedEnergy: populated.estimatedEnergy || 0,
      estimatedTime: populated.estimatedTime || 0,
      pricePerUnit: populated.pricePerUnit || 18,
      baseAmount: base,
      gstAmount: gst,
      totalAmount: total,
      paymentMethod: populated.paymentMethod || '',
      transactionId: populated.razorpayPaymentId || populated.bookingId || '',
      bookingId: populated.bookingId || '',
    });

    return invoice;
  } catch (err) {
    console.error('Invoice creation error:', err.message);
    return null;
  }
};

// @desc  Get invoice for a booking
// @route GET /api/invoice/:bookingId
// @access User
const getInvoice = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.bookingId, user: req.user._id });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    let invoice = await Invoice.findOne({ booking: booking._id });

    // Auto-generate if booking is completed and invoice doesn't exist
    if (!invoice && booking.status === 'Completed') {
      invoice = await createInvoiceForBooking(booking);
    }

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not available. Booking must be completed first.' });

    res.json({ success: true, data: invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Download invoice as PDF
// @route GET /api/invoice/:bookingId/pdf
// @access User
const getInvoicePdf = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.bookingId, user: req.user._id });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    let invoice = await Invoice.findOne({ booking: booking._id });
    if (!invoice && booking.status === 'Completed') {
      invoice = await createInvoiceForBooking(booking);
    }
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not available' });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    doc.pipe(res);

    // ── Header ──
    doc.fontSize(22).fillColor('#2E7D32').text('Bharat EV Prime', 50, 50);
    doc.fontSize(10).fillColor('#666').text('EV Charging Network', 50, 78);
    doc.fontSize(18).fillColor('#333').text('TAX INVOICE', 400, 50, { align: 'right' });
    doc.fontSize(10).fillColor('#666').text(`Invoice No: ${invoice.invoiceNumber}`, 400, 78, { align: 'right' });
    doc.text(`Date: ${new Date(invoice.generatedAt).toLocaleDateString('en-IN')}`, 400, 92, { align: 'right' });

    doc.moveTo(50, 115).lineTo(545, 115).strokeColor('#2E7D32').lineWidth(2).stroke();

    // ── Bill To ──
    doc.fontSize(11).fillColor('#333').text('Bill To:', 50, 130);
    doc.fontSize(10).fillColor('#555')
      .text(invoice.userName, 50, 148)
      .text(`Mobile: ${invoice.userMobile}`, 50, 163)
      .text(invoice.userEmail ? `Email: ${invoice.userEmail}` : '', 50, 178);

    // ── Station ──
    doc.fontSize(11).fillColor('#333').text('Charging Station:', 320, 130);
    doc.fontSize(10).fillColor('#555')
      .text(invoice.stationName, 320, 148)
      .text(invoice.stationCity, 320, 163)
      .text(`Partner: ${invoice.stationPartner}`, 320, 178);

    doc.moveTo(50, 205).lineTo(545, 205).strokeColor('#ddd').lineWidth(1).stroke();

    // ── Booking Details ──
    doc.fontSize(11).fillColor('#333').text('Booking Details', 50, 220);

    const details = [
      ['Booking ID', invoice.bookingId],
      ['Date', invoice.scheduledDate],
      ['Time Slot', invoice.scheduledTime],
      ['Connector Type', invoice.connectorType],
      ['Power', invoice.connectorPower || 'N/A'],
      ['Charge Upto', `${invoice.chargeUpTo}%`],
      ['Est. Energy', `${invoice.estimatedEnergy} kWh`],
      ['Est. Duration', `${invoice.estimatedTime} min`],
      ['Payment Method', invoice.paymentMethod === 'razorpay' ? 'Razorpay (Online)' : 'Wallet'],
      ['Transaction ID', invoice.transactionId || 'N/A'],
    ];

    let y = 240;
    details.forEach(([label, value]) => {
      doc.fontSize(10).fillColor('#666').text(label, 50, y);
      doc.fontSize(10).fillColor('#333').text(value, 250, y);
      y += 18;
    });

    doc.moveTo(50, y + 5).lineTo(545, y + 5).strokeColor('#ddd').lineWidth(1).stroke();
    y += 20;

    // ── Amount Breakdown ──
    doc.fontSize(11).fillColor('#333').text('Amount Breakdown', 50, y);
    y += 20;

    doc.fontSize(10).fillColor('#555').text('Base Charging Cost', 50, y);
    doc.text(`₹${invoice.baseAmount.toFixed(2)}`, 450, y, { align: 'right', width: 95 });
    y += 18;

    doc.text(`GST (18%)`, 50, y);
    doc.text(`₹${invoice.gstAmount.toFixed(2)}`, 450, y, { align: 'right', width: 95 });
    y += 18;

    doc.moveTo(50, y).lineTo(545, y).strokeColor('#ddd').lineWidth(1).stroke();
    y += 10;

    doc.fontSize(12).fillColor('#2E7D32').text('Total Amount Paid', 50, y);
    doc.fontSize(12).fillColor('#2E7D32').text(`₹${invoice.totalAmount.toFixed(2)}`, 450, y, { align: 'right', width: 95 });
    y += 30;

    doc.moveTo(50, y).lineTo(545, y).strokeColor('#2E7D32').lineWidth(2).stroke();
    y += 20;

    // ── Footer ──
    doc.fontSize(9).fillColor('#999')
      .text('This is a computer generated invoice and does not require a signature.', 50, y, { align: 'center', width: 495 })
      .text('Thank you for choosing Bharat EV Prime!', 50, y + 14, { align: 'center', width: 495 });

    doc.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get all invoices (admin)
// @route GET /api/invoice/admin/all
// @access Admin
const getAllInvoicesAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const invoices = await Invoice.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Invoice.countDocuments();
    res.json({ success: true, data: invoices, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getInvoice, getInvoicePdf, createInvoiceForBooking, getAllInvoicesAdmin };
