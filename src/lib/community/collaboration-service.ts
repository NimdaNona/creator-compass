import { prisma } from '@/lib/prisma';
import { 
  CreatorCollaboration,
  CollaborationType,
  CollaborationStatus,
  CollaborationRequirement,
  CollaborationMilestone,
  CollaborationApplication
} from '@/types/community';

export class CollaborationService {
  async createCollaboration(
    creatorId: string,
    data: {
      title: string;
      description: string;
      type: CollaborationType;
      requirements: CollaborationRequirement[];
      deliverables: string[];
      timeline: {
        startDate: Date;
        endDate: Date;
        milestones: Omit<CollaborationMilestone, 'id' | 'status'>[];
      };
      tags: string[];
    }
  ): Promise<CreatorCollaboration> {
    const collaboration = await prisma.collaboration.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        status: CollaborationStatus.OPEN,
        creatorId,
        requirements: data.requirements,
        deliverables: data.deliverables,
        startDate: data.timeline.startDate,
        endDate: data.timeline.endDate,
        tags: data.tags,
        milestones: {
          create: data.timeline.milestones.map(milestone => ({
            title: milestone.title,
            description: milestone.description,
            dueDate: milestone.dueDate,
            status: 'pending',
            assignedTo: milestone.assignedTo
          }))
        }
      },
      include: this.getCollaborationIncludes()
    });

    return this.formatCollaboration(collaboration);
  }

  async getCollaborations(
    filters: {
      type?: CollaborationType;
      status?: CollaborationStatus;
      creatorId?: string;
      tags?: string[];
      search?: string;
    } = {},
    pagination: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ collaborations: CreatorCollaboration[]; total: number }> {
    const { limit = 20, offset = 0 } = pagination;

    const where: any = {};
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
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

    const [collaborations, total] = await Promise.all([
      prisma.collaboration.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: this.getCollaborationIncludes()
      }),
      prisma.collaboration.count({ where })
    ]);

    return {
      collaborations: collaborations.map(c => this.formatCollaboration(c)),
      total
    };
  }

  async getCollaboration(id: string): Promise<CreatorCollaboration | null> {
    const collaboration = await prisma.collaboration.findUnique({
      where: { id },
      include: this.getCollaborationIncludes()
    });

    if (!collaboration) return null;
    return this.formatCollaboration(collaboration);
  }

  async applyToCollaboration(
    collaborationId: string,
    applicantId: string,
    data: {
      message: string;
      portfolio?: string[];
    }
  ): Promise<CollaborationApplication> {
    // Check if already applied
    const existing = await prisma.collaborationApplication.findUnique({
      where: {
        collaborationId_applicantId: {
          collaborationId,
          applicantId
        }
      }
    });

    if (existing) {
      throw new Error('Already applied to this collaboration');
    }

    const application = await prisma.collaborationApplication.create({
      data: {
        collaborationId,
        applicantId,
        message: data.message,
        portfolio: data.portfolio,
        status: 'pending'
      },
      include: {
        applicant: {
          include: {
            profile: true,
            gamificationProfile: true
          }
        }
      }
    });

    return this.formatApplication(application);
  }

  async reviewApplication(
    applicationId: string,
    reviewerId: string,
    decision: 'accepted' | 'rejected'
  ): Promise<CollaborationApplication> {
    const application = await prisma.collaborationApplication.findUnique({
      where: { id: applicationId },
      include: { collaboration: true }
    });

    if (!application || application.collaboration.creatorId !== reviewerId) {
      throw new Error('Unauthorized');
    }

    const updated = await prisma.collaborationApplication.update({
      where: { id: applicationId },
      data: {
        status: decision,
        reviewedAt: new Date(),
        reviewedBy: reviewerId
      },
      include: {
        applicant: {
          include: {
            profile: true,
            gamificationProfile: true
          }
        }
      }
    });

    // If accepted, add as collaborator
    if (decision === 'accepted') {
      await prisma.collaboration.update({
        where: { id: application.collaborationId },
        data: {
          collaborators: {
            connect: { id: application.applicantId }
          }
        }
      });
    }

    return this.formatApplication(updated);
  }

  async updateCollaborationStatus(
    collaborationId: string,
    creatorId: string,
    status: CollaborationStatus
  ): Promise<void> {
    const collaboration = await prisma.collaboration.findUnique({
      where: { id: collaborationId }
    });

    if (!collaboration || collaboration.creatorId !== creatorId) {
      throw new Error('Unauthorized');
    }

    await prisma.collaboration.update({
      where: { id: collaborationId },
      data: { status }
    });
  }

  async updateMilestone(
    milestoneId: string,
    userId: string,
    data: {
      status?: 'pending' | 'in_progress' | 'completed';
      notes?: string;
    }
  ): Promise<void> {
    const milestone = await prisma.collaborationMilestone.findUnique({
      where: { id: milestoneId },
      include: { collaboration: true }
    });

    if (!milestone) {
      throw new Error('Milestone not found');
    }

    // Check if user is creator or collaborator
    const isAuthorized = milestone.collaboration.creatorId === userId ||
      milestone.collaboration.collaborators.some(c => c === userId);

    if (!isAuthorized) {
      throw new Error('Unauthorized');
    }

    await prisma.collaborationMilestone.update({
      where: { id: milestoneId },
      data
    });
  }

  async getRecommendedCollaborators(
    userId: string,
    collaborationType: CollaborationType
  ): Promise<any[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        gamificationProfile: true
      }
    });

    if (!user || !user.profile) return [];

    // Find users with complementary skills and similar level
    const recommendations = await prisma.user.findMany({
      where: {
        id: { not: userId },
        profile: {
          isNot: null,
          platform: user.profile.platform,
          OR: [
            { niche: user.profile.niche },
            { niche: { in: this.getComplementaryNiches(user.profile.niche) } }
          ]
        },
        gamificationProfile: {
          level: {
            gte: Math.max(1, (user.gamificationProfile?.level || 1) - 2),
            lte: (user.gamificationProfile?.level || 1) + 2
          }
        }
      },
      include: {
        profile: true,
        gamificationProfile: true,
        achievements: true
      },
      take: 10
    });

    return recommendations.map(rec => ({
      id: rec.id,
      name: rec.name || 'Anonymous',
      image: rec.image,
      level: rec.gamificationProfile?.level || 1,
      platform: rec.profile?.platform,
      niche: rec.profile?.niche,
      achievements: rec.achievements.length,
      matchScore: this.calculateMatchScore(user, rec, collaborationType)
    }));
  }

  private getCollaborationIncludes() {
    return {
      creator: {
        include: {
          profile: true,
          gamificationProfile: true
        }
      },
      applications: {
        include: {
          applicant: {
            include: {
              profile: true,
              gamificationProfile: true
            }
          }
        }
      },
      collaborators: {
        include: {
          profile: true,
          gamificationProfile: true
        }
      },
      milestones: true
    };
  }

  private formatCollaboration(collaboration: any): CreatorCollaboration {
    return {
      id: collaboration.id,
      title: collaboration.title,
      description: collaboration.description,
      type: collaboration.type,
      status: collaboration.status,
      creatorId: collaboration.creatorId,
      creator: {
        id: collaboration.creator.id,
        name: collaboration.creator.name || 'Anonymous',
        image: collaboration.creator.image,
        level: collaboration.creator.gamificationProfile?.level || 1,
        platform: collaboration.creator.profile?.platform || '',
        niche: collaboration.creator.profile?.niche || ''
      },
      requirements: collaboration.requirements,
      deliverables: collaboration.deliverables,
      timeline: {
        startDate: collaboration.startDate,
        endDate: collaboration.endDate,
        milestones: collaboration.milestones
      },
      applications: collaboration.applications.map((a: any) => this.formatApplication(a)),
      collaborators: collaboration.collaborators.map((c: any) => c.id),
      tags: collaboration.tags,
      createdAt: collaboration.createdAt,
      updatedAt: collaboration.updatedAt
    };
  }

  private formatApplication(application: any): CollaborationApplication {
    return {
      id: application.id,
      collaborationId: application.collaborationId,
      applicantId: application.applicantId,
      applicant: {
        id: application.applicant.id,
        name: application.applicant.name || 'Anonymous',
        image: application.applicant.image,
        level: application.applicant.gamificationProfile?.level || 1,
        platform: application.applicant.profile?.platform || '',
        niche: application.applicant.profile?.niche || ''
      },
      message: application.message,
      portfolio: application.portfolio,
      status: application.status,
      createdAt: application.createdAt,
      reviewedAt: application.reviewedAt,
      reviewedBy: application.reviewedBy
    };
  }

  private getComplementaryNiches(niche: string): string[] {
    const complementaryMap: Record<string, string[]> = {
      'gaming': ['technology', 'entertainment'],
      'technology': ['gaming', 'education', 'tutorials'],
      'lifestyle': ['fashion', 'travel', 'food'],
      'education': ['technology', 'tutorials'],
      'fitness': ['lifestyle', 'food'],
      'music': ['entertainment', 'art'],
      'comedy': ['entertainment'],
      'food': ['lifestyle', 'travel'],
      'travel': ['lifestyle', 'food'],
      'fashion': ['lifestyle', 'beauty'],
      'beauty': ['fashion', 'lifestyle'],
      'art': ['music', 'entertainment']
    };

    return complementaryMap[niche] || [];
  }

  private calculateMatchScore(
    user: any,
    candidate: any,
    collaborationType: CollaborationType
  ): number {
    let score = 50; // Base score

    // Platform match
    if (user.profile?.platform === candidate.profile?.platform) {
      score += 20;
    }

    // Niche compatibility
    if (user.profile?.niche === candidate.profile?.niche) {
      score += 10;
    } else if (this.getComplementaryNiches(user.profile?.niche || '').includes(candidate.profile?.niche || '')) {
      score += 15;
    }

    // Level proximity
    const levelDiff = Math.abs((user.gamificationProfile?.level || 1) - (candidate.gamificationProfile?.level || 1));
    score += Math.max(0, 10 - levelDiff * 2);

    // Achievement count
    score += Math.min(10, candidate.achievements?.length || 0);

    return Math.min(100, score);
  }
}

export const collaborationService = new CollaborationService();