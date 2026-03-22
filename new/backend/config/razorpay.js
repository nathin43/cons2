const Razorpay = require('razorpay');

/**
 * Razorpay Instance — lazy getter
 *
 * We do NOT initialize at require() time so that the backend server
 * can start and serve other routes even if Razorpay keys are not yet set.
 * The keys are validated the first time a Razorpay route is hit, giving
 * a clear 500 error with an actionable message instead of crashing.
 */
let _instance = null;

const getRazorpay = () => {
  const keyId     = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    throw new Error(
      'Razorpay keys are missing or empty. ' +
      'Open backend/.env and fill in RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET ' +
      'with your keys from https://dashboard.razorpay.com/app/keys'
    );
  }

  // Re-use the same instance across requests
  if (!_instance) {
    _instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  return _instance;
};

module.exports = getRazorpay;
