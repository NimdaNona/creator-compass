import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const BASE_URL = process.env.NEXTAUTH_URL || 'https://creatorsaicompass.com';
const FROM_EMAIL = 'noreply@creatorsaicompass.com';
const APP_NAME = 'Creators AI Compass';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      text: text || stripHtml(html),
    });

    if (error) {
      console.error('Failed to send email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${BASE_URL}/api/auth/verify-email?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Verify your email</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9fafb;
            border-radius: 8px;
            padding: 32px;
            text-align: center;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #8b5cf6;
            margin-bottom: 24px;
          }
          h1 {
            color: #1f2937;
            font-size: 24px;
            margin-bottom: 16px;
          }
          p {
            color: #6b7280;
            margin-bottom: 24px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(to right, #8b5cf6, #ec4899);
            color: white;
            text-decoration: none;
            padding: 12px 32px;
            border-radius: 8px;
            font-weight: 600;
            margin: 24px 0;
          }
          .footer {
            margin-top: 32px;
            font-size: 14px;
            color: #9ca3af;
          }
          .link {
            color: #8b5cf6;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">🧭 Creators AI Compass</div>
          <h1>Verify your email address</h1>
          <p>Welcome to Creators AI Compass! Please verify your email address to get started on your creator journey.</p>
          <a href="${verifyUrl}" class="button">Verify Email</a>
          <p>Or copy and paste this link in your browser:</p>
          <p class="link">${verifyUrl}</p>
          <div class="footer">
            This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `Verify your email for ${APP_NAME}`,
    html,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${BASE_URL}/auth/reset-password?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Reset your password</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9fafb;
            border-radius: 8px;
            padding: 32px;
            text-align: center;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #8b5cf6;
            margin-bottom: 24px;
          }
          h1 {
            color: #1f2937;
            font-size: 24px;
            margin-bottom: 16px;
          }
          p {
            color: #6b7280;
            margin-bottom: 24px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(to right, #8b5cf6, #ec4899);
            color: white;
            text-decoration: none;
            padding: 12px 32px;
            border-radius: 8px;
            font-weight: 600;
            margin: 24px 0;
          }
          .footer {
            margin-top: 32px;
            font-size: 14px;
            color: #9ca3af;
          }
          .link {
            color: #8b5cf6;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">🧭 Creators AI Compass</div>
          <h1>Reset your password</h1>
          <p>We received a request to reset your password. Click the button below to create a new password.</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>Or copy and paste this link in your browser:</p>
          <p class="link">${resetUrl}</p>
          <div class="footer">
            This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `Reset your password for ${APP_NAME}`,
    html,
  });
}

/**
 * Send welcome email after successful registration
 */
export async function sendWelcomeEmail(email: string, name?: string) {
  const dashboardUrl = `${BASE_URL}/dashboard`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Creators AI Compass!</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9fafb;
            border-radius: 8px;
            padding: 32px;
            text-align: center;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #8b5cf6;
            margin-bottom: 24px;
          }
          h1 {
            color: #1f2937;
            font-size: 24px;
            margin-bottom: 16px;
          }
          p {
            color: #6b7280;
            margin-bottom: 24px;
            text-align: left;
          }
          .button {
            display: inline-block;
            background: linear-gradient(to right, #8b5cf6, #ec4899);
            color: white;
            text-decoration: none;
            padding: 12px 32px;
            border-radius: 8px;
            font-weight: 600;
            margin: 24px 0;
          }
          .features {
            text-align: left;
            margin: 24px 0;
          }
          .feature {
            margin: 12px 0;
            padding-left: 24px;
            position: relative;
          }
          .feature::before {
            content: "✨";
            position: absolute;
            left: 0;
          }
          .footer {
            margin-top: 32px;
            font-size: 14px;
            color: #9ca3af;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">🧭 Creators AI Compass</div>
          <h1>Welcome${name ? `, ${name}` : ''}!</h1>
          <p>You're all set to begin your creator journey with Creators AI Compass. We're excited to help you grow your audience and achieve your content creation goals!</p>
          
          <div class="features">
            <div class="feature">Personalized 90-day roadmaps for YouTube, TikTok, and Twitch</div>
            <div class="feature">Daily tasks and milestones to track your progress</div>
            <div class="feature">Platform-specific templates and resources</div>
            <div class="feature">Achievement system to celebrate your wins</div>
            <div class="feature">Expert insights and best practices</div>
          </div>
          
          <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
          
          <div class="footer">
            Happy creating! 🚀<br>
            The Creators AI Compass Team
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `Welcome to ${APP_NAME}! 🎉`,
    html,
  });
}

/**
 * Strip HTML tags from a string (simple implementation for text fallback)
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}