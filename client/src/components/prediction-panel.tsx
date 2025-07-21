import { useState } from "react";
import { CheckCircle, TrendingUp, BarChart3 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";

export default function PredictionPanel() {
  const [selectedType, setSelectedType] = useState("earthquake");
  const queryClient = useQueryClient();

  const { data: predictions = [] } = useQuery({
    queryKey: ["/api/predictions"],
  });

  const generateMutation = useMutation({
    mutationFn: async (disasterType: string) => {
      return apiRequest("POST", "/api/predictions/generate", { disasterType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/predictions"] });
    },
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
          <h2 className="text-xl font-bold text-slate-900">AI Predictions</h2>
          <div className="flex items-center space-x-2 text-sm" style={{ color: 'var(--safe-green)' }}>
            <CheckCircle className="h-4 w-4" />
            <span>Model Active</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {earthquakePrediction && (
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-900">Next Earthquake Prediction</h4>
                <span 
                  className="text-xs text-white px-2 py-1 rounded"
                  style={{ backgroundColor: getConfidenceColor(earthquakePrediction.confidence) }}
                >
                  {earthquakePrediction.confidence.toFixed(0)}% Confidence
                </span>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--emergency-red)' }}>
                {earthquakePrediction.predictedIntensity.toFixed(1)}
              </p>
              <p className="text-sm" style={{ color: 'var(--neutral-gray)' }}>
                Predicted magnitude in next {earthquakePrediction.timeframe}
              </p>
              {earthquakePrediction.location && (
                <p className="text-xs mt-1" style={{ color: 'var(--neutral-gray)' }}>
                  Location: {earthquakePrediction.location}
                </p>
              )}
            </div>
          )}

          {wildfirePrediction && (
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-900">Wildfire Risk Assessment</h4>
                <span 
                  className="text-xs text-white px-2 py-1 rounded"
                  style={{ backgroundColor: getRiskColor(wildfirePrediction.predictedIntensity) }}
                >
                  {wildfirePrediction.predictedIntensity > 80 ? "High Risk" : 
                   wildfirePrediction.predictedIntensity > 60 ? "Medium Risk" : "Low Risk"}
                </span>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--warning-orange)' }}>
                {wildfirePrediction.predictedIntensity.toFixed(0)}%
              </p>
              <p className="text-sm" style={{ color: 'var(--neutral-gray)' }}>
                Risk probability next {wildfirePrediction.timeframe}
              </p>
              {wildfirePrediction.location && (
                <p className="text-xs mt-1" style={{ color: 'var(--neutral-gray)' }}>
                  Areas: {wildfirePrediction.location}
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="font-medium text-slate-900">Generate New Prediction</h5>
              <div className="flex items-center space-x-2">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="earthquake">Earthquake</SelectItem>
                    <SelectItem value="wildfire">Wildfire</SelectItem>
                    <SelectItem value="flood">Flood</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={() => generateMutation.mutate(selectedType)}
                  disabled={generateMutation.isPending}
                  style={{ backgroundColor: 'var(--emergency-red)' }}
                  className="text-white hover:opacity-90"
                >
                  {generateMutation.isPending ? "Generating..." : "Generate"}
                </Button>
              </div>
            </div>

            <div className="mt-4">
              <h5 className="font-medium text-slate-900 mb-2">Prediction Trends</h5>
              <div className="h-32 bg-slate-100 rounded-lg flex items-center justify-center">
                <div className="text-center" style={{ color: 'var(--neutral-gray)' }}>
                  <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">7-day prediction trends</p>
                  <p className="text-xs">Chart visualization coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
