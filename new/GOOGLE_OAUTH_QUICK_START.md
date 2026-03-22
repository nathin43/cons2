# Google OAuth - Quick Setup (5 Minutes)

## 1️⃣ Get Google Client ID (2 minutes)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Go to [APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
4. Click "CREATE CREDENTIALS" → "OAuth client ID"
5. Choose "Web application"
6. Add to "Authorized JavaScript origins":
   - `http://localhost:5173`
7. Click CREATE and copy the **Client ID**

## 2️⃣ Add to Frontend (.env.local) (1 minute)
Create/update `frontend/.env.local`:
```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here
```

## 3️⃣ Add to Backend (.env) (1 minute)
Add to `backend/.env`:
```env
GOOGLE_CLIENT_ID=your-client-id-here
```

## 4️⃣ Restart Servers (1 minute)
Restart both frontend and backend servers to load new env variables.

## ✅ Done!
- Login page has "Continue with Google" button
- Register page has "Sign up with Google" button
- Click to test!

## What Happens Next

### First Time User Logs in with Google
✓ Account automatically created
✓ Email automatically verified (no OTP needed)
✓ Logged in immediately
✓ Redirected to home page

### Existing User Logs in with Google
✓ Email marked as verified if it wasn't
✓ Logged in with existing account
✓ Redirected to home page

## Testing

1. **Test Login**: Click Google button on Login page
2. **Test Register**: Click Google button on Register page
3. Both should work immediately

## Common Issues

| Issue | Solution |
|-------|----------|
| Google button not showing | Restart frontend server after adding `.env.local` |
| "Invalid Client ID" error | Check Client ID is correct in both `.env` files |
| Login fails with 401 | Check `GOOGLE_CLIENT_ID` matches in backend `.env` |
| Google popup blocked | Check browser popup blocker settings |

## For Production

Before deploying:
1. Add your domain to Google Cloud Console credentials:
   - Add to "Authorized JavaScript origins": `https://yourdomain.com`
   - Add to "Authorized redirect URIs": `https://yourdomain.com/`
2. Update `.env` files with production domain
3. Deploy frontend and backend

## Files Changed

✅ Backend:
- Added `controllers/googleAuthController.js` - Google OAuth logic
- Updated `routes/authRoutes.js` - Added `/auth/google` endpoint
- Updated `package.json` - Added `google-auth-library`

✅ Frontend:
- Updated `pages/customer/Login.jsx` - Added Google button
- Updated `pages/customer/Register.jsx` - Added Google button
- Updated `context/AuthContext.jsx` - Added `loginWithGoogle()` method
- Updated `package.json` - Added `@react-oauth/google`

## More Info
See [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md) for detailed setup instructions.
