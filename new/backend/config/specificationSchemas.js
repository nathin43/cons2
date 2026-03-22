/**
 * Product Specification Schemas
 * Defines the specification structure for each product category
 */

const specificationSchemas = {
  'Lights': {
    icon: '💡',
    displayName: 'Lights',
    required: [
      { key: 'lightType', label: 'Light Type', type: 'select', options: ['LED', 'Tube Light', 'Bulb', 'Panel Light', 'Street Light'] },
      { key: 'wattage', label: 'Wattage (W)', type: 'number', placeholder: 'e.g., 12' },
      { key: 'colorTemperature', label: 'Color Temperature', type: 'select', options: ['Warm White (3000K)', 'Cool White (4000K)', 'Daylight (6500K)'] },
      { key: 'lumens', label: 'Lumens', type: 'number', placeholder: 'e.g., 800' }
    ],
    optional: [
      { key: 'warranty', label: 'Warranty', type: 'text', placeholder: 'e.g., 1 Year' },
      { key: 'voltage', label: 'Voltage', type: 'text', placeholder: 'e.g., 220V' }
    ]
  },
  'Fan': {
    icon: '🌀',
    displayName: 'Fan',
    required: [
      { key: 'bladeSize', label: 'Blade Size (inches)', type: 'number', placeholder: 'e.g., 48' },
      { key: 'sweep', label: 'Sweep (mm)', type: 'number', placeholder: 'e.g., 1200' },
      { key: 'speedRpm', label: 'Speed (RPM)', type: 'number', placeholder: 'e.g., 350' },
      { key: 'powerConsumption', label: 'Power Consumption (W)', type: 'number', placeholder: 'e.g., 75' },
      { key: 'mountType', label: 'Mount Type', type: 'select', options: ['Ceiling', 'Wall', 'Table', 'Pedestal', 'Exhaust'] }
    ],
    optional: [
      { key: 'warranty', label: 'Warranty', type: 'text', placeholder: 'e.g., 2 Years' }
    ]
  },
  'Pipes': {
    icon: '🚰',
    displayName: 'Pipes',
    required: [
      { key: 'diameter', label: 'Diameter (mm / inch)', type: 'text', placeholder: 'e.g., 25mm or 1 inch' },
      { key: 'length', label: 'Length (meters / feet)', type: 'text', placeholder: 'e.g., 3m or 10ft' },
      { key: 'material', label: 'Material', type: 'select', options: ['PVC', 'CPVC', 'UPVC', 'GI', 'PPR', 'HDPE'] },
      { key: 'pressureRating', label: 'Pressure Rating', type: 'select', options: ['Low Pressure', 'Medium Pressure', 'High Pressure', 'SDR 11', 'SDR 13.5'] }
    ],
    optional: [
      { key: 'usageType', label: 'Usage Type', type: 'select', options: ['Water Supply', 'Drainage', 'Sewage', 'Irrigation'] },
      { key: 'isiCertified', label: 'ISI Certified', type: 'select', options: ['Yes', 'No'] }
    ]
  },
  'Motors': {
    icon: '⚙️',
    displayName: 'Motors',
    required: [
      { key: 'powerHp', label: 'Power (HP)', type: 'text', placeholder: 'e.g., 1 HP' },
      { key: 'voltage', label: 'Voltage', type: 'text', placeholder: 'e.g., 220V' },
      { key: 'phase', label: 'Phase', type: 'select', options: ['Single Phase', 'Three Phase'] },
      { key: 'rpm', label: 'RPM', type: 'number', placeholder: 'e.g., 1440' },
      { key: 'insulationClass', label: 'Insulation Class', type: 'select', options: ['Class A', 'Class B', 'Class F', 'Class H'] }
    ],
    optional: [
      { key: 'warranty', label: 'Warranty', type: 'text', placeholder: 'e.g., 1 Year' }
    ]
  },
  'Heater': {
    icon: '🔥',
    displayName: 'Heater',
    required: [
      { key: 'powerWatt', label: 'Power (Watt)', type: 'number', placeholder: 'e.g., 2000' },
      { key: 'temperatureRange', label: 'Temperature Range', type: 'text', placeholder: 'e.g., 25-75°C' },
      { key: 'safetyFeatures', label: 'Safety Features', type: 'textarea', placeholder: 'e.g., Auto Cut-off, Thermostat, Pressure Relief Valve' }
    ],
    optional: [
      { key: 'warranty', label: 'Warranty', type: 'text', placeholder: 'e.g., 2 Years' },
      { key: 'capacityLiters', label: 'Capacity (Liters)', type: 'number', placeholder: 'e.g., 25' }
    ]
  },
  'Switches': {
    icon: '💡',
    displayName: 'Switches',
    required: [
      { key: 'switchType', label: 'Switch Type', type: 'select', options: ['Modular', 'Non-Modular', 'Dimmer', 'Touch'] },
      { key: 'currentRating', label: 'Current Rating', type: 'select', options: ['6A', '10A', '16A', '20A'] },
      { key: 'voltage', label: 'Voltage', type: 'text', placeholder: 'e.g., 220-240V' },
      { key: 'color', label: 'Color', type: 'text', placeholder: 'e.g., White' }
    ],
    optional: [
      { key: 'warranty', label: 'Warranty', type: 'text', placeholder: 'e.g., 2 Years' },
      { key: 'plateIncluded', label: 'Plate Included', type: 'select', options: ['Yes', 'No'] }
    ]
  },
  'Tank': {
    icon: '🛢️',
    displayName: 'Tank',
    required: [
      { key: 'capacityLiters', label: 'Capacity (Liters)', type: 'number', placeholder: 'e.g., 100' },
      { key: 'material', label: 'Material', type: 'select', options: ['Plastic', 'Steel', 'Fiber'] },
      { key: 'layers', label: 'Number of Layers', type: 'select', options: ['3', '4', '5'] },
      { key: 'height', label: 'Height', type: 'text', placeholder: 'e.g., 1.2m' },
      { key: 'diameter', label: 'Diameter', type: 'text', placeholder: 'e.g., 900mm' }
    ],
    optional: [
      { key: 'warranty', label: 'Warranty', type: 'text', placeholder: 'e.g., 5 Years' },
      { key: 'color', label: 'Color', type: 'text', placeholder: 'e.g., Black' }
    ]
  },
  'Wire & Cables': {
    icon: '🔌',
    displayName: 'Wire & Cables',
    required: [
      { key: 'coreType', label: 'Core Type', type: 'select', options: ['Single Core', 'Multi Core', 'Flexible', 'Armoured'] },
      { key: 'wireGauge', label: 'Wire Gauge (sq mm)', type: 'text', placeholder: 'e.g., 1.5 sq mm' },
      { key: 'length', label: 'Length (meters)', type: 'number', placeholder: 'e.g., 100' },
      { key: 'conductorMaterial', label: 'Conductor Material', type: 'select', options: ['Copper', 'Aluminum', 'Copper Clad Aluminum'] },
      { key: 'insulationType', label: 'Insulation Type', type: 'select', options: ['PVC', 'XLPE', 'Rubber', 'FRLS'] }
    ],
    optional: [
      { key: 'voltageRating', label: 'Voltage Rating', type: 'text', placeholder: 'e.g., 1100V' },
      { key: 'isiCertified', label: 'ISI Certified', type: 'select', options: ['Yes', 'No'] }
    ]
  },
  'Water Heater': {
    icon: '🚿',
    displayName: 'Water Heater',
    required: [
      { key: 'capacityLiters', label: 'Capacity (Liters)', type: 'number', placeholder: 'e.g., 25' },
      { key: 'powerWatt', label: 'Power (Watt)', type: 'number', placeholder: 'e.g., 2000' },
      { key: 'voltage', label: 'Voltage', type: 'text', placeholder: 'e.g., 220V' },
      { key: 'heatingElementType', label: 'Heating Element Type', type: 'text', placeholder: 'e.g., Copper' },
      { key: 'innerTankMaterial', label: 'Inner Tank Material', type: 'text', placeholder: 'e.g., Stainless Steel' }
    ],
    optional: [
      { key: 'warranty', label: 'Warranty', type: 'text', placeholder: 'e.g., 2 Years' }
    ]
  },
  'Other': {
    icon: '📦',
    displayName: 'Other',
    required: [],
    optional: [
      { key: 'specifications', label: 'Specifications', type: 'textarea', placeholder: 'Enter product specifications...' }
    ]
  }
};

/**
 * Get specification schema for a specific category
 * @param {string} category - Product category
 * @returns {object} Schema definition for the category
 */
const getSpecificationSchema = (category) => {
  return specificationSchemas[category] || specificationSchemas['Other'];
};

/**
 * Get all categories with specification schemas
 * @returns {array} Array of category names
 */
const getCategories = () => {
  return Object.keys(specificationSchemas);
};

/**
 * Validate specifications against schema
 * @param {string} category - Product category
 * @param {object} specifications - Specifications to validate
 * @returns {object} Validation result { valid: boolean, errors: array }
 */
const validateSpecifications = (category, specifications) => {
  const schema = getSpecificationSchema(category);
  const errors = [];

  // Check required fields
  schema.required.forEach(field => {
    const value = specifications[field.key];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      errors.push(`${field.label} is required`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Format specification value for display
 * @param {string} key - Specification key
 * @param {any} value - Specification value
 * @returns {string} Formatted value
 */
const formatSpecValue = (key, value) => {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }
  return String(value);
};

/**
 * Get human-readable label for specification key
 * @param {string} category - Product category
 * @param {string} key - Specification key
 * @returns {string} Human-readable label
 */
const getSpecLabel = (category, key) => {
  const schema = getSpecificationSchema(category);
  const allFields = [...schema.required, ...schema.optional];
  const field = allFields.find(f => f.key === key);
  
  return field ? field.label : key
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
};

module.exports = {
  specificationSchemas,
  getSpecificationSchema,
  getCategories,
  validateSpecifications,
  formatSpecValue,
  getSpecLabel
};
