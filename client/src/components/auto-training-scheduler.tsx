import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Target, Database, Bot, Activity, Settings, Play, Pause, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AutoTrainingSchedulerProps {
  pytorchMetrics: any;
  ollamaMetrics: any;
  onSchedulerUpdate: (config: any) => void;
}

export default function AutoTrainingScheduler({ 
  pytorchMetrics, 
  ollamaMetrics, 
  onSchedulerUpdate 
}: AutoTrainingSchedulerProps) {
  const [sentinelConfig, setSentinelConfig] = useState({
    enabled: false,
    targetAccuracy: 95.0,
    targetDataPoints: 100000,
    maxSessions: 10,
    trainingInterval: 'daily',
    currentProgress: 0
  });

  const [ollamaConfig, setOllamaConfig] = useState({
    enabled: false,
    targetAccuracy: 90.0,
    targetDataPoints: 80000,
    maxSessions: 8,
    trainingInterval: 'daily',
    currentProgress: 0
  });

  const [isRunning, setIsRunning] = useState(false);
  const [schedulerStatus, setSchedulerStatus] = useState<'idle' | 'running' | 'paused'>('idle');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calculate current progress based on metrics
  useEffect(() => {
    if (pytorchMetrics) {
      const accuracyProgress = (pytorchMetrics.accuracy / sentinelConfig.targetAccuracy) * 50;
      const dataProgress = (pytorchMetrics.trainingDataCount / sentinelConfig.targetDataPoints) * 50;
      setSentinelConfig(prev => ({ 
        ...prev, 
        currentProgress: Math.min(100, accuracyProgress + dataProgress)
      }));
    }

    if (ollamaMetrics && ollamaMetrics.accuracy > 0) {
      const accuracyProgress = (ollamaMetrics.accuracy / ollamaConfig.targetAccuracy) * 50;
      const dataProgress = (ollamaMetrics.trainingDataCount / ollamaConfig.targetDataPoints) * 50;
      setOllamaConfig(prev => ({ 
        ...prev, 
        currentProgress: Math.min(100, accuracyProgress + dataProgress)
      }));
    }
  }, [pytorchMetrics, ollamaMetrics, sentinelConfig.targetAccuracy, sentinelConfig.targetDataPoints, ollamaConfig.targetAccuracy, ollamaConfig.targetDataPoints]);

  const startSchedulerMutation = useMutation({
    mutationFn: async (config: any) => {
      return apiRequest("POST", "/api/predictions/scheduler/start", config);
    },
    onSuccess: () => {
      setIsRunning(true);
      setSchedulerStatus('running');
      toast({
        title: "Auto Training Started",
        description: "Automated training scheduler is now active and will train models to reach target benchmarks.",
      });
    }
  });

  const pauseSchedulerMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/predictions/scheduler/pause");
    },
    onSuccess: () => {
      setIsRunning(false);
      setSchedulerStatus('paused');
      toast({
        title: "Training Paused",
        description: "Automated training scheduler has been paused.",
      });
    }
  });

  const resetSchedulerMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/predictions/scheduler/reset");
    },
    onSuccess: () => {
      setIsRunning(false);
      setSchedulerStatus('idle');
      setSentinelConfig(prev => ({ ...prev, currentProgress: 0 }));
      setOllamaConfig(prev => ({ ...prev, currentProgress: 0 }));
      toast({
        title: "Scheduler Reset",
        description: "Training scheduler has been reset to initial state.",
      });
    }
  });

  const handleStartScheduler = () => {
    const config = {
      sentinel: sentinelConfig,
      ollama: ollamaConfig
    };
    startSchedulerMutation.mutate(config);
    onSchedulerUpdate(config);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getTargetsMet = (metrics: any, config: any) => {
    if (!metrics || !metrics.accuracy) return false;
    return metrics.accuracy >= config.targetAccuracy && 
           metrics.trainingDataCount >= config.targetDataPoints;
  };

  return (
    <div className="space-y-6">
      {/* Scheduler Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-600" />
            Autonomous Training Scheduler
            <Badge 
              variant={schedulerStatus === 'running' ? 'default' : schedulerStatus === 'paused' ? 'secondary' : 'outline'}
              className={`ml-auto ${getStatusColor(schedulerStatus)} text-white`}
            >
              {schedulerStatus.toUpperCase()}
            </Badge>
          </CardTitle>
          <CardDescription>
            Configure automated training targets and let the models train themselves to reach optimal performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button 
              onClick={handleStartScheduler}
              disabled={startSchedulerMutation.isPending || (!sentinelConfig.enabled && !ollamaConfig.enabled)}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4 mr-2" />
              {startSchedulerMutation.isPending ? 'Starting...' : 'Start Auto Training'}
            </Button>
            <Button 
              onClick={() => pauseSchedulerMutation.mutate()}
              disabled={!isRunning || pauseSchedulerMutation.isPending}
              variant="outline"
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
            <Button 
              onClick={() => resetSchedulerMutation.mutate()}
              disabled={resetSchedulerMutation.isPending}
              variant="outline"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Model Configurations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentinel Model Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Sentinel Model Auto-Training
              {getTargetsMet(pytorchMetrics, sentinelConfig) && (
                <Badge className="ml-auto bg-green-500 text-white">Targets Met</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Configure autonomous training for the Sentinel PyTorch LSTM model
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <Label htmlFor="sentinel-enabled" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Enable Auto Training
              </Label>
              <Switch
                id="sentinel-enabled"
                checked={sentinelConfig.enabled}
                onCheckedChange={(enabled) => 
                  setSentinelConfig(prev => ({ ...prev, enabled }))
                }
              />
            </div>

            {sentinelConfig.enabled && (
              <>
                {/* Progress Display */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Training Progress</span>
                    <span className="font-medium">{sentinelConfig.currentProgress.toFixed(1)}%</span>
                  </div>
                  <Progress value={sentinelConfig.currentProgress} className="h-2" />
                </div>

                {/* Current Stats */}
                {pytorchMetrics && (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="text-center">
                      <div className="font-bold text-blue-700">{pytorchMetrics.accuracy.toFixed(1)}%</div>
                      <div className="text-xs text-blue-600">Current Accuracy</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-blue-700">{pytorchMetrics.trainingDataCount.toLocaleString()}</div>
                      <div className="text-xs text-blue-600">Data Records</div>
                    </div>
                  </div>
                )}

                {/* Target Configuration */}
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="sentinel-accuracy">Target Accuracy (%)</Label>
                    <Input
                      id="sentinel-accuracy"
                      type="number"
                      min="85"
                      max="99"
                      step="0.1"
                      value={sentinelConfig.targetAccuracy}
                      onChange={(e) => setSentinelConfig(prev => ({ 
                        ...prev, 
                        targetAccuracy: parseFloat(e.target.value) 
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="sentinel-data">Target Data Points</Label>
                    <Input
                      id="sentinel-data"
                      type="number"
                      min="10000"
                      max="1000000"
                      step="1000"
                      value={sentinelConfig.targetDataPoints}
                      onChange={(e) => setSentinelConfig(prev => ({ 
                        ...prev, 
                        targetDataPoints: parseInt(e.target.value) 
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="sentinel-sessions">Max Training Sessions</Label>
                    <Input
                      id="sentinel-sessions"
                      type="number"
                      min="1"
                      max="50"
                      value={sentinelConfig.maxSessions}
                      onChange={(e) => setSentinelConfig(prev => ({ 
                        ...prev, 
                        maxSessions: parseInt(e.target.value) 
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="sentinel-interval">Training Interval</Label>
                    <Select value={sentinelConfig.trainingInterval} onValueChange={(value) => 
                      setSentinelConfig(prev => ({ ...prev, trainingInterval: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Every Hour</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="continuous">Continuous</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Ollama Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-green-600" />
              Ollama AI Auto-Training
              {getTargetsMet(ollamaMetrics, ollamaConfig) && (
                <Badge className="ml-auto bg-green-500 text-white">Targets Met</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Configure autonomous training for the Ollama AI reasoning model
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <Label htmlFor="ollama-enabled" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Enable Auto Training
              </Label>
              <Switch
                id="ollama-enabled"
                checked={ollamaConfig.enabled}
                onCheckedChange={(enabled) => 
                  setOllamaConfig(prev => ({ ...prev, enabled }))
                }
              />
            </div>

            {ollamaConfig.enabled && (
              <>
                {/* Progress Display */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Training Progress</span>
                    <span className="font-medium">{ollamaConfig.currentProgress.toFixed(1)}%</span>
                  </div>
                  <Progress value={ollamaConfig.currentProgress} className="h-2" />
                </div>

                {/* Current Stats */}
                {ollamaMetrics && ollamaMetrics.accuracy > 0 ? (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="text-center">
                      <div className="font-bold text-green-700">{ollamaMetrics.accuracy.toFixed(1)}%</div>
                      <div className="text-xs text-green-600">Current Accuracy</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-green-700">{ollamaMetrics.trainingDataCount.toLocaleString()}</div>
                      <div className="text-xs text-green-600">Data Records</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg text-center text-sm text-gray-600">
                    Train Ollama model manually first to enable auto-training
                  </div>
                )}

                {/* Target Configuration */}
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="ollama-accuracy">Target Accuracy (%)</Label>
                    <Input
                      id="ollama-accuracy"
                      type="number"
                      min="80"
                      max="95"
                      step="0.1"
                      value={ollamaConfig.targetAccuracy}
                      onChange={(e) => setOllamaConfig(prev => ({ 
                        ...prev, 
                        targetAccuracy: parseFloat(e.target.value) 
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="ollama-data">Target Data Points</Label>
                    <Input
                      id="ollama-data"
                      type="number"
                      min="5000"
                      max="500000"
                      step="1000"
                      value={ollamaConfig.targetDataPoints}
                      onChange={(e) => setOllamaConfig(prev => ({ 
                        ...prev, 
                        targetDataPoints: parseInt(e.target.value) 
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="ollama-sessions">Max Training Sessions</Label>
                    <Input
                      id="ollama-sessions"
                      type="number"
                      min="1"
                      max="30"
                      value={ollamaConfig.maxSessions}
                      onChange={(e) => setOllamaConfig(prev => ({ 
                        ...prev, 
                        maxSessions: parseInt(e.target.value) 
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="ollama-interval">Training Interval</Label>
                    <Select value={ollamaConfig.trainingInterval} onValueChange={(value) => 
                      setOllamaConfig(prev => ({ ...prev, trainingInterval: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Every Hour</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="continuous">Continuous</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Training Schedule Overview */}
      {(sentinelConfig.enabled || ollamaConfig.enabled) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              Training Schedule Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sentinelConfig.enabled && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <div className="font-medium text-blue-900">Sentinel Model</div>
                    <div className="text-sm text-blue-700">
                      Target: {sentinelConfig.targetAccuracy}% accuracy, {sentinelConfig.targetDataPoints.toLocaleString()} records
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-blue-900">{sentinelConfig.trainingInterval}</div>
                    <div className="text-xs text-blue-600">Max {sentinelConfig.maxSessions} sessions</div>
                  </div>
                </div>
              )}
              
              {ollamaConfig.enabled && (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <div className="font-medium text-green-900">Ollama AI Model</div>
                    <div className="text-sm text-green-700">
                      Target: {ollamaConfig.targetAccuracy}% accuracy, {ollamaConfig.targetDataPoints.toLocaleString()} records
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-900">{ollamaConfig.trainingInterval}</div>
                    <div className="text-xs text-green-600">Max {ollamaConfig.maxSessions} sessions</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}