/**
 * Lightbulb Icon Component
 * SVG icon for Mani Electrical branding
 */
const LightbulbIcon = ({ size = 28, color = "#ffffff" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Bulb circle */}
    <circle cx="12" cy="9" r="6" />
    
    {/* Lightning bolt inside */}
    <path d="M 12 4 L 14.5 8.5 L 11 8.5 L 13 13.5" />
    
    {/* Base of bulb */}
    <path d="M 10 15 L 10 17 C 10 17.5 10.2 18 10.5 18 L 13.5 18 C 13.8 18 14 17.5 14 17 L 14 15" />
    
    {/* Threads */}
    <line x1="9" y1="18" x2="15" y2="18" />
    <line x1="9" y1="19" x2="15" y2="19" />
    <line x1="9" y1="20" x2="15" y2="20" />
    
    {/* Light rays */}
    <line x1="12" y1="2" x2="12" y2="1" />
    <line x1="18" y1="9" x2="19" y2="9" />
    <line x1="6" y1="9" x2="5" y2="9" />
    <line x1="16.5" y1="4" x2="17.2" y2="3.3" />
    <line x1="7.5" y1="14" x2="6.8" y2="14.7" />
    <line x1="16.5" y1="14" x2="17.2" y2="14.7" />
    <line x1="7.5" y1="4" x2="6.8" y2="3.3" />
  </svg>
);

export default LightbulbIcon;
