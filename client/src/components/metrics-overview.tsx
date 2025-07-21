import { CircleAlert, MapPin, Users, Brain, TrendingUp, TrendingDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";

export default function MetricsOverview() {
  const { data: metrics } = useQuery({
    queryKey: ["/api/metrics"],
  });

  if (!metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-20 bg-slate-200 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  const metricCards = [
    {
      title: "Active Incidents",
      value: metrics.activeIncidents,
      icon: CircleAlert,
      color: "var(--emergency-red)",
      bgColor: "rgba(220, 38, 38, 0.1)",
      trend: { value: "12%", isUp: true, label: "from last hour" }
    },
    {
      title: "High Risk Zones", 
      value: metrics.highRiskZones,
      icon: MapPin,
      color: "var(--warning-orange)",
      bgColor: "rgba(234, 88, 12, 0.1)",
      trend: { value: "5%", isUp: false, label: "from yesterday" }
    },
    {
      title: "Response Teams",
      value: metrics.responseTeams,
      icon: Users,
      color: "var(--safe-green)",
      bgColor: "rgba(5, 150, 105, 0.1)",
      trend: { value: "89%", isUp: null, label: "deployment ready" }
    },
    {
      title: "Prediction Accuracy",
      value: `${metrics.accuracy}%`,
      icon: Brain,
      color: "hsl(207, 90%, 54%)",
      bgColor: "rgba(59, 130, 246, 0.1)",
      trend: { value: "2.1%", isUp: true, label: "this week" }
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metricCards.map((metric, index) => (
        <Card key={index} className="bg-white rounded-xl shadow-lg p-6 border-l-4" style={{ borderLeftColor: metric.color }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium" style={{ color: 'var(--neutral-gray)' }}>
                {metric.title}
              </h3>
              <p className="text-3xl font-bold text-slate-900">
                {metric.value}
              </p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: metric.bgColor }}>
              <metric.icon className="h-6 w-6" style={{ color: metric.color }} />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            {metric.trend.isUp !== null && (
              <>
                {metric.trend.isUp ? (
                  <TrendingUp className="h-4 w-4 mr-1" style={{ color: metric.trend.isUp ? 'var(--emergency-red)' : 'var(--safe-green)' }} />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" style={{ color: 'var(--safe-green)' }} />
                )}
              </>
            )}
            <span className="font-medium" style={{ color: metric.trend.isUp === true ? 'var(--emergency-red)' : metric.trend.isUp === false ? 'var(--safe-green)' : 'var(--safe-green)' }}>
              {metric.trend.value}
            </span>
            <span className="ml-1" style={{ color: 'var(--neutral-gray)' }}>
              {metric.trend.label}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}
