const { fetchGSTDetails } = require('../services/gst.service');

const getGSTDetails = async (req, res) => {
  try {
    const { gstin } = req.params;

    if (!gstin || typeof gstin !== 'string') {
      return res.status(400).json({ success: false, message: 'GST Number is required' });
    }

    // Basic regex validation for 15-character GSTIN
    // 2 digits (state), 10 char PAN, 1 entity num, Z, 1 checksum
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gstin)) {
      return res.status(400).json({ success: false, message: 'Invalid GST Number format' });
    }

    const gstData = await fetchGSTDetails(gstin);

    res.status(200).json({
      success: true,
      data: gstData
    });
  } catch (error) {
    console.error(`GST Fetch Error [${req.params.gstin}]:`, error.message);
    
    // Distinguish between 404/Bad Request vs Server Error
    if (error.message.includes('not found') || error.message.includes('invalid')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    
    if (error.message.includes('quota')) {
      return res.status(429).json({ success: false, message: error.message });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch GST details'
    });
  }
};

module.exports = {
  getGSTDetails
};
