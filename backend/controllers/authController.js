const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Twilio configuration (optional)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

let twilioClient = null;

// Only initialize Twilio if credentials are properly configured
if (TWILIO_ACCOUNT_SID && 
    TWILIO_AUTH_TOKEN && 
    TWILIO_ACCOUNT_SID.startsWith('AC') && 
    TWILIO_ACCOUNT_SID.length > 10) {
  try {
    const twilio = require('twilio');
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    console.log('✅ Twilio SMS service initialized');
  } catch (error) {
    console.log('⚠️ Twilio initialization failed:', error.message);
  }
} else {
  console.log('⚠️ Twilio not configured - OTP will be logged to console');
}

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via SMS using Twilio
const sendOTP = async (phone, otp, userName = null) => {
  try {
    // Format phone number (ensure it has country code)
    let formattedPhone = phone;
    if (!phone.startsWith('+')) {
      // Assuming Indian number, add +91
      formattedPhone = '+91' + phone.replace(/\D/g, '');
    }

    // Create personalized message
    let messageBody;
    if (userName) {
      messageBody = `Dear ${userName}, your verification code is: ${otp}. Valid for 10 minutes. Please do not share this code with anyone.`;
    } else {
      messageBody = `Your verification code is: ${otp}. Valid for 10 minutes. Please do not share this code with anyone.`;
    }

    console.log(`📱 Sending OTP to ${formattedPhone}: ${otp}`);

    if (twilioClient && TWILIO_PHONE_NUMBER) {
      // Send actual SMS via Twilio
      const message = await twilioClient.messages.create({
        body: messageBody,
        from: TWILIO_PHONE_NUMBER,
        to: formattedPhone
      });

      console.log(`✅ SMS sent successfully! Message SID: ${message.sid}`);
      return true;
    } else {
      // Fallback: Log OTP to console if Twilio not configured
      console.log('⚠️ Twilio not configured. OTP logged to console only.');
      console.log(`🔐 Use this OTP to verify: ${otp}`);
      return true;
    }
  } catch (error) {
    console.error('❌ Error sending SMS:', error.message);
    // Still log OTP as fallback
    console.log(`🔐 Fallback - Use this OTP to verify: ${otp}`);
    return true; // Don't fail signup/login if SMS fails
  }
};

// Signup - Step 1: Send OTP
const signup = async (req, res) => {
  try {
    const { name, email, phone, password, storeName } = req.body;

    // Validation
    if (!name || !email || !phone || !password || !storeName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[+]?[\d\s-()]+$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }
      if (existingUser.phone === phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already registered'
        });
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create unverified user
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      storeName,
      isVerified: false,
      otp,
      otpExpiry
    });

    // Send OTP
    await sendOTP(phone, otp, name);

    res.status(201).json({
      success: true,
      message: 'OTP sent to your phone number',
      userId: user._id,
      phone: phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2') // Mask phone number
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
};

// Verify OTP and complete signup
const verifySignupOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'User ID and OTP are required'
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'User already verified'
      });
    }

    // Check OTP expiry
    if (new Date() > user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please request a new one.'
      });
    }

    // Verify OTP
    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Mark user as verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Account verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        storeName: user.storeName
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
};

// Login - Direct authentication without OTP
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Validation
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and password are required'
      });
    }

    // Find user by phone
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password'
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        storeName: user.storeName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
};


// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        storeName: user.storeName
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update profile picture
const updateProfile = async (req, res) => {
  try {
    const { profilePicture } = req.body;
    const userId = req.userId; // From auth middleware

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.profilePicture = profilePicture;
    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        storeName: user.storeName,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Forget Password - Step 1: Send OTP
const forgetPassword = async (req, res) => {
  try {
    const { phone } = req.body;

    // Validation
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Find user by phone
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Phone number not registered'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP with personalized message
    await sendOTP(user.phone, otp, user.name);

    res.json({
      success: true,
      message: 'OTP sent to your phone number',
      userId: user._id,
      phone: user.phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2') // Mask phone number
    });
  } catch (error) {
    console.error('Forget password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
};

// Verify OTP and reset password
const resetPassword = async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;

    if (!userId || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'User ID, OTP, and new password are required'
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check OTP expiry
    if (new Date() > user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please request a new one.'
      });
    }

    // Verify OTP
    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear OTP
    user.password = hashedPassword;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
};

module.exports = {
  signup,
  verifySignupOTP,
  login,
  forgetPassword,
  resetPassword,
  getCurrentUser,
  updateProfile
};
