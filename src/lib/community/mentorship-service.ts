import { prisma } from '@/lib/prisma';
import { 
  MentorshipProfile,
  MentorshipMatch,
  MentorshipStatus,
  MentorshipSession,
  MentorshipStyle,
  MentorAvailability
} from '@/types/community';
import { openai } from '@/lib/openai';

export class MentorshipService {
  async createOrUpdateProfile(
    userId: string,
    data: {
      role: 'mentor' | 'mentee' | 'both';
      expertise: string[];
      interests: string[];
      availability: MentorAvailability;
      experience: string;
      bio: string;
      goals: string[];
      preferredMentorshipStyle: MentorshipStyle;
      languages: string[];
      timezone: string;
    }
  ): Promise<MentorshipProfile> {
    const profile = await prisma.mentorshipProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...data
      },
      update: data,
      include: {
        user: {
          include: {
            profile: true,
            gamificationProfile: true,
            achievements: true
          }
        }
      }
    });

    return this.formatMentorshipProfile(profile);
  }

  async findMatches(
    userId: string,
    preferences?: {
      expertise?: string[];
      style?: MentorshipStyle;
      language?: string;
      timezone?: string;
    }
  ): Promise<{ matches: MentorshipProfile[]; scores: Record<string, number> }> {
    const seekerProfile = await prisma.mentorshipProfile.findUnique({
      where: { userId },
      include: {
        user: {
          include: {
            profile: true,
            gamificationProfile: true
          }
        }
      }
    });

    if (!seekerProfile) {
      throw new Error('Please create a mentorship profile first');
    }

    const targetRole = seekerProfile.role === 'mentor' ? 'mentee' : 'mentor';

    // Find potential matches
    const potentials = await prisma.mentorshipProfile.findMany({
      where: {
        userId: { not: userId },
        role: { in: targetRole === 'mentor' ? ['mentor', 'both'] : ['mentee', 'both'] },
        ...(preferences?.expertise && {
          expertise: { hasSome: preferences.expertise }
        }),
        ...(preferences?.style && {
          preferredMentorshipStyle: preferences.style
        }),
        ...(preferences?.language && {
          languages: { has: preferences.language }
        })
      },
      include: {
        user: {
          include: {
            profile: true,
            gamificationProfile: true,
            achievements: true
          }
        },
        matches: {
          where: {
            OR: [
              { mentorId: userId },
              { menteeId: userId }
            ],
            status: { in: [MentorshipStatus.ACTIVE, MentorshipStatus.COMPLETED] }
          }
        }
      }
    });

    // Calculate match scores
    const scores: Record<string, number> = {};
    const scoredMatches = potentials.map(potential => {
      const score = this.calculateMatchScore(seekerProfile, potential, preferences);
      scores[potential.userId] = score;
      return potential;
    });

    // Sort by score
    scoredMatches.sort((a, b) => scores[b.userId] - scores[a.userId]);

    return {
      matches: scoredMatches.slice(0, 10).map(p => this.formatMentorshipProfile(p)),
      scores
    };
  }

  async requestMatch(
    requesterId: string,
    targetUserId: string,
    data: {
      goals: string[];
      duration: {
        commitment: string;
        end?: Date;
      };
      message: string;
    }
  ): Promise<MentorshipMatch> {
    // Check if both have profiles
    const [requesterProfile, targetProfile] = await Promise.all([
      prisma.mentorshipProfile.findUnique({ where: { userId: requesterId } }),
      prisma.mentorshipProfile.findUnique({ where: { userId: targetUserId } })
    ]);

    if (!requesterProfile || !targetProfile) {
      throw new Error('Both users must have mentorship profiles');
    }

    // Check for existing match
    const existing = await prisma.mentorshipMatch.findFirst({
      where: {
        OR: [
          { mentorId: requesterId, menteeId: targetUserId },
          { mentorId: targetUserId, menteeId: requesterId }
        ],
        status: { in: [MentorshipStatus.PENDING, MentorshipStatus.ACTIVE] }
      }
    });

    if (existing) {
      throw new Error('Match already exists');
    }

    // Determine mentor and mentee
    const isMentor = requesterProfile.role === 'mentor' || 
      (requesterProfile.role === 'both' && targetProfile.role === 'mentee');
    const mentorId = isMentor ? requesterId : targetUserId;
    const menteeId = isMentor ? targetUserId : requesterId;

    // Create match request
    const match = await prisma.mentorshipMatch.create({
      data: {
        mentorId,
        menteeId,
        status: MentorshipStatus.PENDING,
        matchScore: await this.calculateDetailedMatchScore(requesterProfile, targetProfile),
        matchReasons: await this.generateMatchReasons(requesterProfile, targetProfile),
        goals: data.goals,
        startDate: new Date(),
        endDate: data.duration.end,
        commitment: data.duration.commitment,
        requestMessage: data.message
      }
    });

    return this.formatMatch(match);
  }

  async respondToMatch(
    matchId: string,
    userId: string,
    accept: boolean
  ): Promise<MentorshipMatch> {
    const match = await prisma.mentorshipMatch.findUnique({
      where: { id: matchId }
    });

    if (!match) {
      throw new Error('Match not found');
    }

    // Verify user is the target of the request
    const isTarget = (match.mentorId === userId && match.requestedBy === 'mentee') ||
      (match.menteeId === userId && match.requestedBy === 'mentor');

    if (!isTarget) {
      throw new Error('Unauthorized');
    }

    const updated = await prisma.mentorshipMatch.update({
      where: { id: matchId },
      data: {
        status: accept ? MentorshipStatus.ACTIVE : MentorshipStatus.CANCELLED,
        respondedAt: new Date()
      }
    });

    return this.formatMatch(updated);
  }

  async scheduleSession(
    matchId: string,
    userId: string,
    data: {
      scheduledAt: Date;
      duration: number;
      type: 'video' | 'voice' | 'chat';
      agenda: string;
    }
  ): Promise<MentorshipSession> {
    const match = await prisma.mentorshipMatch.findUnique({
      where: { id: matchId }
    });

    if (!match || (match.mentorId !== userId && match.menteeId !== userId)) {
      throw new Error('Unauthorized');
    }

    if (match.status !== MentorshipStatus.ACTIVE) {
      throw new Error('Match is not active');
    }

    const session = await prisma.mentorshipSession.create({
      data: {
        matchId,
        scheduledAt: data.scheduledAt,
        duration: data.duration,
        type: data.type,
        agenda: data.agenda,
        status: 'scheduled'
      }
    });

    return session as MentorshipSession;
  }

  async completeSession(
    sessionId: string,
    userId: string,
    data: {
      notes?: string;
      resources?: string[];
    }
  ): Promise<void> {
    const session = await prisma.mentorshipSession.findUnique({
      where: { id: sessionId },
      include: { match: true }
    });

    if (!session || (session.match.mentorId !== userId && session.match.menteeId !== userId)) {
      throw new Error('Unauthorized');
    }

    await prisma.mentorshipSession.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        notes: data.notes,
        resources: data.resources
      }
    });
  }

  async provideFeedback(
    matchId: string,
    userId: string,
    data: {
      rating: number;
      review: string;
    }
  ): Promise<void> {
    const match = await prisma.mentorshipMatch.findUnique({
      where: { id: matchId }
    });

    if (!match || (match.mentorId !== userId && match.menteeId !== userId)) {
      throw new Error('Unauthorized');
    }

    const isMentor = match.mentorId === userId;
    
    await prisma.mentorshipMatch.update({
      where: { id: matchId },
      data: isMentor ? {
        mentorRating: data.rating,
        mentorReview: data.review
      } : {
        menteeRating: data.rating,
        menteeReview: data.review
      }
    });

    // Update average rating on profile
    const targetUserId = isMentor ? match.menteeId : match.mentorId;
    await this.updateProfileRating(targetUserId);
  }

  private async updateProfileRating(userId: string): Promise<void> {
    const matches = await prisma.mentorshipMatch.findMany({
      where: {
        OR: [
          { mentorId: userId, menteeRating: { not: null } },
          { menteeId: userId, mentorRating: { not: null } }
        ],
        status: MentorshipStatus.COMPLETED
      }
    });

    const ratings = matches.map(m => 
      m.mentorId === userId ? m.menteeRating! : m.mentorRating!
    );

    if (ratings.length > 0) {
      const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      
      await prisma.mentorshipProfile.update({
        where: { userId },
        data: {
          rating: average,
          reviewCount: ratings.length
        }
      });
    }
  }

  private calculateMatchScore(
    seeker: any,
    candidate: any,
    preferences?: any
  ): number {
    let score = 50; // Base score

    // Expertise match
    const sharedExpertise = seeker.interests.filter((i: string) => 
      candidate.expertise.includes(i)
    ).length;
    score += Math.min(20, sharedExpertise * 5);

    // Availability match
    const sharedDays = seeker.availability.preferredDays.filter((d: string) =>
      candidate.availability.preferredDays.includes(d)
    ).length;
    score += Math.min(10, sharedDays * 2);

    // Style match
    if (seeker.preferredMentorshipStyle === candidate.preferredMentorshipStyle) {
      score += 10;
    }

    // Language match
    const sharedLanguages = seeker.languages.filter((l: string) =>
      candidate.languages.includes(l)
    ).length;
    if (sharedLanguages > 0) score += 5;

    // Timezone compatibility
    const timezoneGap = Math.abs(
      this.getTimezoneOffset(seeker.timezone) - 
      this.getTimezoneOffset(candidate.timezone)
    );
    if (timezoneGap <= 3) score += 5;

    // Experience level (for mentors)
    if (candidate.role === 'mentor' || candidate.role === 'both') {
      const level = candidate.user?.gamificationProfile?.level || 1;
      score += Math.min(10, level);
    }

    return Math.min(100, score);
  }

  private async calculateDetailedMatchScore(
    profile1: any,
    profile2: any
  ): Promise<number> {
    // Use AI to analyze compatibility
    const prompt = `Analyze the compatibility between these two creator profiles for mentorship:

Profile 1:
- Expertise: ${profile1.expertise.join(', ')}
- Interests: ${profile1.interests.join(', ')}
- Goals: ${profile1.goals.join(', ')}
- Experience: ${profile1.experience}
- Style: ${profile1.preferredMentorshipStyle}

Profile 2:
- Expertise: ${profile2.expertise.join(', ')}
- Interests: ${profile2.interests.join(', ')}
- Goals: ${profile2.goals.join(', ')}
- Experience: ${profile2.experience}
- Style: ${profile2.preferredMentorshipStyle}

Provide a compatibility score from 0-100 based on:
- Complementary skills and knowledge
- Aligned goals and interests
- Compatible mentorship styles
- Potential for mutual growth

Return only the numeric score.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 10
      });

      const score = parseInt(response.choices[0].message.content || '50');
      return Math.min(100, Math.max(0, score));
    } catch (error) {
      // Fallback to basic calculation
      return this.calculateMatchScore(profile1, profile2);
    }
  }

  private async generateMatchReasons(
    profile1: any,
    profile2: any
  ): Promise<string[]> {
    const reasons: string[] = [];

    // Expertise matches
    const sharedTopics = profile1.interests.filter((i: string) => 
      profile2.expertise.includes(i)
    );
    if (sharedTopics.length > 0) {
      reasons.push(`Expertise in ${sharedTopics.join(', ')}`);
    }

    // Platform match
    if (profile1.user?.profile?.platform === profile2.user?.profile?.platform) {
      reasons.push(`Both create content for ${profile1.user.profile.platform}`);
    }

    // Style compatibility
    if (profile1.preferredMentorshipStyle === profile2.preferredMentorshipStyle) {
      reasons.push(`Compatible ${profile1.preferredMentorshipStyle} mentorship style`);
    }

    // Timezone
    const timezoneGap = Math.abs(
      this.getTimezoneOffset(profile1.timezone) - 
      this.getTimezoneOffset(profile2.timezone)
    );
    if (timezoneGap <= 3) {
      reasons.push('Compatible timezones for scheduling');
    }

    return reasons;
  }

  private getTimezoneOffset(timezone: string): number {
    // Simplified timezone offset calculation
    const offsets: Record<string, number> = {
      'UTC': 0,
      'EST': -5,
      'CST': -6,
      'MST': -7,
      'PST': -8,
      'CET': 1,
      'JST': 9,
      'AEST': 10
    };
    return offsets[timezone] || 0;
  }

  private formatMentorshipProfile(profile: any): MentorshipProfile {
    return {
      id: profile.id,
      userId: profile.userId,
      user: {
        id: profile.user.id,
        name: profile.user.name || 'Anonymous',
        image: profile.user.image,
        level: profile.user.gamificationProfile?.level || 1,
        platform: profile.user.profile?.platform || '',
        niche: profile.user.profile?.niche || '',
        achievements: profile.user.achievements?.map((a: any) => a.badgeId) || []
      },
      role: profile.role,
      expertise: profile.expertise,
      interests: profile.interests,
      availability: profile.availability,
      experience: profile.experience,
      bio: profile.bio,
      goals: profile.goals,
      preferredMentorshipStyle: profile.preferredMentorshipStyle,
      languages: profile.languages,
      timezone: profile.timezone,
      rating: profile.rating,
      reviewCount: profile.reviewCount,
      mentorshipCount: profile.mentorshipCount || 0,
      isVerified: profile.isVerified,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    };
  }

  private formatMatch(match: any): MentorshipMatch {
    return {
      id: match.id,
      mentorId: match.mentorId,
      menteeId: match.menteeId,
      status: match.status,
      matchScore: match.matchScore,
      matchReasons: match.matchReasons,
      goals: match.goals,
      duration: {
        start: match.startDate,
        end: match.endDate,
        commitment: match.commitment
      },
      sessions: match.sessions || [],
      feedback: {
        mentorRating: match.mentorRating,
        menteeRating: match.menteeRating,
        mentorReview: match.mentorReview,
        menteeReview: match.menteeReview
      },
      createdAt: match.createdAt,
      updatedAt: match.updatedAt
    };
  }
}

export const mentorshipService = new MentorshipService();