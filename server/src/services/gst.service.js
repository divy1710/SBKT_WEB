const axios = require('axios');

// In-memory token cache to avoid authenticating on every request
let cachedToken = null;
let tokenExpiry = null; // Timestamp in milliseconds

/**
 * Dynamically authenticate with Sandbox API to get a temporary access token (valid 24h)
 * @param {string} apiKey 
 * @param {string} apiSecret 
 * @param {string} baseUrl 
 * @returns {Promise<string>} The access token
 */
const getAccessToken = async (apiKey, apiSecret, baseUrl) => {
  // If we have a cached token that isn't expiring in the next 5 minutes, return it
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry - 5 * 60 * 1000) {
    return cachedToken;
  }

  try {
    const response = await axios.post(`${baseUrl}/authenticate`, {}, {
      headers: {
        'x-api-key': apiKey,
        'x-api-secret': apiSecret,
        'x-api-version': '1.0',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    const token = response.data?.access_token;
    if (!token) {
      throw new Error('Authentication response did not contain access_token');
    }

    cachedToken = token;
    // Set token expiration to 23 hours from now (standard lifetime is 24 hours)
    tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
    return cachedToken;
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message;
    console.error('Sandbox Authentication failed:', errMsg);
    throw new Error(`Sandbox Authentication failed: ${errMsg}`);
  }
};

/**
 * Fetch GST details from Sandbox/Quicko API
 * @param {string} gstin 
 * @returns {Promise<Object>} Normalized GST details
 */
const fetchGSTDetails = async (gstin) => {
  const apiKey = process.env.GST_API_KEY?.trim().replace(/^["']|["']$/g, '');
  const apiSecret = process.env.GST_API_SECRET?.trim().replace(/^["']|["']$/g, '');
  const baseUrl = (process.env.GST_API_BASE_URL || 'https://api.sandbox.co.in')?.trim().replace(/^["']|["']$/g, '');

  if (!apiKey || !apiSecret) {
    throw new Error('GST API key or secret is missing in environment variables');
  }

  // Retrieve valid access token
  const token = await getAccessToken(apiKey, apiSecret, baseUrl);

  try {
    const response = await axios.post(`${baseUrl}/gst/compliance/public/gstin/search`, { gstin }, {
      headers: {
        'Authorization': token,
        'x-api-key': apiKey,
        'x-api-version': '1.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 seconds timeout
    });

    console.log("SANDBOX RAW RESPONSE DATA:", JSON.stringify(response.data, null, 2));

    let data = response.data?.data;
    if (data && data.data) {
      data = data.data;
    }
    
    if (!data) {
      throw new Error('Invalid response format from GST API');
    }

    // Highly robust and fallback-safe address extraction
    const addr = data.pradr?.addr || data.pradr || {};
    const bno = addr.bno || '';
    const buildingName = addr.bnm || '';
    const street = addr.st || '';
    const loc = addr.loc || '';
    const stateStr = addr.stcd || data.stateJurisdiction || '';
    const pincodeStr = addr.pncd || '';

    const addressParts = [bno, buildingName, street, loc, stateStr, pincodeStr].filter(Boolean);
    const addressStr = addressParts.join(', ') || data.pradr?.adr || '';

    return {
      companyName: data.tradeName || data.tradeNam || data.legalName || data.lgnm || '',
      legalName: data.legalName || data.lgnm || '',
      gstNumber: data.gstin || gstin,
      status: data.status || data.sts || 'Unknown',
      address: addressStr,
      state: stateStr,
      pincode: pincodeStr,
      registrationDate: data.rgdt,
      businessType: data.ctb
    };
  } catch (error) {
    if (error.response) {
      console.error('Sandbox API Error Response:', {
        status: error.response.status,
        data: error.response.data
      });
      // API responded with an error status (e.g., 404 for invalid GST, 429 for rate limit)
      if (error.response.status === 404) {
        throw new Error('GST Number not found or invalid');
      }
      if (error.response.status === 429) {
        throw new Error('GST API quota exceeded. Please try again later.');
      }
      throw new Error(error.response.data?.message || 'Failed to fetch GST details from provider');
    } else if (error.request) {
      console.error('Sandbox API Request Error (No Response):', error.message);
      // No response received (Network or timeout)
      throw new Error('Network error: Unable to reach GST API');
    } else {
      console.error('GST Service Error:', error.message);
      throw new Error(error.message);
    }
  }
};

module.exports = {
  fetchGSTDetails
};

