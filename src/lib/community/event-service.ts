import { prisma } from '@/lib/prisma';
import { 
  CommunityEvent,
  EventType,
  EventStatus,
  EventAgendaItem,
  CommunityChallenge,
  ChallengeType,
  ChallengeStatus,
  ChallengePrize,
  JudgingCriterion,
  ChallengeParticipant,
  ChallengeSubmission
} from '@/types/community';

export class EventService {
  // Event Management
  async createEvent(
    hostId: string,
    data: {
      title: string;
      description: string;
      type: EventType;
      startTime: Date;
      endTime: Date;
      timezone: string;
      location: {
        type: 'online' | 'in_person' | 'hybrid';
        platform?: string;
        url?: string;
        address?: string;
      };
      capacity?: number;
      tags: string[];
      requirements?: string[];
      agenda?: EventAgendaItem[];
      coHosts?: string[];
    }
  ): Promise<CommunityEvent> {
    const event = await prisma.communityEvent.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        hostId,
        startTime: data.startTime,
        endTime: data.endTime,
        timezone: data.timezone,
        locationType: data.location.type,
        locationPlatform: data.location.platform,
        locationUrl: data.location.url,
        locationAddress: data.location.address,
        capacity: data.capacity,
        tags: data.tags,
        requirements: data.requirements,
        agenda: data.agenda,
        coHosts: data.coHosts,
        status: EventStatus.DRAFT
      },
      include: this.getEventIncludes()
    });

    return this.formatEvent(event);
  }

  async getEvents(
    filters: {
      type?: EventType;
      status?: EventStatus;
      hostId?: string;
      startAfter?: Date;
      endBefore?: Date;
      tags?: string[];
      search?: string;
    } = {},
    pagination: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ events: CommunityEvent[]; total: number }> {
    const { limit = 20, offset = 0 } = pagination;

    const where: any = {};
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.hostId) where.hostId = filters.hostId;
    if (filters.startAfter) where.startTime = { gte: filters.startAfter };
    if (filters.endBefore) where.endTime = { lte: filters.endBefore };
    if (filters.tags?.length) {
      where.tags = { hasSome: filters.tags };
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const [events, total] = await Promise.all([
      prisma.communityEvent.findMany({
        where,
        orderBy: { startTime: 'asc' },
        take: limit,
        skip: offset,
        include: this.getEventIncludes()
      }),
      prisma.communityEvent.count({ where })
    ]);

    return {
      events: events.map(e => this.formatEvent(e)),
      total
    };
  }

  async publishEvent(eventId: string, hostId: string): Promise<void> {
    const event = await prisma.communityEvent.findUnique({
      where: { id: eventId }
    });

    if (!event || event.hostId !== hostId) {
      throw new Error('Unauthorized');
    }

    await prisma.communityEvent.update({
      where: { id: eventId },
      data: {
        status: EventStatus.PUBLISHED,
        publishedAt: new Date()
      }
    });

    // Schedule status updates
    if (event.startTime > new Date()) {
      await this.scheduleEventStatusUpdate(
        eventId,
        EventStatus.REGISTRATION_OPEN,
        new Date()
      );
    }
  }

  async registerForEvent(eventId: string, userId: string): Promise<void> {
    const event = await prisma.communityEvent.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { attendees: true }
        }
      }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.status !== EventStatus.REGISTRATION_OPEN) {
      throw new Error('Registration is not open');
    }

    if (event.capacity && event._count.attendees >= event.capacity) {
      throw new Error('Event is full');
    }

    // Check if already registered
    const existing = await prisma.eventAttendee.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId
        }
      }
    });

    if (existing) {
      throw new Error('Already registered');
    }

    await prisma.eventAttendee.create({
      data: {
        eventId,
        userId,
        registeredAt: new Date()
      }
    });
  }

  async cancelRegistration(eventId: string, userId: string): Promise<void> {
    await prisma.eventAttendee.delete({
      where: {
        eventId_userId: {
          eventId,
          userId
        }
      }
    });
  }

  // Challenge Management
  async createChallenge(
    creatorId: string,
    data: {
      title: string;
      description: string;
      type: ChallengeType;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      rules: string[];
      prizes?: ChallengePrize[];
      startDate: Date;
      endDate: Date;
      submissionDeadline: Date;
      requirements: string[];
      judgingCriteria: JudgingCriterion[];
      tags: string[];
    }
  ): Promise<CommunityChallenge> {
    const challenge = await prisma.communityChallenge.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        difficulty: data.difficulty,
        creatorId,
        rules: data.rules,
        prizes: data.prizes,
        startDate: data.startDate,
        endDate: data.endDate,
        submissionDeadline: data.submissionDeadline,
        requirements: data.requirements,
        judgingCriteria: data.judgingCriteria,
        tags: data.tags,
        status: ChallengeStatus.UPCOMING
      },
      include: this.getChallengeIncludes()
    });

    // Schedule status updates
    await this.scheduleChallengeStatusUpdates(challenge.id, data.startDate, data.submissionDeadline, data.endDate);

    return this.formatChallenge(challenge);
  }

  async getChallenges(
    filters: {
      type?: ChallengeType;
      status?: ChallengeStatus;
      difficulty?: 'beginner' | 'intermediate' | 'advanced';
      creatorId?: string;
      tags?: string[];
      search?: string;
    } = {},
    pagination: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ challenges: CommunityChallenge[]; total: number }> {
    const { limit = 20, offset = 0 } = pagination;

    const where: any = {};
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.difficulty) where.difficulty = filters.difficulty;
    if (filters.creatorId) where.creatorId = filters.creatorId;
    if (filters.tags?.length) {
      where.tags = { hasSome: filters.tags };
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const [challenges, total] = await Promise.all([
      prisma.communityChallenge.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: this.getChallengeIncludes()
      }),
      prisma.communityChallenge.count({ where })
    ]);

    return {
      challenges: challenges.map(c => this.formatChallenge(c)),
      total
    };
  }

  async joinChallenge(challengeId: string, userId: string): Promise<void> {
    const challenge = await prisma.communityChallenge.findUnique({
      where: { id: challengeId }
    });

    if (!challenge || challenge.status !== ChallengeStatus.ACTIVE) {
      throw new Error('Cannot join this challenge');
    }

    // Check if already joined
    const existing = await prisma.challengeParticipant.findUnique({
      where: {
        challengeId_userId: {
          challengeId,
          userId
        }
      }
    });

    if (existing) {
      throw new Error('Already joined this challenge');
    }

    await prisma.challengeParticipant.create({
      data: {
        challengeId,
        userId,
        status: 'registered'
      }
    });
  }

  async submitToChallenge(
    challengeId: string,
    userId: string,
    data: {
      title: string;
      description: string;
      links: string[];
      attachments?: any[];
      metrics?: Record<string, number>;
    }
  ): Promise<ChallengeSubmission> {
    const challenge = await prisma.communityChallenge.findUnique({
      where: { id: challengeId }
    });

    if (!challenge || challenge.status !== ChallengeStatus.ACTIVE) {
      throw new Error('Cannot submit to this challenge');
    }

    if (new Date() > challenge.submissionDeadline) {
      throw new Error('Submission deadline has passed');
    }

    // Check if participant
    const participant = await prisma.challengeParticipant.findUnique({
      where: {
        challengeId_userId: {
          challengeId,
          userId
        }
      }
    });

    if (!participant || participant.status !== 'registered') {
      throw new Error('Must join challenge before submitting');
    }

    // Check for existing submission
    const existing = await prisma.challengeSubmission.findFirst({
      where: {
        challengeId,
        userId
      }
    });

    if (existing) {
      throw new Error('Already submitted to this challenge');
    }

    const submission = await prisma.challengeSubmission.create({
      data: {
        challengeId,
        userId,
        title: data.title,
        description: data.description,
        links: data.links,
        attachments: data.attachments,
        metrics: data.metrics
      },
      include: {
        user: {
          include: {
            gamificationProfile: true
          }
        }
      }
    });

    // Update participant status
    await prisma.challengeParticipant.update({
      where: {
        challengeId_userId: {
          challengeId,
          userId
        }
      },
      data: { status: 'submitted' }
    });

    return this.formatSubmission(submission);
  }

  async judgeSubmission(
    submissionId: string,
    judgeId: string,
    data: {
      score: number;
      feedback: string;
    }
  ): Promise<void> {
    const submission = await prisma.challengeSubmission.findUnique({
      where: { id: submissionId },
      include: { challenge: true }
    });

    if (!submission || submission.challenge.creatorId !== judgeId) {
      throw new Error('Unauthorized');
    }

    await prisma.challengeSubmission.update({
      where: { id: submissionId },
      data: {
        score: data.score,
        feedback: data.feedback,
        judgedAt: new Date()
      }
    });
  }

  async announceWinners(
    challengeId: string,
    creatorId: string,
    winnerIds: string[]
  ): Promise<void> {
    const challenge = await prisma.communityChallenge.findUnique({
      where: { id: challengeId }
    });

    if (!challenge || challenge.creatorId !== creatorId) {
      throw new Error('Unauthorized');
    }

    // Update challenge with winners
    await prisma.communityChallenge.update({
      where: { id: challengeId },
      data: {
        winners: winnerIds,
        status: ChallengeStatus.COMPLETED
      }
    });

    // Rank submissions
    const submissions = await prisma.challengeSubmission.findMany({
      where: { challengeId },
      orderBy: { score: 'desc' }
    });

    for (let i = 0; i < submissions.length; i++) {
      await prisma.challengeSubmission.update({
        where: { id: submissions[i].id },
        data: { rank: i + 1 }
      });
    }
  }

  private async scheduleEventStatusUpdate(
    eventId: string,
    status: EventStatus,
    at: Date
  ): Promise<void> {
    // In production, this would use a job queue like Bull or Agenda
    // For now, we'll just note this needs to be implemented
    console.log(`Schedule status update for event ${eventId} to ${status} at ${at}`);
  }

  private async scheduleChallengeStatusUpdates(
    challengeId: string,
    startDate: Date,
    submissionDeadline: Date,
    endDate: Date
  ): Promise<void> {
    // Schedule status changes
    console.log(`Schedule challenge ${challengeId} status updates:
      - Active at: ${startDate}
      - Submission closed at: ${submissionDeadline}
      - Judging at: ${submissionDeadline}
      - Completed at: ${endDate}`);
  }

  private getEventIncludes() {
    return {
      host: {
        include: {
          gamificationProfile: true
        }
      },
      attendees: {
        include: {
          user: true
        }
      },
      _count: {
        select: {
          attendees: true
        }
      }
    };
  }

  private getChallengeIncludes() {
    return {
      creator: {
        include: {
          gamificationProfile: true
        }
      },
      participants: true,
      submissions: {
        include: {
          user: {
            include: {
              gamificationProfile: true
            }
          }
        }
      },
      _count: {
        select: {
          participants: true,
          submissions: true
        }
      }
    };
  }

  private formatEvent(event: any): CommunityEvent {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      type: event.type,
      hostId: event.hostId,
      host: {
        id: event.host.id,
        name: event.host.name || 'Anonymous',
        image: event.host.image,
        level: event.host.gamificationProfile?.level || 1
      },
      coHosts: event.coHosts,
      startTime: event.startTime,
      endTime: event.endTime,
      timezone: event.timezone,
      location: {
        type: event.locationType,
        platform: event.locationPlatform,
        url: event.locationUrl,
        address: event.locationAddress
      },
      capacity: event.capacity,
      registeredCount: event._count.attendees,
      attendees: event.attendees.map((a: any) => a.userId),
      tags: event.tags,
      requirements: event.requirements,
      agenda: event.agenda,
      recordings: event.recordings,
      resources: event.resources,
      status: event.status,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt
    };
  }

  private formatChallenge(challenge: any): CommunityChallenge {
    return {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      type: challenge.type,
      difficulty: challenge.difficulty,
      creatorId: challenge.creatorId,
      creator: {
        id: challenge.creator.id,
        name: challenge.creator.name || 'Anonymous',
        image: challenge.creator.image,
        level: challenge.creator.gamificationProfile?.level || 1
      },
      rules: challenge.rules,
      prizes: challenge.prizes,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      submissionDeadline: challenge.submissionDeadline,
      requirements: challenge.requirements,
      judgingCriteria: challenge.judgingCriteria,
      participants: challenge.participants.map((p: any) => ({
        userId: p.userId,
        joinedAt: p.joinedAt,
        status: p.status
      })),
      submissions: challenge.submissions.map((s: any) => this.formatSubmission(s)),
      winners: challenge.winners,
      tags: challenge.tags,
      status: challenge.status,
      createdAt: challenge.createdAt,
      updatedAt: challenge.updatedAt
    };
  }

  private formatSubmission(submission: any): ChallengeSubmission {
    return {
      id: submission.id,
      challengeId: submission.challengeId,
      userId: submission.userId,
      user: {
        id: submission.user.id,
        name: submission.user.name || 'Anonymous',
        image: submission.user.image,
        level: submission.user.gamificationProfile?.level || 1
      },
      title: submission.title,
      description: submission.description,
      links: submission.links,
      attachments: submission.attachments,
      metrics: submission.metrics,
      score: submission.score,
      rank: submission.rank,
      feedback: submission.feedback,
      submittedAt: submission.submittedAt,
      updatedAt: submission.updatedAt
    };
  }
}

export const eventService = new EventService();