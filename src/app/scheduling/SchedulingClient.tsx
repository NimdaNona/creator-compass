'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarPlus, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { SchedulePostDialog } from '@/components/scheduling/SchedulePostDialog';
import { ScheduledPostsList } from '@/components/scheduling/ScheduledPostsList';
import { PlatformConnection, ScheduledPost } from '@prisma/client';

interface ScheduledPostWithConnection extends ScheduledPost {
  platformConnection: Pick<PlatformConnection, 'id' | 'platform' | 'accountName' | 'accountImage'>;
}

interface SchedulingClientProps {
  connections: PlatformConnection[];
  scheduledPosts: ScheduledPostWithConnection[];
}

export default function SchedulingClient({
  connections,
  scheduledPosts,
}: SchedulingClientProps) {
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Filter posts by status
  const filteredPosts = scheduledPosts.filter((post) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'scheduled') return post.status === 'scheduled';
    if (activeTab === 'published') return post.status === 'published';
    if (activeTab === 'failed') return post.status === 'failed';
    return true;
  });

  const statusCounts = {
    all: scheduledPosts.length,
    scheduled: scheduledPosts.filter((p) => p.status === 'scheduled').length,
    published: scheduledPosts.filter((p) => p.status === 'published').length,
    failed: scheduledPosts.filter((p) => p.status === 'failed').length,
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              All ({statusCounts.all})
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Scheduled ({statusCounts.scheduled})
            </TabsTrigger>
            <TabsTrigger value="published" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Published ({statusCounts.published})
            </TabsTrigger>
            <TabsTrigger value="failed" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Failed ({statusCounts.failed})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button onClick={() => setScheduleDialogOpen(true)}>
          <CalendarPlus className="h-4 w-4 mr-2" />
          Schedule Post
        </Button>
      </div>

      <ScheduledPostsList posts={filteredPosts} />

      <SchedulePostDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        connections={connections}
      />
    </>
  );
}