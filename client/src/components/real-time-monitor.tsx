import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Activity, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  Globe,
  TrendingUp,
  TrendingDown,
  Play,
  Square,
  Waves,
  MapPin
} from "lucide-react";

interface FeedStatus {
  name: string;
  lastUpdate: string;
  eventsReceived: number;
  status: 'active' | 'delayed' | 'offline';
  latency: number;
  dataGaps: number;
}

interface SeismicEvent {
  id: string;
  time: string;
  latitude: number;
  longitude: number;
  magnitude: number;
  depth: number;
  location: string;
  source: string;
  quality?: string;
  uncertainty?: number;
}

interface CascadiaActivity {
  recentEvents: SeismicEvent[];
  weeklyTrend: number;
  maxMagnitude: number;
  totalEvents: number;
}

interface AnomalyDetection {
  unusualActivity: boolean;
  swarmDetected: boolean;
  magnitudeSpike: boolean;
  details: string;
}

interface MonitoringStatus {
  isRunning: boolean;
  feedCount: number;
  totalEvents: number;
}

export function RealTimeMonitor() {
  const [activeTab, setActiveTab] = useState("feeds");
  const queryClient = useQueryClient();

  // Fetch feed status
  const { data: feedStatus = [], isLoading: statusLoading } = useQuery<FeedStatus[]>({
    queryKey: ['/api/real-time/feed-status'],
    refetchInterval: 10000
  });

  // Fetch monitoring status
  const { data: monitorStatus } = useQuery<MonitoringStatus>({
    queryKey: ['/api/real-time/monitoring-status'],
    refetchInterval: 5000
  });

  // Fetch recent events
  const { data: recentEvents = [] } = useQuery<SeismicEvent[]>({
    queryKey: ['/api/real-time/recent-events'],
    refetchInterval: 30000
  });

  // Fetch Cascadia activity
  const { data: cascadiaActivity } = useQuery<CascadiaActivity>({
    queryKey: ['/api/real-time/cascadia-activity'],
    refetchInterval: 60000
  });

  // Fetch anomaly detection
  const { data: anomalies } = useQuery<AnomalyDetection>({
    queryKey: ['/api/real-time/anomalies'],
    refetchInterval: 30000
  });

  // Start monitoring mutation
  const startMonitoring = useMutation({
    mutationFn: () => apiRequest('POST', '/api/real-time/start'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/real-time'] });
    }
  });

  // Stop monitoring mutation
  const stopMonitoring = useMutation({
    mutationFn: () => apiRequest('POST', '/api/real-time/stop'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/real-time'] });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'delayed': return 'text-yellow-600 bg-yellow-50';
      case 'offline': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'delayed': return <Clock className="h-4 w-4" />;
      case 'offline': return <XCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
  };

  const getMagnitudeColor = (magnitude: number) => {
    if (magnitude >= 7) return "text-red-600 bg-red-100";
    if (magnitude >= 5) return "text-orange-600 bg-orange-100";
    if (magnitude >= 3) return "text-yellow-600 bg-yellow-100";
    return "text-green-600 bg-green-100";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Waves className="h-5 w-5 text-blue-600" />
                Real-Time Seismic Monitoring
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Live feeds from USGS, PNSN, and IRIS networks
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={monitorStatus?.isRunning ? "default" : "secondary"}>
                {monitorStatus?.isRunning ? "Running" : "Stopped"}
              </Badge>
              
              {monitorStatus?.isRunning ? (
                <Button
                  onClick={() => stopMonitoring.mutate()}
                  disabled={stopMonitoring.isPending}
                  variant="outline"
                  size="sm"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              ) : (
                <Button
                  onClick={() => startMonitoring.mutate()}
                  disabled={startMonitoring.isPending}
                  size="sm"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Globe className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Active Feeds</div>
                <div className="text-lg font-bold">
                  {feedStatus.filter(f => f.status === 'active').length}/{monitorStatus?.feedCount || 0}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50">
                <Activity className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Events Today</div>
                <div className="text-lg font-bold">
                  {recentEvents.length}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <Zap className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Total Processed</div>
                <div className="text-lg font-bold">
                  {monitorStatus?.totalEvents?.toLocaleString() || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Anomaly Alerts */}
          {anomalies && (anomalies.unusualActivity || anomalies.swarmDetected || anomalies.magnitudeSpike) && (
            <Alert className="mt-4 border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Seismic Anomaly Detected:</strong> {anomalies.details}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="feeds">Data Feeds</TabsTrigger>
          <TabsTrigger value="events">Recent Events</TabsTrigger>
          <TabsTrigger value="cascadia">Cascadia Focus</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        {/* Data Feeds Tab */}
        <TabsContent value="feeds" className="space-y-4">
          {feedStatus.map((feed, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(feed.status)}
                    <div>
                      <div className="font-medium">{feed.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Last update: {formatRelativeTime(feed.lastUpdate)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-sm font-medium">{feed.eventsReceived}</div>
                      <div className="text-xs text-muted-foreground">Events</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium">{feed.latency}m</div>
                      <div className="text-xs text-muted-foreground">Latency</div>
                    </div>
                    
                    <Badge className={getStatusColor(feed.status)}>
                      {feed.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                
                {feed.dataGaps > 0 && (
                  <div className="mt-2 text-sm text-yellow-600">
                    {feed.dataGaps} data gaps detected
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Recent Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <div className="space-y-3">
            {recentEvents.slice(0, 20).map((event, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Badge className={getMagnitudeColor(event.magnitude)}>
                          M{event.magnitude.toFixed(1)}
                        </Badge>
                        <Badge variant="outline">{event.source}</Badge>
                      </div>
                      
                      <div>
                        <div className="font-medium">{event.location}</div>
                        <div className="text-sm text-muted-foreground">
                          {event.depth.toFixed(1)}km deep • {formatRelativeTime(event.time)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right text-sm text-muted-foreground">
                      <div>{event.latitude.toFixed(2)}°N</div>
                      <div>{Math.abs(event.longitude).toFixed(2)}°W</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Cascadia Focus Tab */}
        <TabsContent value="cascadia" className="space-y-4">
          {cascadiaActivity && (
            <>
              {/* Cascadia Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-red-600" />
                    Cascadia Subduction Zone Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {cascadiaActivity.totalEvents}
                      </div>
                      <div className="text-sm text-muted-foreground">Events This Week</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        M{cascadiaActivity.maxMagnitude.toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">Max Magnitude</div>
                    </div>
                    
                    <div className="text-center">
                      <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${
                        cascadiaActivity.weeklyTrend > 0 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {cascadiaActivity.weeklyTrend > 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                        {Math.abs(cascadiaActivity.weeklyTrend).toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Weekly Trend</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Cascadia Events */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Cascadia Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {cascadiaActivity.recentEvents.map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                          <Badge className={getMagnitudeColor(event.magnitude)}>
                            M{event.magnitude.toFixed(1)}
                          </Badge>
                          <div>
                            <div className="font-medium">{event.location}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatRelativeTime(event.time)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right text-sm text-muted-foreground">
                          <div>{event.depth.toFixed(1)}km deep</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-Time Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Data Quality Metrics */}
                <div>
                  <h4 className="font-medium mb-2">Data Quality Assessment</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Feed Reliability</span>
                      <div className="flex items-center gap-2">
                        <Progress value={85} className="w-20 h-2" />
                        <span className="text-sm font-medium">85%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Data Completeness</span>
                      <div className="flex items-center gap-2">
                        <Progress value={92} className="w-20 h-2" />
                        <span className="text-sm font-medium">92%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Latency Score</span>
                      <div className="flex items-center gap-2">
                        <Progress value={78} className="w-20 h-2" />
                        <span className="text-sm font-medium">78%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Anomaly Summary */}
                {anomalies && (
                  <div>
                    <h4 className="font-medium mb-2">Anomaly Detection</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className={`p-3 rounded-lg ${anomalies.swarmDetected ? 'bg-red-50' : 'bg-green-50'}`}>
                        <div className="text-sm font-medium">Earthquake Swarms</div>
                        <div className={`text-lg font-bold ${anomalies.swarmDetected ? 'text-red-600' : 'text-green-600'}`}>
                          {anomalies.swarmDetected ? 'DETECTED' : 'Normal'}
                        </div>
                      </div>
                      
                      <div className={`p-3 rounded-lg ${anomalies.magnitudeSpike ? 'bg-red-50' : 'bg-green-50'}`}>
                        <div className="text-sm font-medium">Magnitude Spikes</div>
                        <div className={`text-lg font-bold ${anomalies.magnitudeSpike ? 'text-red-600' : 'text-green-600'}`}>
                          {anomalies.magnitudeSpike ? 'DETECTED' : 'Normal'}
                        </div>
                      </div>
                      
                      <div className={`p-3 rounded-lg ${anomalies.unusualActivity ? 'bg-orange-50' : 'bg-green-50'}`}>
                        <div className="text-sm font-medium">Activity Level</div>
                        <div className={`text-lg font-bold ${anomalies.unusualActivity ? 'text-orange-600' : 'text-green-600'}`}>
                          {anomalies.unusualActivity ? 'Elevated' : 'Normal'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}