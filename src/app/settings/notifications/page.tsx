'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, Bell, BellOff, Clock, Moon, Sun, Mail, Smartphone, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotificationToast } from '@/components/notifications/NotificationProvider';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';

export default function NotificationSettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { showNotification } = useNotificationToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    dailyReminders: true,
    milestoneAlerts: true,
    streakNotifications: true,
    featureAnnouncements: true,
    subscriptionAlerts: true,
    emailNotifications: true,
    pushNotifications: false,
    soundEnabled: true,
    soundVolume: 70,
    reminderTime: '09:00',
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    notificationFrequency: 'normal' // 'minimal', 'normal', 'all'
  });

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    fetchPreferences();
  }, [session, router]);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences');
      if (!response.ok) throw new Error('Failed to fetch preferences');
      
      const data = await response.json();
      setPreferences(data);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      showNotification({
        type: 'payment_failed',
        title: 'Error',
        message: 'Failed to load notification preferences',
        icon: '❌',
        color: 'red',
        animation: 'shake',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) throw new Error('Failed to save preferences');

      showNotification({
        type: 'subscription_renewed',
        title: 'Settings Saved',
        message: 'Your notification preferences have been updated',
        icon: '✅',
        color: 'green',
        animation: 'slide',
        duration: 3000
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      showNotification({
        type: 'payment_failed',
        title: 'Error',
        message: 'Failed to save notification preferences',
        icon: '❌',
        color: 'red',
        animation: 'shake',
        duration: 5000
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTimeChange = (key: 'reminderTime' | 'quietHoursStart' | 'quietHoursEnd', value: string) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <Bell className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Notification Settings</h1>
            <p className="text-muted-foreground mt-1">
              Control how and when you receive notifications
            </p>
          </div>
        </div>
        
        {/* Quick Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-3">
            {preferences.emailNotifications || preferences.pushNotifications ? (
              <Bell className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <BellOff className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">All Notifications</p>
              <p className="text-sm text-muted-foreground">
                {preferences.emailNotifications || preferences.pushNotifications 
                  ? 'Notifications are enabled' 
                  : 'All notifications are disabled'}
              </p>
            </div>
          </div>
          <Switch
            checked={preferences.emailNotifications || preferences.pushNotifications}
            onCheckedChange={(checked) => {
              setPreferences(prev => ({
                ...prev,
                emailNotifications: checked,
                pushNotifications: false // Don't auto-enable push
              }));
            }}
          />
        </div>
      </div>

      <Tabs defaultValue="types" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="types">Types</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="timing">Timing</TabsTrigger>
          <TabsTrigger value="sound">Sound</TabsTrigger>
        </TabsList>
        <TabsContent value="types" className="space-y-6">
          {/* Frequency Setting */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                Notification Frequency
              </CardTitle>
              <CardDescription>
                Control how often you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'minimal', label: 'Minimal', description: 'Only important notifications' },
                  { value: 'normal', label: 'Normal', description: 'Balanced notifications' },
                  { value: 'all', label: 'All', description: 'Every notification' }
                ].map((freq) => (
                  <button
                    key={freq.value}
                    onClick={() => setPreferences(prev => ({ ...prev, notificationFrequency: freq.value }))}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      preferences.notificationFrequency === freq.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <p className="font-medium mb-1">{freq.label}</p>
                    <p className="text-xs text-muted-foreground">{freq.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notification Types */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Types</CardTitle>
              <CardDescription>
                Choose which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dailyReminders">Daily Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Receive daily task reminders and content schedule alerts
                </p>
              </div>
              <Switch
                id="dailyReminders"
                checked={preferences.dailyReminders}
                onCheckedChange={() => handleToggle('dailyReminders')}
                aria-label="Toggle daily reminders"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="milestoneAlerts">Milestone Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about achieved and upcoming milestones
                </p>
              </div>
              <Switch
                id="milestoneAlerts"
                checked={preferences.milestoneAlerts}
                onCheckedChange={() => handleToggle('milestoneAlerts')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="streakNotifications">Streak Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Track your progress streaks and get warnings
                </p>
              </div>
              <Switch
                id="streakNotifications"
                checked={preferences.streakNotifications}
                onCheckedChange={() => handleToggle('streakNotifications')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="featureAnnouncements">Feature Announcements</Label>
                <p className="text-sm text-muted-foreground">
                  Stay updated with new features and platform updates
                </p>
              </div>
              <Switch
                id="featureAnnouncements"
                checked={preferences.featureAnnouncements}
                onCheckedChange={() => handleToggle('featureAnnouncements')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="subscriptionAlerts">Subscription Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Important subscription and payment notifications
                </p>
              </div>
              <Switch
                id="subscriptionAlerts"
                checked={preferences.subscriptionAlerts}
                onCheckedChange={() => handleToggle('subscriptionAlerts')}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="delivery">
        <Card>
          <CardHeader>
            <CardTitle>Delivery Methods</CardTitle>
            <CardDescription>
              Choose how you want to receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive important notifications via email
                </p>
              </div>
              <Switch
                id="emailNotifications"
                checked={preferences.emailNotifications}
                onCheckedChange={() => handleToggle('emailNotifications')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="pushNotifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get browser push notifications (requires permission)
                </p>
              </div>
              <Switch
                id="pushNotifications"
                checked={preferences.pushNotifications}
                onCheckedChange={() => handleToggle('pushNotifications')}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="timing">
        <Card>
          <CardHeader>
            <CardTitle>Timing Preferences</CardTitle>
            <CardDescription>
              Set when you want to receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reminderTime">Daily Reminder Time</Label>
              <Select
                value={preferences.reminderTime}
                onValueChange={(value) => handleTimeChange('reminderTime', value)}
              >
                <SelectTrigger id="reminderTime">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = i.toString().padStart(2, '0');
                    return (
                      <SelectItem key={hour} value={`${hour}:00`}>
                        {hour}:00
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quiet Hours</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Don't send notifications during these hours
              </p>
              <div className="flex items-center gap-2">
                <Select
                  value={preferences.quietHoursStart}
                  onValueChange={(value) => handleTimeChange('quietHoursStart', value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return (
                        <SelectItem key={hour} value={`${hour}:00`}>
                          {hour}:00
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <span className="text-sm">to</span>
                <Select
                  value={preferences.quietHoursEnd}
                  onValueChange={(value) => handleTimeChange('quietHoursEnd', value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return (
                        <SelectItem key={hour} value={`${hour}:00`}>
                          {hour}:00
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="sound">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              Sound Settings
            </CardTitle>
            <CardDescription>
              Configure notification sounds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="soundEnabled">Enable Sounds</Label>
                <p className="text-sm text-muted-foreground">
                  Play sounds for notifications
                </p>
              </div>
              <Switch
                id="soundEnabled"
                checked={preferences.soundEnabled}
                onCheckedChange={() => handleToggle('soundEnabled')}
              />
            </div>

            {preferences.soundEnabled && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="soundVolume">Volume</Label>
                  <span className="text-sm text-muted-foreground">{preferences.soundVolume}%</span>
                </div>
                <Slider
                  id="soundVolume"
                  value={[preferences.soundVolume]}
                  onValueChange={(value) => setPreferences(prev => ({ ...prev, soundVolume: value[0] }))}
                  max={100}
                  step={10}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <VolumeX className="w-3 h-3" /> Quiet
                  </span>
                  <span className="flex items-center gap-1">
                    Loud <Volume2 className="w-3 h-3" />
                  </span>
                </div>
              </div>
            )}

            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                <strong>Tip:</strong> Test your notification sound by clicking the bell icon in the header.
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Save Button */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
          <p className="text-sm text-muted-foreground">
            Changes will take effect immediately
          </p>
          <Button onClick={savePreferences} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save All Settings
              </>
            )}
          </Button>
        </div>
      </Tabs>
    </div>
  );
}