import { useState } from "react";
import { CheckCircle, TrendingUp, BarChart3, Brain, Database, RefreshCw, Activity, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function PredictionPanel() {
  const [selectedType, setSelectedType] = useState("earthquake");
  const [region, setRegion] = useState("");
  const [lastPrediction, setLastPrediction] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: predictions = [] } = useQuery({
    queryKey: ["/api/predictions"],
  });

  const { data: modelMetrics } = useQuery({
    queryKey: ["/api/predictions/model-metrics"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const generateMutation = useMutation({
    mutationFn: async ({ disasterType, region }: { disasterType: string; region?: string }) => {
      return apiRequest("POST", "/api/predictions/generate", { disasterType, region });
    },
    onSuccess: async (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/predictions"] });
      const data = await response.json();
      setLastPrediction(data);
      toast({
        title: "Ollama AI Prediction Generated",
        description: "Local AI analysis of real-time earthquake data completed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Prediction Failed",
        description: error.message || "Unable to generate prediction. Please try again.",
        variant: "destructive",
      });
    }
  });

  const trainMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/predictions/train");
    },
    onSuccess: async (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/predictions/model-metrics"] });
      const data = await response.json();
      toast({
        title: "Model Training Complete",
        description: `Model trained with ${data.dataPoints} earthquake records from multiple sources.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Training Failed",
        description: error.message || "Unable to train model. Please try again.",
        variant: "destructive",
      });
    }
  });

  const getLatestPrediction = (type: string) => {
    return predictions
      .filter(p => p.disasterType === type)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  };

  const earthquakePrediction = getLatestPrediction("earthquake");
  const wildfirePrediction = getLatestPrediction("wildfire");

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "var(--safe-green)";
    if (confidence >= 70) return "var(--warning-orange)";
    return "var(--emergency-red)";
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 80) return "var(--emergency-red)";
    if (risk >= 60) return "var(--warning-orange)";
    return "var(--safe-green)";
  };

  return (
    <Card className="bg-white rounded-xl shadow-lg">
      <CardHeader className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5" style={{ color: 'var(--emergency-red)' }} />
            <h2 className="text-xl font-bold text-slate-900">Ollama AI Earthquake Prediction</h2>
          </div>
          <div className="flex items-center space-x-2 text-sm" style={{ color: 'var(--safe-green)' }}>
            <Activity className="h-4 w-4" />
            <span>Local AI Processing</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Model Metrics Display */}
          {modelMetrics && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-900 flex items-center">
                  <Database className="h-4 w-4 mr-2" style={{ color: 'hsl(207, 90%, 54%)' }} />
                  AI Model Performance
                </h4>
                <span className="text-xs" style={{ color: 'var(--neutral-gray)' }}>
                  Updated: {new Date(modelMetrics.lastUpdated).toLocaleTimeString()}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: 'hsl(207, 90%, 54%)' }}>
                    {modelMetrics.accuracy.toFixed(1)}%
                  </p>
                  <p className="text-xs" style={{ color: 'var(--neutral-gray)' }}>Accuracy</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: 'var(--safe-green)' }}>
                    {modelMetrics.precision.toFixed(1)}%
                  </p>
                  <p className="text-xs" style={{ color: 'var(--neutral-gray)' }}>Precision</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: 'var(--warning-orange)' }}>
                    {modelMetrics.recall.toFixed(1)}%
                  </p>
                  <p className="text-xs" style={{ color: 'var(--neutral-gray)' }}>Recall</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900">
                    {modelMetrics.totalPredictions}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--neutral-gray)' }}>Predictions</p>
                </div>
              </div>
            </div>
          )}

          {/* Latest AI Prediction */}
          {lastPrediction && (
            <div className="bg-slate-50 p-4 rounded-lg border-l-4" style={{ borderLeftColor: 'var(--emergency-red)' }}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-900">Latest AI Prediction</h4>
                <div className="flex items-center space-x-2">
                  <span 
                    className="text-xs text-white px-2 py-1 rounded"
                    style={{ backgroundColor: getConfidenceColor(lastPrediction.confidence) }}
                  >
                    {lastPrediction.confidence.toFixed(0)}% Confidence
                  </span>
                  <span 
                    className="text-xs text-white px-2 py-1 rounded capitalize"
                    style={{ backgroundColor: getRiskColor(lastPrediction.predictedIntensity * 10) }}
                  >
                    {lastPrediction.riskLevel} Risk
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--emergency-red)' }}>
                    Magnitude {lastPrediction.predictedIntensity.toFixed(1)}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--neutral-gray)' }}>
                    Expected in next {lastPrediction.timeframe}
                  </p>
                  <p className="text-sm font-medium text-slate-900 mt-1">
                    📍 {lastPrediction.location}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 mb-2">AI Analysis:</p>
                  <p className="text-xs" style={{ color: 'var(--neutral-gray)' }}>
                    {lastPrediction.reasoning?.substring(0, 150)}...
                  </p>
                </div>
              </div>
              {lastPrediction.keyFactors && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs font-medium text-slate-900 mb-1">Key Risk Factors:</p>
                  <div className="flex flex-wrap gap-1">
                    {lastPrediction.keyFactors.slice(0, 3).map((factor: string, index: number) => (
                      <span key={index} className="text-xs bg-slate-200 px-2 py-1 rounded">
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generate New Prediction */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="font-medium text-slate-900">Generate AI Prediction</h5>
              <Button
                size="sm"
                onClick={() => trainMutation.mutate()}
                disabled={trainMutation.isPending}
                variant="outline"
                className="text-xs"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${trainMutation.isPending ? 'animate-spin' : ''}`} />
                {trainMutation.isPending ? "Training..." : "Train Model"}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="disasterType" className="text-sm font-medium text-slate-900 mb-2">
                  Disaster Type
                </Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="earthquake">🌍 Earthquake (Ollama AI)</SelectItem>
                    <SelectItem value="wildfire">🔥 Wildfire (Statistical)</SelectItem>
                    <SelectItem value="flood">🌊 Flood (Statistical)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="region" className="text-sm font-medium text-slate-900 mb-2">
                  Region (Optional)
                </Label>
                <Input
                  id="region"
                  placeholder="e.g. California, Pacific Ring"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                />
              </div>
            </div>

            <Button
              className="w-full text-white font-semibold"
              style={{ backgroundColor: 'var(--emergency-red)' }}
              onClick={() => generateMutation.mutate({ disasterType: selectedType, region })}
              disabled={generateMutation.isPending}
            >
              <Brain className="h-4 w-4 mr-2" />
              {generateMutation.isPending ? "Analyzing with Ollama..." : 
               selectedType === 'earthquake' ? "Generate Ollama AI Prediction" : "Generate Statistical Prediction"}
            </Button>
          </div>

          {/* Data Sources Info */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Database className="h-4 w-4" style={{ color: 'hsl(207, 90%, 54%)' }} />
              <span className="text-sm font-medium text-slate-900">System Status & Data Sources</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--warning-orange)' }}></div>
                  <span style={{ color: 'var(--neutral-gray)' }}>Ollama AI (Local - Setup Required)</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--safe-green)' }}></div>
                  <span style={{ color: 'var(--neutral-gray)' }}>Statistical Analysis (Active)</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--safe-green)' }}></div>
                  <span style={{ color: 'var(--neutral-gray)' }}>USGS Earthquake API</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--safe-green)' }}></div>
                  <span style={{ color: 'var(--neutral-gray)' }}>Historical Patterns (1500+ records)</span>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded p-2">
              <div className="flex items-center space-x-1 mb-1">
                <AlertTriangle className="h-3 w-3" style={{ color: 'var(--warning-orange)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--warning-orange)' }}>Ollama Setup Required</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--neutral-gray)' }}>
                Install Ollama locally for advanced AI predictions. Currently using statistical analysis with real earthquake data.
                <br />See OLLAMA_SETUP.md for installation instructions.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
