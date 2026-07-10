const Pricing = require('../models/Pricing');
const Station = require('../models/Station');

// ─── Helper: get effective price for a connector at a given time ──
const calculateEffectivePrice = (pricing, connectorType, dateTime = new Date()) => {
  // Find connector-specific price
  const connectorPrice = pricing.connectorPrices?.find(
    c => c.connectorType?.toLowerCase() === connectorType?.toLowerCase()
  );
  let basePrice = connectorPrice?.pricePerUnit ?? pricing.basePricePerUnit;

  // Check peak hours
  const hours = dateTime.getHours();
  const minutes = dateTime.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  let peakMultiplier = 1;
  let activePeak = null;

  for (const peak of (pricing.peakHours || [])) {
    const [sh, sm] = peak.startTime.split(':').map(Number);
    const [eh, em] = peak.endTime.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;

    const inPeak = startMin <= endMin
      ? currentMinutes >= startMin && currentMinutes < endMin
      : currentMinutes >= startMin || currentMinutes < endMin; // overnight

    if (inPeak && peak.multiplier > peakMultiplier) {
      peakMultiplier = peak.multiplier;
      activePeak = peak;
    }
  }

  const effectivePrice = parseFloat((basePrice * peakMultiplier).toFixed(2));
  return { effectivePrice, basePrice, peakMultiplier, activePeak, sessionFee: pricing.sessionFee || 0, gstPercent: pricing.gstPercent || 18 };
};

// ─── PUBLIC: Get pricing for a station (used by Flutter app) ──────
const getStationPricing = async (req, res) => {
  try {
    const { stationId } = req.params;

    // First look for station-specific pricing
    let pricing = await Pricing.findOne({ scope: 'station', station: stationId, isActive: true });

    // Fallback to global
    if (!pricing) {
      pricing = await Pricing.findOne({ scope: 'global', isActive: true }).sort({ createdAt: -1 });
    }

    if (!pricing) {
      // Return default pricing if nothing configured
      return res.json({
        success: true,
        data: {
          basePricePerUnit: 18,
          connectorPrices: [],
          peakHours: [],
          sessionFee: 0,
          gstPercent: 18,
          minChargeAmount: 10,
          isDefault: true,
        }
      });
    }

    res.json({ success: true, data: pricing });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ─── PUBLIC: Calculate cost estimate ─────────────────────────────
const calculateCost = async (req, res) => {
  try {
    const { stationId, connectorType, energyKwh, scheduledTime } = req.body;

    let pricing = await Pricing.findOne({ scope: 'station', station: stationId, isActive: true });
    if (!pricing) pricing = await Pricing.findOne({ scope: 'global', isActive: true }).sort({ createdAt: -1 });

    if (!pricing) {
      const base = 18;
      const cost = parseFloat((energyKwh * base).toFixed(2));
      return res.json({ success: true, data: { pricePerUnit: base, subtotal: cost, gst: 0, sessionFee: 0, total: cost, peakMultiplier: 1 } });
    }

    const dateTime = scheduledTime ? new Date(`1970-01-01T${scheduledTime}:00`) : new Date();
    const { effectivePrice, peakMultiplier, activePeak, sessionFee, gstPercent } = calculateEffectivePrice(pricing, connectorType, dateTime);

    const subtotal = parseFloat((energyKwh * effectivePrice).toFixed(2));
    const gstAmount = parseFloat((subtotal * gstPercent / 100).toFixed(2));
    const total = parseFloat((subtotal + gstAmount + sessionFee).toFixed(2));

    res.json({
      success: true,
      data: {
        pricePerUnit: effectivePrice,
        basePricePerUnit: pricing.basePricePerUnit,
        peakMultiplier,
        activePeak: activePeak?.label || null,
        subtotal,
        gstPercent,
        gstAmount,
        sessionFee,
        total,
        minChargeAmount: pricing.minChargeAmount,
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ─── PUBLIC: Get global pricing (for app display) ─────────────────
const getGlobalPricing = async (req, res) => {
  try {
    const pricing = await Pricing.findOne({ scope: 'global', isActive: true }).sort({ createdAt: -1 });
    if (!pricing) return res.json({ success: true, data: { basePricePerUnit: 18, connectorPrices: [], peakHours: [], sessionFee: 0, gstPercent: 18, isDefault: true } });
    res.json({ success: true, data: pricing });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ─── ADMIN: Get all pricing configs ──────────────────────────────
const getAllPricing = async (req, res) => {
  try {
    const pricings = await Pricing.find()
      .populate('station', 'name city location')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: pricings, total: pricings.length });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ─── ADMIN: Create pricing ────────────────────────────────────────
const createPricing = async (req, res) => {
  try {
    const { scope, stationId, name, description, basePricePerUnit, connectorPrices, peakHours, sessionFee, gstPercent, minChargeAmount } = req.body;

    // If global, deactivate old global
    if (scope === 'global') {
      await Pricing.updateMany({ scope: 'global' }, { isActive: false });
    }
    // If station-specific, deactivate old for same station
    if (scope === 'station' && stationId) {
      await Pricing.updateMany({ scope: 'station', station: stationId }, { isActive: false });
    }

    const pricing = await Pricing.create({
      scope: scope || 'global',
      station: stationId || null,
      name,
      description: description || '',
      basePricePerUnit,
      connectorPrices: connectorPrices || [],
      peakHours: peakHours || [],
      sessionFee: sessionFee || 0,
      gstPercent: gstPercent ?? 18,
      minChargeAmount: minChargeAmount || 10,
      isActive: true,
      createdBy: req.admin?._id,
    });

    const populated = await Pricing.findById(pricing._id).populate('station', 'name city');
    res.status(201).json({ success: true, data: populated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ─── ADMIN: Update pricing ────────────────────────────────────────
const updatePricing = async (req, res) => {
  try {
    const pricing = await Pricing.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('station', 'name city');
    if (!pricing) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: pricing });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ─── ADMIN: Delete pricing ────────────────────────────────────────
const deletePricing = async (req, res) => {
  try {
    await Pricing.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ─── ADMIN: Toggle active ─────────────────────────────────────────
const togglePricing = async (req, res) => {
  try {
    const pricing = await Pricing.findById(req.params.id);
    if (!pricing) return res.status(404).json({ success: false, message: 'Not found' });
    pricing.isActive = !pricing.isActive;
    await pricing.save();
    res.json({ success: true, data: pricing });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getStationPricing, calculateCost, getGlobalPricing, getAllPricing, createPricing, updatePricing, deletePricing, togglePricing, calculateEffectivePrice };
