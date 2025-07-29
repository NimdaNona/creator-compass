import { prisma } from '@/lib/prisma';
import { 
  CommunityPost, 
  PostCategory, 
  PostReply,
  CommunityChannel,
  CommunityStats,
  PostAttachment
} from '@/types/community';

export class CommunityService {
  // Post Management
  async createPost(
    userId: string,
    data: {
      title: string;
      content: string;
      category: PostCategory;
      tags: string[];
      attachments?: PostAttachment[];
    }
  ): Promise<CommunityPost> {
    const post = await prisma.communityPost.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category,
        tags: data.tags,
        authorId: userId,
        attachments: data.attachments ? {
          create: data.attachments
        } : undefined
      },
      include: {
        author: {
          include: {
            achievements: true
          }
        },
        _count: {
          select: {
            replies: true,
            likes: true
          }
        }
      }
    });

    return this.formatPost(post);
  }

  async getPosts(
    filters: {
      category?: PostCategory;
      tags?: string[];
      authorId?: string;
      search?: string;
      featured?: boolean;
    } = {},
    pagination: {
      limit?: number;
      offset?: number;
      sortBy?: 'recent' | 'popular' | 'trending';
    } = {}
  ): Promise<{ posts: CommunityPost[]; total: number }> {
    const { limit = 20, offset = 0, sortBy = 'recent' } = pagination;

    const where: any = {};
    if (filters.category) where.category = filters.category;
    if (filters.authorId) where.authorId = filters.authorId;
    if (filters.featured) where.isFeatured = true;
    if (filters.tags?.length) {
      where.tags = { hasSome: filters.tags };
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const orderBy = this.getPostOrderBy(sortBy);

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        include: {
          author: {
            include: {
              achievements: true
            }
          },
          _count: {
            select: {
              replies: true,
              likes: true
            }
          }
        }
      }),
      prisma.communityPost.count({ where })
    ]);

    return {
      posts: posts.map(post => this.formatPost(post)),
      total
    };
  }

  async getPost(postId: string, userId?: string): Promise<CommunityPost | null> {
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          include: {
            achievements: true
          }
        },
        attachments: true,
        likes: userId ? {
          where: { userId }
        } : false,
        _count: {
          select: {
            replies: true,
            likes: true
          }
        }
      }
    });

    if (!post) return null;

    // Increment view count
    await prisma.communityPost.update({
      where: { id: postId },
      data: { views: { increment: 1 } }
    });

    return this.formatPost(post);
  }

  async updatePost(
    postId: string,
    userId: string,
    data: {
      title?: string;
      content?: string;
      category?: PostCategory;
      tags?: string[];
    }
  ): Promise<CommunityPost> {
    const post = await prisma.communityPost.findUnique({
      where: { id: postId }
    });

    if (!post || post.authorId !== userId) {
      throw new Error('Unauthorized');
    }

    const updated = await prisma.communityPost.update({
      where: { id: postId },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        author: {
          include: {
            achievements: true
          }
        },
        _count: {
          select: {
            replies: true,
            likes: true
          }
        }
      }
    });

    return this.formatPost(updated);
  }

  async deletePost(postId: string, userId: string): Promise<void> {
    const post = await prisma.communityPost.findUnique({
      where: { id: postId }
    });

    if (!post || post.authorId !== userId) {
      throw new Error('Unauthorized');
    }

    await prisma.communityPost.delete({
      where: { id: postId }
    });
  }

  async toggleLike(postId: string, userId: string): Promise<boolean> {
    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId
        }
      }
    });

    if (existingLike) {
      await prisma.postLike.delete({
        where: {
          postId_userId: {
            postId,
            userId
          }
        }
      });
      return false;
    } else {
      await prisma.postLike.create({
        data: {
          postId,
          userId
        }
      });
      return true;
    }
  }

  // Reply Management
  async createReply(
    postId: string,
    userId: string,
    data: {
      content: string;
      parentReplyId?: string;
    }
  ): Promise<PostReply> {
    const reply = await prisma.postReply.create({
      data: {
        postId,
        authorId: userId,
        content: data.content,
        parentReplyId: data.parentReplyId
      },
      include: {
        author: {
          include: {
            achievements: true
          }
        },
        _count: {
          select: {
            likes: true
          }
        }
      }
    });

    // Update post's last activity
    await prisma.communityPost.update({
      where: { id: postId },
      data: { lastActivityAt: new Date() }
    });

    return this.formatReply(reply);
  }

  async getReplies(
    postId: string,
    pagination: { limit?: number; offset?: number } = {}
  ): Promise<{ replies: PostReply[]; total: number }> {
    const { limit = 50, offset = 0 } = pagination;

    const [replies, total] = await Promise.all([
      prisma.postReply.findMany({
        where: { postId },
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip: offset,
        include: {
          author: {
            include: {
              achievements: true
            }
          },
          _count: {
            select: {
              likes: true
            }
          }
        }
      }),
      prisma.postReply.count({ where: { postId } })
    ]);

    return {
      replies: replies.map(reply => this.formatReply(reply)),
      total
    };
  }

  async markBestAnswer(replyId: string, postAuthorId: string): Promise<void> {
    const reply = await prisma.postReply.findUnique({
      where: { id: replyId },
      include: { post: true }
    });

    if (!reply || reply.post.authorId !== postAuthorId) {
      throw new Error('Unauthorized');
    }

    // Remove previous best answer
    await prisma.postReply.updateMany({
      where: {
        postId: reply.postId,
        isBestAnswer: true
      },
      data: { isBestAnswer: false }
    });

    // Set new best answer
    await prisma.postReply.update({
      where: { id: replyId },
      data: { isBestAnswer: true }
    });
  }

  // Channel Management
  async getChannels(): Promise<CommunityChannel[]> {
    const channels = await prisma.communityChannel.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: {
            posts: true,
            members: true
          }
        }
      }
    });

    return channels.map(channel => ({
      id: channel.id,
      name: channel.name,
      description: channel.description,
      icon: channel.icon,
      color: channel.color,
      category: channel.category as PostCategory,
      postCount: channel._count.posts,
      memberCount: channel._count.members,
      lastActivityAt: channel.lastActivityAt,
      moderators: channel.moderators,
      rules: channel.rules,
      isPrivate: channel.isPrivate,
      requiredLevel: channel.requiredLevel
    }));
  }

  async joinChannel(channelId: string, userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { gamificationProfile: true }
    });

    const channel = await prisma.communityChannel.findUnique({
      where: { id: channelId }
    });

    if (!channel || !user) {
      throw new Error('Channel or user not found');
    }

    if (channel.isPrivate && channel.requiredLevel) {
      const userLevel = user.gamificationProfile?.level || 1;
      if (userLevel < channel.requiredLevel) {
        throw new Error(`Level ${channel.requiredLevel} required to join this channel`);
      }
    }

    await prisma.channelMember.create({
      data: {
        channelId,
        userId
      }
    });
  }

  // Community Stats
  async getCommunityStats(): Promise<CommunityStats> {
    const [
      totalPosts,
      totalReplies,
      totalMembers,
      todaysPosts,
      lastWeekPosts,
      thisWeekPosts,
      topContributors
    ] = await Promise.all([
      prisma.communityPost.count(),
      prisma.postReply.count(),
      prisma.user.count(),
      prisma.communityPost.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.communityPost.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.communityPost.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      this.getTopContributors()
    ]);

    const weeklyGrowth = lastWeekPosts > 0 
      ? ((thisWeekPosts - lastWeekPosts) / lastWeekPosts) * 100 
      : 0;

    const activeMembers = await prisma.user.count({
      where: {
        OR: [
          {
            posts: {
              some: {
                createdAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
              }
            }
          },
          {
            replies: {
              some: {
                createdAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
              }
            }
          }
        ]
      }
    });

    return {
      totalPosts,
      totalReplies,
      totalMembers,
      activeMembers,
      todaysPosts,
      weeklyGrowth,
      topContributors
    };
  }

  private async getTopContributors() {
    const contributors = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        gamificationProfile: {
          select: { level: true }
        },
        _count: {
          select: {
            posts: {
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
              }
            },
            replies: {
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
              }
            }
          }
        },
        replies: {
          where: {
            isBestAnswer: true
          },
          select: { id: true }
        }
      },
      orderBy: [
        {
          posts: {
            _count: 'desc'
          }
        },
        {
          replies: {
            _count: 'desc'
          }
        }
      ],
      take: 10
    });

    return contributors.map(contributor => ({
      userId: contributor.id,
      user: {
        name: contributor.name || 'Anonymous',
        image: contributor.image,
        level: contributor.gamificationProfile?.level || 1
      },
      contributions: contributor._count.posts + contributor._count.replies,
      helpfulReplies: contributor.replies.length
    }));
  }

  private getPostOrderBy(sortBy: 'recent' | 'popular' | 'trending') {
    switch (sortBy) {
      case 'popular':
        return [
          { likes: { _count: 'desc' } },
          { replies: { _count: 'desc' } },
          { views: 'desc' }
        ];
      case 'trending':
        return [
          { lastActivityAt: 'desc' },
          { likes: { _count: 'desc' } }
        ];
      default:
        return { createdAt: 'desc' };
    }
  }

  private formatPost(post: any): CommunityPost {
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      tags: post.tags,
      authorId: post.authorId,
      author: {
        id: post.author.id,
        name: post.author.name || 'Anonymous',
        image: post.author.image,
        level: post.author.gamificationProfile?.level || 1,
        badges: post.author.achievements?.map((a: any) => a.badgeId) || []
      },
      likes: post._count?.likes || 0,
      likedBy: post.likes?.map((l: any) => l.userId) || [],
      replies: post._count?.replies || 0,
      views: post.views,
      isPinned: post.isPinned,
      isLocked: post.isLocked,
      isFeatured: post.isFeatured,
      attachments: post.attachments,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      lastActivityAt: post.lastActivityAt
    };
  }

  private formatReply(reply: any): PostReply {
    return {
      id: reply.id,
      postId: reply.postId,
      content: reply.content,
      authorId: reply.authorId,
      author: {
        id: reply.author.id,
        name: reply.author.name || 'Anonymous',
        image: reply.author.image,
        level: reply.author.gamificationProfile?.level || 1,
        badges: reply.author.achievements?.map((a: any) => a.badgeId) || []
      },
      parentReplyId: reply.parentReplyId,
      likes: reply._count?.likes || 0,
      likedBy: reply.likes?.map((l: any) => l.userId) || [],
      isBestAnswer: reply.isBestAnswer,
      createdAt: reply.createdAt,
      updatedAt: reply.updatedAt
    };
  }
}

export const communityService = new CommunityService();