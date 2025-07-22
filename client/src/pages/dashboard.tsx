import { useQuery } from "@tanstack/react-query";
import NavigationHeader from "@/components/navigation-header";
import AlertBanner from "@/components/alert-banner";
import MetricsOverview from "@/components/metrics-overview";
import DisasterHeatmap from "@/components/disaster-heatmap";
import ActiveAlerts from "@/components/active-alerts";
import PredictionPanel from "@/components/prediction-panel";
import EarthquakeMap from "@/components/earthquake-map";
import IncidentReporting from "@/components/incident-reporting";
import RouteOptimization from "@/components/route-optimization";
import RecentActivity from "@/components/recent-activity";
import { NewsWidget } from "@/components/news-widget";
import { HybridPrediction } from "@/components/hybrid-prediction";
import { useState } from "react";

export default function Dashboard() {
  const [hybridPredictions, setHybridPredictions] = useState<any[]>([]);
  
  const { data: predictions = [] } = useQuery({
    queryKey: ["/api/predictions"],
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <NavigationHeader />
      <AlertBanner />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <MetricsOverview />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <DisasterHeatmap />
          </div>
          <ActiveAlerts />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <div className="xl:col-span-2">
            <EarthquakeMap 
              earthquakes={[]}
              predictions={[...predictions, ...hybridPredictions]}
              onLocationSelect={(location: any) => {
                console.log('Selected earthquake location:', location);
              }}
              height="600px"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <IncidentReporting />
            <RouteOptimization />
          </div>
          <NewsWidget />
        </div>

        <div className="mb-6">
          <HybridPrediction onPredictionGenerated={(prediction: any) => {
            console.log('New hybrid prediction generated:', prediction);
            // Add prediction to map with location data
            if (prediction.prediction?.predictedLocation) {
              const mapPrediction = {
                ...prediction,
                location: prediction.prediction.predictedLocation.name || 'Unknown Location',
                lat: prediction.prediction.predictedLocation.lat,
                lng: prediction.prediction.predictedLocation.lng,
                disasterType: 'earthquake',
                magnitude: prediction.prediction?.magnitude || 5.0,
                confidence: prediction.prediction?.confidence || 50
              };
              setHybridPredictions((prev: any[]) => [mapPrediction, ...prev.slice(0, 9)]); // Keep last 10 predictions
            }
          }} />
        </div>

        <div className="mt-4">
          <RecentActivity />
        </div>
      </main>
    </div>
  );
}
