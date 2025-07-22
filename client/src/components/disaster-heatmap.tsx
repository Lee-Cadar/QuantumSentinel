import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function DisasterHeatmap() {
  const [selectedType, setSelectedType] = useState("earthquake");
  const queryClient = useQueryClient();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

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
    if (intensity >= 7.0) return Math.max(20, intensity * 3);
    if (intensity >= 5.0) return Math.max(15, intensity * 2.5);
    return Math.max(10, intensity * 2);
  };

  // Initialize and update map
  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([39.8283, -98.5795], 4); // US center

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(mapInstance.current);
    }

    const map = mapInstance.current;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    // Add disaster markers
    if (disasters && Array.isArray(disasters)) {
      disasters.forEach((disaster: any) => {
        if (disaster.latitude && disaster.longitude) {
          const intensity = disaster.intensity || disaster.magnitude || 4.0;
          const color = getIntensityColor(intensity);
          const size = getIntensitySize(intensity);
          
          const marker = L.circleMarker([disaster.latitude, disaster.longitude], {
            radius: Math.max(5, size / 2),
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.6
          }).addTo(map);

          const popupContent = `
            <div style="font-family: system-ui; min-width: 180px;">
              <h4 style="margin: 0 0 8px 0; color: #1f2937;">${disaster.location}</h4>
              <div style="margin-bottom: 4px;">
                <strong>Type:</strong> ${disaster.disasterType}
              </div>
              <div style="margin-bottom: 4px;">
                <strong>Intensity:</strong> ${intensity.toFixed(1)}
              </div>
              <div style="margin-bottom: 8px;">
                <strong>Status:</strong> ${disaster.status || 'Active'}
              </div>
              <div style="font-size: 12px; color: #6b7280;">
                Last updated: ${new Date(disaster.timestamp || Date.now()).toLocaleDateString()}
              </div>
            </div>
          `;

          marker.bindPopup(popupContent);
        }
      });

      // Fit map to show all markers if there are any
      if (disasters.length > 0) {
        const validDisasters = disasters.filter((d: any) => d.latitude && d.longitude);
        if (validDisasters.length > 0) {
          const group = new L.FeatureGroup(
            validDisasters.map((d: any) => L.marker([d.latitude, d.longitude]))
          );
          map.fitBounds(group.getBounds().pad(0.1));
        }
      }
    }

    return () => {
      // Cleanup handled by map instance persistence
    };
  }, [disasters, selectedType]);

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
            <div 
              ref={mapRef} 
              style={{ height: '320px', width: '100%' }}
              className="border rounded-lg overflow-hidden"
            />
            
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

            {disasters.length === 0 && (
              <div className="mt-4 text-center">
                <div className="bg-white bg-opacity-90 p-4 rounded-lg">
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

            <div className="mt-4 text-xs text-gray-500">
              <p>🌍 Map powered by OpenStreetMap • Click markers for details • Real disaster data from USGS</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
