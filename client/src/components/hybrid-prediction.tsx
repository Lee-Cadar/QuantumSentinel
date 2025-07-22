import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Brain, Zap, TrendingUp, AlertTriangle, Clock, Activity, Cpu, Database, Trophy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BenchmarkComparison } from "./benchmark-comparison";
import AutoTrainingScheduler from "./auto-training-scheduler";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { PredictionReport } from "./prediction-report";

interface HybridPredictionProps {
  onPredictionGenerated?: (prediction: any) => void;
}

interface TrainingProgressState {
  [key: string]: {
    progress: number;
    eta: string;
    status: 'idle' | 'training' | 'completed' | 'error';
    currentStep: string;
    dataPointsUsed?: number;
    totalDataPoints?: number;
  };
}

export function HybridPrediction({ onPredictionGenerated }: HybridPredictionProps) {
  const [predictionType, setPredictionType] = useState<'hybrid' | 'pytorch' | 'ollama'>('hybrid');
  const [region, setRegion] = useState('');
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgressState>({});
  const [latestPrediction, setLatestPrediction] = useState<any>(null);
  const [showPredictionReport, setShowPredictionReport] = useState(false);
  const [sentinelSessionCount, setSentinelSessionCount] = useState(1);
  const [ollamaSessionCount, setOllamaSessionCount] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Simulate training progress updates
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const updateProgress = (modelType: string) => {
      setTrainingProgress(prev => {
        const current = prev[modelType] || { progress: 0, eta: '', status: 'idle', currentStep: '' };
        if (current.status === 'training') {
          const newProgress = Math.min(current.progress + Math.random() * 5, 95);
          const timeLeft = Math.max(1, Math.round((100 - newProgress) / 3));
          return {
            ...prev,
            [modelType]: {
              progress: newProgress,
              eta: `${timeLeft} min remaining`,
              status: 'training',
              currentStep: getTrainingStep(modelType, newProgress)
            }
          };
        }
        return prev;
      });
    };

    interval = setInterval(() => {
      Object.keys(trainingProgress).forEach(updateProgress);
    }, 2000);

    return () => clearInterval(interval);
  }, [trainingProgress]);

  const getTrainingStep = (modelType: string, progress: number): string => {
    if (modelType === 'pytorch') {
      if (progress < 20) return 'Loading earthquake data...';
      if (progress < 40) return 'Preprocessing seismic patterns...';
      if (progress < 60) return 'Training LSTM neural network...';
      if (progress < 80) return 'Optimizing magnitude prediction...';
      if (progress < 95) return 'Validating model accuracy...';
      return 'Finalizing training...';
    } else {
      if (progress < 25) return 'Initializing Ollama model...';
      if (progress < 50) return 'Analyzing historical patterns...';
      if (progress < 75) return 'Training reasoning engine...';
      if (progress < 90) return 'Calibrating confidence scores...';
      return 'Completing training...';
    }
  };

  // Fetch PyTorch model metrics
  const { data: pytorchMetrics } = useQuery({
    queryKey: ['/api/predictions/model-metrics', 'pytorch'],
    queryFn: () => fetch('/api/predictions/model-metrics?model=pytorch').then(r => r.json()),
    refetchInterval: 30000
  });

  const { data: ollamaMetrics } = useQuery({
    queryKey: ['/api/predictions/model-metrics', 'ollama'],
    queryFn: () => fetch('/api/predictions/model-metrics?model=ollama').then(r => r.json()),
    refetchInterval: 30000
  });



  const generatePredictionMutation = useMutation({
    mutationFn: async (data: { disasterType: string; region?: string; predictionType: string }) => {
      const response = await fetch('/api/predictions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to generate prediction');
      return response.json();
    },
    onSuccess: (prediction) => {
      setLatestPrediction(prediction);
      setShowPredictionReport(true);
      toast({
        title: "Prediction Generated",
        description: `${predictionType.toUpperCase()} prediction completed successfully`
      });
      onPredictionGenerated?.(prediction);
      queryClient.invalidateQueries({ queryKey: ['/api/predictions'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Prediction Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });

  // Poll training status during training
  useEffect(() => {
    const interval = setInterval(async () => {
      for (const model of ['pytorch', 'ollama'] as const) {
        if (trainingProgress[model]?.status === 'training') {
          try {
            const response = await fetch(`/api/predictions/training-status/${model}`);
            const status = await response.json();
            if (status.isTraining) {
              setTrainingProgress(prev => ({
                ...prev,
                [model]: {
                  progress: status.progress || 0,
                  eta: `${status.estimatedTimeRemaining || 0} min remaining`,
                  status: 'training',
                  currentStep: getTrainingStep(model, status.progress || 0),
                  dataPointsUsed: status.dataPointsProcessed || 0,
                  totalDataPoints: status.totalDataPoints || 0
                }
              }));
            } else {
              // Training completed
              setTrainingProgress(prev => ({
                ...prev,
                [model]: {
                  ...prev[model],
                  progress: 100,
                  eta: 'Complete!',
                  status: 'completed',
                  currentStep: 'Training completed successfully'
                }
              }));
            }
          } catch (error) {
            console.warn(`Failed to fetch training status for ${model}`);
          }
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [trainingProgress]);

  const trainModelMutation = useMutation({
    mutationFn: async ({ model, sessions }: { model: 'pytorch' | 'ollama', sessions: number }) => {
      // Start progress tracking with session info
      setTrainingProgress(prev => ({
        ...prev,
        [model]: { 
          progress: 0, 
          eta: `${sessions * 2}-${sessions * 3} minutes`, 
          status: 'training', 
          currentStep: `Starting ${sessions} session${sessions > 1 ? 's' : ''} of training...`,
          dataPointsUsed: 0,
          totalDataPoints: 0
        }
      }));

      // Start a polling interval to get real training status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/training-status`);
          if (statusResponse.ok) {
            const status = await statusResponse.json();
            const modelStatus = status[model];
            if (modelStatus && modelStatus.isTraining) {
              setTrainingProgress(prev => ({
                ...prev,
                [model]: {
                  progress: Math.min(95, modelStatus.progress || prev[model]?.progress || 0),
                  eta: modelStatus.eta || prev[model]?.eta || 'Calculating...',
                  status: 'training',
                  currentStep: modelStatus.currentStep || prev[model]?.currentStep || 'Training...',
                  dataPointsUsed: prev[model]?.dataPointsUsed || 0,
                  totalDataPoints: prev[model]?.totalDataPoints || 0
                }
              }));
            }
          }
        } catch (error) {
          console.log('Status polling error:', error);
        }
      }, 2000);

      // Store interval reference
      (window as any)[`${model}TrainingPoll`] = pollInterval;
      
      const response = await fetch('/api/predictions/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, sessions })
      });
      if (!response.ok) throw new Error('Failed to train model');
      return response.json();
    },
    onSuccess: (result, { model, sessions }) => {
      // Clear polling interval
      const pollInterval = (window as any)[`${model}TrainingPoll`];
      if (pollInterval) {
        clearInterval(pollInterval);
        delete (window as any)[`${model}TrainingPoll`];
      }

      // Update with final results
      setTrainingProgress(prev => ({
        ...prev,
        [model]: { 
          progress: 100, 
          eta: 'Complete!', 
          status: 'completed', 
          currentStep: `Training completed - ${sessions} session${sessions > 1 ? 's' : ''} - Accuracy improved to ${result.metrics?.accuracy?.toFixed(1) || 'N/A'}%`,
          dataPointsUsed: result.dataCount || 0,
          totalDataPoints: result.dataCount || 0
        }
      }));
      toast({
        title: "Model Training Complete",
        description: `${model.toUpperCase()} model trained for ${sessions} session${sessions > 1 ? 's' : ''} with ${result.dataCount?.toLocaleString() || 0} data points`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/predictions/model-metrics'] });
    },
    onError: (error, { model }) => {
      // Clear polling interval
      const pollInterval = (window as any)[`${model}TrainingPoll`];
      if (pollInterval) {
        clearInterval(pollInterval);
        delete (window as any)[`${model}TrainingPoll`];
      }

      setTrainingProgress(prev => ({
        ...prev,
        [model]: { 
          progress: 0, 
          eta: 'Failed', 
          status: 'error', 
          currentStep: 'Training failed',
          dataPointsUsed: 0,
          totalDataPoints: 0
        }
      }));
      toast({
        variant: "destructive",
        title: "Training Failed",
        description: `Failed to train ${model.toUpperCase()} model: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  const handleGeneratePrediction = () => {
    generatePredictionMutation.mutate({
      disasterType: 'earthquake',
      region: region || undefined,
      predictionType
    });
  };

  const handleTrainModel = (model: 'pytorch' | 'ollama', sessions: number = 1) => {
    trainModelMutation.mutate({ model, sessions });
  };

  const getPredictionTypeDescription = () => {
    switch (predictionType) {
      case 'hybrid':
        return 'Combines PyTorch LSTM precision with Ollama AI reasoning for comprehensive predictions';
      case 'pytorch':
        return 'Uses deep learning LSTM model for precise magnitude predictions with confidence scoring';
      case 'ollama':
        return 'Uses local AI with scientific knowledge for explanatory predictions and risk assessment';
      default:
        return '';
    }
  };

  const getPredictionTypeIcon = () => {
    switch (predictionType) {
      case 'hybrid':
        return <Brain className="h-5 w-5 text-purple-600" />;
      case 'pytorch':
        return <Zap className="h-5 w-5 text-blue-600" />;
      case 'ollama':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Prediction Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Hybrid AI Prediction System
          </CardTitle>
          <CardDescription>
            Choose between different AI models for earthquake predictions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="predictionType">Prediction Model</Label>
              <Select value={predictionType} onValueChange={(value) => setPredictionType(value as 'hybrid' | 'pytorch' | 'ollama')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select prediction model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hybrid">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-purple-600" />
                      Hybrid (PyTorch + Ollama)
                    </div>
                  </SelectItem>
                  <SelectItem value="pytorch">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-600" />
                      PyTorch LSTM Only
                    </div>
                  </SelectItem>
                  <SelectItem value="ollama">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Ollama AI Only
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="region">Target Region (Optional)</Label>
              <Input
                id="region"
                placeholder="e.g., California, Japan, Turkey"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {getPredictionTypeIcon()}
              <span className="font-medium">{predictionType.toUpperCase()} Mode</span>
            </div>
            <p className="text-sm text-slate-600">{getPredictionTypeDescription()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Main Interface with Tabs */}
      <Tabs defaultValue="training" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="training">Manual Training</TabsTrigger>
          <TabsTrigger value="scheduler">Auto Training</TabsTrigger>
          <TabsTrigger value="benchmark">Industry Benchmarks</TabsTrigger>
          <TabsTrigger value="predictions">Generate Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="training" className="space-y-6">
          {/* Model Training Section with Progress Indicators */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PyTorch Training */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Sentinel Model (PyTorch LSTM)
            </CardTitle>
            <CardDescription>
              Deep learning model for precise earthquake magnitude predictions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* PyTorch Metrics */}
            {pytorchMetrics && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Current Performance</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-blue-700">{(pytorchMetrics.accuracy || 0).toFixed(1)}%</div>
                    <div className="text-blue-600">Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-blue-700">{(pytorchMetrics.recall || 0).toFixed(1)}%</div>
                    <div className="text-blue-600">Recall</div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <div className="flex justify-between text-xs text-blue-600">
                    <span>Training Data:</span>
                    <span className="font-medium">
                      {(pytorchMetrics.trainingDataCount || 0).toLocaleString()} records
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-blue-600">
                    <span>Sessions:</span>
                    <span className="font-medium">{pytorchMetrics.trainingSessions || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Training Progress for PyTorch */}
            {trainingProgress.pytorch && trainingProgress.pytorch.status !== 'idle' && (
              <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">Training Progress</span>
                  <Badge variant={trainingProgress.pytorch.status === 'completed' ? 'default' : trainingProgress.pytorch.status === 'error' ? 'destructive' : 'secondary'}>
                    {trainingProgress.pytorch.progress.toFixed(0)}%
                  </Badge>
                </div>
                <Progress value={trainingProgress.pytorch.progress} className="h-2" />
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-blue-700">
                      <Activity className="h-3 w-3" />
                      <span>{trainingProgress.pytorch.currentStep}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock className="h-3 w-3" />
                      <span>{trainingProgress.pytorch.eta}</span>
                    </div>
                  </div>
                  {trainingProgress.pytorch.totalDataPoints && (
                    <div className="flex justify-between text-xs text-blue-600">
                      <span>Data Processing:</span>
                      <span>
                        {(trainingProgress.pytorch.dataPointsUsed || 0).toLocaleString()} / {trainingProgress.pytorch.totalDataPoints.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Session Count Selector for Sentinel Model */}
            <div className="space-y-2">
              <Label htmlFor="sentinel-sessions" className="text-sm font-medium">Training Sessions</Label>
              <Select 
                value={sentinelSessionCount.toString()} 
                onValueChange={(value) => setSentinelSessionCount(parseInt(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select sessions" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} Session{num > 1 ? 's' : ''}
                      {num === 1 && ' (Quick)'}
                      {num === 5 && ' (Recommended)'}
                      {num === 10 && ' (Maximum)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                More sessions = better accuracy but longer training time
              </p>
            </div>

            <Button 
              onClick={() => handleTrainModel('pytorch', sentinelSessionCount)} 
              disabled={trainModelMutation.isPending || trainingProgress.pytorch?.status === 'training'}
              className="w-full"
              variant="outline"
            >
              <Cpu className="h-4 w-4 mr-2" />
              {trainingProgress.pytorch?.status === 'training' 
                ? `Training ${sentinelSessionCount} Session${sentinelSessionCount > 1 ? 's' : ''}...` 
                : `Train Sentinel Model (${sentinelSessionCount} Session${sentinelSessionCount > 1 ? 's' : ''})`
              }
            </Button>
          </CardContent>
        </Card>

        {/* Ollama Training */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Ollama AI Model
            </CardTitle>
            <CardDescription>
              Local AI model for reasoning and risk assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Ollama Metrics */}
            {ollamaMetrics && (
              <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Current Performance</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-green-700">{(ollamaMetrics.accuracy || 0).toFixed(1)}%</div>
                    <div className="text-green-600">Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-green-700">{(ollamaMetrics.confidence || ollamaMetrics.accuracy || 0).toFixed(1)}%</div>
                    <div className="text-green-600">Confidence</div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-green-200">
                  <div className="flex justify-between text-xs text-green-600">
                    <span>Training Data:</span>
                    <span className="font-medium">
                      {(ollamaMetrics.trainingDataCount || 0).toLocaleString()} records
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-green-600">
                    <span>Sessions:</span>
                    <span className="font-medium">{ollamaMetrics.trainingSessions || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Training Progress for Ollama */}
            {trainingProgress.ollama && trainingProgress.ollama.status !== 'idle' && (
              <div className="space-y-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-900">Training Progress</span>
                  <Badge variant={trainingProgress.ollama.status === 'completed' ? 'default' : trainingProgress.ollama.status === 'error' ? 'destructive' : 'secondary'}>
                    {trainingProgress.ollama.progress.toFixed(0)}%
                  </Badge>
                </div>
                <Progress value={trainingProgress.ollama.progress} className="h-2" />
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-green-700">
                    <Activity className="h-3 w-3" />
                    <span>{trainingProgress.ollama.currentStep}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500">
                    <Clock className="h-3 w-3" />
                    <span>{trainingProgress.ollama.eta}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Session Count Selector for Ollama Model */}
            <div className="space-y-2">
              <Label htmlFor="ollama-sessions" className="text-sm font-medium">Training Sessions</Label>
              <Select 
                value={ollamaSessionCount.toString()} 
                onValueChange={(value) => setOllamaSessionCount(parseInt(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select sessions" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} Session{num > 1 ? 's' : ''}
                      {num === 1 && ' (Quick)'}
                      {num === 5 && ' (Recommended)'}
                      {num === 10 && ' (Maximum)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                More sessions = better accuracy but longer training time
              </p>
            </div>

            <Button 
              onClick={() => handleTrainModel('ollama', ollamaSessionCount)} 
              disabled={trainModelMutation.isPending || trainingProgress.ollama?.status === 'training'}
              className="w-full"
              variant="outline"
            >
              <Brain className="h-4 w-4 mr-2" />
              {trainingProgress.ollama?.status === 'training' 
                ? `Training ${ollamaSessionCount} Session${ollamaSessionCount > 1 ? 's' : ''}...` 
                : `Train Ollama Model (${ollamaSessionCount} Session${ollamaSessionCount > 1 ? 's' : ''})`
              }
            </Button>
          </CardContent>
        </Card>

          </div>
        </TabsContent>

        <TabsContent value="benchmark" className="space-y-6">
          <BenchmarkComparison modelType="pytorch" />
        </TabsContent>

        <TabsContent value="scheduler" className="space-y-6">
          {/* Automated Training Scheduler */}
          <AutoTrainingScheduler 
            pytorchMetrics={pytorchMetrics}
            ollamaMetrics={ollamaMetrics}
            onSchedulerUpdate={(config: any) => {
              console.log('Training scheduler updated:', config);
            }}
          />
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          {/* Prediction Generation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getPredictionTypeIcon()}
                Generate Hybrid AI Prediction
              </CardTitle>
              <CardDescription>
                Generate earthquake predictions with geographic locations shown on the interactive map
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleGeneratePrediction}
                disabled={generatePredictionMutation.isPending}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                <Brain className="h-4 w-4 mr-2" />
                {generatePredictionMutation.isPending ? 'Generating Prediction...' : 'Generate Hybrid Prediction'}
              </Button>
            </CardContent>
          </Card>

          {/* Latest Prediction Report */}
          {showPredictionReport && latestPrediction && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Latest Prediction Report
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPredictionReport(false)}
                  >
                    Hide Report
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PredictionReport prediction={latestPrediction} showDetails={true} />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}