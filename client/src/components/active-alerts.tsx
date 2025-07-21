import { AlertTriangle, Flame, CloudRain } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ActiveAlerts() {
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["/api/alerts"],
  });

  const getAlertIcon = (alertType: string) => {
    switch (alertType.toLowerCase()) {
      case "earthquake":
        return AlertTriangle;
      case "wildfire":
        return Flame;
      case "flood":
        return CloudRain;
      default:
        return AlertTriangle;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high":
        return "var(--emergency-red)";
      case "medium":
        return "var(--warning-orange)";
      case "low":
        return "hsl(207, 90%, 54%)";
      default:
        return "var(--emergency-red)";
    }
  };

  const getAlertBgColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high":
        return "rgba(220, 38, 38, 0.1)";
      case "medium":
        return "rgba(234, 88, 12, 0.1)";
      case "low":
        return "rgba(59, 130, 246, 0.1)";
      default:
        return "rgba(220, 38, 38, 0.1)";
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    const hours = Math.floor(diffInMinutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  return (
    <Card className="bg-white rounded-xl shadow-lg">
      <CardHeader className="p-6 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900">Active Alerts</h2>
      </CardHeader>
      <CardContent className="p-6 space-y-4 max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-slate-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : alerts.length > 0 ? (
          alerts.map((alert) => {
            const IconComponent = getAlertIcon(alert.alertType);
            const alertColor = getAlertColor(alert.severity);
            const alertBgColor = getAlertBgColor(alert.severity);
            
            return (
              <div
                key={alert.id}
                className="border-l-4 p-4 rounded-r-lg"
                style={{ 
                  borderLeftColor: alertColor,
                  backgroundColor: alertBgColor
                }}
              >
                <div className="flex items-start space-x-3">
                  <IconComponent className="mt-1 h-5 w-5" style={{ color: alertColor }} />
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{alert.title}</h4>
                    <p className="text-sm" style={{ color: 'var(--neutral-gray)' }}>
                      {alert.message}
                    </p>
                    {alert.location && (
                      <p className="text-xs mt-1" style={{ color: 'var(--neutral-gray)' }}>
                        Location: {alert.location}
                      </p>
                    )}
                    <p className="text-xs mt-1" style={{ color: 'var(--neutral-gray)' }}>
                      {formatTimeAgo(alert.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto mb-2" style={{ color: 'var(--neutral-gray)' }} />
            <p className="font-medium" style={{ color: 'var(--neutral-gray)' }}>
              No active alerts
            </p>
            <p className="text-sm" style={{ color: 'var(--neutral-gray)' }}>
              All systems operating normally
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
