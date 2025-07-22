import { useState } from "react";
import { Route, MapPin, Clock, AlertTriangle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function RouteOptimization() {
  const [formData, setFormData] = useState({
    startLocation: "",
    endLocation: "",
    startLat: "",
    startLon: "",
    endLat: "",
    endLon: "",
    avoidHighRisk: false,
    minimizeDistance: false,
    useMajorRoads: false
  });

  const [routes, setRoutes] = useState<any[]>([]);
  const { toast } = useToast();

  const optimizeMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!data.startLat || !data.startLon || !data.endLat || !data.endLon) {
        throw new Error("Please provide valid coordinates for both locations");
      }
      
      const payload = {
        startLat: parseFloat(data.startLat),
        startLon: parseFloat(data.startLon),
        endLat: parseFloat(data.endLat),
        endLon: parseFloat(data.endLon),
        avoidHighRisk: data.avoidHighRisk,
        minimizeDistance: data.minimizeDistance,
        useMajorRoads: data.useMajorRoads
      };
      
      return apiRequest("POST", "/api/routes/optimize", payload);
    },
    onSuccess: (response) => {
      const data = response.json();
      setRoutes(data);
      toast({
        title: "Routes Calculated",
        description: "Optimal evacuation routes have been generated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Route Calculation Failed",
        description: error.message || "Please check your coordinates and try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    optimizeMutation.mutate(formData);
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "low":
        return "var(--safe-green)";
      case "medium":
        return "var(--warning-orange)";
      case "high":
        return "var(--emergency-red)";
      default:
        return "var(--neutral-gray)";
    }
  };

  const getSafetyBadgeColor = (safety: string) => {
    switch (safety.toLowerCase()) {
      case "safest":
        return "var(--safe-green)";
      case "fastest":
        return "var(--warning-orange)";
      default:
        return "var(--neutral-gray)";
    }
  };

  return (
    <div className="dashboard-card mt-[0px] mb-[0px]">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900">Emergency Route Optimization</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Plan Evacuation Route</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="startLocation" className="block text-sm font-medium text-slate-900 mb-2">
                    Starting Location
                  </Label>
                  <Input
                    id="startLocation"
                    placeholder="Enter address"
                    value={formData.startLocation}
                    onChange={(e) => setFormData(prev => ({ ...prev, startLocation: e.target.value }))}
                  />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Input
                      placeholder="Latitude"
                      type="number"
                      step="any"
                      value={formData.startLat}
                      onChange={(e) => setFormData(prev => ({ ...prev, startLat: e.target.value }))}
                    />
                    <Input
                      placeholder="Longitude"
                      type="number"
                      step="any"
                      value={formData.startLon}
                      onChange={(e) => setFormData(prev => ({ ...prev, startLon: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="endLocation" className="block text-sm font-medium text-slate-900 mb-2">
                    Destination
                  </Label>
                  <Input
                    id="endLocation"
                    placeholder="Safe zone or shelter"
                    value={formData.endLocation}
                    onChange={(e) => setFormData(prev => ({ ...prev, endLocation: e.target.value }))}
                  />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Input
                      placeholder="Latitude"
                      type="number"
                      step="any"
                      value={formData.endLat}
                      onChange={(e) => setFormData(prev => ({ ...prev, endLat: e.target.value }))}
                    />
                    <Input
                      placeholder="Longitude"
                      type="number"
                      step="any"
                      value={formData.endLon}
                      onChange={(e) => setFormData(prev => ({ ...prev, endLon: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="block text-sm font-medium text-slate-900 mb-2">
                  Priority Factors
                </Label>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="avoidHighRisk"
                      checked={formData.avoidHighRisk}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, avoidHighRisk: !!checked }))}
                    />
                    <Label htmlFor="avoidHighRisk" className="text-sm">
                      Avoid high-risk zones
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="minimizeDistance"
                      checked={formData.minimizeDistance}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, minimizeDistance: !!checked }))}
                    />
                    <Label htmlFor="minimizeDistance" className="text-sm">
                      Minimize distance
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="useMajorRoads"
                      checked={formData.useMajorRoads}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, useMajorRoads: !!checked }))}
                    />
                    <Label htmlFor="useMajorRoads" className="text-sm">
                      Use major roads
                    </Label>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full text-white font-semibold"
                style={{ backgroundColor: 'var(--emergency-red)' }}
                disabled={optimizeMutation.isPending}
              >
                <Route className="h-4 w-4 mr-2" />
                {optimizeMutation.isPending ? "Calculating..." : "Calculate Optimal Route"}
              </Button>
            </form>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Recommended Routes</h4>
            <div className="space-y-3">
              {routes.length > 0 ? routes.map((route, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-slate-900">{route.name}</h5>
                    <span 
                      className="text-xs text-white px-2 py-1 rounded"
                      style={{ backgroundColor: getSafetyBadgeColor(route.safety) }}
                    >
                      {route.safety}
                    </span>
                  </div>
                  <p className="text-sm mb-2" style={{ color: 'var(--neutral-gray)' }}>
                    {route.description}
                  </p>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" style={{ color: 'var(--neutral-gray)' }} />
                      <span style={{ color: 'var(--neutral-gray)' }}>Distance:</span>
                      <span className="font-medium text-slate-900">{route.distance} mi</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" style={{ color: 'var(--neutral-gray)' }} />
                      <span style={{ color: 'var(--neutral-gray)' }}>Time:</span>
                      <span className="font-medium text-slate-900">{route.time} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <AlertTriangle className="h-3 w-3" style={{ color: 'var(--neutral-gray)' }} />
                      <span style={{ color: 'var(--neutral-gray)' }}>Risk:</span>
                      <span className="font-medium" style={{ color: getRiskColor(route.risk) }}>
                        {route.risk}
                      </span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Route className="h-12 w-12 mx-auto mb-2" style={{ color: 'var(--neutral-gray)' }} />
                  <p className="font-medium" style={{ color: 'var(--neutral-gray)' }}>
                    No routes calculated
                  </p>
                  <p className="text-sm" style={{ color: 'var(--neutral-gray)' }}>
                    Enter coordinates and click Calculate Optimal Route
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
