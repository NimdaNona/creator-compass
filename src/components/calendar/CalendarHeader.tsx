'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Grid3x3,
  List
} from 'lucide-react';
import { format } from 'date-fns';

interface CalendarHeaderProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  view: 'month' | 'week' | 'list';
  onViewChange: (view: 'month' | 'week' | 'list') => void;
}

export function CalendarHeader({
  currentDate,
  onDateChange,
  view,
  onViewChange
}: CalendarHeaderProps) {
  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    }
    onDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    }
    onDateChange(newDate);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const getDateDisplay = () => {
    if (view === 'month') {
      return format(currentDate, 'MMMM yyyy');
    } else if (view === 'week') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'MMMM yyyy');
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      {/* Date Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevious}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="min-w-[200px] text-center">
          <h2 className="text-lg font-semibold">{getDateDisplay()}</h2>
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleToday}
          className="ml-2"
        >
          Today
        </Button>
      </div>

      {/* View Selector (for desktop, mobile uses tabs) */}
      <div className="hidden md:flex items-center gap-2">
        <Select value={view} onValueChange={(v) => onViewChange(v as typeof view)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">
              <div className="flex items-center gap-2">
                <Grid3x3 className="w-4 h-4" />
                Month
              </div>
            </SelectItem>
            <SelectItem value="week">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Week
              </div>
            </SelectItem>
            <SelectItem value="list">
              <div className="flex items-center gap-2">
                <List className="w-4 h-4" />
                List
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}