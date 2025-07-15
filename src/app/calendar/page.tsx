'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DraggableContentCalendar } from '@/components/calendar/DraggableContentCalendar';
import { EventFormModal } from '@/components/calendar/EventFormModal';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { ScheduleOptimizer } from '@/components/calendar/ScheduleOptimizer';
import { ContentList } from '@/components/calendar/ContentList';
import { BulkScheduler } from '@/components/calendar/BulkScheduler';
import { SeriesManager } from '@/components/calendar/SeriesManager';
import { 
  Calendar,
  Grid3x3,
  List,
  Plus,
  Filter,
  Download,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { PaywallModal } from '@/components/paywall/PaywallModal';
import { Badge } from '@/components/ui/badge';

export default function CalendarPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { selectedPlatform, subscription } = useAppStore();
  const [view, setView] = useState<'month' | 'week' | 'list'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showPaywall, setShowPaywall] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Check if user has access (calendar is a premium feature for full functionality)
  const hasFullAccess = subscription !== 'free';
  const freeUserDaysLimit = 7; // Free users can only see 7 days ahead

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, router]);

  const handleCreateContent = () => {
    if (!hasFullAccess) {
      setShowPaywall(true);
      return;
    }
    setSelectedDate(new Date());
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleEventCreate = (date: Date) => {
    if (!hasFullAccess && date > new Date(Date.now() + freeUserDaysLimit * 24 * 60 * 60 * 1000)) {
      setShowPaywall(true);
      return;
    }
    setSelectedDate(date);
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleEventEdit = (event: any) => {
    setSelectedEvent(event);
    setSelectedDate(event.scheduledDate);
    setShowEventModal(true);
  };

  const handleExport = () => {
    if (!hasFullAccess) {
      setShowPaywall(true);
      return;
    }
    // Export calendar functionality
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-8 w-8 animate-pulse mx-auto mb-4" />
          <p>Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <Calendar className="w-8 h-8" />
                Content Calendar
              </h1>
              <p className="text-muted-foreground">
                Plan and schedule your content across all platforms
              </p>
              {!hasFullAccess && (
                <Badge variant="secondary" className="mt-2">
                  Free plan: {freeUserDaysLimit}-day view only
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="hidden sm:flex"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button onClick={handleCreateContent}>
                <Plus className="w-4 h-4 mr-2" />
                Add Content
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Header Controls */}
        <CalendarHeader 
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          view={view}
          onViewChange={setView}
        />

        {/* Main Calendar Content */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Calendar View */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-0">
                <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
                  <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
                    <TabsTrigger value="month" className="flex items-center gap-2">
                      <Grid3x3 className="w-4 h-4" />
                      <span className="hidden sm:inline">Month</span>
                    </TabsTrigger>
                    <TabsTrigger value="week" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="hidden sm:inline">Week</span>
                    </TabsTrigger>
                    <TabsTrigger value="list" className="flex items-center gap-2">
                      <List className="w-4 h-4" />
                      <span className="hidden sm:inline">List</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="month" className="mt-0">
                    <DraggableContentCalendar 
                      view="month"
                      currentDate={currentDate}
                      hasFullAccess={hasFullAccess}
                      freeUserDaysLimit={freeUserDaysLimit}
                      onEventCreate={handleEventCreate}
                      onEventEdit={handleEventEdit}
                    />
                  </TabsContent>

                  <TabsContent value="week" className="mt-0">
                    <DraggableContentCalendar 
                      view="week"
                      currentDate={currentDate}
                      hasFullAccess={hasFullAccess}
                      freeUserDaysLimit={freeUserDaysLimit}
                      onEventCreate={handleEventCreate}
                      onEventEdit={handleEventEdit}
                    />
                  </TabsContent>

                  <TabsContent value="list" className="mt-0">
                    <ContentList 
                      currentDate={currentDate}
                      hasFullAccess={hasFullAccess}
                      freeUserDaysLimit={freeUserDaysLimit}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Bulk Scheduler */}
            <BulkScheduler 
              onSuccess={() => {
                // Calendar will auto-refresh
              }}
            />

            {/* Series Manager */}
            <SeriesManager />

            {/* Schedule Optimizer */}
            <ScheduleOptimizer 
              platform={selectedPlatform}
              onTimeSelect={(time) => {
                // Handle optimal time selection
                console.log('Selected time:', time);
              }}
            />

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Scheduled</span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Published</span>
                  <span className="font-medium">8</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Drafts</span>
                  <span className="font-medium">5</span>
                </div>
              </CardContent>
            </Card>

            {/* Premium Upsell for Free Users */}
            {!hasFullAccess && (
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
                <CardContent className="p-6">
                  <div className="text-center space-y-3">
                    <Sparkles className="w-8 h-8 mx-auto text-purple-500" />
                    <h3 className="font-semibold">Unlock Full Calendar</h3>
                    <p className="text-sm text-muted-foreground">
                      Plan months ahead, bulk schedule, and sync with external calendars
                    </p>
                    <Button 
                      className="w-full" 
                      onClick={() => router.push('/pricing')}
                    >
                      Upgrade to Premium
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Paywall Modal */}
      <PaywallModal 
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature="Full Calendar Access"
        description="Unlock unlimited calendar planning, bulk scheduling, and calendar export features."
      />

      {/* Event Form Modal */}
      <EventFormModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setSelectedEvent(null);
          setSelectedDate(null);
        }}
        event={selectedEvent}
        defaultDate={selectedDate}
        onSuccess={() => {
          setShowEventModal(false);
          setSelectedEvent(null);
          setSelectedDate(null);
          // Calendar will auto-refresh due to useEffect dependency
        }}
      />
    </div>
  );
}