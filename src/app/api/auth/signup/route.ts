import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, validatePassword, generateToken } from '@/lib/password';
import { sendVerificationEmail } from '@/lib/email';
import { prisma } from '@/lib/db';

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
    const existingUser = await prisma.user.findUnique({
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

    // Create user, profile, and stats in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          name: name || null,
          password: hashedPassword,
          emailVerificationToken: verificationToken,
        },
      });

      // Create user profile
      await tx.userProfile.create({
        data: {
          userId: user.id,
        },
      });

      // Create user stats
      await tx.userStats.create({
        data: {
          userId: user.id,
        },
      });

      return user;
    });

    // Send verification email (outside transaction for better performance)
    await sendVerificationEmail(result.email, verificationToken);

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