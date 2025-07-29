import { prisma } from '@/lib/db';
import type {
  PlatformConnection,
  PlatformContent,
  PlatformAnalytics,
  PlatformLimits,
  PlatformService,
  ContentSchedule,
  ListOptions,
  ValidationResult,
  PlatformType,
  OAuthTokens
} from '@/types/platform-integrations';

export abstract class BasePlatformService implements PlatformService {
  protected abstract platform: PlatformType;
  protected abstract authConfig: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes: string[];
    authUrl: string;
    tokenUrl: string;
  };

  // Abstract methods that each platform must implement
  abstract connect(authCode: string): Promise<PlatformConnection>;
  abstract refreshToken(connection: PlatformConnection): Promise<PlatformConnection>;
  abstract publishContent(connectionId: string, content: Partial<PlatformContent>): Promise<PlatformContent>;
  abstract getAnalytics(connectionId: string, period: { start: Date; end: Date }): Promise<PlatformAnalytics>;
  abstract getPlatformLimits(): PlatformLimits;
  abstract validateContent(content: Partial<PlatformContent>): ValidationResult;

  // Common implementations
  async disconnect(connectionId: string): Promise<void> {
    await prisma.platformConnection.update({
      where: { id: connectionId },
      data: { isActive: false }
    });
  }

  async validateConnection(connection: PlatformConnection): Promise<boolean> {
    try {
      // Check if token is expired
      if (connection.tokenExpiry && connection.tokenExpiry < new Date()) {
        // Try to refresh the token
        await this.refreshToken(connection);
      }

      // Make a simple API call to validate the connection
      return await this.testConnection(connection);
    } catch (error) {
      console.error(`Failed to validate ${this.platform} connection:`, error);
      return false;
    }
  }

  async scheduleContent(connectionId: string, content: Partial<ContentSchedule>): Promise<ContentSchedule> {
    const schedule = await prisma.contentSchedule.create({
      data: {
        connectionId,
        platform: this.platform,
        content: content.content || {},
        scheduledFor: content.scheduledFor!,
        timezone: content.timezone || 'UTC',
        status: 'pending',
        retryCount: 0,
        userId: content.userId!
      }
    });

    return schedule as ContentSchedule;
  }

  async updateContent(connectionId: string, contentId: string, updates: Partial<PlatformContent>): Promise<PlatformContent> {
    // This would be implemented differently for each platform
    throw new Error('Method not implemented for this platform');
  }

  async deleteContent(connectionId: string, contentId: string): Promise<void> {
    // This would be implemented differently for each platform
    throw new Error('Method not implemented for this platform');
  }

  async getContent(connectionId: string, contentId: string): Promise<PlatformContent> {
    // This would be implemented differently for each platform
    throw new Error('Method not implemented for this platform');
  }

  async listContent(connectionId: string, options?: ListOptions): Promise<PlatformContent[]> {
    // This would be implemented differently for each platform
    throw new Error('Method not implemented for this platform');
  }

  async syncAnalytics(connectionId: string): Promise<void> {
    const connection = await this.getConnection(connectionId);
    if (!connection) throw new Error('Connection not found');

    const analytics = await this.getAnalytics(connectionId, {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      end: new Date()
    });

    // Store analytics data
    await prisma.platformAnalytics.upsert({
      where: { connectionId },
      update: {
        metrics: analytics.metrics as any,
        audienceData: analytics.audienceData as any,
        updatedAt: new Date()
      },
      create: {
        connectionId,
        platform: this.platform,
        metrics: analytics.metrics as any,
        audienceData: analytics.audienceData as any
      }
    });

    // Update last sync time
    await prisma.platformConnection.update({
      where: { id: connectionId },
      data: { lastSync: new Date() }
    });
  }

  // Helper methods
  protected async getConnection(connectionId: string): Promise<PlatformConnection | null> {
    const connection = await prisma.platformConnection.findUnique({
      where: { id: connectionId }
    });

    return connection as PlatformConnection | null;
  }

  protected async saveConnection(connection: PlatformConnection): Promise<PlatformConnection> {
    const saved = await prisma.platformConnection.upsert({
      where: {
        userId_platform_accountId: {
          userId: connection.userId,
          platform: connection.platform,
          accountId: connection.accountId
        }
      },
      update: {
        accessToken: connection.accessToken,
        refreshToken: connection.refreshToken,
        tokenExpiry: connection.tokenExpiry,
        isActive: true,
        updatedAt: new Date()
      },
      create: connection
    });

    return saved as PlatformConnection;
  }

  protected abstract testConnection(connection: PlatformConnection): Promise<boolean>;

  // OAuth helpers
  protected buildAuthUrl(state: string, additionalParams?: Record<string, string>): string {
    const params = new URLSearchParams({
      client_id: this.authConfig.clientId,
      redirect_uri: this.authConfig.redirectUri,
      response_type: 'code',
      scope: this.authConfig.scopes.join(' '),
      state,
      ...additionalParams
    });

    return `${this.authConfig.authUrl}?${params.toString()}`;
  }

  protected async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    const response = await fetch(this.authConfig.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: this.authConfig.clientId,
        client_secret: this.authConfig.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.authConfig.redirectUri
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange code for tokens: ${response.statusText}`);
    }

    return await response.json();
  }

  protected async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    const response = await fetch(this.authConfig.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: this.authConfig.clientId,
        client_secret: this.authConfig.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    return await response.json();
  }

  // Rate limiting helper
  protected async checkRateLimit(connectionId: string, action: string): Promise<boolean> {
    const key = `rate_limit:${this.platform}:${connectionId}:${action}`;
    const limits = this.getPlatformLimits();
    
    // This would integrate with Redis or similar for rate limiting
    // For now, return true
    return true;
  }

  // Content adaptation helper
  protected adaptContentForPlatform(content: Partial<PlatformContent>): Partial<PlatformContent> {
    const limits = this.getPlatformLimits();
    const adapted = { ...content };

    // Truncate title if needed
    if (adapted.title && limits.content.titleMaxLength && adapted.title.length > limits.content.titleMaxLength) {
      adapted.title = adapted.title.substring(0, limits.content.titleMaxLength - 3) + '...';
    }

    // Truncate description if needed
    if (adapted.description && limits.content.descriptionMaxLength && adapted.description.length > limits.content.descriptionMaxLength) {
      adapted.description = adapted.description.substring(0, limits.content.descriptionMaxLength - 3) + '...';
    }

    // Limit tags
    if (adapted.tags && limits.content.tagsMax && adapted.tags.length > limits.content.tagsMax) {
      adapted.tags = adapted.tags.slice(0, limits.content.tagsMax);
    }

    // Limit hashtags
    if (adapted.hashtags && limits.content.hashtagsMax && adapted.hashtags.length > limits.content.hashtagsMax) {
      adapted.hashtags = adapted.hashtags.slice(0, limits.content.hashtagsMax);
    }

    return adapted;
  }
}