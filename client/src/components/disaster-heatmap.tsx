import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function DisasterHeatmap() {
  const [selectedType, setSelectedType] = useState("earthquake");
  const queryClient = useQueryClient();

  const { data: disasters = [], isLoading } = useQuery({
    queryKey: ["/api/disasters", selectedType],
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/disasters/refresh");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disasters"] });
    },
  });

  const disasterTypes = [
    { id: "earthquake", label: "Earthquakes", color: "var(--emergency-red)" },
    { id: "wildfire", label: "Wildfires", color: "var(--warning-orange)" },
    { id: "flood", label: "Floods", color: "hsl(207, 90%, 54%)" }
  ];

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 7.0) return "var(--emergency-red)";
    if (intensity >= 5.0) return "var(--warning-orange)";
    return "hsl(45, 93%, 47%)"; // yellow
  };

  const getIntensitySize = (intensity: number) => {
    if (intensity >= 7.0) return "h-4 w-4";
    if (intensity >= 5.0) return "h-3 w-3";
    return "h-2 w-2";
  };

  return (
    <Card className="bg-white rounded-xl shadow-lg">
      <CardHeader className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Disaster Activity Heatmap</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <div className="flex space-x-2">
              {disasterTypes.map((type) => (
                <Button
                  key={type.id}
                  size="sm"
                  variant={selectedType === type.id ? "default" : "outline"}
                  onClick={() => setSelectedType(type.id)}
                  className={selectedType === type.id ? "text-white" : ""}
                  style={selectedType === type.id ? { backgroundColor: type.color } : {}}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="h-80 bg-slate-100 rounded-lg flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--emergency-red)' }}></div>
          </div>
        ) : (
          <>
            <div className="h-80 bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg relative overflow-hidden">
              {disasters.map((disaster, index) => {
                // Convert lat/lng to relative positions (simplified)
                const x = ((disaster.longitude + 180) / 360) * 100;
                const y = ((90 - disaster.latitude) / 180) * 100;
                
                return (
                  <div
                    key={disaster.id}
                    className={`absolute rounded-full animate-pulse-emergency ${getIntensitySize(disaster.intensity)}`}
                    style={{
                      left: `${Math.max(0, Math.min(95, x))}%`,
                      top: `${Math.max(0, Math.min(95, y))}%`,
                      backgroundColor: getIntensityColor(disaster.intensity)
                    }}
                    title={`${disaster.location} - Intensity: ${disaster.intensity}`}
                  />
                );
              })}
              
              {disasters.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white bg-opacity-90 p-4 rounded-lg text-center">
                    <MapPin className="h-12 w-12 mx-auto mb-2" style={{ color: 'var(--neutral-gray)' }} />
                    <p className="font-medium" style={{ color: 'var(--neutral-gray)' }}>
                      No {selectedType} data available
                    </p>
                    <p className="text-sm" style={{ color: 'var(--neutral-gray)' }}>
                      Try refreshing or select a different disaster type
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex items-center justify-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--emergency-red)' }}></div>
                <span className="text-sm" style={{ color: 'var(--neutral-gray)' }}>High Intensity (7.0+)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--warning-orange)' }}></div>
                <span className="text-sm" style={{ color: 'var(--neutral-gray)' }}>Moderate (5.0-6.9)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm" style={{ color: 'var(--neutral-gray)' }}>Low (3.0-4.9)</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
