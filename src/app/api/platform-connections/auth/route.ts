import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import crypto from 'crypto';
import { kv } from '@vercel/kv';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { platform } = await request.json();

    if (!['youtube', 'tiktok', 'instagram', 'twitter'].includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    // Generate state for OAuth security
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state with user info in KV (expires in 10 minutes)
    await kv.setex(
      `oauth_state:${state}`,
      600,
      JSON.stringify({
        userId: session.user.id,
        platform,
        timestamp: Date.now()
      })
    );

    // Build OAuth URLs based on platform
    let authUrl: string;
    const baseUrl = process.env.NEXTAUTH_URL || 'https://creatorsaicompass.com';

    switch (platform) {
      case 'youtube':
        const youtubeParams = new URLSearchParams({
          client_id: process.env.YOUTUBE_CLIENT_ID!,
          redirect_uri: `${baseUrl}/api/auth/youtube/callback`,
          response_type: 'code',
          scope: [
            'https://www.googleapis.com/auth/youtube',
            'https://www.googleapis.com/auth/youtube.upload',
            'https://www.googleapis.com/auth/youtube.readonly',
            'https://www.googleapis.com/auth/yt-analytics.readonly',
            'https://www.googleapis.com/auth/userinfo.profile'
          ].join(' '),
          state,
          access_type: 'offline',
          prompt: 'consent'
        });
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${youtubeParams}`;
        break;

      case 'tiktok':
        const tiktokParams = new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY!,
          redirect_uri: `${baseUrl}/api/auth/tiktok/callback`,
          response_type: 'code',
          scope: [
            'user.info.basic',
            'user.info.profile',
            'user.info.stats',
            'video.list',
            'video.upload',
            'video.publish'
          ].join(','),
          state
        });
        authUrl = `https://www.tiktok.com/v2/auth/authorize?${tiktokParams}`;
        break;

      case 'instagram':
        const instagramParams = new URLSearchParams({
          client_id: process.env.INSTAGRAM_APP_ID!,
          redirect_uri: `${baseUrl}/api/auth/instagram/callback`,
          response_type: 'code',
          scope: [
            'instagram_basic',
            'instagram_content_publish',
            'instagram_manage_comments',
            'instagram_manage_insights',
            'pages_show_list',
            'pages_read_engagement'
          ].join(','),
          state
        });
        authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${instagramParams}`;
        break;

      case 'twitter':
        // Twitter uses OAuth 2.0 PKCE
        const codeVerifier = crypto.randomBytes(32).toString('base64url');
        const codeChallenge = crypto
          .createHash('sha256')
          .update(codeVerifier)
          .digest('base64url');

        // Store code verifier for later use
        await kv.setex(
          `twitter_pkce:${state}`,
          600,
          codeVerifier
        );

        const twitterParams = new URLSearchParams({
          client_id: process.env.TWITTER_CLIENT_ID!,
          redirect_uri: `${baseUrl}/api/auth/twitter/callback`,
          response_type: 'code',
          scope: [
            'tweet.read',
            'tweet.write',
            'users.read',
            'follows.read',
            'follows.write',
            'offline.access'
          ].join(' '),
          state,
          code_challenge: codeChallenge,
          code_challenge_method: 'S256'
        });
        authUrl = `https://twitter.com/i/oauth2/authorize?${twitterParams}`;
        break;

      default:
        return NextResponse.json({ error: 'Platform not supported' }, { status: 400 });
    }

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error initializing OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initialize connection' },
      { status: 500 }
    );
  }
}