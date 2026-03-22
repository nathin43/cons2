# SERVICE PAGE USER FLOW

## What Users See on Services Page

### Services List View (`/services`)

**Grid Layout** showing all 13 services:

```
┌─────────────────────┬─────────────────────┬─────────────────────┐
│   Service Card      │   Service Card      │   Service Card      │
├─────────────────────┼─────────────────────┼─────────────────────┤
│                     │                     │                     │
│  Service Image      │  Service Image      │  Service Image      │
│  [Placeholder]      │  [Placeholder]      │  [Placeholder]      │
│                     │                     │                     │
├─────────────────────┼─────────────────────┼─────────────────────┤
│ Light Fitting       │ Fan Installation    │ Socket & Switch     │
│ Installation        │ & Repair            │ Installation        │
│                     │                     │                     │
│ Professional        │ Expert installation │ Installation of     │
│ installation of     │ and repair...       │ electrical sockets..│
│ ceiling lights,     │                     │                     │
│ wall lights...      │ Price: $200         │ Price: $150         │
│                     │ Duration: 1-2 hrs   │ Duration: 30min-1hr │
│ Price: $250         │                     │                     │
│ Duration: 30min-1hr │ [View Details]      │ [View Details]      │
│                     │                     │                     │
│ [View Details]      │                     │                     │
└─────────────────────┴─────────────────────┴─────────────────────┘
```

Each card shows:
- Service image
- Service name
- Short description (truncated to 2 lines)
- Price
- Duration
- "View Details" button

---

## Service Details Page (`/service/:serviceId`)

When user clicks "View Details":

```
═══════════════════════════════════════════════════════════════

                    [← Back to Services]

═══════════════════════════════════════════════════════════════

┌─────────────────────────────────┬──────────────────────────┐
│                                 │                          │
│       Service Image             │   💡 Light Fitting       │
│                                 │   Installation           │
│    [Large Preview]              │                          │
│    400x300 pixels               │   [$250] [30min - 1hr]   │
│                                 │                          │
│                                 │   Description:           │
│                                 │   Expert installation    │
│                                 │   of ceiling lights...   │
│                                 │                          │
│                                 │   Features:              │
│                                 │   ✓ Ceiling light        │
│                                 │   ✓ Pendant light        │
│                                 │   ✓ Wall sconce          │
│                                 │   ✓ Chandelier mounting  │
│                                 │   ✓ Recessed lighting    │
│                                 │   ✓ Dimmer switch        │
│                                 │   ✓ LED integration      │
│                                 │                          │
│                                 │   [Book Service]         │
│                                 │   [Send Inquiry]         │
└─────────────────────────────────┴──────────────────────────┘

═══════════════════════════════════════════════════════════════
```

Full details include:
- Large service image
- Service name & icon
- Full description
- Price badge
- Duration badge
- Complete feature list
- "Book Service" button
- "Send Inquiry" button (links to contact page)

---

## Available Services with Details

### 1. **⚡ Electrical Installation** - $500
- Duration: 2-4 hours
- For: Complete electrical setup for new construction
- Features: Wiring, circuit breaker, cable management, load management, energy efficient solutions, safety inspection

### 2. **🔌 Wiring & Rewiring** - $400
- Duration: 1-3 days
- For: New or old house electrical wiring
- Features: Copper wire, wall chasing, conduit pipe, replacement, underground wiring, waterproof solutions

### 3. **💡 Light Fitting Installation** - $250
- Duration: 30 minutes - 1 hour
- For: All types of lighting fixtures
- Features: Ceiling, pendant, wall lights, chandeliers, recessed, dimmers, LED integration

### 4. **🌀 Fan Installation & Repair** - $200
- Duration: 1-2 hours
- For: Ceiling fans and exhaust fans
- Features: Mounting, repair, speed controller, blade balancing, maintenance plans

### 5. **🔲 Socket & Switch Installation** - $150
- Duration: 30 minutes - 1 hour
- For: Electrical outlets and switches
- Features: Standard sockets, GFCI outlets, smart switches, USB outlets, safety certification

### 6. **🔧 Electrical Maintenance** - $300
- Duration: 1-2 hours
- For: Regular safety check-ups
- Features: Safety inspection, voltage testing, circuit testing, earthing check, maintenance contracts

### 7. **⚙️ MCB & Earthing Installation** - $350
- Duration: 2-3 hours
- For: Safety systems
- Features: MCB installation, earthing rod, grounding, lightning arrestor, safety certification

### 8. **❄️ AC Panel Installation** - $600
- Duration: 3-4 hours
- For: Air conditioner setup
- Features: Indoor/outdoor mounting, refrigerant lines, dedicated circuit, power stabilizer, warranty

### 9. **🔥 Water Heater Installation** - $350
- Duration: 1-2 hours
- For: Electric water heater setup
- Features: Mounting, electrical connection, thermostat, safety valve, proper grounding, leakage protection

### 10. **🔍 Electrical Troubleshooting** - $200
- Duration: 30 minutes - 2 hours
- For: Emergency electrical problems
- Features: Fault diagnosis, short circuit detection, appliance troubleshooting, 24/7 service

### 11. **🎬 Home Theater Wiring** - $450
- Duration: 2-3 hours
- For: Entertainment system installation
- Features: Speaker wiring, HDMI routing, power distribution, concealed wiring, audio optimization

### 12. **☀️ Solar Panel Installation** - $5000
- Duration: 1-2 days
- For: Renewable energy setup
- Features: Solar mounting, inverter, battery, grid connection, warranty, maintenance

### 13. **🚨 Emergency Lighting System** - $800
- Duration: 3-4 hours
- For: Backup lighting during power outages
- Features: Battery backup, emergency lights, automatic switchover, UPS system, maintenance

---

## User Interaction Flow

1. **Browse Services** → `/services`
   - See all services in grid layout
   - Hover to see more details
   - See price and duration

2. **View Details** → `/service/:serviceId`
   - Click "View Details" button
   - See full service description
   - View all features
   - See pricing

3. **Take Action**
   - **Book Service** → Goes to booking page (can be extended)
   - **Send Inquiry** → Goes to `/contact` page
   - **Back** → Return to services list

---

## To Load Services Into Database

Run in backend folder:
```bash
npm run seed:services
```

This loads all 13 services with:
- Names & descriptions
- Features list
- Pricing
- Duration estimates
- Icons & images
- Status (active/inactive)

---

## Customization Options

You can modify services by:
1. Editing `seed-services.js` file
2. Adding new services to the array
3. Running `npm run seed:services` again
4. Services automatically appear on the page

Example adding new service:
```javascript
{
  name: 'Generator Installation',
  description: 'Professional generator setup...',
  icon: '⚡',
  image: 'url...',
  features: [...],
  price: 800,
  duration: '2 hours',
  status: 'active'
}
```
