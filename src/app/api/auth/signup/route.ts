import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, validatePassword, generateToken } from '@/lib/password';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: 'Password requirements not met', errors: passwordValidation.errors },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate email verification token
    const verificationToken = generateToken();

    // Create user
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        name: name || null,
        password: hashedPassword,
        emailVerificationToken: verificationToken,
      },
    });

    // Create user profile
    await db.userProfile.create({
      data: {
        userId: user.id,
      },
    });

    // Create user stats
    await db.userStats.create({
      data: {
        userId: user.id,
      },
    });

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken);

    return NextResponse.json({
      message: 'Account created successfully. Please check your email to verify your account.',
      success: true,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An error occurred during signup. Please try again.' },
      { status: 500 }
    );
  }
}