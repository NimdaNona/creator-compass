'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExportButton } from '@/components/export/ExportButton';
import { useAppStore } from '@/store/useAppStore';
import { getRoadmap, calculatePhaseProgress, calculateWeekProgress } from '@/lib/data';
import { exportRoadmapToPDF } from '@/lib/export';
import { 
  CheckCircle, 
  Clock, 
  Target,
  Calendar,
  PlayCircle,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Zap,
  Users,
  TrendingUp,
  FileText
} from 'lucide-react';

export function RoadmapView() {
  const { selectedPlatform, selectedNiche, progress, completeTask, isTaskCompleted } = useAppStore();
  const [expandedPhase, setExpandedPhase] = useState<number>(1);
  const [expandedWeek, setExpandedWeek] = useState<number>(1);

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

  const currentPhase = Math.min(expandedPhase, roadmap.phases.length);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-muted-foreground';
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
    <div className="space-y-6">
      {/* Roadmap Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>90-Day {selectedPlatform.displayName} {selectedNiche.name} Roadmap</span>
            </CardTitle>
            <ExportButton
              onExport={async (format) => {
                if (format === 'pdf') {
                  await exportRoadmapToPDF(
                    roadmap,
                    {
                      name: progress.userName || 'Creator',
                      platform: selectedPlatform.displayName,
                      niche: selectedNiche.name,
                      goal: progress.goal || 'Grow my audience'
                    }
                  );
                }
              }}
              options={[
                { format: 'pdf', label: 'Export as PDF', icon: FileText }
              ]}
              size="sm"
              feature="roadmap-export"
            />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Your personalized roadmap to grow your {selectedPlatform.displayName} channel in the {selectedNiche.name} niche.
            Follow the phases sequentially for best results.
          </p>
          
          {/* Phase Overview */}
          <div className="grid md:grid-cols-3 gap-4">
            {roadmap.phases.map((phase, index) => {
              const phaseProgress = calculatePhaseProgress(selectedPlatform.id, selectedNiche.id, phase.phase, progress.completedTasks);
              const isActive = phase.phase === currentPhase;
              
              return (
                <div 
                  key={phase.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    isActive ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20' : 'border-border hover:border-purple-300'
                  }`}
                  onClick={() => setExpandedPhase(phase.phase)}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      phaseProgress >= 100 ? 'bg-green-500 text-white' :
                      phaseProgress > 0 ? 'bg-blue-500 text-white' :
                      'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>
                      {phaseProgress >= 100 ? <CheckCircle className="w-4 h-4" /> : phase.phase}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{phase.title}</h4>
                      <p className="text-xs text-muted-foreground">{phase.timeframe}</p>
                    </div>
                  </div>
                  <Progress value={phaseProgress} className="h-1 mb-2" />
                  <div className="text-xs text-muted-foreground">
                    {Math.round(phaseProgress)}% complete
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Phase View */}
      <Tabs value={`phase-${currentPhase}`} onValueChange={(value) => setExpandedPhase(parseInt(value.split('-')[1]))}>
        <TabsList className="grid w-full grid-cols-3">
          {roadmap.phases.map((phase) => {
            const phaseProgress = calculatePhaseProgress(selectedPlatform.id, selectedNiche.id, phase.phase, progress.completedTasks);
            
            return (
              <TabsTrigger key={phase.id} value={`phase-${phase.phase}`} className="flex items-center space-x-2">
                {phaseProgress >= 100 ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-xs">
                    {phase.phase}
                  </div>
                )}
                <span>Phase {phase.phase}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {roadmap.phases.map((phase) => (
          <TabsContent key={phase.id} value={`phase-${phase.phase}`} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{phase.title}</span>
                  <Badge variant="outline">{phase.timeframe}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{phase.description}</p>
                
                {/* Phase Goals */}
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Phase Goals:</h4>
                  <div className="grid md:grid-cols-2 gap-2">
                    {phase.goals.map((goal, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Target className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">{goal}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weekly Breakdown */}
                {phase.weeks && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Weekly Breakdown:</h4>
                    {phase.weeks.map((week) => {
                      const weekProgress = calculateWeekProgress(selectedPlatform.id, selectedNiche.id, phase.phase, week.week, progress.completedTasks);
                      const isExpanded = expandedWeek === week.week;
                      
                      return (
                        <div key={week.id} className="border rounded-lg">
                          <div 
                            className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setExpandedWeek(isExpanded ? 0 : week.week)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  weekProgress >= 100 ? 'bg-green-500 text-white' :
                                  weekProgress > 0 ? 'bg-blue-500 text-white' :
                                  'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                }`}>
                                  {weekProgress >= 100 ? <CheckCircle className="w-3 h-3" /> : week.week}
                                </div>
                                <div>
                                  <h5 className="font-medium">{week.title}</h5>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Progress value={weekProgress} className="w-24 h-1" />
                                    <span className="text-xs text-muted-foreground">
                                      {Math.round(weekProgress)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Badge variant="secondary" className="text-xs">
                                  {week.dailyTasks.length} tasks
                                </Badge>
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="border-t p-4 space-y-3">
                              {week.dailyTasks.map((task) => {
                                const isCompleted = isTaskCompleted(task.id);
                                const CategoryIcon = getCategoryIcon(task.category);
                                
                                return (
                                  <div 
                                    key={task.id}
                                    className={`p-3 rounded-lg border transition-all ${
                                      isCompleted 
                                        ? 'bg-green-50 dark:bg-green-950/20 border-green-200' 
                                        : 'bg-muted/30 hover:bg-muted/50'
                                    }`}
                                  >
                                    <div className="flex items-start space-x-3">
                                      <button
                                        onClick={() => !isCompleted && completeTask(task.id)}
                                        className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center ${
                                          isCompleted 
                                            ? 'bg-green-500 border-green-500' 
                                            : 'border-gray-300 hover:border-purple-500'
                                        }`}
                                      >
                                        {isCompleted && <CheckCircle className="w-3 h-3 text-white" />}
                                      </button>
                                      
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-1">
                                          <h6 className={`font-medium text-sm ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                            {task.title}
                                          </h6>
                                          
                                          <div className="flex items-center space-x-2 ml-2">
                                            <Badge variant="outline" className="text-xs">
                                              <CategoryIcon className="w-3 h-3 mr-1" />
                                              {task.category}
                                            </Badge>
                                            <div className={`w-2 h-2 rounded-full ${
                                              task.priority === 'high' ? 'bg-red-500' :
                                              task.priority === 'medium' ? 'bg-yellow-500' :
                                              'bg-green-500'
                                            }`} />
                                          </div>
                                        </div>
                                        
                                        <p className={`text-xs mb-2 ${isCompleted ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                                          {task.description}
                                        </p>
                                        
                                        <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                                          <div className="flex items-center space-x-1">
                                            <Clock className="w-3 h-3" />
                                            <span>{task.estimatedTime} min</span>
                                          </div>
                                          
                                          <div className="flex items-center space-x-1">
                                            <Calendar className="w-3 h-3" />
                                            <span>{task.dayRange}</span>
                                          </div>
                                          
                                          <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                                            {task.priority}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}