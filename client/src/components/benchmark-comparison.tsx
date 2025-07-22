import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, TrendingUp, Target, Database, Award, CheckCircle } from "lucide-react";

interface BenchmarkComparison {
  sentinelModel: string;
  sentinelMetrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    datasetSize: number;
  };
  industryBenchmarks: Array<{
    modelName: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    datasetSize: number;
    organization: string;
    year: number;
    category: 'academic' | 'commercial' | 'government';
  }>;
  ranking: {
    accuracyRank: number;
    precisionRank: number;
    recallRank: number;
    overallRank: number;
    totalModels: number;
  };
  insights: string[];
}

interface BenchmarkComparisonProps {
  modelType: 'pytorch' | 'ollama';
}

export function BenchmarkComparison({ modelType }: BenchmarkComparisonProps) {
  const { data: comparison, isLoading, error } = useQuery<BenchmarkComparison>({
    queryKey: ['/api/predictions/benchmark', modelType],
    queryFn: () => fetch(`/api/predictions/benchmark/${modelType}`).then(r => r.json()),
    refetchInterval: 30000
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading benchmark comparison...</div>
        </CardContent>
      </Card>
    );
  }

  if (error || !comparison) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">Failed to load benchmark data</div>
        </CardContent>
      </Card>
    );
  }

  const getRankColor = (rank: number, total: number) => {
    const percentile = (rank / total) * 100;
    if (percentile <= 20) return "text-green-600 bg-green-50";
    if (percentile <= 40) return "text-blue-600 bg-blue-50";
    if (percentile <= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'academic': return "bg-purple-100 text-purple-800";
      case 'commercial': return "bg-blue-100 text-blue-800";
      case 'government': return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Industry Benchmark Comparison - {comparison.sentinelModel}
          </CardTitle>
          <CardDescription>
            How AXIOM Sentinel compares against leading earthquake prediction models worldwide
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Ranking */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`text-center p-4 rounded-lg ${getRankColor(comparison.ranking.overallRank, comparison.ranking.totalModels)}`}>
              <div className="text-2xl font-bold">#{comparison.ranking.overallRank}</div>
              <div className="text-sm">Overall Rank</div>
              <div className="text-xs opacity-75">of {comparison.ranking.totalModels} models</div>
            </div>
            <div className={`text-center p-4 rounded-lg ${getRankColor(comparison.ranking.accuracyRank, comparison.ranking.totalModels)}`}>
              <div className="text-2xl font-bold">#{comparison.ranking.accuracyRank}</div>
              <div className="text-sm">Accuracy Rank</div>
            </div>
            <div className={`text-center p-4 rounded-lg ${getRankColor(comparison.ranking.precisionRank, comparison.ranking.totalModels)}`}>
              <div className="text-2xl font-bold">#{comparison.ranking.precisionRank}</div>
              <div className="text-sm">Precision Rank</div>
            </div>
            <div className={`text-center p-4 rounded-lg ${getRankColor(comparison.ranking.recallRank, comparison.ranking.totalModels)}`}>
              <div className="text-2xl font-bold">#{comparison.ranking.recallRank}</div>
              <div className="text-sm">Recall Rank</div>
            </div>
          </div>

          {/* Key Insights */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance Insights
            </h3>
            <div className="grid gap-3">
              {comparison.insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{insight}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Comparison */}
      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metrics">Metrics Comparison</TabsTrigger>
          <TabsTrigger value="rankings">Category Rankings</TabsTrigger>
          <TabsTrigger value="details">Model Details</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Performance Metrics vs Industry Leaders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Sentinel Metrics */}
                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3">{comparison.sentinelModel} (Current)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-700">{comparison.sentinelMetrics.accuracy.toFixed(1)}%</div>
                      <div className="text-blue-600">Accuracy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-700">{comparison.sentinelMetrics.precision.toFixed(1)}%</div>
                      <div className="text-blue-600">Precision</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-700">{comparison.sentinelMetrics.recall.toFixed(1)}%</div>
                      <div className="text-blue-600">Recall</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-700">{comparison.sentinelMetrics.datasetSize.toLocaleString()}</div>
                      <div className="text-blue-600">Training Data</div>
                    </div>
                  </div>
                </div>

                {/* Top 5 Industry Models */}
                <div>
                  <h4 className="font-semibold mb-3">Top Industry Models</h4>
                  <div className="space-y-3">
                    {comparison.industryBenchmarks.slice(0, 5).map((model, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={getCategoryColor(model.category)}>
                            {model.category}
                          </Badge>
                          <div>
                            <div className="font-medium">{model.modelName}</div>
                            <div className="text-sm text-gray-600">{model.organization} ({model.year})</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm text-right">
                          <div>
                            <div className="font-semibold">{model.accuracy.toFixed(1)}%</div>
                            <div className="text-gray-500">Accuracy</div>
                          </div>
                          <div>
                            <div className="font-semibold">{model.precision.toFixed(1)}%</div>
                            <div className="text-gray-500">Precision</div>
                          </div>
                          <div>
                            <div className="font-semibold">{model.datasetSize.toLocaleString()}</div>
                            <div className="text-gray-500">Data</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rankings" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {['academic', 'commercial', 'government'].map((category) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="capitalize text-sm">{category} Models</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {comparison.industryBenchmarks
                    .filter(model => model.category === category)
                    .slice(0, 3)
                    .map((model, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="truncate">{model.modelName}</span>
                        <span className="font-semibold">{model.accuracy.toFixed(1)}%</span>
                      </div>
                    ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Complete Industry Benchmark Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {comparison.industryBenchmarks.map((model, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{model.modelName}</h4>
                        <p className="text-sm text-gray-600">{model.organization} • {model.year}</p>
                      </div>
                      <Badge className={getCategoryColor(model.category)}>
                        {model.category}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Accuracy:</span>
                        <div className="font-semibold">{model.accuracy.toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Precision:</span>
                        <div className="font-semibold">{model.precision.toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Recall:</span>
                        <div className="font-semibold">{model.recall.toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-gray-500">F1 Score:</span>
                        <div className="font-semibold">{model.f1Score.toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Dataset:</span>
                        <div className="font-semibold">{model.datasetSize.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}