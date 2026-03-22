# Email Configuration for OTP
# Add these environment variables to your .env file

# Gmail SMTP Configuration (Recommended)
# Steps to enable Gmail:
# 1. Go to https://myaccount.google.com/apppasswords
# 2. Create an app password for Node.js application
# 3. Use the 16-character password below

EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# OR use your own Email Service Provider
# EMAIL_SERVICE=your-service (e.g., "outlook", "yahoo", "custom")
# EMAIL_USER=your-email@yourdomain.com
# EMAIL_PASS=your-password

# For Custom SMTP Server:
# EMAIL_HOST=smtp.yourdomain.com
# EMAIL_PORT=587
# EMAIL_SECURE=false (use true for port 465)
# EMAIL_USER=your-email@yourdomain.com
# EMAIL_PASS=your-password
