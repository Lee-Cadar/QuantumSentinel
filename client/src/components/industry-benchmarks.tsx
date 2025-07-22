import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { 
  Trophy,
  TrendingUp,
  Building2,
  GraduationCap,
  Globe,
  Star,
  Target,
  BarChart3,
  Users,
  Award,
  Zap,
  Brain,
  BookOpen,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";

interface BenchmarkModel {
  name: string;
  organization: string;
  type: 'academic' | 'commercial' | 'government';
  accuracy: number;
  precision: number;
  recall: number;
  methodology: string;
  dataSource: string;
  lastUpdated: string;
  strengths: string[];
  limitations: string[];
  publicationYear?: number;
  citationCount?: number;
}

interface BenchmarkComparison {
  ourModel: {
    name: string;
    accuracy: number;
    precision: number;
    recall: number;
    trainingData: number;
  };
  industryModels: BenchmarkModel[];
  ranking: {
    accuracyRank: number;
    precisionRank: number;
    recallRank: number;
    overallRank: number;
  };
  competitiveAdvantages: string[];
  improvementAreas: string[];
}

export function IndustryBenchmarks() {
  const [selectedModel, setSelectedModel] = useState<'pytorch' | 'ollama'>('pytorch');
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch benchmark comparison
  const { data: benchmarkData, isLoading, refetch } = useQuery<BenchmarkComparison>({
    queryKey: [`/api/benchmarks/comparison/${selectedModel}`],
    refetchInterval: 30000
  });

  // Fetch detailed analysis
  const { data: detailedAnalysis } = useQuery({
    queryKey: [`/api/benchmarks/analysis/${selectedModel}`],
    refetchInterval: 60000
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'academic': return <GraduationCap className="h-4 w-4" />;
      case 'commercial': return <Building2 className="h-4 w-4" />;
      case 'government': return <Globe className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'academic': return 'bg-blue-50 text-blue-700';
      case 'commercial': return 'bg-green-50 text-green-700';
      case 'government': return 'bg-purple-50 text-purple-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const getRankIcon = (rank: number, total: number) => {
    const percentile = (total - rank + 1) / total;
    if (percentile > 0.8) return <ArrowUp className="h-4 w-4 text-green-600" />;
    if (percentile < 0.4) return <ArrowDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-yellow-600" />;
  };

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const topPerformers = benchmarkData?.industryModels
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Industry Benchmark Comparison
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Compare AXIOM Sentinel against 15+ leading earthquake prediction models
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={selectedModel === 'pytorch' ? 'default' : 'outline'}
                onClick={() => setSelectedModel('pytorch')}
                size="sm"
              >
                <Brain className="h-4 w-4 mr-2" />
                PyTorch Model
              </Button>
              <Button
                variant={selectedModel === 'ollama' ? 'default' : 'outline'}
                onClick={() => setSelectedModel('ollama')}
                size="sm"
              >
                <Zap className="h-4 w-4 mr-2" />
                Ollama Model
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {benchmarkData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-50">
                  <Award className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <div className="text-sm font-medium">Overall Ranking</div>
                  <div className="text-lg font-bold flex items-center gap-1">
                    #{benchmarkData.ranking.overallRank}
                    {getRankIcon(benchmarkData.ranking.overallRank, benchmarkData.industryModels.length + 1)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-50">
                  <Target className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-medium">Accuracy</div>
                  <div className="text-lg font-bold">
                    {benchmarkData.ourModel.accuracy.toFixed(1)}%
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-medium">Precision</div>
                  <div className="text-lg font-bold">
                    {benchmarkData.ourModel.precision.toFixed(1)}%
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm font-medium">Total Competitors</div>
                  <div className="text-lg font-bold">
                    {benchmarkData.industryModels.length}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="comparison">Model Comparison</TabsTrigger>
          <TabsTrigger value="analysis">Market Analysis</TabsTrigger>
          <TabsTrigger value="technical">Technical Details</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {benchmarkData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Accuracy Ranking</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          #{benchmarkData.ranking.accuracyRank} of {benchmarkData.industryModels.length + 1}
                        </Badge>
                        {getRankIcon(benchmarkData.ranking.accuracyRank, benchmarkData.industryModels.length + 1)}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Precision Ranking</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          #{benchmarkData.ranking.precisionRank} of {benchmarkData.industryModels.length + 1}
                        </Badge>
                        {getRankIcon(benchmarkData.ranking.precisionRank, benchmarkData.industryModels.length + 1)}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Recall Ranking</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          #{benchmarkData.ranking.recallRank} of {benchmarkData.industryModels.length + 1}
                        </Badge>
                        {getRankIcon(benchmarkData.ranking.recallRank, benchmarkData.industryModels.length + 1)}
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="text-sm font-medium mb-2">Training Data Scale</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {benchmarkData.ourModel.trainingData.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">earthquake records</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Competitive Advantages */}
              <Card>
                <CardHeader>
                  <CardTitle>Competitive Advantages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {benchmarkData.competitiveAdvantages.map((advantage, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-green-50">
                        <Star className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-green-800">{advantage}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Industry Performers */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Industry Performers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topPerformers.map((model, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                            <span className="text-sm font-bold">{index + 1}</span>
                          </div>
                          <div>
                            <div className="font-medium text-sm">{model.name}</div>
                            <div className="text-xs text-muted-foreground">{model.organization}</div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-bold">{model.accuracy.toFixed(1)}%</div>
                          <Badge className={getTypeColor(model.type)} variant="outline">
                            {getTypeIcon(model.type)}
                            <span className="ml-1 capitalize">{model.type}</span>
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Improvement Areas */}
              <Card>
                <CardHeader>
                  <CardTitle>Areas for Improvement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {benchmarkData.improvementAreas.map((area, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-orange-50">
                        <TrendingUp className="h-4 w-4 text-orange-600 flex-shrink-0" />
                        <span className="text-sm text-orange-800">{area}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Model Comparison Tab */}
        <TabsContent value="comparison" className="space-y-4">
          {benchmarkData && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Model Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Model</th>
                          <th className="text-left p-2">Organization</th>
                          <th className="text-left p-2">Type</th>
                          <th className="text-center p-2">Accuracy</th>
                          <th className="text-center p-2">Precision</th>
                          <th className="text-center p-2">Recall</th>
                          <th className="text-left p-2">Last Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Our Model */}
                        <tr className="border-b bg-blue-50">
                          <td className="p-2 font-medium text-blue-900">
                            {benchmarkData.ourModel.name}
                          </td>
                          <td className="p-2 text-blue-800">AXIOM Sentinel</td>
                          <td className="p-2">
                            <Badge className="bg-blue-100 text-blue-800">
                              Our System
                            </Badge>
                          </td>
                          <td className="p-2 text-center font-bold text-blue-900">
                            {benchmarkData.ourModel.accuracy.toFixed(1)}%
                          </td>
                          <td className="p-2 text-center font-bold text-blue-900">
                            {benchmarkData.ourModel.precision.toFixed(1)}%
                          </td>
                          <td className="p-2 text-center font-bold text-blue-900">
                            {benchmarkData.ourModel.recall.toFixed(1)}%
                          </td>
                          <td className="p-2 text-blue-800">Real-time</td>
                        </tr>
                        
                        {/* Industry Models */}
                        {benchmarkData.industryModels
                          .sort((a, b) => b.accuracy - a.accuracy)
                          .map((model, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-medium">{model.name}</td>
                            <td className="p-2 text-muted-foreground">{model.organization}</td>
                            <td className="p-2">
                              <Badge className={getTypeColor(model.type)} variant="outline">
                                {getTypeIcon(model.type)}
                                <span className="ml-1 capitalize">{model.type}</span>
                              </Badge>
                            </td>
                            <td className="p-2 text-center font-medium">{model.accuracy.toFixed(1)}%</td>
                            <td className="p-2 text-center font-medium">{model.precision.toFixed(1)}%</td>
                            <td className="p-2 text-center font-medium">{model.recall.toFixed(1)}%</td>
                            <td className="p-2 text-muted-foreground">
                              {formatLastUpdated(model.lastUpdated)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Market Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          {detailedAnalysis && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Market Position */}
              <Card>
                <CardHeader>
                  <CardTitle>Market Position</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {detailedAnalysis.marketPosition.marketPercentile.toFixed(0)}th
                      </div>
                      <div className="text-sm text-muted-foreground">percentile</div>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm">Market Ranking:</span>
                      <span className="font-medium">
                        #{detailedAnalysis.marketPosition.overallRanking} of {detailedAnalysis.marketPosition.totalMarket}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Unique Strengths:</div>
                      {detailedAnalysis.marketPosition.uniqueStrengths.slice(0, 4).map((strength, index) => (
                        <div key={index} className="text-xs p-2 bg-green-50 rounded">
                          {strength}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Competitor Profile */}
              <Card>
                <CardHeader>
                  <CardTitle>Competitive Landscape</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-xl font-bold text-blue-600">
                          {detailedAnalysis.competitorProfile.byType.academic}
                        </div>
                        <div className="text-xs text-muted-foreground">Academic</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-green-600">
                          {detailedAnalysis.competitorProfile.byType.commercial}
                        </div>
                        <div className="text-xs text-muted-foreground">Commercial</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-purple-600">
                          {detailedAnalysis.competitorProfile.byType.government}
                        </div>
                        <div className="text-xs text-muted-foreground">Government</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Emerging Trends:</div>
                      {detailedAnalysis.competitorProfile.emergingTrends.slice(0, 3).map((trend, index) => (
                        <div key={index} className="text-xs p-2 bg-yellow-50 rounded flex items-center gap-2">
                          <TrendingUp className="h-3 w-3 text-yellow-600" />
                          {trend}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>vs. Industry Average</span>
                        <span>Accuracy</span>
                      </div>
                      <Progress 
                        value={
                          (detailedAnalysis.performanceAnalysis.currentPerformance.accuracy / 
                           detailedAnalysis.performanceAnalysis.industryAverage.accuracy) * 50
                        } 
                        className="h-2" 
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Our Model</div>
                        <div className="font-bold">
                          {detailedAnalysis.performanceAnalysis.currentPerformance.accuracy.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Industry Avg</div>
                        <div className="font-bold">
                          {detailedAnalysis.performanceAnalysis.industryAverage.accuracy.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Citation Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Research Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {detailedAnalysis.technicalComparison.citationAnalysis.totalCitations}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Industry Citations</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-2">High-Impact Models:</div>
                      {detailedAnalysis.technicalComparison.citationAnalysis.highImpactModels.slice(0, 3).map((model, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                          <span>{model.name}</span>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            <span>{model.citationCount}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Technical Details Tab */}
        <TabsContent value="technical" className="space-y-4">
          {benchmarkData && (
            <div className="space-y-6">
              {/* Selected Model Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Model Profiles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {topPerformers.slice(0, 3).map((model, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-medium">{model.name}</div>
                            <div className="text-sm text-muted-foreground">{model.organization}</div>
                            {model.publicationYear && (
                              <div className="text-xs text-muted-foreground">
                                Published: {model.publicationYear} • Citations: {model.citationCount || 'N/A'}
                              </div>
                            )}
                          </div>
                          
                          <Badge className={getTypeColor(model.type)} variant="outline">
                            {getTypeIcon(model.type)}
                            <span className="ml-1 capitalize">{model.type}</span>
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="font-bold">{model.accuracy.toFixed(1)}%</div>
                            <div className="text-xs text-muted-foreground">Accuracy</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="font-bold">{model.precision.toFixed(1)}%</div>
                            <div className="text-xs text-muted-foreground">Precision</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="font-bold">{model.recall.toFixed(1)}%</div>
                            <div className="text-xs text-muted-foreground">Recall</div>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <div className="text-sm font-medium mb-1">Methodology:</div>
                          <div className="text-sm text-muted-foreground">{model.methodology}</div>
                        </div>
                        
                        <div className="mb-3">
                          <div className="text-sm font-medium mb-1">Data Source:</div>
                          <div className="text-sm text-muted-foreground">{model.dataSource}</div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium mb-1">Strengths:</div>
                            <div className="space-y-1">
                              {model.strengths.slice(0, 2).map((strength, i) => (
                                <div key={i} className="text-xs p-1 bg-green-50 rounded">
                                  + {strength}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-sm font-medium mb-1">Limitations:</div>
                            <div className="space-y-1">
                              {model.limitations.slice(0, 2).map((limitation, i) => (
                                <div key={i} className="text-xs p-1 bg-red-50 rounded">
                                  - {limitation}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}