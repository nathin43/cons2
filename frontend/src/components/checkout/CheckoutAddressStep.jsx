import { memo, useRef } from 'react';

const CheckoutAddressStep = ({
  formData,
  fieldErrors,
  onChange,
  loading,
  paymentProcessing,
  savedAddresses,
  selectedSavedAddressId,
  onSelectSavedAddress,
  onAddNewAddress,
  onUseCurrentLocation,
  locationLoading
}) => {
  const disabled = loading || paymentProcessing;
  const inputRefs = useRef({
    name: null,
    phone: null,
    pincode: null,
    city: null,
    houseNo: null,
    state: null
  });

  const setInputRef = (key) => (node) => {
    inputRefs.current[key] = node;
  };

  const focusField = (key) => {
    const field = inputRefs.current[key];
    if (field) field.focus();
  };

  const moveOnEnter = (nextField) => (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      focusField(nextField);
    }
  };

  const handlePhoneChange = (e) => {
    onChange(e);
    const digits = String(e.target.value || '').replace(/\D/g, '').slice(0, 10);
    if (digits.length === 10) focusField('pincode');
  };

  const handlePincodeChange = (e) => {
    onChange(e);
    const digits = String(e.target.value || '').replace(/\D/g, '').slice(0, 6);
    if (digits.length === 6) focusField('houseNo');
  };

  return (
    <div className="checkout-address-card">
      <div className="checkout-address-section">
        <p className="checkout-address-section-title">Contact Details</p>
        <button type="button" className="checkout-location-btn" onClick={onUseCurrentLocation} disabled={locationLoading}>
          {locationLoading ? 'Locating...' : 'Use Current Location'}
        </button>

        <div className="checkout-address-grid">
          <div className="checkout-field">
            <div className="checkout-float-input">
              <input
                ref={setInputRef('name')}
                id="checkout-name"
                type="text"
                name="name"
                placeholder=" "
                value={formData.name}
                onChange={onChange}
                onKeyDown={moveOnEnter('phone')}
                autoComplete="name"
                autoFocus
                className={fieldErrors.name ? 'is-invalid' : ''}
              />
              <label htmlFor="checkout-name">Full Name <span className="required">*</span></label>
            </div>
            {fieldErrors.name && <p className="checkout-inline-error">{fieldErrors.name}</p>}
          </div>

          <div className="checkout-field">
            <div className="checkout-float-input">
              <input
                ref={setInputRef('phone')}
                id="checkout-phone"
                type="tel"
                name="phone"
                placeholder=" "
                value={formData.phone}
                onChange={handlePhoneChange}
                onKeyDown={moveOnEnter('pincode')}
                inputMode="numeric"
                maxLength={10}
                autoComplete="tel"
                className={fieldErrors.phone ? 'is-invalid' : ''}
              />
              <label htmlFor="checkout-phone">Phone Number <span className="required">*</span></label>
            </div>
            {fieldErrors.phone && <p className="checkout-inline-error">{fieldErrors.phone}</p>}
          </div>
        </div>
      </div>

      <div className="checkout-address-divider" aria-hidden="true"></div>

      <div className="checkout-address-section">
        <p className="checkout-address-section-title">Address Details</p>
        <div className="checkout-address-grid">
          <div className="checkout-field checkout-field--full">
            <div className="checkout-float-input checkout-float-input--status">
              <input
                ref={setInputRef('pincode')}
                id="checkout-pincode"
                type="text"
                name="pincode"
                placeholder=" "
                value={formData.pincode}
                onChange={handlePincodeChange}
                onKeyDown={moveOnEnter('city')}
                inputMode="numeric"
                maxLength={6}
                autoComplete="postal-code"
                className={fieldErrors.pincode ? 'is-invalid' : ''}
              />
              <label htmlFor="checkout-pincode">Pincode <span className="required">*</span></label>
            </div>
            {fieldErrors.pincode && <p className="checkout-inline-error">{fieldErrors.pincode}</p>}
          </div>

          <div className="checkout-field checkout-field--full">
            <label htmlFor="checkout-house">Address <span className="required">*</span></label>
            <textarea
              ref={setInputRef('houseNo')}
              id="checkout-house"
              name="houseNo"
              value={formData.houseNo}
              onChange={onChange}
              autoComplete="street-address"
              className={`checkout-address-textarea ${fieldErrors.houseNo ? 'is-invalid' : ''}`}
            />
            {fieldErrors.houseNo && <p className="checkout-inline-error">{fieldErrors.houseNo}</p>}
          </div>

          <div className="checkout-field">
            <div className="checkout-float-input">
              <input
                ref={setInputRef('city')}
                id="checkout-city"
                type="text"
                name="city"
                placeholder=" "
                value={formData.city}
                onChange={onChange}
                onKeyDown={moveOnEnter('state')}
                autoComplete="address-level2"
                className={fieldErrors.city ? 'is-invalid' : ''}
              />
              <label htmlFor="checkout-city">City <span className="required">*</span></label>
            </div>
            {fieldErrors.city && <p className="checkout-inline-error">{fieldErrors.city}</p>}
          </div>

          <div className="checkout-field">
            <div className="checkout-float-input">
              <input
                ref={setInputRef('state')}
                id="checkout-state"
                type="text"
                name="state"
                placeholder=" "
                value={formData.state}
                onChange={onChange}
                autoComplete="address-level1"
                className={fieldErrors.state ? 'is-invalid' : ''}
              />
              <label htmlFor="checkout-state">State <span className="required">*</span></label>
            </div>
            {fieldErrors.state && <p className="checkout-inline-error">{fieldErrors.state}</p>}
          </div>
        </div>
      </div>

    </div>
  );
};

export default memo(CheckoutAddressStep);
