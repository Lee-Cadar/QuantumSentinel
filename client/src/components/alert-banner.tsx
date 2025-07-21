import { X, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function AlertBanner() {
  const queryClient = useQueryClient();
  
  const { data: alerts = [] } = useQuery({
    queryKey: ["/api/alerts"],
  });

  const dismissMutation = useMutation({
    mutationFn: async (alertId: number) => {
      return apiRequest("PUT", `/api/alerts/${alertId}/dismiss`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
    },
  });

  const currentAlert = alerts[0]; // Show the most recent alert

  if (!currentAlert) {
    return null;
  }

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
    <div className="text-white py-3" style={{ backgroundColor: 'var(--emergency-red)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-300" />
            <span className="font-semibold">ACTIVE ALERT:</span>
            <span>{currentAlert.message}</span>
            <span className="text-yellow-300 text-sm">
              {formatTimeAgo(currentAlert.timestamp)}
            </span>
          </div>
          <button
            className="hover:bg-red-700 p-1 rounded transition-colors"
            onClick={() => dismissMutation.mutate(currentAlert.id)}
            disabled={dismissMutation.isPending}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
