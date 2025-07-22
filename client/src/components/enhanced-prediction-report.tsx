import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { MapPin, Brain, Activity, Database, AlertTriangle, TrendingUp, Eye, EyeOff, Calendar, Target } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import RealTimeEarthquakeMap from "./real-time-earthquake-map";

interface PredictionLocation {
  name: string;
  lat: number;
  lng: number;
}

interface EnhancedPredictionReportProps {
  prediction: {
    id: number;
    modelType: 'hybrid' | 'pytorch' | 'ollama';
    prediction: {
      magnitude: number;
      confidence: number;
      timeframe: string;
      location: string;
      riskLevel: 'low' | 'medium' | 'high' | 'extreme';
    };
    analysis: {
      pytorchAnalysis?: {
        magnitudePrediction: number;
        confidence: number;
        dataPointsUsed: number;
        modelAccuracy: number;
        technicalDetails?: {
          lstmArchitecture: string;
          inputFeatures: string[];
          trainingEpochs: number;
          lossFunction: string;
          optimizerDetails: string;
          validationSplit: string;
          earlyStoppingSigma: string;
        };
        seismicParameters?: {
          frequencyDomain: string;
          magnitudeScale: string;
          depthEstimate: string;
          seismicMoment: string;
          energyRelease: string;
          ruptureLength: string;
        };
      };
      ollamaAnalysis?: {
        reasoning: string;
        riskFactors: string[];
        confidence: number;
        historicalContext: string;
      };
      hybridSynthesis: {
        combinedConfidence: number;
        reconciliationMethod: string;
        keyInsights: string[];
        dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
        probabilityAnalysis?: {
          bayesianInference: string;
          confidenceInterval: string;
          statisticalSignificance: string;
          modelAgreement: string;
          uncertaintyQuantification: string;
        };
        modelDivergence?: {
          magnitudeVariance: string;
          confidenceSpread: string;
          consensusLevel: string;
          reliabilityFactor: string;
        };
      };
      predictedLocation?: PredictionLocation;
    };
    riskAssessment: {
      immediateRisk: number;
      weeklyRisk: number;
      monthlyRisk: number;
      keyFactors: string[];
      recommendedActions: string[];
    };
    dataMetrics: {
      inputSequenceLength: number;
      recentEarthquakeCount: number;
      historicalPatternMatch: number;
      dataRecency: string;
      closestRecordedEvent?: {
        magnitude: number;
        location: string;
        timestamp: string;
        distance: string;
        significance: string;
      };
      dailyProbabilities?: Array<{
        day: number;
        probability: number;
        riskLevel: string;
      }>;
    };
    timestamp: string;
  };
  onHide?: () => void;
}

export function EnhancedPredictionReport({ prediction, onHide }: EnhancedPredictionReportProps) {
  const [showMap, setShowMap] = useState(true);
  
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'extreme': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getDataQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200';
      case 'good': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200';
      case 'fair': return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200';
      case 'poor': return 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200';
      default: return 'bg-gray-50 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200';
    }
  };

  const formatNumber = (num: number) => num.toLocaleString();

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Brain className="h-6 w-6 text-purple-600" />
                Enhanced Earthquake Prediction Report
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Combined PyTorch LSTM + Ollama AI Analysis • Generated on {new Date(prediction.timestamp).toLocaleString()}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={prediction.modelType === 'hybrid' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                {prediction.modelType.toUpperCase()}
              </Badge>
              {onHide && (
                <Button variant="outline" size="sm" onClick={onHide}>
                  Hide Report
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Main Prediction Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {prediction.prediction.magnitude.toFixed(1)}
                </div>
                <div className="text-sm text-blue-800 dark:text-blue-200 font-medium">Predicted Magnitude</div>
              </CardContent>
            </Card>
            
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {prediction.prediction.confidence.toFixed(0)}%
                </div>
                <div className="text-sm text-green-800 dark:text-green-200 font-medium">Model Confidence</div>
              </CardContent>
            </Card>
            
            <Card className={`border-2 ${getRiskColor(prediction.prediction.riskLevel) === 'destructive' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'}`}>
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-yellow-800 dark:text-yellow-200 uppercase">
                  {prediction.prediction.riskLevel}
                </div>
                <div className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">Risk Level</div>
              </CardContent>
            </Card>
            
            <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {prediction.prediction.timeframe}
                </div>
                <div className="text-sm text-purple-800 dark:text-purple-200 font-medium">Time Window</div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Predicted Location and Map Section */}
          {prediction.analysis.predictedLocation && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-red-600" />
                  Predicted Epicenter
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMap(!showMap)}
                  className="flex items-center gap-2"
                >
                  {showMap ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showMap ? 'Hide Map' : 'Show Map'}
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Seismic Zone:</span>
                          <span className="font-semibold">{prediction.analysis.predictedLocation?.name || 'Regional Area'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Coordinates:</span>
                          <span className="font-mono text-sm">
                            {prediction.analysis.predictedLocation?.lat?.toFixed(4) || '0.0000'}°, 
                            {prediction.analysis.predictedLocation?.lng?.toFixed(4) || '0.0000'}°
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Location Source:</span>
                          <Badge variant="outline">AI Prediction</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {showMap && (
                  <div className="space-y-4">
                    <RealTimeEarthquakeMap prediction={prediction} />

                    {/* Closest Recorded Event */}
                    {prediction.dataMetrics.closestRecordedEvent && (
                      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                        <h4 className="font-semibold text-sm mb-2 text-orange-800 dark:text-orange-200">Closest Recorded Event</h4>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="font-medium">Magnitude:</span>
                            <span className="ml-2 font-bold">{prediction.dataMetrics.closestRecordedEvent.magnitude.toFixed(1)}</span>
                          </div>
                          <div>
                            <span className="font-medium">Distance:</span>
                            <span className="ml-2">{prediction.dataMetrics.closestRecordedEvent.distance}</span>
                          </div>
                          <div>
                            <span className="font-medium">Location:</span>
                            <span className="ml-2">{prediction.dataMetrics.closestRecordedEvent.location}</span>
                          </div>
                          <div>
                            <span className="font-medium">Significance:</span>
                            <span className="ml-2">{prediction.dataMetrics.closestRecordedEvent.significance}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium">Date:</span>
                            <span className="ml-2">{new Date(prediction.dataMetrics.closestRecordedEvent.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 14-Day Probability Forecast - Full Width */}
              {prediction.dataMetrics.dailyProbabilities && (
                <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h4 className="font-semibold text-sm mb-4 text-purple-800 dark:text-purple-200 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    14-Day Probability Forecast
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={prediction.dataMetrics.dailyProbabilities}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="day" 
                          label={{ value: 'Days', position: 'insideBottom', offset: -5 }} 
                        />
                        <YAxis 
                          label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft' }} 
                        />
                        <Tooltip 
                          formatter={(value: any) => [`${value.toFixed(1)}%`, 'Probability']}
                          labelFormatter={(label) => `Day ${label}`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="probability" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    Peak probability window: Days 3-8 based on seismic pattern analysis
                  </p>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Model Analysis Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PyTorch Analysis */}
            {prediction.analysis.pytorchAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    PyTorch LSTM Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {prediction.analysis.pytorchAnalysis.magnitudePrediction.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Magnitude</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {prediction.analysis.pytorchAnalysis.confidence.toFixed(0)}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Confidence</div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Model Accuracy:</span>
                      <span className="font-semibold">{prediction.analysis.pytorchAnalysis.modelAccuracy.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Data Points Used:</span>
                      <span className="font-mono text-sm font-bold">{formatNumber(prediction.analysis.pytorchAnalysis.dataPointsUsed)}</span>
                    </div>
                  </div>

                  {/* Enhanced Technical Details */}
                  {prediction.analysis.pytorchAnalysis.technicalDetails && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-semibold text-sm mb-3">Technical Architecture</h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="font-medium">LSTM Architecture:</span>
                          <p className="text-gray-600 dark:text-gray-400">{prediction.analysis.pytorchAnalysis.technicalDetails.lstmArchitecture}</p>
                        </div>
                        <div>
                          <span className="font-medium">Training Epochs:</span>
                          <p className="text-gray-600 dark:text-gray-400">{prediction.analysis.pytorchAnalysis.technicalDetails.trainingEpochs}</p>
                        </div>
                        <div>
                          <span className="font-medium">Loss Function:</span>
                          <p className="text-gray-600 dark:text-gray-400">{prediction.analysis.pytorchAnalysis.technicalDetails.lossFunction}</p>
                        </div>
                        <div>
                          <span className="font-medium">Optimizer:</span>
                          <p className="text-gray-600 dark:text-gray-400">{prediction.analysis.pytorchAnalysis.technicalDetails.optimizerDetails}</p>
                        </div>
                        <div className="lg:col-span-2">
                          <span className="font-medium">Input Features:</span>
                          <p className="text-gray-600 dark:text-gray-400">{prediction.analysis.pytorchAnalysis.technicalDetails.inputFeatures.join(', ')}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Seismic Parameters */}
                  {prediction.analysis.pytorchAnalysis.seismicParameters && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h4 className="font-semibold text-sm mb-3">Seismic Analysis Parameters</h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="font-medium">Frequency Domain:</span>
                          <p className="text-gray-600 dark:text-gray-400">{prediction.analysis.pytorchAnalysis.seismicParameters.frequencyDomain}</p>
                        </div>
                        <div>
                          <span className="font-medium">Depth Estimate:</span>
                          <p className="text-gray-600 dark:text-gray-400">{prediction.analysis.pytorchAnalysis.seismicParameters.depthEstimate}</p>
                        </div>
                        <div>
                          <span className="font-medium">Seismic Moment:</span>
                          <p className="text-gray-600 dark:text-gray-400">{prediction.analysis.pytorchAnalysis.seismicParameters.seismicMoment}</p>
                        </div>
                        <div>
                          <span className="font-medium">Energy Release:</span>
                          <p className="text-gray-600 dark:text-gray-400">{prediction.analysis.pytorchAnalysis.seismicParameters.energyRelease}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Ollama Analysis */}
            {prediction.analysis.ollamaAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="h-5 w-5 text-green-600" />
                    Ollama AI Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">AI Reasoning</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {prediction.analysis.ollamaAnalysis.reasoning}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Key Risk Factors:</h4>
                    <ul className="space-y-1">
                      {prediction.analysis.ollamaAnalysis.riskFactors.map((factor, index) => (
                        <li key={index} className="text-sm flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Historical Context</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {prediction.analysis.ollamaAnalysis.historicalContext}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Separator />

          {/* Hybrid Model Synthesis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Hybrid Model Synthesis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {prediction.analysis.hybridSynthesis.combinedConfidence.toFixed(0)}%
                    </div>
                    <div className="text-sm text-purple-800 dark:text-purple-200">Combined Confidence</div>
                    <div className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                      {prediction.analysis.hybridSynthesis.reconciliationMethod}
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${getDataQualityColor(prediction.analysis.hybridSynthesis.dataQuality)}`}>
                    <div className="font-semibold capitalize">{prediction.analysis.hybridSynthesis.dataQuality}</div>
                    <div className="text-sm">Data Quality</div>
                    <div className="text-xs mt-1">{formatNumber(prediction.dataMetrics.recentEarthquakeCount)} recent earthquakes analyzed</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Key Insights
                  </h4>
                  <ul className="space-y-2">
                    {prediction.analysis.hybridSynthesis.keyInsights.map((insight, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Enhanced Probability Analysis */}
              {prediction.analysis.hybridSynthesis.probabilityAnalysis && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Detailed Probability Analysis
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs space-y-2">
                    <div>
                      <span className="font-medium">Bayesian Weighting:</span>
                      <p className="text-gray-600 dark:text-gray-400">{prediction.analysis.hybridSynthesis.probabilityAnalysis.bayesianInference}</p>
                    </div>
                    <div>
                      <span className="font-medium">Confidence Interval:</span>
                      <p className="text-gray-600 dark:text-gray-400">{prediction.analysis.hybridSynthesis.probabilityAnalysis.confidenceInterval}</p>
                    </div>
                    <div>
                      <span className="font-medium">Statistical Significance:</span>
                      <p className="text-gray-600 dark:text-gray-400">{prediction.analysis.hybridSynthesis.probabilityAnalysis.statisticalSignificance}</p>
                    </div>
                    <div>
                      <span className="font-medium">Model Agreement:</span>
                      <p className="text-gray-600 dark:text-gray-400">{prediction.analysis.hybridSynthesis.probabilityAnalysis.modelAgreement}</p>
                    </div>
                    <div className="lg:col-span-2">
                      <span className="font-medium">Uncertainty Quantification:</span>
                      <p className="text-gray-600 dark:text-gray-400">{prediction.analysis.hybridSynthesis.probabilityAnalysis.uncertaintyQuantification}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Model Divergence Analysis */}
              {prediction.analysis.hybridSynthesis.modelDivergence && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <h4 className="font-semibold text-sm mb-3">Model Divergence Analysis</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-medium">Magnitude Variance:</span>
                      <p className="text-gray-600 dark:text-gray-400">{prediction.analysis.hybridSynthesis.modelDivergence.magnitudeVariance}</p>
                    </div>
                    <div>
                      <span className="font-medium">Consensus Level:</span>
                      <p className="text-gray-600 dark:text-gray-400">{prediction.analysis.hybridSynthesis.modelDivergence.consensusLevel}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Risk Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Risk Assessment & Recommended Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="text-2xl font-bold text-red-600">{prediction.riskAssessment.immediateRisk}%</div>
                  <div className="text-sm text-red-800 dark:text-red-200">Immediate Risk (24h)</div>
                </div>
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="text-2xl font-bold text-orange-600">{prediction.riskAssessment.weeklyRisk}%</div>
                  <div className="text-sm text-orange-800 dark:text-orange-200">Weekly Risk (7 days)</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="text-2xl font-bold text-yellow-600">{prediction.riskAssessment.monthlyRisk}%</div>
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">Monthly Risk (30 days)</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div>
                  <h4 className="font-semibold mb-3">Key Risk Factors:</h4>
                  <ul className="space-y-2">
                    {prediction.riskAssessment.keyFactors.map((factor, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Recommended Actions:</h4>
                  <ul className="space-y-2">
                    {prediction.riskAssessment.recommendedActions.map((action, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Metrics Footer */}
          <Card className="bg-gray-50 dark:bg-gray-900/50">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold">{prediction.dataMetrics.inputSequenceLength}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Input Sequence Length</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{formatNumber(prediction.dataMetrics.recentEarthquakeCount)}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Total Dataset Size</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{prediction.dataMetrics.historicalPatternMatch}%</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Pattern Match Score</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{prediction.dataMetrics.dataRecency}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Data Recency</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}