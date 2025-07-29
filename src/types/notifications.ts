export type NotificationType =
  | 'milestone_achieved'
  | 'milestone_upcoming'
  | 'streak_achieved'
  | 'streak_warning'
  | 'streak_lost'
  | 'daily_task_reminder'
  | 'content_schedule'
  | 'feature_announcement'
  | 'platform_update'
  | 'achievement_unlocked'
  | 'level_up'
  | 'trial_ending'
  | 'subscription_renewed'
  | 'payment_failed'
  // Community notification types
  | 'new_reply'                    // Someone replied to your post
  | 'post_liked'                   // Your post was liked
  | 'collaboration_application'     // New application for your collaboration
  | 'collaboration_accepted'        // Your collaboration application was accepted
  | 'mentorship_request'           // New mentorship request
  | 'event_reminder'               // Upcoming event reminder
  | 'challenge_update'             // Challenge status update
  | 'community_mention';           // You were mentioned in a post/reply

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  icon: string;
  color: string;
  animation: string;
  duration: number;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationPreferences {
  dailyReminders: boolean;
  milestoneAlerts: boolean;
  streakNotifications: boolean;
  featureAnnouncements: boolean;
  subscriptionAlerts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  reminderTime: string; // HH:MM format
  quietHoursStart?: string; // HH:MM format
  quietHoursEnd?: string; // HH:MM format
  // Community notification preferences
  communityReplies: boolean;
  communityLikes: boolean;
  communityMentions: boolean;
  collaborationUpdates: boolean;
  mentorshipUpdates: boolean;
  eventReminders: boolean;
  challengeUpdates: boolean;
}