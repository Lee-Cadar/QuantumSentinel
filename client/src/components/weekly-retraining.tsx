import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Calendar,
  TrendingUp,
  Brain,
  Settings,
  Play,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Activity,
  Zap,
  BarChart3,
  Map
} from "lucide-react";

interface RetrainingConfig {
  enabled: boolean;
  intervalDays: number;
  minNewEvents: number;
  targetAccuracyImprovement: number;
  models: ('pytorch' | 'ollama')[];
  cascadiaFocus: boolean;
}

interface RetrainingSession {
  id: string;
  startTime: string;
  endTime: string;
  modelType: 'pytorch' | 'ollama';
  newEventsProcessed: number;
  accuracyBefore: number;
  accuracyAfter: number;
  improvementAchieved: number;
  dataQualityScore: number;
  status: 'running' | 'completed' | 'failed';
  errorMessage?: string;
}

interface WeeklyDataAnalysis {
  totalNewEvents: number;
  cascadiaEvents: number;
  significantEvents: number;
  dataQualityMetrics: {
    completeness: number;
    timeliness: number;
    accuracy: number;
  };
  seismicTrends: {
    frequencyChange: number;
    magnitudeDistributionShift: number;
    spatialPatternChanges: number;
  };
}

interface RetrainingStatus {
  isRetraining: boolean;
  nextScheduled: string;
  config: RetrainingConfig;
  recentSessions: RetrainingSession[];
}

export function WeeklyRetraining() {
  const [activeTab, setActiveTab] = useState("overview");
  const queryClient = useQueryClient();

  // Fetch retraining status
  const { data: retrainingStatus, isLoading: statusLoading } = useQuery<RetrainingStatus>({
    queryKey: ['/api/weekly-retraining/status'],
    refetchInterval: 10000
  });

  // Fetch weekly data analysis
  const { data: weeklyAnalysis } = useQuery<WeeklyDataAnalysis>({
    queryKey: ['/api/weekly-retraining/analysis'],
    refetchInterval: 300000 // 5 minutes
  });

  // Manual retraining mutation
  const triggerRetraining = useMutation({
    mutationFn: (modelType?: 'pytorch' | 'ollama') => 
      apiRequest('POST', '/api/weekly-retraining/trigger', { modelType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-retraining'] });
    }
  });

  // Update config mutation
  const updateConfig = useMutation({
    mutationFn: (newConfig: Partial<RetrainingConfig>) => 
      apiRequest('POST', '/api/weekly-retraining/config', newConfig),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-retraining/status'] });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'running': return 'text-blue-600 bg-blue-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'running': return <Activity className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${Math.floor(diff / (1000 * 60))}m ago`;
  };

  const getTimeUntilNext = (nextScheduled: string) => {
    const diff = new Date(nextScheduled).getTime() - Date.now();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return `${Math.floor(diff / (1000 * 60))}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Weekly Model Retraining
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Automated model improvement with fresh seismic patterns
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={retrainingStatus?.isRetraining ? "default" : "secondary"}>
                {retrainingStatus?.isRetraining ? "Training Active" : "Scheduled"}
              </Badge>
              
              <Button
                onClick={() => triggerRetraining.mutate()}
                disabled={triggerRetraining.isPending || retrainingStatus?.isRetraining}
                size="sm"
              >
                <Play className="h-4 w-4 mr-2" />
                Trigger Now
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Next Training</div>
                <div className="text-lg font-bold">
                  {retrainingStatus?.nextScheduled 
                    ? getTimeUntilNext(retrainingStatus.nextScheduled)
                    : "Not scheduled"
                  }
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Activity className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium">New Events</div>
                <div className="text-lg font-bold">
                  {weeklyAnalysis?.totalNewEvents || 0}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Data Quality</div>
                <div className="text-lg font-bold">
                  {weeklyAnalysis 
                    ? Math.round((weeklyAnalysis.dataQualityMetrics.completeness + 
                                 weeklyAnalysis.dataQualityMetrics.timeliness + 
                                 weeklyAnalysis.dataQualityMetrics.accuracy) / 3)
                    : 0}%
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-50">
                <Map className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Cascadia Events</div>
                <div className="text-lg font-bold">
                  {weeklyAnalysis?.cascadiaEvents || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Progress indicator for active training */}
          {retrainingStatus?.isRetraining && (
            <Alert className="mt-4 border-blue-200 bg-blue-50">
              <Activity className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Weekly retraining in progress. This may take 10-15 minutes to complete.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analysis">Data Analysis</TabsTrigger>
          <TabsTrigger value="history">Training History</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Training Status */}
            <Card>
              <CardHeader>
                <CardTitle>Current Training Status</CardTitle>
              </CardHeader>
              <CardContent>
                {retrainingStatus?.recentSessions.length === 0 ? (
                  <p className="text-muted-foreground">No recent training sessions</p>
                ) : (
                  <div className="space-y-3">
                    {retrainingStatus?.recentSessions.slice(0, 3).map((session, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(session.status)}
                          <div>
                            <div className="font-medium">{session.modelType.toUpperCase()} Model</div>
                            <div className="text-sm text-muted-foreground">
                              {formatRelativeTime(session.startTime)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-medium">
                            {session.status === 'completed' 
                              ? `+${session.improvementAchieved.toFixed(2)}%`
                              : session.status.toUpperCase()
                            }
                          </div>
                          <Badge className={getStatusColor(session.status)}>
                            {session.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    onClick={() => triggerRetraining.mutate('pytorch')}
                    disabled={triggerRetraining.isPending || retrainingStatus?.isRetraining}
                    className="w-full"
                    variant="outline"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Retrain PyTorch Model
                  </Button>
                  
                  <Button
                    onClick={() => triggerRetraining.mutate('ollama')}
                    disabled={triggerRetraining.isPending || retrainingStatus?.isRetraining}
                    className="w-full"
                    variant="outline"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Retrain Ollama Model
                  </Button>
                  
                  <Button
                    onClick={() => triggerRetraining.mutate()}
                    disabled={triggerRetraining.isPending || retrainingStatus?.isRetraining}
                    className="w-full"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Retrain All Models
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Data Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          {weeklyAnalysis && (
            <>
              {/* Data Quality Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Data Quality Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Data Completeness</span>
                      <div className="flex items-center gap-2">
                        <Progress value={weeklyAnalysis.dataQualityMetrics.completeness} className="w-20 h-2" />
                        <span className="text-sm font-bold">{weeklyAnalysis.dataQualityMetrics.completeness}%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Reporting Timeliness</span>
                      <div className="flex items-center gap-2">
                        <Progress value={weeklyAnalysis.dataQualityMetrics.timeliness} className="w-20 h-2" />
                        <span className="text-sm font-bold">{weeklyAnalysis.dataQualityMetrics.timeliness}%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Data Accuracy</span>
                      <div className="flex items-center gap-2">
                        <Progress value={weeklyAnalysis.dataQualityMetrics.accuracy} className="w-20 h-2" />
                        <span className="text-sm font-bold">{weeklyAnalysis.dataQualityMetrics.accuracy}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seismic Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Seismic Pattern Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-lg bg-blue-50">
                      <div className="text-2xl font-bold text-blue-600">
                        {weeklyAnalysis.seismicTrends.frequencyChange > 0 ? '+' : ''}
                        {weeklyAnalysis.seismicTrends.frequencyChange.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Frequency Change</div>
                    </div>
                    
                    <div className="text-center p-4 rounded-lg bg-green-50">
                      <div className="text-2xl font-bold text-green-600">
                        {weeklyAnalysis.seismicTrends.magnitudeDistributionShift > 0 ? '+' : ''}
                        {weeklyAnalysis.seismicTrends.magnitudeDistributionShift.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Magnitude Shift</div>
                    </div>
                    
                    <div className="text-center p-4 rounded-lg bg-purple-50">
                      <div className="text-2xl font-bold text-purple-600">
                        {weeklyAnalysis.seismicTrends.spatialPatternChanges.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Spatial Changes</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Event Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Event Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-8 w-8 text-blue-600" />
                      <div>
                        <div className="text-2xl font-bold">{weeklyAnalysis.totalNewEvents}</div>
                        <div className="text-sm text-muted-foreground">Total Events</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-8 w-8 text-orange-600" />
                      <div>
                        <div className="text-2xl font-bold">{weeklyAnalysis.significantEvents}</div>
                        <div className="text-sm text-muted-foreground">M4+ Events</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Map className="h-8 w-8 text-red-600" />
                      <div>
                        <div className="text-2xl font-bold">{weeklyAnalysis.cascadiaEvents}</div>
                        <div className="text-sm text-muted-foreground">Cascadia Region</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Training History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Training Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {retrainingStatus?.recentSessions.length === 0 ? (
                <p className="text-muted-foreground">No training sessions recorded</p>
              ) : (
                <div className="space-y-3">
                  {retrainingStatus?.recentSessions.map((session, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(session.status)}
                          <div>
                            <div className="font-medium">{session.modelType.toUpperCase()} Model</div>
                            <div className="text-sm text-muted-foreground">
                              Session {session.id.split('_').pop()}
                            </div>
                          </div>
                        </div>
                        
                        <Badge className={getStatusColor(session.status)}>
                          {session.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Started</div>
                          <div className="font-medium">{formatRelativeTime(session.startTime)}</div>
                        </div>
                        
                        <div>
                          <div className="text-muted-foreground">Events Processed</div>
                          <div className="font-medium">{session.newEventsProcessed.toLocaleString()}</div>
                        </div>
                        
                        <div>
                          <div className="text-muted-foreground">Accuracy Change</div>
                          <div className="font-medium">
                            {session.status === 'completed' 
                              ? `${session.accuracyBefore.toFixed(2)}% → ${session.accuracyAfter.toFixed(2)}%`
                              : 'In progress'
                            }
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-muted-foreground">Data Quality</div>
                          <div className="font-medium">{session.dataQualityScore.toFixed(1)}%</div>
                        </div>
                      </div>
                      
                      {session.errorMessage && (
                        <Alert className="mt-3 border-red-200 bg-red-50">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-800">
                            {session.errorMessage}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Retraining Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {retrainingStatus?.config && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Enable Automatic Retraining</div>
                      <div className="text-sm text-muted-foreground">
                        Automatically retrain models on schedule
                      </div>
                    </div>
                    <Switch
                      checked={retrainingStatus.config.enabled}
                      onCheckedChange={(checked) => 
                        updateConfig.mutate({ enabled: checked })
                      }
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="font-medium">Training Interval</div>
                      <div className="text-sm text-muted-foreground">
                        {retrainingStatus.config.intervalDays} days
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-medium">Minimum New Events</div>
                      <div className="text-sm text-muted-foreground">
                        {retrainingStatus.config.minNewEvents} events required
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-medium">Target Improvement</div>
                      <div className="text-sm text-muted-foreground">
                        {retrainingStatus.config.targetAccuracyImprovement}% accuracy gain
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-medium">Cascadia Focus</div>
                      <div className="text-sm text-muted-foreground">
                        {retrainingStatus.config.cascadiaFocus ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-medium mb-2">Active Models</div>
                    <div className="flex gap-2">
                      {retrainingStatus.config.models.map((model, index) => (
                        <Badge key={index} variant="outline">
                          {model.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}