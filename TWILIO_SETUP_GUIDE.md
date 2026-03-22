# Twilio SMS Setup Guide

## Step 1: Create Twilio Account

1. Go to https://www.twilio.com/try-twilio
2. Sign up for a free trial account
3. Verify your email and phone number
4. You'll get **$15 free trial credits** (enough for ~500 SMS)

## Step 2: Get Your Credentials

1. After login, go to https://console.twilio.com/
2. You'll see your **Account SID** and **Auth Token** on the dashboard
3. Copy these values

## Step 3: Get a Phone Number

1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Select your country (India: +91)
3. Choose a number with SMS capability
4. Click "Buy" (it's free with trial credits)
5. Copy your Twilio phone number (format: +1234567890)

## Step 4: Configure Your App

Open `backend/.env` file and update these values:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

## Step 5: Verify Phone Numbers (Trial Account)

⚠️ **Important**: Twilio trial accounts can only send SMS to **verified phone numbers**.

To verify your phone number:
1. Go to https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. Click "Add a new number"
3. Enter your phone number with country code (e.g., +918072007223)
4. Verify via SMS or call
5. Now you can receive OTP on this number!

## Step 6: Restart Backend

After updating `.env`, restart your backend server:

```bash
cd backend
npm start
```

## Step 7: Test

1. Go to signup page
2. Enter your **verified phone number**
3. You should receive OTP via SMS!

## Upgrade to Production (Optional)

To send SMS to any number (not just verified):
1. Upgrade your Twilio account (add payment method)
2. Complete regulatory compliance (if required in your country)
3. Your account will be upgraded automatically

## Pricing

- **Trial**: $15 free credits (~500 SMS)
- **Production**: ~$0.0075 per SMS (India)
- **Monthly**: No monthly fees, pay-as-you-go

## Alternative: Use MSG91 (India-specific)

If you prefer an Indian SMS provider:

1. Sign up at https://msg91.com/
2. Get API key
3. Update the `sendOTP` function in `backend/controllers/authController.js`

```javascript
// MSG91 Example
const axios = require('axios');
const response = await axios.get(`https://api.msg91.com/api/v5/otp`, {
  params: {
    authkey: 'YOUR_MSG91_API_KEY',
    mobile: phone,
    otp: otp
  }
});
```

## Troubleshooting

**SMS not received?**
- Check if phone number is verified (trial accounts)
- Check Twilio console logs for errors
- Verify phone number format (+91xxxxxxxxxx)
- Check backend console for error messages

**"Unverified number" error?**
- Add your phone to verified numbers in Twilio console
- Or upgrade to paid account

**Need help?**
- Twilio Docs: https://www.twilio.com/docs/sms
- Support: https://support.twilio.com/
