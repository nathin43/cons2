# Quick Setup Guide - OTP Email Verification

## 1️⃣ Add Environment Variables

Create/update `.env` file in the `backend` folder:

```env
# Email Service Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

## 2️⃣ For Gmail Users

1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer"
3. Google generates a 16-character password
4. Copy this password to `EMAIL_PASS` in .env
5. Done!

## 3️⃣ Test the Flow

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "phone": "1234567890",
    "address": {
      "street": "123 Main St",
      "city": "City",
      "state": "State",
      "zipCode": "100001"
    }
  }'
```

Response:
```json
{
  "success": true,
  "message": "OTP sent to your email. Please verify to complete registration.",
  "email": "test@example.com"
}
```

### Verify OTP
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Email verified successfully. Account created!",
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "test@example.com",
    "isEmailVerified": true
  }
}
```

### Resend OTP
```bash
curl -X POST http://localhost:5000/api/auth/resend-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## 4️⃣ What Changed

| Component | Change |
|-----------|--------|
| Backend Model | Added: `isEmailVerified`, `otp`, `otpExpiry` fields |
| Auth Controller | Now 2-step: register → verify OTP |
| Auth Routes | New: `/verify-otp`, `/resend-otp` |
| Frontend Form | Now 2-step: fill form → enter OTP |
| Auth Context | New: `registerWithOTP()`, `verifyOTP()`, `resendOTP()` |

## 5️⃣ Key Points

✅ Users must verify email before account activation
✅ OTP sent to email (valid for 10 minutes)
✅ Only verified users can login
✅ Can resend OTP if needed
✅ Uses nodemailer for email delivery

## 6️⃣ Troubleshooting

**Email not sending?**
- Check EMAIL_USER and EMAIL_PASS are correct
- Gmail: Use app password from https://myaccount.google.com/apppasswords
- Check network connection

**OTP expired?**
- Valid for 10 minutes
- Click "Resend OTP" to get new one
- Change duration in `backend/utils/otpGenerator.js` line 10

**Can't login?**
- Make sure email is verified first
- Check `isEmailVerified` field in database

## 📚 More Information

- Full setup: `OTP_SETUP_GUIDE.md`
- Implementation details: `OTP_IMPLEMENTATION_SUMMARY.md`
- Email config: `backend/EMAIL_CONFIG.md`

## 🚀 You're Ready!

Start your backend and frontend servers and test the registration flow!
