export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  category: PostCategory;
  tags: string[];
  authorId: string;
  author: {
    id: string;
    name: string;
    image?: string;
    level: number;
    badges: string[];
  };
  likes: number;
  likedBy: string[];
  replies: number;
  views: number;
  isPinned: boolean;
  isLocked: boolean;
  isFeatured: boolean;
  attachments?: PostAttachment[];
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
}

export interface PostReply {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    image?: string;
    level: number;
    badges: string[];
  };
  parentReplyId?: string;
  likes: number;
  likedBy: string[];
  isBestAnswer: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostAttachment {
  id: string;
  type: 'image' | 'video' | 'file';
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export enum PostCategory {
  GENERAL = 'general',
  HELP = 'help',
  SHOWCASE = 'showcase',
  FEEDBACK = 'feedback',
  COLLABORATION = 'collaboration',
  RESOURCES = 'resources',
  TUTORIALS = 'tutorials',
  ANNOUNCEMENTS = 'announcements'
}

export interface CommunityChannel {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: PostCategory;
  postCount: number;
  memberCount: number;
  lastActivityAt: Date;
  moderators: string[];
  rules?: string[];
  isPrivate: boolean;
  requiredLevel?: number;
}

export interface CommunityStats {
  totalPosts: number;
  totalReplies: number;
  totalMembers: number;
  activeMembers: number;
  todaysPosts: number;
  weeklyGrowth: number;
  topContributors: {
    userId: string;
    user: {
      name: string;
      image?: string;
      level: number;
    };
    contributions: number;
    helpfulReplies: number;
  }[];
}

export interface CreatorCollaboration {
  id: string;
  title: string;
  description: string;
  type: CollaborationType;
  status: CollaborationStatus;
  creatorId: string;
  creator: {
    id: string;
    name: string;
    image?: string;
    level: number;
    platform: string;
    niche: string;
  };
  requirements: CollaborationRequirement[];
  deliverables: string[];
  timeline: {
    startDate: Date;
    endDate: Date;
    milestones: CollaborationMilestone[];
  };
  applications: CollaborationApplication[];
  collaborators: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export enum CollaborationType {
  VIDEO = 'video',
  PODCAST = 'podcast',
  STREAM = 'stream',
  SHORTS = 'shorts',
  SERIES = 'series',
  EVENT = 'event',
  COURSE = 'course',
  OTHER = 'other'
}

export enum CollaborationStatus {
  OPEN = 'open',
  IN_REVIEW = 'in_review',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface CollaborationRequirement {
  type: 'subscribers' | 'views' | 'platform' | 'niche' | 'skill' | 'equipment' | 'availability';
  value: string | number;
  required: boolean;
}

export interface CollaborationMilestone {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo?: string[];
}

export interface CollaborationApplication {
  id: string;
  collaborationId: string;
  applicantId: string;
  applicant: {
    id: string;
    name: string;
    image?: string;
    level: number;
    platform: string;
    niche: string;
  };
  message: string;
  portfolio?: string[];
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}

export interface MentorshipProfile {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    image?: string;
    level: number;
    platform: string;
    niche: string;
    achievements: string[];
  };
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
  rating?: number;
  reviewCount?: number;
  mentorshipCount?: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MentorAvailability {
  hoursPerWeek: number;
  preferredDays: string[];
  preferredTimes: string[];
  sessionDuration: number; // in minutes
  communicationMethods: ('video' | 'voice' | 'chat' | 'email')[];
}

export enum MentorshipStyle {
  STRUCTURED = 'structured',
  CASUAL = 'casual',
  PROJECT_BASED = 'project_based',
  GOAL_ORIENTED = 'goal_oriented',
  FLEXIBLE = 'flexible'
}

export interface MentorshipMatch {
  id: string;
  mentorId: string;
  menteeId: string;
  status: MentorshipStatus;
  matchScore: number;
  matchReasons: string[];
  goals: string[];
  duration: {
    start: Date;
    end?: Date;
    commitment: string;
  };
  sessions: MentorshipSession[];
  feedback?: {
    mentorRating?: number;
    menteeRating?: number;
    mentorReview?: string;
    menteeReview?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export enum MentorshipStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface MentorshipSession {
  id: string;
  matchId: string;
  scheduledAt: Date;
  duration: number;
  type: 'video' | 'voice' | 'chat';
  agenda: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  recording?: string;
  resources?: string[];
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  hostId: string;
  host: {
    id: string;
    name: string;
    image?: string;
    level: number;
  };
  coHosts?: string[];
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
  registeredCount: number;
  attendees: string[];
  tags: string[];
  requirements?: string[];
  agenda?: EventAgendaItem[];
  recordings?: string[];
  resources?: string[];
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum EventType {
  WORKSHOP = 'workshop',
  WEBINAR = 'webinar',
  MEETUP = 'meetup',
  CHALLENGE = 'challenge',
  HACKATHON = 'hackathon',
  Q_AND_A = 'q_and_a',
  NETWORKING = 'networking',
  LAUNCH = 'launch'
}

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  REGISTRATION_OPEN = 'registration_open',
  REGISTRATION_CLOSED = 'registration_closed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface EventAgendaItem {
  time: string;
  title: string;
  description: string;
  speaker?: string;
}

export interface CommunityChallenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  creatorId: string;
  creator: {
    id: string;
    name: string;
    image?: string;
    level: number;
  };
  rules: string[];
  prizes?: ChallengePrize[];
  startDate: Date;
  endDate: Date;
  submissionDeadline: Date;
  requirements: string[];
  judgingCriteria: JudgingCriterion[];
  participants: ChallengeParticipant[];
  submissions: ChallengeSubmission[];
  winners?: string[];
  tags: string[];
  status: ChallengeStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum ChallengeType {
  CONTENT_CREATION = 'content_creation',
  GROWTH = 'growth',
  ENGAGEMENT = 'engagement',
  CREATIVITY = 'creativity',
  TECHNICAL = 'technical',
  COLLABORATION = 'collaboration',
  MARATHON = 'marathon'
}

export enum ChallengeStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  SUBMISSION_CLOSED = 'submission_closed',
  JUDGING = 'judging',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface ChallengePrize {
  place: number;
  title: string;
  description: string;
  value?: string;
  type: 'cash' | 'product' | 'service' | 'recognition' | 'other';
}

export interface JudgingCriterion {
  name: string;
  description: string;
  weight: number; // percentage
}

export interface ChallengeParticipant {
  userId: string;
  joinedAt: Date;
  status: 'registered' | 'submitted' | 'disqualified' | 'withdrawn';
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    image?: string;
    level: number;
  };
  title: string;
  description: string;
  links: string[];
  attachments?: PostAttachment[];
  metrics?: Record<string, number>;
  score?: number;
  rank?: number;
  feedback?: string;
  submittedAt: Date;
  updatedAt: Date;
}