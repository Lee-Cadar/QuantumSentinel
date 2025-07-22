import { useState } from "react";
import { RefreshCw, Mountain, Flame, CloudRain, MapPin, Calendar, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

export default function RecentActivity() {
  const queryClient = useQueryClient();

  const { data: disasters = [], isLoading } = useQuery({
    queryKey: ["/api/disasters"],
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/disasters/refresh");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disasters"] });
    },
  });

  const getDisasterIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "earthquake":
        return Mountain;
      case "wildfire":
        return Flame;
      case "flood":
        return CloudRain;
      default:
        return AlertTriangle;
    }
  };

  const getIntensityColor = (intensity: number, type: string) => {
    if (type === "earthquake") {
      if (intensity >= 7.0) return "var(--emergency-red)";
      if (intensity >= 5.0) return "var(--warning-orange)";
      return "hsl(45, 93%, 47%)"; // yellow
    }
    // For other disaster types, use generic intensity mapping
    if (intensity >= 8.0) return "var(--emergency-red)";
    if (intensity >= 6.0) return "var(--warning-orange)";
    return "hsl(45, 93%, 47%)";
  };

  const getStatusColor = (verified: boolean) => {
    return verified ? "var(--safe-green)" : "var(--warning-orange)";
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      relative: getRelativeTime(date)
    };
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    const hours = Math.floor(diffInMinutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  const recentDisasters = disasters
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  return (
    <Card className="bg-white rounded-xl shadow-lg">
      <CardHeader className="px-4 py-2 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recent Disaster Activity</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            className="font-medium text-xs h-7"
            style={{ color: 'var(--emergency-red)' }}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-8 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-1 px-2 font-semibold text-slate-900 text-xs">Type</th>
                    <th className="text-left py-1 px-2 font-semibold text-slate-900 text-xs">Location</th>
                    <th className="text-left py-1 px-2 font-semibold text-slate-900 text-xs">Intensity</th>
                    <th className="text-left py-1 px-2 font-semibold text-slate-900 text-xs">Time</th>
                    <th className="text-left py-1 px-2 font-semibold text-slate-900 text-xs">Status</th>
                    <th className="text-left py-1 px-2 font-semibold text-slate-900 text-xs">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {recentDisasters.map((disaster) => {
                    const IconComponent = getDisasterIcon(disaster.disasterType);
                    const intensityColor = getIntensityColor(disaster.intensity, disaster.disasterType);
                    const statusColor = getStatusColor(disaster.verified);
                    const timeInfo = formatDateTime(disaster.timestamp);
                    
                    return (
                      <tr key={disaster.id} className="hover:bg-slate-50">
                        <td className="py-1 px-2">
                          <div className="flex items-center space-x-1">
                            <IconComponent className="h-3 w-3" style={{ color: intensityColor }} />
                            <span className="font-medium capitalize text-xs">{disaster.disasterType}</span>
                          </div>
                        </td>
                        <td className="py-1 px-2 text-xs" style={{ color: 'var(--neutral-gray)' }}>
                          <div>
                            <div className="truncate max-w-24">{disaster.location}</div>
                          </div>
                        </td>
                        <td className="py-1 px-2">
                          <span 
                            className="text-white px-1 py-0.5 rounded text-xs font-medium"
                            style={{ backgroundColor: intensityColor }}
                          >
                            {disaster.intensity.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-1 px-2 text-xs" style={{ color: 'var(--neutral-gray)' }}>
                          <div>
                            <div>{timeInfo.relative}</div>
                          </div>
                        </td>
                        <td className="py-1 px-2">
                          <span 
                            className="text-white px-1 py-0.5 rounded text-xs"
                            style={{ backgroundColor: statusColor }}
                          >
                            {disaster.verified ? "Verified" : "Pending"}
                          </span>
                        </td>
                        <td className="py-1 px-2 text-xs" style={{ color: 'var(--neutral-gray)' }}>
                          USGS
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {recentDisasters.length === 0 && (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto mb-2" style={{ color: 'var(--neutral-gray)' }} />
                <p className="font-medium" style={{ color: 'var(--neutral-gray)' }}>
                  No recent disaster activity
                </p>
                <p className="text-sm" style={{ color: 'var(--neutral-gray)' }}>
                  Try refreshing data or check back later
                </p>
              </div>
            )}
            
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm" style={{ color: 'var(--neutral-gray)' }}>
                Showing {Math.min(10, recentDisasters.length)} of {disasters.length} recent events
              </p>
              {disasters.length > 10 && (
                <Button 
                  className="text-white font-medium"
                  style={{ backgroundColor: 'var(--emergency-red)' }}
                >
                  View All Events
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
