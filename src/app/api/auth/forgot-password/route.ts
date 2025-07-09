import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateToken, generateTokenExpiry } from '@/lib/password';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with this email, you will receive password reset instructions.',
        success: true,
      });
    }

    // Generate reset token
    const resetToken = generateToken();
    const resetExpiry = generateTokenExpiry(1); // 1 hour expiry

    // Update user with reset token
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpiry,
      },
    });

    // Send password reset email
    await sendPasswordResetEmail(user.email, resetToken);

    return NextResponse.json({
      message: 'If an account exists with this email, you will receive password reset instructions.',
      success: true,
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}