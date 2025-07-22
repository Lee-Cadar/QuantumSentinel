import { useQuery } from "@tanstack/react-query";
import NavigationHeader from "@/components/navigation-header";
import { HybridPrediction } from "@/components/hybrid-prediction";
import { BenchmarkComparison } from "@/components/benchmark-comparison";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Activity, Zap } from "lucide-react";
import { useState } from "react";

export default function Dashboard() {
  const [activeModel, setActiveModel] = useState<'pytorch' | 'ollama'>('pytorch');
  
  const { data: pytorchMetrics } = useQuery({
    queryKey: ["/api/predictions/model-metrics", "pytorch"],
  });

  const { data: ollamaMetrics } = useQuery({
    queryKey: ["/api/predictions/model-metrics", "ollama"],
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <NavigationHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AXIOM Sentinel - Earthquake Prediction System
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Advanced AI-powered seismic analysis with temporal cross-validation
          </p>
        </div>

        {/* Simplified Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PyTorch Model</CardTitle>
              <Brain className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {pytorchMetrics?.accuracy?.toFixed(1) || '0.0'}%
              </div>
              <p className="text-xs text-muted-foreground">
                {pytorchMetrics?.trainingDataCount?.toLocaleString() || '0'} data points
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ollama AI Model</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {ollamaMetrics?.accuracy?.toFixed(1) || '0.0'}%
              </div>
              <p className="text-xs text-muted-foreground">
                {ollamaMetrics?.trainingDataCount?.toLocaleString() || '0'} data points
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Zap className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">Active</div>
              <Badge variant="default" className="text-xs">
                Hybrid Mode
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Main Prediction Interface */}
        <div className="mb-8">
          <HybridPrediction onPredictionGenerated={(prediction: any) => {
            console.log('New hybrid prediction generated:', prediction);
          }} />
        </div>

        {/* Benchmark Comparison */}
        <div className="mb-8">
          <BenchmarkComparison modelType="pytorch" />
        </div>
      </main>
    </div>
  );
}
