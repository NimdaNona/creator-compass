'use client';

import { useState, useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/store/useAppStore';
import { getRoadmap, calculatePhaseProgress, calculateWeekProgress } from '@/lib/data';
import { 
  CheckCircle, 
  Clock, 
  Target,
  Calendar,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Zap,
  Users,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export function MobileRoadmapView() {
  const { selectedPlatform, selectedNiche, progress, completeTask, isTaskCompleted } = useAppStore();
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: false
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // Subscribe to embla events
  useEffect(() => {
    if (emblaApi) {
      emblaApi.on('select', onSelect);
      onSelect();
    }
  }, [emblaApi, onSelect]);

  if (!selectedPlatform || !selectedNiche || !progress) {
    return null;
  }

  const roadmap = getRoadmap(selectedPlatform.id, selectedNiche.id);

  if (!roadmap) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Roadmap Not Available</h3>
          <p className="text-muted-foreground">
            We're still building the roadmap for this platform and niche combination.
          </p>
        </CardContent>
      </Card>
    );
  }

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 border-red-300 dark:bg-red-950/20';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 dark:bg-yellow-950/20';
      case 'low':
        return 'bg-green-100 border-green-300 dark:bg-green-950/20';
      default:
        return 'bg-gray-100 border-gray-300 dark:bg-gray-950/20';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'content':
        return PlayCircle;
      case 'optimization':
        return Target;
      case 'engagement':
        return Users;
      case 'setup':
        return Zap;
      default:
        return Clock;
    }
  };

  return (
    <div className="space-y-4">
      {/* Mobile Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Your 90-Day Journey</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Swipe through phases • Tap tasks to complete
          </p>
        </CardHeader>
      </Card>

      {/* Phase Navigation Dots */}
      <div className="flex justify-center space-x-2 py-2">
        {roadmap.phases.map((phase, index) => {
          const phaseProgress = calculatePhaseProgress(selectedPlatform.id, selectedNiche.id, phase.phase, progress.completedTasks);
          
          return (
            <button
              key={phase.id}
              onClick={() => emblaApi?.scrollTo(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === selectedIndex 
                  ? 'bg-purple-500 scale-125' 
                  : phaseProgress >= 100
                  ? 'bg-green-500'
                  : phaseProgress > 0
                  ? 'bg-blue-500'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          );
        })}
      </div>

      {/* Swipeable Phase Cards */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {roadmap.phases.map((phase, phaseIndex) => {
            const phaseProgress = calculatePhaseProgress(selectedPlatform.id, selectedNiche.id, phase.phase, progress.completedTasks);
            
            return (
              <div key={phase.id} className="flex-[0_0_100%] px-2">
                <Card className="border-2 border-purple-200 dark:border-purple-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          phaseProgress >= 100 ? 'bg-green-500 text-white' :
                          phaseProgress > 0 ? 'bg-blue-500 text-white' :
                          'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}>
                          {phaseProgress >= 100 ? <CheckCircle className="w-5 h-5" /> : phase.phase}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{phase.title}</h3>
                          <p className="text-sm text-muted-foreground">{phase.timeframe}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(phaseProgress)}%
                      </Badge>
                    </div>
                    <Progress value={phaseProgress} className="h-2 mt-3" />
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Phase Description */}
                    <p className="text-sm text-muted-foreground">
                      {phase.description}
                    </p>
                    
                    {/* Phase Goals */}
                    <div>
                      <h4 className="font-medium text-sm mb-2">🎯 Phase Goals:</h4>
                      <div className="space-y-1">
                        {phase.goals.map((goal, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                            <span className="text-xs">{goal}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Weekly Tasks */}
                    {phase.weeks && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">📅 Weekly Tasks:</h4>
                        {phase.weeks.map((week) => {
                          const weekProgress = calculateWeekProgress(selectedPlatform.id, selectedNiche.id, phase.phase, week.week, progress.completedTasks);
                          
                          return (
                            <div key={week.id} className="space-y-2">
                              {/* Week Header */}
                              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    weekProgress >= 100 ? 'bg-green-500 text-white' :
                                    weekProgress > 0 ? 'bg-blue-500 text-white' :
                                    'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                  }`}>
                                    {weekProgress >= 100 ? <CheckCircle className="w-3 h-3" /> : week.week}
                                  </div>
                                  <div>
                                    <h5 className="font-medium text-sm">{week.title}</h5>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <Progress value={weekProgress} className="w-16 h-1" />
                                      <span className="text-xs text-muted-foreground">
                                        {week.dailyTasks.filter(task => isTaskCompleted(task.id)).length}/{week.dailyTasks.length}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Daily Tasks */}
                              <div className="space-y-2 pl-2">
                                {week.dailyTasks.slice(0, 3).map((task) => {
                                  const isCompleted = isTaskCompleted(task.id);
                                  const isExpanded = expandedTasks[task.id];
                                  const CategoryIcon = getCategoryIcon(task.category);
                                  
                                  return (
                                    <div 
                                      key={task.id}
                                      className={`mobile-card ${
                                        isCompleted 
                                          ? 'bg-green-50 dark:bg-green-950/20 border-green-200' 
                                          : getPriorityColor(task.priority)
                                      }`}
                                    >
                                      <div className="flex items-start space-x-3">
                                        <button
                                          onClick={() => !isCompleted && completeTask(task.id)}
                                          className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                            isCompleted 
                                              ? 'bg-green-500 border-green-500 celebrate' 
                                              : 'border-gray-300 hover:border-purple-500 active:scale-95'
                                          }`}
                                        >
                                          {isCompleted && <CheckCircle className="w-3 h-3 text-white" />}
                                        </button>
                                        
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-start justify-between mb-1">
                                            <h6 className={`font-medium text-sm leading-tight ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                              {task.title}
                                            </h6>
                                            
                                            <button
                                              onClick={() => toggleTaskExpansion(task.id)}
                                              className="ml-2 p-1 hover:bg-muted/50 rounded"
                                            >
                                              {isExpanded ? (
                                                <ChevronUp className="w-3 h-3" />
                                              ) : (
                                                <ChevronDown className="w-3 h-3" />
                                              )}
                                            </button>
                                          </div>
                                          
                                          {!isExpanded && (
                                            <p className={`text-xs mb-2 line-clamp-2 ${isCompleted ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                                              {task.description}
                                            </p>
                                          )}
                                          
                                          {isExpanded && (
                                            <div className="space-y-2">
                                              <p className={`text-xs ${isCompleted ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                                                {task.description}
                                              </p>
                                              
                                              {task.metadata?.tips && (
                                                <div className="p-2 bg-muted/50 rounded text-xs">
                                                  <div className="font-medium mb-1">💡 Tips:</div>
                                                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                                    {task.metadata.tips.slice(0, 2).map((tip: string, index: number) => (
                                                      <li key={index}>{tip}</li>
                                                    ))}
                                                  </ul>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                          
                                          <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center space-x-2">
                                              <Badge variant="outline" className="text-xs">
                                                <CategoryIcon className="w-2 h-2 mr-1" />
                                                {task.category}
                                              </Badge>
                                              
                                              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                                <Clock className="w-2 h-2" />
                                                <span>{task.estimatedTime}m</span>
                                              </div>
                                            </div>
                                            
                                            <div className={`w-2 h-2 rounded-full ${
                                              task.priority === 'high' ? 'bg-red-500' :
                                              task.priority === 'medium' ? 'bg-yellow-500' :
                                              'bg-green-500'
                                            }`} />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                                
                                {week.dailyTasks.length > 3 && (
                                  <div className="text-center py-2">
                                    <Button variant="ghost" size="sm" className="text-xs">
                                      View {week.dailyTasks.length - 3} more tasks
                                      <ArrowRight className="w-3 h-3 ml-1" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={scrollPrev}
          disabled={selectedIndex === 0}
          className="flex items-center space-x-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </Button>
        
        <div className="text-center">
          <div className="text-sm font-medium">
            Phase {selectedIndex + 1} of {roadmap.phases.length}
          </div>
          <div className="text-xs text-muted-foreground">
            Swipe to navigate
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={scrollNext}
          disabled={selectedIndex === roadmap.phases.length - 1}
          className="flex items-center space-x-1"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}