import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  Target,
  BarChart3,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Shield,
  Activity,
  Database
} from "lucide-react";

interface PredictionReportProps {
  prediction: any;
  showDetails?: boolean;
}

export function PredictionReport({ prediction, showDetails = true }: PredictionReportProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'extreme': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getModelTypeIcon = (modelType: string) => {
    switch (modelType) {
      case 'hybrid': return <Brain className="h-5 w-5 text-purple-600" />;
      case 'pytorch': return <Zap className="h-5 w-5 text-blue-600" />;
      case 'ollama': return <TrendingUp className="h-5 w-5 text-green-600" />;
      default: return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getModelTypeDescription = (modelType: string) => {
    switch (modelType) {
      case 'hybrid': return 'Combined PyTorch LSTM + Ollama AI Analysis';
      case 'pytorch': return 'Deep Learning LSTM Neural Network';
      case 'ollama': return 'Local AI Reasoning & Risk Assessment';
      default: return 'Statistical Analysis Model';
    }
  };

  // Handle legacy prediction format
  if (!prediction.analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Earthquake Prediction Report
          </CardTitle>
          <CardDescription>
            Generated on {new Date(prediction.timestamp).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">
                {prediction.predictedMagnitude?.toFixed(1) || prediction.predictedIntensity?.toFixed(1) || 'N/A'}
              </div>
              <div className="text-sm text-blue-600">Predicted Magnitude</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">
                {prediction.confidence?.toFixed(0) || 0}%
              </div>
              <div className="text-sm text-green-600">Confidence</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-700">
                {prediction.timeframe || '24-72 hours'}
              </div>
              <div className="text-sm text-orange-600">Timeframe</div>
            </div>
          </div>
          
          {prediction.reasoning && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Analysis</h4>
              <p className="text-sm text-gray-700">{prediction.reasoning}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Enhanced prediction report
  return (
    <div className="space-y-6">
      {/* Main Prediction Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getModelTypeIcon(prediction.modelType)}
            Enhanced Earthquake Prediction Report
            <Badge variant="outline" className="ml-auto">
              {prediction.modelType.toUpperCase()}
            </Badge>
          </CardTitle>
          <CardDescription>
            {getModelTypeDescription(prediction.modelType)} • Generated on {new Date(prediction.timestamp).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-700">
                {prediction.prediction.magnitude.toFixed(1)}
              </div>
              <div className="text-sm text-blue-600">Predicted Magnitude</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-700">
                {prediction.prediction.confidence.toFixed(0)}%
              </div>
              <div className="text-sm text-green-600">Model Confidence</div>
            </div>
            <div className={`text-center p-4 rounded-lg ${getRiskLevelColor(prediction.prediction.riskLevel)}`}>
              <div className="text-xl font-bold uppercase">
                {prediction.prediction.riskLevel}
              </div>
              <div className="text-sm">Risk Level</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-xl font-bold text-purple-700">
                {prediction.prediction.timeframe}
              </div>
              <div className="text-sm text-purple-600">Time Window</div>
            </div>
          </div>

          {/* Location & Data Quality */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <MapPin className="h-5 w-5 text-gray-600" />
              <div>
                <div className="font-medium">Target Region</div>
                <div className="text-sm text-gray-600">{prediction.prediction.location}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Database className="h-5 w-5 text-gray-600" />
              <div>
                <div className="font-medium">Data Quality</div>
                <div className="text-sm text-gray-600 capitalize">
                  {prediction.analysis.hybridSynthesis.dataQuality}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Analysis Breakdown */}
      {showDetails && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PyTorch Analysis */}
          {prediction.analysis.pytorchAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  PyTorch LSTM Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">
                      {prediction.analysis.pytorchAnalysis.magnitudePrediction.toFixed(1)}
                    </div>
                    <div className="text-xs text-blue-600">Magnitude</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">
                      {prediction.analysis.pytorchAnalysis.confidence.toFixed(0)}%
                    </div>
                    <div className="text-xs text-blue-600">Confidence</div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Model Accuracy:</span>
                    <span className="font-medium">
                      {prediction.analysis.pytorchAnalysis.modelAccuracy.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Data Points Used:</span>
                    <span className="font-medium">
                      {prediction.analysis.pytorchAnalysis.dataPointsUsed.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ollama Analysis */}
          {prediction.analysis.ollamaAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Ollama AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-sm font-medium text-green-900 mb-2">AI Reasoning</div>
                  <div className="text-sm text-green-700">
                    {prediction.analysis.ollamaAnalysis.reasoning}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="font-medium text-sm">Key Risk Factors:</div>
                  {prediction.analysis.ollamaAnalysis.riskFactors.map((factor: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <AlertCircle className="h-3 w-3 text-yellow-600" />
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium mb-1">Historical Context</div>
                  <div className="text-xs text-gray-600">
                    {prediction.analysis.ollamaAnalysis.historicalContext}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Hybrid Synthesis & Key Insights */}
      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Hybrid Model Synthesis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-700">
                  {prediction.analysis.hybridSynthesis.combinedConfidence.toFixed(0)}%
                </div>
                <div className="text-sm text-purple-600">Combined Confidence</div>
                <div className="text-xs text-purple-500 mt-1">
                  {prediction.analysis.hybridSynthesis.reconciliationMethod}
                </div>
              </div>
              <div className="p-4 bg-indigo-50 rounded-lg">
                <div className="text-lg font-bold text-indigo-700 capitalize">
                  {prediction.analysis.hybridSynthesis.dataQuality}
                </div>
                <div className="text-sm text-indigo-600">Data Quality</div>
                <div className="text-xs text-indigo-500 mt-1">
                  {prediction.dataMetrics.recentEarthquakeCount} recent earthquakes analyzed
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Key Insights
              </h4>
              <div className="space-y-2">
                {prediction.analysis.hybridSynthesis.keyInsights.map((insight: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Assessment & Recommendations */}
      {showDetails && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-red-600" />
                Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Immediate Risk (24h)</span>
                    <span className="text-sm font-bold">{prediction.riskAssessment.immediateRisk}%</span>
                  </div>
                  <Progress value={prediction.riskAssessment.immediateRisk} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Weekly Risk</span>
                    <span className="text-sm font-bold">{prediction.riskAssessment.weeklyRisk}%</span>
                  </div>
                  <Progress value={prediction.riskAssessment.weeklyRisk} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Monthly Risk</span>
                    <span className="text-sm font-bold">{prediction.riskAssessment.monthlyRisk}%</span>
                  </div>
                  <Progress value={prediction.riskAssessment.monthlyRisk} className="h-2" />
                </div>
              </div>

              <Separator />

              <div>
                <h5 className="font-medium mb-2">Key Risk Factors</h5>
                <div className="space-y-1">
                  {prediction.riskAssessment.keyFactors.map((factor: string, index: number) => (
                    <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      {factor}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Recommended Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {prediction.riskAssessment.recommendedActions.map((action: string, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <span className="text-sm">{action}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Metrics Summary */}
      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-600" />
              Data Analysis Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold">{prediction.dataMetrics.inputSequenceLength}</div>
                <div className="text-xs text-gray-600">Sequence Length</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold">{prediction.dataMetrics.recentEarthquakeCount}</div>
                <div className="text-xs text-gray-600">Recent Events</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold">{prediction.dataMetrics.historicalPatternMatch}%</div>
                <div className="text-xs text-gray-600">Pattern Match</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold">{prediction.dataMetrics.dataRecency}</div>
                <div className="text-xs text-gray-600">Data Recency</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}