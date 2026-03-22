# Reports Not Showing - Fix Guide

## Problem
Reports are not appearing in the user reports page.

## Diagnosis Results
✅ Backend API is working correctly
✅ Database has 1 report message
✅ Routes are properly configured
⚠️ Message is already marked as READ

## Root Causes & Solutions

### 1. Login with Correct User
The report message belongs to user:
- **Email:** mrsolking676@gmail.com
- **Name:** sadha

**Action:** Login with this user account to see the reports.

### 2. Message is Already Read
The existing message in the database is marked as `isRead: true`, so if the frontend filters for unread messages only, it won't show.

**Action:** Clear the "Unread Only" filter if enabled on the frontend.

### 3. Backend Server Must Be Running
**Check if server is running:**
```bash
cd backend
npm start
# or
node server.js
```

Server should be running on port 5000 (or your configured port).

### 4. Create More Test Messages
To test properly, send new report messages from the admin panel.

**Steps:**
1. Login as Admin
2. Go to Admin Dashboard → Reports
3. Select "Send Report Message"
4. Choose user: sadha (mrsolking676@gmail.com)
5. Fill in message details and send

## API Endpoints (For Testing)

### Get User's Report Messages
```
GET /api/user/reports/messages
Headers: Authorization: Bearer <user_token>
```

### Expected Response:
```json
{
  "success": true,
  "count": 1,
  "totalMessages": 1,
  "unreadCount": 0,
  "messages": [
    {
      "_id": "...",
      "subject": "...",
      "message": "...",
      "status": "Issue",
      "isRead": true,
      "createdAt": "2026-02-19T04:31:39.836Z",
      "sentBy": {
        "name": "Mani Electrical Admin",
        "email": "..."
      }
    }
  ]
}
```

## Frontend Debugging Steps

1. **Open Browser DevTools** (F12)
2. **Check Console** for errors
3. **Go to Network Tab**
4. **Navigate to User Reports page**
5. **Look for API call** to `/api/user/reports/messages`
6. **Check Response:**
   - If 401: Authentication issue (login again)
   - If 404: Backend server not running
   - If 200: Check response data

## Quick Test Command

Run this to verify database state:
```bash
cd backend
node test-user-reports-api.js
```

## Create Test Messages Script

```bash
cd backend
node
