const nodemailer = require('nodemailer');

// Check if SMTP is properly configured
const isSmtpConfigured = () => {
    return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
};

// Email configuration - using environment variables
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    // Add connection timeout
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
});

// Categorize email errors for user-friendly messages
const categorizeEmailError = (error) => {
    const errorCode = error.code || '';
    const errorMessage = error.message || '';
    
    // DNS/Network errors
    if (errorCode === 'ENOTFOUND' || errorCode === 'EBADNAME' || errorMessage.includes('EBADNAME') || errorMessage.includes('ENOTFOUND')) {
        return {
            type: 'DNS_ERROR',
            userMessage: 'Email service is temporarily unavailable. Please try again later or contact support.',
            technicalMessage: 'DNS resolution failed for SMTP host'
        };
    }
    
    // Connection errors
    if (errorCode === 'ECONNREFUSED' || errorCode === 'ETIMEDOUT' || errorCode === 'ECONNRESET') {
        return {
            type: 'CONNECTION_ERROR',
            userMessage: 'Unable to connect to email service. Please try again in a few minutes.',
            technicalMessage: `Connection failed: ${errorCode}`
        };
    }
    
    // Authentication errors
    if (errorCode === 'EAUTH' || errorMessage.includes('authentication') || errorMessage.includes('Invalid login') || errorMessage.includes('535')) {
        return {
            type: 'AUTH_ERROR',
            userMessage: 'Email service configuration error. Please contact support.',
            technicalMessage: 'SMTP authentication failed - check credentials'
        };
    }
    
    // Rate limiting
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many') || errorMessage.includes('421')) {
        return {
            type: 'RATE_LIMIT',
            userMessage: 'Too many emails sent. Please wait a few minutes and try again.',
            technicalMessage: 'SMTP rate limit exceeded'
        };
    }
    
    // Invalid recipient
    if (errorMessage.includes('recipient') || errorMessage.includes('550') || errorMessage.includes('invalid address')) {
        return {
            type: 'INVALID_RECIPIENT',
            userMessage: 'The email address appears to be invalid. Please check and try again.',
            technicalMessage: 'Invalid recipient address'
        };
    }
    
    // Default error
    return {
        type: 'UNKNOWN_ERROR',
        userMessage: 'Failed to send verification email. Please try again later.',
        technicalMessage: error.message
    };
};

// Generate 6-digit verification code
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email
const sendVerificationEmail = async (email, code, username) => {
    const mailOptions = {
        from: `"Image Studio" <${process.env.SMTP_USER || 'noreply@imagestudio.app'}>`,
        to: email,
        subject: 'Verify your Image Studio account',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #1a1c2e; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1c2e; padding: 40px 20px;">
                    <tr>
                        <td align="center">
                            <table width="100%" max-width="500" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
                                <!-- Header -->
                                <tr>
                                    <td style="padding: 40px 40px 20px; text-align: center;">
                                        <h1 style="margin: 0; color: #fff; font-size: 28px; font-weight: 700;">
                                            ✨ Image Studio
                                        </h1>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 20px 40px;">
                                        <p style="color: rgba(255,255,255,0.9); font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                            Hi <strong>${username}</strong>,
                                        </p>
                                        <p style="color: rgba(255,255,255,0.7); font-size: 15px; line-height: 1.6; margin: 0 0 30px;">
                                            Thanks for signing up! Use the verification code below to verify your email address:
                                        </p>
                                        
                                        <!-- Code Box -->
                                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 25px; text-align: center; margin: 0 0 30px;">
                                            <span style="font-size: 36px; font-weight: 700; color: #fff; letter-spacing: 8px; font-family: monospace;">
                                                ${code}
                                            </span>
                                        </div>
                                        
                                        <p style="color: rgba(255,255,255,0.5); font-size: 13px; line-height: 1.5; margin: 0 0 10px;">
                                            This code expires in <strong>15 minutes</strong>.
                                        </p>
                                        <p style="color: rgba(255,255,255,0.5); font-size: 13px; line-height: 1.5; margin: 0;">
                                            If you didn't create an account, you can safely ignore this email.
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="padding: 30px 40px; border-top: 1px solid rgba(255,255,255,0.1);">
                                        <p style="color: rgba(255,255,255,0.4); font-size: 12px; text-align: center; margin: 0;">
                                            © ${new Date().getFullYear()} Image Studio. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `
    };

    try {
        // Check if SMTP is configured
        if (!isSmtpConfigured()) {
            console.error('SMTP not configured - SMTP_USER and SMTP_PASS are required');
            return { 
                success: false, 
                error: 'Email service is not configured. Please contact support.',
                errorType: 'CONFIG_ERROR'
            };
        }
        
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Email send error:', error);
        const categorized = categorizeEmailError(error);
        console.error(`Email error type: ${categorized.type}, Technical: ${categorized.technicalMessage}`);
        return { 
            success: false, 
            error: categorized.userMessage,
            errorType: categorized.type,
            technicalError: categorized.technicalMessage
        };
    }
};

// Send password reset email
const sendPasswordResetEmail = async (email, code, username) => {
    const mailOptions = {
        from: `"Image Studio" <${process.env.SMTP_USER || 'noreply@imagestudio.app'}>`,
        to: email,
        subject: 'Reset your Image Studio password',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
            </head>
            <body style="margin: 0; padding: 0; background-color: #1a1c2e; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1c2e; padding: 40px 20px;">
                    <tr>
                        <td align="center">
                            <table width="100%" max-width="500" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden;">
                                <tr>
                                    <td style="padding: 40px; text-align: center;">
                                        <h1 style="color: #fff; margin: 0 0 20px;">✨ Image Studio</h1>
                                        <p style="color: rgba(255,255,255,0.7); font-size: 15px;">
                                            Hi ${username}, use this code to reset your password:
                                        </p>
                                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 25px; margin: 20px 0;">
                                            <span style="font-size: 36px; font-weight: 700; color: #fff; letter-spacing: 8px; font-family: monospace;">
                                                ${code}
                                            </span>
                                        </div>
                                        <p style="color: rgba(255,255,255,0.5); font-size: 13px;">
                                            This code expires in 15 minutes.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `
    };

    try {
        // Check if SMTP is configured
        if (!isSmtpConfigured()) {
            console.error('SMTP not configured - SMTP_USER and SMTP_PASS are required');
            return { 
                success: false, 
                error: 'Email service is not configured. Please contact support.',
                errorType: 'CONFIG_ERROR'
            };
        }
        
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Email send error:', error);
        const categorized = categorizeEmailError(error);
        console.error(`Email error type: ${categorized.type}, Technical: ${categorized.technicalMessage}`);
        return { 
            success: false, 
            error: categorized.userMessage,
            errorType: categorized.type,
            technicalError: categorized.technicalMessage
        };
    }
};

module.exports = {
    generateVerificationCode,
    sendVerificationEmail,
    sendPasswordResetEmail,
    isSmtpConfigured
};
