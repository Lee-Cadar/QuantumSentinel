import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Brain, Zap, TrendingUp, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface HybridPredictionProps {
  onPredictionGenerated?: (prediction: any) => void;
}

export function HybridPrediction({ onPredictionGenerated }: HybridPredictionProps) {
  const [predictionType, setPredictionType] = useState<'hybrid' | 'pytorch' | 'ollama'>('hybrid');
  const [region, setRegion] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch PyTorch model metrics
  const { data: pytorchMetrics } = useQuery({
    queryKey: ['/api/predictions/model-metrics', 'pytorch'],
    queryFn: () => fetch('/api/predictions/model-metrics?model=pytorch').then(r => r.json()),
    refetchInterval: 30000
  });

  // Fetch Ollama model metrics
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

  const trainModelMutation = useMutation({
    mutationFn: async (model: 'pytorch' | 'ollama') => {
      const response = await fetch('/api/predictions/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model })
      });
      if (!response.ok) throw new Error('Failed to train model');
      return response.json();
    },
    onSuccess: (result, model) => {
      toast({
        title: "Model Training Complete",
        description: `${model.toUpperCase()} model has been trained successfully`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/predictions/model-metrics'] });
    },
    onError: (error, model) => {
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

  const handleTrainModel = (model: 'pytorch' | 'ollama') => {
    trainModelMutation.mutate(model);
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
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g., California, Pacific Ring of Fire"
              />
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            {getPredictionTypeIcon()}
            <div className="text-sm">
              <strong className="text-blue-700 dark:text-blue-300">
                {predictionType.toUpperCase()} Model:
              </strong>
              <br />
              {getPredictionTypeDescription()}
            </div>
          </div>

          <Button
            onClick={handleGeneratePrediction}
            disabled={generatePredictionMutation.isPending}
            className="w-full"
          >
            {generatePredictionMutation.isPending ? 'Generating...' : 'Generate Prediction'}
          </Button>
        </CardContent>
      </Card>

      {/* Model Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PyTorch Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600" />
              PyTorch LSTM Model
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pytorchMetrics ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Accuracy</span>
                  <Badge variant="secondary">{pytorchMetrics.accuracy?.toFixed(1)}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Precision</span>
                  <Badge variant="secondary">{pytorchMetrics.precision?.toFixed(1)}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Recall</span>
                  <Badge variant="secondary">{pytorchMetrics.recall?.toFixed(1)}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Predictions</span>
                  <Badge variant="outline">{pytorchMetrics.totalPredictions}</Badge>
                </div>
                <Separator />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTrainModel('pytorch')}
                  disabled={trainModelMutation.isPending}
                  className="w-full"
                >
                  {trainModelMutation.isPending ? 'Training...' : 'Train PyTorch Model'}
                </Button>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Loading PyTorch metrics...</div>
            )}
          </CardContent>
        </Card>

        {/* Ollama Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Ollama AI Model
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ollamaMetrics ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Accuracy</span>
                  <Badge variant="secondary">{ollamaMetrics.accuracy?.toFixed(1)}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Confidence</span>
                  <Badge variant="secondary">{ollamaMetrics.averageConfidence?.toFixed(1)}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Predictions</span>
                  <Badge variant="outline">{ollamaMetrics.totalPredictions}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={ollamaMetrics.isOllamaAvailable ? "default" : "destructive"}>
                    {ollamaMetrics.isOllamaAvailable ? "Available" : "Offline"}
                  </Badge>
                </div>
                <Separator />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTrainModel('ollama')}
                  disabled={trainModelMutation.isPending}
                  className="w-full"
                >
                  {trainModelMutation.isPending ? 'Training...' : 'Train Ollama Model'}
                </Button>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Loading Ollama metrics...</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}