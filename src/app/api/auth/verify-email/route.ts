import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin?error=InvalidToken', request.url));
    }

    // Find user with this verification token
    const user = await db.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      return NextResponse.redirect(new URL('/auth/signin?error=InvalidToken', request.url));
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.redirect(new URL('/auth/signin?message=EmailAlreadyVerified', request.url));
    }

    // Verify the email
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null, // Clear the token
      },
    });

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name || undefined);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the verification if welcome email fails
    }

    // Redirect to sign in with success message
    return NextResponse.redirect(
      new URL('/auth/signin?message=EmailVerified', request.url)
    );
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(
      new URL('/auth/signin?error=VerificationFailed', request.url)
    );
  }
}