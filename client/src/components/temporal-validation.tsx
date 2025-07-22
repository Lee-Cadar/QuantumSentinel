import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Clock, 
  Database, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  Play,
  Calendar,
  BarChart3,
  Target,
  Award,
  Zap
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface TemporalValidationResult {
  modelType: 'pytorch' | 'ollama' | 'hybrid';
  config: {
    trainingCutoffDate: string;
    testingStartDate: string;
    validationPeriods: Array<{
      name: string;
      startDate: string;
      endDate: string;
    }>;
  };
  trainingMetrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    mae: number;
    locationAccuracy: number;
    temporalAccuracy: number;
  };
  testingMetrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    mae: number;
    locationAccuracy: number;
    temporalAccuracy: number;
  };
  realTimeResults: Array<{
    period: string;
    predictedEvents: number;
    actualEvents: number;
    successfulPredictions: number;
    falsePositives: number;
    missedEvents: number;
    avgMagnitudeError: number;
    avgLocationError: number;
  }>;
  scientificCredibility: {
    dataLeakageScore: number;
    temporalRobustness: number;
    realWorldPerformance: number;
    overallCredibility: number;
  };
}

interface TemporalValidationProps {
  modelType?: 'pytorch' | 'ollama';
}

export function TemporalValidation({ modelType = 'pytorch' }: TemporalValidationProps) {
  const [isValidating, setIsValidating] = useState(false);
  const queryClient = useQueryClient();

  // Fetch latest validation results
  const { data: validationResults = [], isLoading } = useQuery<TemporalValidationResult[]>({
    queryKey: ['/api/temporal-validation/results', modelType],
    refetchInterval: 10000
  });

  // Start temporal validation mutation
  const validationMutation = useMutation({
    mutationFn: async (model: string) => {
      return apiRequest('POST', `/api/temporal-validation/start/${model}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/temporal-validation/results', modelType] });
      setIsValidating(false);
    },
    onError: (error) => {
      console.error('Temporal validation error:', error);
      setIsValidating(false);
    }
  });

  const handleStartValidation = async (model: 'pytorch' | 'ollama') => {
    setIsValidating(true);
    try {
      await validationMutation.mutateAsync(model);
    } catch (error) {
      console.error('Validation error:', error);
      setIsValidating(false);
    }
  };

  const getCredibilityColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-50";
    if (score >= 80) return "text-blue-600 bg-blue-50"; 
    if (score >= 70) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const latestResult = validationResults[0];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading temporal validation results...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Temporal Cross-Validation System
          </CardTitle>
          <CardDescription>
            Scientific validation using pre-2024 training data and 2025 real-time testing to eliminate data leakage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={() => handleStartValidation('pytorch')}
              disabled={isValidating}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              {isValidating ? 'Running...' : 'Validate PyTorch Model'}
            </Button>
            <Button 
              onClick={() => handleStartValidation('ollama')}
              disabled={isValidating}
              variant="outline"
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              {isValidating ? 'Running...' : 'Validate Ollama Model'}
            </Button>
          </div>
          
          {isValidating && (
            <Alert className="mt-4">
              <Zap className="h-4 w-4" />
              <AlertDescription>
                Running comprehensive temporal validation... This runs in the background and results will appear shortly.
              </AlertDescription>
            </Alert>
          )}
          
          {validationMutation.isError && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Temporal validation failed. Please try again or check the server logs.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Latest Results */}
      {latestResult && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="realtime">Real-Time</TabsTrigger>
            <TabsTrigger value="credibility">Credibility</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Model Validation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {latestResult.modelType.toUpperCase()}
                  </div>
                  <Badge variant="outline" className="mt-1">
                    {latestResult.config.trainingCutoffDate} Cutoff
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Training Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {(latestResult.trainingMetrics.accuracy * 100).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Pre-2024 Data</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Testing Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {(latestResult.testingMetrics.accuracy * 100).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">2024 Out-of-Sample</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Validation Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {latestResult.config.validationPeriods.map((period, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{period.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {period.startDate} to {period.endDate}
                        </div>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Training Metrics (Pre-2024)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Accuracy</span>
                      <span className="font-mono">{(latestResult.trainingMetrics.accuracy * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={latestResult.trainingMetrics.accuracy * 100} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Precision</span>
                      <span className="font-mono">{(latestResult.trainingMetrics.precision * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={latestResult.trainingMetrics.precision * 100} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Recall</span>
                      <span className="font-mono">{(latestResult.trainingMetrics.recall * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={latestResult.trainingMetrics.recall * 100} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Location Accuracy</span>
                      <span className="font-mono">{latestResult.trainingMetrics.locationAccuracy.toFixed(1)}%</span>
                    </div>
                    <Progress value={latestResult.trainingMetrics.locationAccuracy} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Testing Metrics (2024 Out-of-Sample)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Accuracy</span>
                      <span className="font-mono">{(latestResult.testingMetrics.accuracy * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={latestResult.testingMetrics.accuracy * 100} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Precision</span>
                      <span className="font-mono">{(latestResult.testingMetrics.precision * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={latestResult.testingMetrics.precision * 100} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Recall</span>
                      <span className="font-mono">{(latestResult.testingMetrics.recall * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={latestResult.testingMetrics.recall * 100} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>MAE (Magnitude)</span>
                      <span className="font-mono">{latestResult.testingMetrics.mae.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="realtime" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Real-Time Performance Analysis
                </CardTitle>
                <CardDescription>
                  Performance on real earthquake events in validation periods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {latestResult.realTimeResults.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{result.period}</h4>
                        <Badge variant="outline">
                          {result.successfulPredictions}/{result.actualEvents} events
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Predicted</div>
                          <div className="font-mono text-lg">{result.predictedEvents}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Successful</div>
                          <div className="font-mono text-lg text-green-600">{result.successfulPredictions}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">False Positives</div>
                          <div className="font-mono text-lg text-red-600">{result.falsePositives}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Missed Events</div>
                          <div className="font-mono text-lg text-yellow-600">{result.missedEvents}</div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Avg Magnitude Error</div>
                          <div className="font-mono">{result.avgMagnitudeError.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Avg Location Error</div>
                          <div className="font-mono">{result.avgLocationError.toFixed(1)} km</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credibility" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Scientific Credibility Assessment
                </CardTitle>
                <CardDescription>
                  Comprehensive evaluation of model reliability and scientific rigor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg ${getCredibilityColor(latestResult.scientificCredibility.dataLeakageScore)}`}>
                      <div className="font-medium">Data Leakage Prevention</div>
                      <div className="text-2xl font-bold">
                        {latestResult.scientificCredibility.dataLeakageScore.toFixed(1)}%
                      </div>
                      <div className="text-sm">Proper temporal separation</div>
                    </div>
                    <div className={`p-4 rounded-lg ${getCredibilityColor(latestResult.scientificCredibility.temporalRobustness)}`}>
                      <div className="font-medium">Temporal Robustness</div>
                      <div className="text-2xl font-bold">
                        {latestResult.scientificCredibility.temporalRobustness.toFixed(1)}%
                      </div>
                      <div className="text-sm">Performance on future data</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg ${getCredibilityColor(latestResult.scientificCredibility.realWorldPerformance)}`}>
                      <div className="font-medium">Real-World Performance</div>
                      <div className="text-2xl font-bold">
                        {latestResult.scientificCredibility.realWorldPerformance.toFixed(1)}%
                      </div>
                      <div className="text-sm">Live earthquake events</div>
                    </div>
                    <div className={`p-4 rounded-lg ${getCredibilityColor(latestResult.scientificCredibility.overallCredibility)}`}>
                      <div className="font-medium">Overall Credibility</div>
                      <div className="text-2xl font-bold">
                        {latestResult.scientificCredibility.overallCredibility.toFixed(1)}%
                      </div>
                      <div className="text-sm">Scientific rigor score</div>
                    </div>
                  </div>
                </div>

                <Alert className="mt-6">
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Temporal Cross-Validation Benefits:</strong> This validation method eliminates data leakage by training only on historical data (pre-2024) and testing on future events (2024-2025). The {((latestResult.testingMetrics.accuracy / latestResult.trainingMetrics.accuracy) * 100).toFixed(1)}% performance retention demonstrates genuine predictive capability rather than pattern memorization.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!latestResult && !isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Temporal Validation Results</h3>
            <p className="text-muted-foreground mb-4">
              Start a temporal cross-validation to assess model credibility
            </p>
            <Button onClick={() => handleStartValidation('pytorch')}>
              Run Temporal Validation
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}