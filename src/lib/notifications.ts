import { prisma } from '@/lib/db';
import { NotificationType } from '@/types/notifications';
import { sendEmail } from '@/lib/email';

// Notification service for creating and managing notifications
export class NotificationService {
  // Create a notification for a user
  static async create(
    userId: string,
    type: NotificationType,
    data: {
      title: string;
      message: string;
      icon?: string;
      color?: string;
      animation?: string;
      duration?: number;
      metadata?: Record<string, any>;
    }
  ) {
    try {
      // Check user preferences first
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { notificationPreferences: true }
      });

      const preferences = user?.notificationPreferences as any || {};
      
      // Check if user has disabled this notification type
      if (!this.shouldSendNotification(type, preferences)) {
        return null;
      }

      // Check quiet hours
      if (this.isInQuietHours(preferences)) {
        return null;
      }

      // Create the notification
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title: data.title,
          message: data.message,
          icon: data.icon || this.getDefaultIcon(type),
          color: data.color || this.getDefaultColor(type),
          animation: data.animation || this.getDefaultAnimation(type),
          duration: data.duration || 5000
        }
      });

      // Send real-time notification via SSE
      try {
        const { sendNotificationToUser } = await import('@/app/api/notifications/sse/route');
        sendNotificationToUser(userId, {
          id: notification.id,
          type,
          title: data.title,
          message: data.message,
          icon: data.icon,
          color: data.color,
          animation: data.animation,
          duration: data.duration,
          createdAt: notification.createdAt
        });
      } catch (error) {
        console.error('Error sending real-time notification:', error);
      }

      // Send email notification if enabled in preferences
      if (preferences.emailNotifications) {
        await this.sendEmailNotification(userId, notification);
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Bulk create notifications for multiple users
  static async createBulk(
    userIds: string[],
    type: NotificationType,
    data: {
      title: string;
      message: string;
      icon?: string;
      color?: string;
      animation?: string;
    }
  ) {
    const notifications = await Promise.all(
      userIds.map(userId => this.create(userId, type, data))
    );
    return notifications.filter(Boolean);
  }

  // Send email notification
  private static async sendEmailNotification(userId: string, notification: any) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true }
      });

      if (!user?.email) return;

      // Create email HTML based on notification type
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333; margin-bottom: 10px;">${notification.title}</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">${notification.message}</p>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #999; font-size: 14px;">
                You're receiving this email because you have email notifications enabled in your CreatorCompass settings.
              </p>
              <a href="${process.env.NEXTAUTH_URL}/settings/notifications" style="color: #6366f1; font-size: 14px;">
                Manage notification preferences
              </a>
            </div>
          </div>
        </div>
      `;

      await sendEmail({
        to: user.email,
        subject: notification.title,
        html: emailHtml
      });
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  // Check if notification should be sent based on preferences
  private static shouldSendNotification(
    type: NotificationType,
    preferences: any
  ): boolean {
    const categoryMap: Record<NotificationType, keyof typeof preferences> = {
      milestone_achieved: 'milestoneAlerts',
      milestone_upcoming: 'milestoneAlerts',
      streak_achieved: 'streakNotifications',
      streak_warning: 'streakNotifications',
      streak_lost: 'streakNotifications',
      daily_task_reminder: 'dailyReminders',
      content_schedule: 'dailyReminders',
      feature_announcement: 'featureAnnouncements',
      platform_update: 'featureAnnouncements',
      achievement_unlocked: 'milestoneAlerts',
      level_up: 'milestoneAlerts',
      trial_ending: 'subscriptionAlerts',
      subscription_renewed: 'subscriptionAlerts',
      payment_failed: 'subscriptionAlerts'
    };

    const category = categoryMap[type];
    return preferences[category] !== false;
  }

  // Check if current time is within quiet hours
  private static isInQuietHours(preferences: any): boolean {
    if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = preferences.quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = preferences.quietHoursEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // Get default icon for notification type
  private static getDefaultIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      milestone_achieved: '🎯',
      milestone_upcoming: '📅',
      streak_achieved: '🔥',
      streak_warning: '⚠️',
      streak_lost: '💔',
      daily_task_reminder: '📝',
      content_schedule: '📅',
      feature_announcement: '🎉',
      platform_update: '📢',
      achievement_unlocked: '🏆',
      level_up: '⚡',
      trial_ending: '⏰',
      subscription_renewed: '✅',
      payment_failed: '❌'
    };
    return icons[type] || '📬';
  }

  // Get default color for notification type
  private static getDefaultColor(type: NotificationType): string {
    const colors: Record<NotificationType, string> = {
      milestone_achieved: 'green',
      milestone_upcoming: 'blue',
      streak_achieved: 'orange',
      streak_warning: 'yellow',
      streak_lost: 'red',
      daily_task_reminder: 'blue',
      content_schedule: 'purple',
      feature_announcement: 'purple',
      platform_update: 'blue',
      achievement_unlocked: 'gold',
      level_up: 'purple',
      trial_ending: 'yellow',
      subscription_renewed: 'green',
      payment_failed: 'red'
    };
    return colors[type] || 'gray';
  }

  // Get default animation for notification type
  private static getDefaultAnimation(type: NotificationType): string {
    const animations: Record<NotificationType, string> = {
      milestone_achieved: 'bounce',
      milestone_upcoming: 'slide',
      streak_achieved: 'bounce',
      streak_warning: 'pulse',
      streak_lost: 'shake',
      daily_task_reminder: 'slide',
      content_schedule: 'slide',
      feature_announcement: 'bounce',
      platform_update: 'slide',
      achievement_unlocked: 'bounce',
      level_up: 'bounce',
      trial_ending: 'pulse',
      subscription_renewed: 'slide',
      payment_failed: 'shake'
    };
    return animations[type] || 'slide';
  }
}

// Notification triggers for various events
export class NotificationTriggers {
  // Trigger milestone achieved notification
  static async onMilestoneAchieved(userId: string, milestone: any) {
    await NotificationService.create(userId, 'milestone_achieved', {
      title: `Milestone Achieved! ${milestone.title}`,
      message: `Congratulations! You've completed "${milestone.title}". Keep up the great work!`,
      icon: '🎯',
      metadata: { milestoneId: milestone.id }
    });
  }

  // Trigger upcoming milestone notification
  static async onMilestoneUpcoming(userId: string, milestone: any, daysUntil: number) {
    await NotificationService.create(userId, 'milestone_upcoming', {
      title: 'Upcoming Milestone',
      message: `Your milestone "${milestone.title}" is coming up in ${daysUntil} days!`,
      icon: '📅',
      metadata: { milestoneId: milestone.id, daysUntil }
    });
  }

  // Trigger streak achieved notification
  static async onStreakAchieved(userId: string, streakDays: number) {
    const milestones = [3, 7, 14, 30, 60, 90, 180, 365];
    if (milestones.includes(streakDays)) {
      await NotificationService.create(userId, 'streak_achieved', {
        title: `${streakDays}-Day Streak! 🔥`,
        message: `Amazing! You've maintained a ${streakDays}-day streak. You're on fire!`,
        icon: '🔥',
        metadata: { streakDays }
      });
    }
  }

  // Trigger streak warning notification
  static async onStreakWarning(userId: string, hoursRemaining: number) {
    await NotificationService.create(userId, 'streak_warning', {
      title: 'Streak at Risk!',
      message: `Your streak will end in ${hoursRemaining} hours. Complete a task to keep it going!`,
      icon: '⚠️',
      metadata: { hoursRemaining }
    });
  }

  // Trigger daily task reminder
  static async sendDailyReminder(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        progress: {
          where: { isActive: true },
          take: 1
        }
      }
    });

    if (!user?.progress[0]) return;

    await NotificationService.create(userId, 'daily_task_reminder', {
      title: 'Daily Task Reminder',
      message: "Don't forget to complete your daily tasks and stay on track with your creator journey!",
      icon: '📝'
    });
  }

  // Trigger achievement unlocked notification
  static async onAchievementUnlocked(userId: string, achievement: any) {
    await NotificationService.create(userId, 'achievement_unlocked', {
      title: 'Achievement Unlocked!',
      message: `You've earned the "${achievement.name}" achievement! ${achievement.description}`,
      icon: achievement.icon || '🏆',
      metadata: { achievementId: achievement.id }
    });
  }

  // Trigger level up notification
  static async onLevelUp(userId: string, newLevel: number) {
    await NotificationService.create(userId, 'level_up', {
      title: `Level ${newLevel} Reached!`,
      message: `Congratulations! You've reached level ${newLevel}. New features and rewards await!`,
      icon: '⚡',
      metadata: { level: newLevel }
    });
  }

  // Trigger trial ending notification
  static async onTrialEnding(userId: string, daysRemaining: number) {
    await NotificationService.create(userId, 'trial_ending', {
      title: 'Trial Ending Soon',
      message: `Your trial ends in ${daysRemaining} days. Upgrade now to keep all your progress and features!`,
      icon: '⏰',
      metadata: { daysRemaining }
    });
  }

  // Trigger subscription renewed notification
  static async onSubscriptionRenewed(userId: string, plan: string) {
    await NotificationService.create(userId, 'subscription_renewed', {
      title: 'Subscription Renewed',
      message: `Your ${plan} subscription has been successfully renewed. Thank you for your continued support!`,
      icon: '✅',
      metadata: { plan }
    });
  }

  // Trigger payment failed notification
  static async onPaymentFailed(userId: string) {
    await NotificationService.create(userId, 'payment_failed', {
      title: 'Payment Failed',
      message: 'We couldn\'t process your payment. Please update your payment method to continue your subscription.',
      icon: '❌'
    });
  }
}

// Scheduled notification jobs
export class NotificationScheduler {
  // Check for users who need daily reminders
  static async sendDailyReminders() {
    const users = await prisma.user.findMany({
      where: {
        notificationPreferences: {
          path: ['dailyReminders'],
          equals: true
        }
      }
    });

    await Promise.all(
      users.map(user => NotificationTriggers.sendDailyReminder(user.id))
    );
  }

  // Check for upcoming milestones
  static async checkUpcomingMilestones() {
    // Logic to check milestones due in next 3 days
    // and send notifications
  }

  // Check for streak warnings
  static async checkStreakWarnings() {
    // Logic to check users whose streaks are at risk
    // and send warnings
  }
}