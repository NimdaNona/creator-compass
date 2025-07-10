import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db, dbUtils } from './db';
import { comparePassword } from './password';
import { sendVerificationEmail } from './email';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  providers: [
    // Email/Password Provider
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        const isPasswordValid = await comparePassword(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }

        if (!user.emailVerified) {
          throw new Error('Please verify your email before signing in');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
    
    // Email Magic Link Provider
    EmailProvider({
      server: {
        host: 'smtp.resend.com',
        port: 465,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY,
        },
      },
      from: process.env.NODE_ENV === 'production' 
        ? 'Creators AI Compass <noreply@creatorsaicompass.com>'
        : 'Creators AI Compass <noreply@dev.creatorsaicompass.com>',
      sendVerificationRequest: async ({ identifier: email, url }) => {
        // Extract token from URL
        const urlObj = new URL(url);
        const token = urlObj.searchParams.get('token');
        
        if (token) {
          await sendVerificationEmail(email, token);
        }
      },
    }),
    
    // Google OAuth Provider
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        
        // Fetch user profile and stats
        const userData = await dbUtils.getUserById(token.sub!);
        if (userData) {
          session.user.profile = userData.profile;
          session.user.stats = userData.stats;
          session.user.emailVerified = userData.emailVerified;
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async signIn({ user, account, profile }) {
      // Handle OAuth sign in
      if (account?.provider === 'google' || account?.provider === 'email') {
        try {
          // Check if user exists
          const existingUser = await dbUtils.getUserByEmail(user.email!);
          
          if (!existingUser) {
            // Create user profile and stats for new users
            const newUser = await dbUtils.createUser({
              email: user.email!,
              name: user.name || '',
              image: user.image || '',
            });

            // Initialize user stats
            await dbUtils.updateUserStats(newUser.id, {
              incrementPoints: 0,
              incrementTasks: 0,
            });
            
            // Mark email as verified for OAuth users
            if (account.provider === 'google') {
              await db.user.update({
                where: { id: newUser.id },
                data: { emailVerified: new Date() },
              });
            }
          } else if (account.provider === 'google' && !existingUser.emailVerified) {
            // Auto-verify email for Google OAuth users
            await db.user.update({
              where: { id: existingUser.id },
              data: { emailVerified: new Date() },
            });
          }
          
          return true;
        } catch (error) {
          console.error('Error during sign in:', error);
          return false;
        }
      }
      
      // Credentials sign in is handled in the authorize callback
      return true;
    },
  },
  session: {
    strategy: 'jwt', // Required for Credentials provider
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development',
};

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      emailVerified?: Date | null;
      profile?: any;
      stats?: any;
    };
  }
}