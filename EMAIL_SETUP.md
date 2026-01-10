# Email Setup Guide for ImageStudio

## Problem: OTP/Verification Emails Not Sending

If you're not receiving verification emails, it's because SMTP is not configured.

---

## Quick Fix for Development

In **development mode** (`NODE_ENV !== 'production'`), when SMTP is not configured:
- Users are **automatically verified** upon registration
- No email is sent, but the account is immediately active
- A message is shown indicating development mode

---

## Setting Up Gmail SMTP (Free)

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable "2-Step Verification"

### Step 2: Generate App Password
1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" as the app
3. Select your device type
4. Click "Generate"
5. **Copy the 16-character password** (format: xxxx xxxx xxxx xxxx)

### Step 3: Configure Environment Variables

Create or edit your `.env` file:

```env
# Email Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
```

**Important:** Use the App Password, NOT your regular Gmail password!

---

## Alternative: SendGrid (Free 100 emails/day)

### Step 1: Create SendGrid Account
1. Go to [sendgrid.com](https://sendgrid.com) and sign up
2. Verify your email

### Step 2: Create API Key
1. Go to Settings → API Keys
2. Click "Create API Key"
3. Choose "Full Access" or "Restricted Access"
4. Copy the API key

### Step 3: Configure Environment Variables

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxx
```

---

## Alternative: Mailgun (Free 5,000 emails/month for 3 months)

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
```

---

## Render.com Deployment

Add these environment variables in your Render dashboard:

1. Go to your service → Environment
2. Add the following:
   - `SMTP_HOST` = `smtp.gmail.com`
   - `SMTP_PORT` = `587`
   - `SMTP_USER` = `your-email@gmail.com`
   - `SMTP_PASS` = `your-app-password`

---

## Testing Email Locally

After configuring SMTP, test with:

```bash
node -e "
const { sendVerificationEmail } = require('./services/email');
sendVerificationEmail('test@example.com', '123456', 'testuser')
  .then(result => console.log(result))
  .catch(err => console.error(err));
"
```

---

## Troubleshooting

### "Authentication failed"
- Make sure you're using an **App Password**, not your regular password
- Verify 2FA is enabled on your Google account

### "ENOTFOUND" or "DNS Error"
- Check your internet connection
- Verify SMTP_HOST is correct

### "Rate limit exceeded"
- Gmail has a limit of ~500 emails/day
- Consider switching to SendGrid or Mailgun for production

### "Connection refused"
- Check if port 587 is blocked
- Try port 465 with `SMTP_SECURE=true`

---

## Development Mode Behavior

When `NODE_ENV !== 'production'` and SMTP is not configured:

1. User registers
2. Email send fails (no SMTP)
3. User is **auto-verified**
4. User receives a token and can log in immediately
5. Console shows: "Development mode: Auto-verified user due to missing SMTP config"

This allows you to test without configuring email.

---

## Production Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production`
- [ ] Configure SMTP environment variables
- [ ] Test email sending
- [ ] Verify emails are not going to spam
- [ ] Consider using a dedicated email service (SendGrid, Mailgun, etc.)

