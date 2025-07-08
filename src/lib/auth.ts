import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { db, dbUtils } from './db';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  providers: [
    // Only add providers if they have valid credentials
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET && 
        process.env.GITHUB_CLIENT_ID !== 'your-dev-github-client-id' && 
        process.env.GITHUB_CLIENT_SECRET !== 'your-dev-github-client-secret' ? [
      GitHubProvider({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      })
    ] : []),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        
        // Fetch user profile and stats
        const userData = await dbUtils.getUserById(user.id);
        if (userData) {
          session.user.profile = userData.profile;
          session.user.stats = userData.stats;
        }
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' || account?.provider === 'github') {
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
          }
          
          return true;
        } catch (error) {
          console.error('Error during sign in:', error);
          return false;
        }
      }
      return true;
    },
  },
  session: {
    strategy: 'database',
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
      profile?: any;
      stats?: any;
    };
  }
}