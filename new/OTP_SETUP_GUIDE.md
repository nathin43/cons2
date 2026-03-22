# OTP Email Verification Setup Guide

## Overview
This guide explains how to set up and use the OTP (One-Time Password) email verification system for customer registration.

## Backend Setup

### 1. Environment Variables
Add the following to your `.env` file:

```
# Email Configuration (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# OR for other email providers
# EMAIL_SERVICE=outlook
# EMAIL_USER=your-email@outlook.com
# EMAIL_PASS=your-password
```

### 2. Gmail Setup (Recommended)
If using Gmail:
1. Go to [Google Account Security](https://myaccount.google.com/apppasswords)
2. Select "Mail" and "Windows Computer" (or your device)
3. Google will generate a 16-character password
4. Use this password in `EMAIL_PASS`
5. **Important**: Enable "Less secure app access" or use App Passwords feature

### 3. Other Email Providers
- **Outlook**: Use your email and password
- **Custom SMTP**: Update `sendEmail.js` to include your SMTP host/port settings

## Frontend Setup

### 1. Update Environment Variables (if needed)
The frontend uses the same API endpoints. No additional configuration needed.

### 2. Styling
The OTP verification form uses existing CSS from `Login.css`. Custom OTP input styling is included inline.

## API Endpoints

### 1. Register (Step 1: Send OTP)
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "1234567890",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "100001",
    "country": "India"
  }
}

Response (200):
{
  "success": true,
  "message": "OTP sent to your email. Please verify to complete registration.",
  "email": "john@example.com"
}
```

### 2. Verify OTP (Step 2: Complete Registration)
```
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}

Response (200):
{
  "success": true,
  "message": "Email verified successfully. Account created!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "address": {...},
    "role": "customer",
    "isEmailVerified": true
  }
}
```

### 3. Resend OTP
```
POST /api/auth/resend-otp
Content-Type: application/json

{
  "email": "john@example.com"
}

Response (200):
{
  "success": true,
  "message": "OTP sent to your email"
}
```

### 4. Login (Only verified users can login)
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {...}
}
```

## Features

### ✓ OTP Verification Flow
- Users register with email and password
- OTP (6-digit) is sent to their email
- OTP expires in 10 minutes
- Users can resend OTP if needed
- After verification, account is activated

### ✓ Email Verification
- Only verified users can login
- Unverified users cannot access the platform
- Users can register again with same email if previous registration wasn't verified

### ✓ Security
- OTP is stored securely in database
- Passwords are hashed using bcryptjs
- OTP expires after 10 minutes
- Users get error messages for invalid/expired OTP

## Database Changes

### User Model Updates
New fields added to User schema:
- `isEmailVerified` (Boolean): Tracks email verification status
- `otp` (String): Stores the 6-digit OTP (not selected by default)
- `otpExpiry` (Date): Stores OTP expiration time

## Frontend Components

### Register.jsx Changes
- Two-step registration process
- Step 1: User fills registration form
- Step 2: User enters OTP
- OTP input with 6-digit formatting
- Back button to return to registration

### AuthContext.jsx Changes
New methods:
- `registerWithOTP(userData)`: Sends registration and OTP
- `verifyOTP(email, otp)`: Verifies OTP and creates account
- `resendOTP(email)`: Resends OTP to user

## Testing

### Test Registration Flow
1. Go to registration page
2. Fill all required fields
3. Click "Continue"
4. Check email for OTP
5. Enter OTP (6 digits)
6. Click "Verify OTP"
7. Redirected to home page

### Test OTP Resend
1. During Step 2, click "Resend OTP" (if implemented)
2. New OTP sent to email
3. Enter new OTP to verify

### Test Invalid OTP
1. Enter wrong OTP
2. Should see error message
3. Can try again

## Troubleshooting

### Email Not Sending
- Check `.env` file has correct email credentials
- Verify Gmail app password (if using Gmail)
- Check network connection
- Check email service provider isn't blocking requests

### OTP Expired
- OTP is valid for 10 minutes
- Click "Resend OTP" to get a new one
- Modify `getOTPExpiryTime()` in `otpGenerator.js` to change expiry duration

### Database Connection
- Ensure MongoDB is running
- Check connection string in `.env`
- New fields will be created automatically when user registers

## Future Enhancements

1. **Rate Limiting**: Limit OTP generation attempts per email
2. **Email Templates**: Use HTML email templates for better formatting
3. **SMS OTP**: Add SMS OTP as alternative verification method
4. **Two-Factor Authentication**: Add 2FA for additional security
5. **OTP History**: Track OTP verification history
6. **Email Confirmation**: Send confirmation email after successful registration

## Support
For issues or questions, check the `EMAIL_CONFIG.md` file in the backend folder.
