# Admin PIN Setup Guide

## Overview
The admin login uses a simple 6-digit PIN system. When users click "Admin" or "Admin Login" on the landing page, a PIN modal will appear.

## How It Works

1. **User clicks "Admin" button** → PIN modal opens
2. **User enters 6-digit PIN** → Automatically verifies when 6 digits are entered
3. **Correct PIN** → Redirects to `/dashboard`
4. **Incorrect PIN** → Shows error message
5. **3 failed attempts** → Locks out for 15 minutes

## Setup Instructions

### Local Development

1. Create a `.env.local` file in the `savant-marketing-studio` directory:
```bash
ADMIN_PIN=123456
```

Replace `123456` with your desired 6-digit PIN.

### Vercel Deployment

1. Go to your Vercel project: https://vercel.com/genzinvestorr-8816s-projects/drss-mvp/settings/environment-variables

2. Add a new environment variable:
   - **Name:** `ADMIN_PIN`
   - **Value:** Your 6-digit PIN (e.g., `123456`)
   - **Environment:** Production, Preview, Development (select all)

3. Click "Save"

4. **Important:** After adding the environment variable, you need to redeploy:
   - Go to the Deployments tab
   - Click the three dots on the latest deployment
   - Click "Redeploy"

Or simply push a new commit to trigger an automatic deployment.

## Security Notes

- The PIN is stored as an environment variable (not in code)
- After 3 failed attempts, users are locked out for 15 minutes
- The lockout is stored in browser localStorage (per device)
- The PIN should be at least 6 digits for security

## Testing

1. Start your local dev server: `npm run dev`
2. Navigate to `http://localhost:3000/landing`
3. Click "Admin" in the navigation
4. Enter your PIN
5. You should be redirected to `/dashboard` if correct

## Troubleshooting

**PIN modal doesn't appear:**
- Check browser console for errors
- Ensure `PinModal` component is imported correctly
- Verify the button has `onClick={() => setShowPinModal(true)}`

**PIN verification fails:**
- Check that `ADMIN_PIN` environment variable is set
- Verify the PIN is exactly 6 digits
- Check Vercel environment variables are set correctly
- Ensure you redeployed after adding the environment variable

**Locked out:**
- Wait 15 minutes, or
- Clear browser localStorage: `localStorage.removeItem('PIN_LOCKOUT')`

