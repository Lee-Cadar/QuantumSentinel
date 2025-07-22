import { useQuery } from "@tanstack/react-query";
import EarthquakeMap from "./earthquake-map";

interface RealTimeEarthquakeMapProps {
  prediction: any;
}

interface USGSEarthquake {
  id: string;
  time: string;
  latitude: number;
  longitude: number;
  magnitude: number;
  depth: number;
  location: string;
  source: string;
}

export default function RealTimeEarthquakeMap({ prediction }: RealTimeEarthquakeMapProps) {
  // Fetch real USGS earthquake data
  const { data: recentEvents = [] } = useQuery<USGSEarthquake[]>({
    queryKey: ["/api/real-time/recent-events"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Convert USGS earthquakes to EarthquakeMap format
  const earthquakeLocations = recentEvents.slice(0, 50).map(event => ({
    lat: event.latitude,
    lng: event.longitude,
    magnitude: event.magnitude,
    location: event.location,
    riskLevel: event.magnitude >= 6.0 ? 'high' : event.magnitude >= 4.0 ? 'medium' : 'low',
    confidence: 95, // USGS data is highly reliable
    reasoning: `Real earthquake data from USGS • Depth: ${event.depth}km • Event ID: ${event.id}`,
    timestamp: event.time,
  }));

  // Add predicted location if available
  const predictions = [];
  if (prediction.analysis.predictedLocation) {
    predictions.push({
      lat: prediction.analysis.predictedLocation.lat || 37.7749,
      lng: prediction.analysis.predictedLocation.lng || -122.4194,
      magnitude: prediction.prediction.magnitude,
      location: `Predicted: ${prediction.prediction.location}`,
      riskLevel: prediction.prediction.riskLevel,
      confidence: prediction.prediction.confidence,
      reasoning: `AI Prediction • ${prediction.modelType.toUpperCase()} Model • ${prediction.prediction.timeframe}`,
      timestamp: new Date().toISOString(),
    });
  }

  return (
    <EarthquakeMap 
      earthquakes={earthquakeLocations}
      predictions={predictions}
      height="450px"
      onLocationSelect={(location) => {
        console.log('Selected earthquake:', location);
      }}
    />
  );
}