# SERVICE SETUP GUIDE

## Quick Start for Services

### Step 1: Load Service Data
Run this command in the backend folder to populate services:

```bash
npm run seed:services
```

This will load **13 professional electrical services** including:
- Electrical Installation
- Wiring & Rewiring
- Light Fitting Installation
- Fan Installation & Repair
- Socket & Switch Installation
- Electrical Maintenance
- MCB & Earthing Installation
- AC Panel Installation
- Water Heater Installation
- Electrical Troubleshooting
- Home Theater Wiring
- Solar Panel Installation
- Emergency Lighting System

### Step 2: Start Backend Server
```bash
npm run dev
```

### Step 3: Start Frontend
```bash
npm run dev
```
(in frontend folder)

### Step 4: Access Services
- Visit `http://localhost:3000/services`
- Browse all services with details
- Click on a service to see full details
- Click "Book Service" or "Send Inquiry"

---

## Service Details Shown to Users

Each service displays:
✅ Service Name & Description  
✅ Service Price  
✅ Estimated Duration  
✅ List of Features/Inclusions  
✅ Service Icon  
✅ Service Image  
✅ Book Service Button  
✅ Contact/Inquiry Button  

---

## Example Services

### Light Fitting Installation ($250)
- 30 minutes - 1 hour
- Features: Ceiling lights, pendant lights, wall lights, chandeliers, LED integration

### AC Panel Installation ($600)
- 3-4 hours
- Features: Indoor/outdoor unit mounting, electrical connections, stabilizer setup

### Electrical Installation ($500)
- 2-4 hours
- Features: Wiring, circuit breaker, cable management, energy-efficient solutions

---

## Admin Features

Admins can:
- Add new services
- Edit existing services
- Delete services
- View all service bookings
- Manage service availability

---

## User Actions

Customers can:
- View all services
- Filter by price
- See service details
- Book a service
- Send inquiry/question about service
- Track service booking

---

## Clear Services (if needed)
```bash
npm run seed:services -- -d
```

This removes all service data from database.
