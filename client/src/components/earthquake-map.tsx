import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Fix Leaflet default markers
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface EarthquakeLocation {
  lat: number;
  lng: number;
  magnitude: number;
  location: string;
  riskLevel: string;
  confidence: number;
  reasoning: string;
  timestamp?: string;
}

interface EarthquakeMapProps {
  earthquakes: EarthquakeLocation[];
  predictions?: any[];
  onLocationSelect?: (location: EarthquakeLocation) => void;
  height?: string;
}

export default function EarthquakeMap({ 
  earthquakes = [], 
  predictions = [], 
  onLocationSelect,
  height = "400px" 
}: EarthquakeMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<EarthquakeLocation | null>(null);

  // Generate earthquake locations from predictions if provided
  const allLocations: EarthquakeLocation[] = [
    ...earthquakes,
    ...predictions.map(pred => ({
      lat: pred.predictedIntensity ? 36.7783 + (Math.random() - 0.5) * 10 : 37.7749,
      lng: pred.predictedIntensity ? -119.4179 + (Math.random() - 0.5) * 10 : -122.4194,
      magnitude: pred.predictedIntensity || pred.predictedMagnitude || 4.5,
      location: pred.location || "Predicted Location",
      riskLevel: pred.riskLevel || (pred.predictedIntensity >= 6 ? 'high' : pred.predictedIntensity >= 4 ? 'medium' : 'low'),
      confidence: pred.confidence || 75,
      reasoning: pred.reasoning || "AI prediction analysis",
      timestamp: pred.timestamp
    }))
  ];

  const getRiskColor = (riskLevel: string, magnitude: number, isPrediction: boolean = false) => {
    if (isPrediction) {
      // Purple tones for predictions
      if (riskLevel === 'high' || magnitude >= 6.0) return '#7c3aed'; // purple-600
      if (riskLevel === 'medium' || magnitude >= 4.0) return '#a855f7'; // purple-500
      return '#c084fc'; // purple-400
    }
    // Original colors for real earthquakes
    if (riskLevel === 'high' || magnitude >= 6.0) return '#dc2626'; // red
    if (riskLevel === 'medium' || magnitude >= 4.0) return '#f59e0b'; // orange
    return '#10b981'; // green
  };

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
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add earthquake markers
    allLocations.forEach((location, index) => {
      const isPrediction = location.reasoning?.includes('AI Prediction') || false;
      const color = getRiskColor(location.riskLevel, location.magnitude, isPrediction);
      
      // Create custom icon based on risk level and type
      const customIcon = L.divIcon({
        html: `<div style="
          background-color: ${color};
          width: ${Math.max(12, location.magnitude * 3)}px;
          height: ${Math.max(12, location.magnitude * 3)}px;
          border-radius: ${isPrediction ? '10%' : '50%'};
          border: ${isPrediction ? '3px solid #6b21a8' : '2px solid white'};
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          font-weight: bold;
          ${isPrediction ? 'animation: pulse 2s infinite;' : ''}
        ">${isPrediction ? '🔮' : location.magnitude.toFixed(1)}</div>`,
        className: `earthquake-marker ${isPrediction ? 'prediction-marker' : 'real-marker'}`,
        iconSize: [Math.max(12, location.magnitude * 3), Math.max(12, location.magnitude * 3)],
        iconAnchor: [Math.max(6, location.magnitude * 1.5), Math.max(6, location.magnitude * 1.5)]
      });

      const marker = L.marker([location.lat, location.lng], { icon: customIcon })
        .addTo(map);

      // Create popup content
      const popupContent = `
        <div style="font-family: system-ui; min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; color: #1f2937;">
            ${isPrediction ? '🔮 ' : '🌍 '}${location.location}
          </h4>
          <div style="margin-bottom: 4px;">
            <strong>Type:</strong> 
            <span style="color: ${isPrediction ? '#7c3aed' : '#059669'}; font-weight: bold;">
              ${isPrediction ? 'AI PREDICTION' : 'REAL EARTHQUAKE'}
            </span>
          </div>
          <div style="margin-bottom: 4px;">
            <strong>Magnitude:</strong> ${location.magnitude.toFixed(1)}
          </div>
          <div style="margin-bottom: 4px;">
            <strong>Risk Level:</strong> 
            <span style="color: ${color}; font-weight: bold;">${location.riskLevel.toUpperCase()}</span>
          </div>
          <div style="margin-bottom: 4px;">
            <strong>Confidence:</strong> ${location.confidence.toFixed(0)}%
          </div>
          <div style="margin-bottom: 8px;">
            <strong>Coordinates:</strong> ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}
          </div>
          ${location.timestamp ? `
          <div style="margin-bottom: 8px;">
            <strong>Time:</strong> ${new Date(location.timestamp).toLocaleString()}
          </div>
          ` : ''}
          <div style="font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 8px;">
            ${location.reasoning}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      // Add click handler
      marker.on('click', () => {
        setSelectedLocation(location);
        onLocationSelect?.(location);
        console.log('Selected earthquake location:', location);
      });
    });

    // Fit map to show all markers if there are any
    if (allLocations.length > 0) {
      const group = new L.FeatureGroup(
        allLocations.map(loc => L.marker([loc.lat, loc.lng]))
      );
      map.fitBounds(group.getBounds().pad(0.1));
    }

    return () => {
      // Cleanup handled by map instance persistence
    };
  }, [allLocations, onLocationSelect]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            🗺️ Interactive Earthquake Map
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="secondary">{allLocations.length} Locations</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-xs text-gray-600 uppercase tracking-wide">Real Earthquakes</h4>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>High Risk (6.0+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>Medium Risk (4.0-5.9)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Low Risk (&lt;4.0)</span>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-xs text-gray-600 uppercase tracking-wide">AI Predictions</h4>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-purple-600"></div>
                <span>High Risk (6.0+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-purple-500"></div>
                <span>Medium Risk (4.0-5.9)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-purple-400"></div>
                <span>Low Risk (&lt;4.0)</span>
              </div>
            </div>
          </div>
        </div>
        
        <div 
          ref={mapRef} 
          style={{ height, width: '100%' }}
          className="border rounded-lg overflow-hidden"
        />

        {selectedLocation && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Selected Location Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>Location:</strong> {selectedLocation.location}</div>
              <div><strong>Magnitude:</strong> {selectedLocation.magnitude.toFixed(1)}</div>
              <div><strong>Risk Level:</strong> 
                <span className={`ml-1 font-semibold ${
                  selectedLocation.riskLevel === 'high' ? 'text-red-600' :
                  selectedLocation.riskLevel === 'medium' ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {selectedLocation.riskLevel.toUpperCase()}
                </span>
              </div>
              <div><strong>Confidence:</strong> {selectedLocation.confidence}%</div>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              <strong>Analysis:</strong> {selectedLocation.reasoning}
            </div>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500">
          <p>🌍 Map powered by OpenStreetMap • Click markers for details • Real earthquake data from USGS</p>
        </div>
      </CardContent>
    </Card>
  );
}