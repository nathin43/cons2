# Google OAuth Setup Guide

## Overview
This guide explains how to set up Google OAuth login/registration for your Electric Shop application.

## Prerequisites
- Google Account
- Google Cloud Project

## Step-by-Step Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click the project dropdown at the top
3. Click "NEW PROJECT"
4. Enter project name: "Electric Shop"
5. Click "CREATE"
6. Wait for project to be created

### 2. Enable Google+ API
1. Go to [APIs & Services](https://console.cloud.google.com/apis/dashboard)
2. Click "ENABLE APIS AND SERVICES"
3. Search for "Google+ API"
4. Click on it and click "ENABLE"

### 3. Create OAuth Consent Screen
1. Go to [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
2. Select "External" for User Type
3. Click "CREATE"
4. Fill in the form:
   - **App name**: Electric Shop
   - **User support email**: your-email@gmail.com
   - **Developer contact**: your-email@gmail.com
5. Click "SAVE AND CONTINUE"
6. Skip scopes (click "SAVE AND CONTINUE")
7. Skip test users (click "SAVE AND CONTINUE")
8. Review and click "BACK TO DASHBOARD"

### 4. Create OAuth 2.0 Credentials
1. Go to [Credentials](https://console.cloud.google.com/apis/credentials)
2. Click "CREATE CREDENTIALS" → "OAuth client ID"
3. Select "Web application"
4. Under "Authorized JavaScript origins" add:
   - `http://localhost:5173` (for local development)
   - `http://localhost:3000` (if using port 3000)
   - `https://yourdomain.com` (for production)
5. Under "Authorized redirect URIs" add:
   - `http://localhost:5173/` (for local development)
   - `https://yourdomain.com/` (for production)
6. Click "CREATE"
7. Copy the **Client ID** (you'll need this)

### 5. Add to Frontend Environment Variables

Create or update `.env.local` in the `frontend` folder:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id-from-google-cloud
```

Replace `your-client-id-from-google-cloud` with the Client ID you copied above.

### 6. Add to Backend Environment Variables

Add to `.env` in the `backend` folder:

```env
GOOGLE_CLIENT_ID=your-client-id-from-google-cloud
```

Must be the same Client ID as frontend.

## Testing Google OAuth

### Test Google Login
1. Start your frontend server
2. Go to Login page
3. Click the Google login button
4. Select a Google account to test with
5. You should be logged in automatically

### Test Google Registration
1. Go to Register page
2. Click "or sign up with Google"
3. Select a Google account
4. Account should be created and you should be logged in

## How It Works

### Frontend Flow
1. User clicks Google button
2. Google OAuth popup appears
3. User selects/logs in with Google account
4. Frontend receives ID token from Google
5. Frontend sends token to backend API
6. Backend verifies token and logs user in

### Backend Flow
1. Receives ID token from frontend
2. Verifies token with Google
3. Extracts user info (email, name)
4. Checks if user exists in database
5. If new user: creates account automatically
6. If existing user: logs them in
7. Returns JWT token to frontend
8. Frontend stores token and redirects to home

## User Experience

### First Time Google Login
- No OTP needed for Google accounts
- Email is auto-verified (Google verifies it)
- Account created automatically
- Logged in immediately

### Already Has Account
- Can login with Google
- Email verification status updated
- Logged in immediately

## Troubleshooting

### Google Button Not Appearing
- Check `VITE_GOOGLE_CLIENT_ID` is set in `.env.local`
- Restart frontend server after adding env variable
- Check browser console for errors

### "Invalid Client ID" Error
- Verify Client ID is correct
- Check localhost URL is in authorized origins
- Ensure `GOOGLE_CLIENT_ID` matches in backend `.env`

### User Auto-Created on First Login
- This is expected behavior
- Google-logged users don't need OTP
- Email is verified automatically

### Login Fails with 401 Error
- Check backend `.env` has correct `GOOGLE_CLIENT_ID`
- Verify `google-auth-library` is installed
- Restart backend server

## Security Notes

✅ **Do NOT** commit `.env` or `.env.local` files to Git
✅ **Do NOT** share your Client Secret (we only use Client ID)
✅ Tokens are verified with Google servers
✅ User data is encrypted in database
✅ Sessions use secure JWT tokens

## Environment-Specific URLs

### Local Development
```
Frontend: http://localhost:5173
Backend: http://localhost:5000
```

### Production
Replace `yourdomain.com` with your actual domain:
```
Frontend: https://yourdomain.com
Backend: https://api.yourdomain.com
```

Update these URLs in:
1. Google Cloud Console credentials
2. `.env.local` (frontend)
3. `.env` (backend)

## File Changes

### Files Modified
- `frontend/src/pages/customer/Login.jsx` - Added Google button
- `frontend/src/pages/customer/Register.jsx` - Added Google button
- `frontend/src/context/AuthContext.jsx` - Added `loginWithGoogle()` method
- `backend/routes/authRoutes.js` - Added Google OAuth endpoint

### Files Created
- `backend/controllers/googleAuthController.js` - Google authentication logic

### Packages Installed
- `@react-oauth/google` (frontend)
- `google-auth-library` (backend)

## Next Steps

1. Create Google Cloud Project
2. Get Client ID
3. Add to `.env.local` and `.env`
4. Restart both servers
5. Test login and registration

## Support

For more information:
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [React Google Login](https://www.npmjs.com/package/@react-oauth/google)
- [Google Auth Library](https://www.npmjs.com/package/google-auth-library)
