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

export default function Dashboard() {
  const { data: predictions = [] } = useQuery({
    queryKey: ["/api/predictions"],
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <NavigationHeader />
      <AlertBanner />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <MetricsOverview />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <DisasterHeatmap />
          </div>
          <ActiveAlerts />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <PredictionPanel />
          <EarthquakeMap 
            earthquakes={[]}
            predictions={predictions}
            onLocationSelect={(location) => {
              console.log('Selected earthquake location:', location);
            }}
            height="500px"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <IncidentReporting />
          <RouteOptimization />
        </div>

        <RecentActivity />
      </main>
    </div>
  );
}
