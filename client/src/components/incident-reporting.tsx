import { useState } from "react";
import { NotebookPen, CheckCircle, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Incident } from "@/../../shared/schema";

export default function IncidentReporting() {
  const [formData, setFormData] = useState({
    incidentType: "",
    location: "",
    latitude: "",
    longitude: "",
    description: "",
    severity: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recentIncidents = [] } = useQuery<Incident[]>({
    queryKey: ["/api/incidents/recent"],
  });

  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
      };
      return apiRequest("POST", "/api/incidents", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      setFormData({
        incidentType: "",
        location: "",
        latitude: "",
        longitude: "",
        description: "",
        severity: ""
      });
      toast({
        title: "Incident Reported",
        description: "Your incident report has been submitted for verification.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit incident report. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.incidentType || !formData.location || !formData.description || !formData.severity) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    submitMutation.mutate(formData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "var(--safe-green)";
      case "pending":
        return "var(--warning-orange)";
      default:
        return "var(--neutral-gray)";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return CheckCircle;
      case "pending":
        return Clock;
      default:
        return Clock;
    }
  };

  const formatTimeAgo = (timestamp: string | Date) => {
    const now = new Date();
    const incidentTime = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const diffInMinutes = Math.floor((now.getTime() - incidentTime.getTime()) / (1000 * 60));
    
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
        <h2 className="text-xl font-bold text-slate-900">Incident Reporting</h2>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="incidentType" className="block text-sm font-medium text-slate-900 mb-2">
              Incident Type
            </Label>
            <Select value={formData.incidentType} onValueChange={(value) => setFormData(prev => ({ ...prev, incidentType: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select incident type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="earthquake">Earthquake</SelectItem>
                <SelectItem value="wildfire">Wildfire</SelectItem>
                <SelectItem value="flood">Flood</SelectItem>
                <SelectItem value="landslide">Landslide</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location" className="block text-sm font-medium text-slate-900 mb-2">
              Location
            </Label>
            <Input
              id="location"
              placeholder="Enter location description"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="latitude" className="block text-sm font-medium text-slate-900 mb-2">
                Latitude (optional)
              </Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="37.7749"
                value={formData.latitude}
                onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="longitude" className="block text-sm font-medium text-slate-900 mb-2">
                Longitude (optional)
              </Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="-122.4194"
                value={formData.longitude}
                onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="block text-sm font-medium text-slate-900 mb-2">
              Description
            </Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Describe the incident details..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-slate-900 mb-2">
              Severity Level
            </Label>
            <RadioGroup value={formData.severity} onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value }))}>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="low" />
                  <Label htmlFor="low" className="text-sm">Low</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="moderate" id="moderate" />
                  <Label htmlFor="moderate" className="text-sm">Moderate</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="high" />
                  <Label htmlFor="high" className="text-sm">High</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <Button
            type="submit"
            className="w-full text-white font-semibold"
            style={{ backgroundColor: 'var(--emergency-red)' }}
            disabled={submitMutation.isPending}
          >
            <NotebookPen className="h-4 w-4 mr-2" />
            {submitMutation.isPending ? "Submitting..." : "Submit Report"}
          </Button>
        </form>

        <div className="mt-6">
          <h4 className="font-semibold text-slate-900 mb-3">Recent Reports</h4>
          <div className="space-y-2">
            {recentIncidents.slice(0, 3).map((incident) => {
              const StatusIcon = getStatusIcon(incident.verificationStatus || 'pending');
              const statusColor = getStatusColor(incident.verificationStatus || 'pending');
              
              return (
                <div key={incident.id} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {incident.incidentType.charAt(0).toUpperCase() + incident.incidentType.slice(1)} reported in {incident.location}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--neutral-gray)' }}>
                      {formatTimeAgo(incident.timestamp)} • {incident.verificationStatus}
                    </p>
                  </div>
                  <span 
                    className="text-xs text-white px-2 py-1 rounded capitalize"
                    style={{ backgroundColor: statusColor }}
                  >
                    {incident.verificationStatus}
                  </span>
                </div>
              );
            })}
            {recentIncidents.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: 'var(--neutral-gray)' }}>
                No recent reports
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
