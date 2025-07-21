import { 
  disasters, 
  incidents, 
  predictions, 
  alerts,
  type Disaster, 
  type InsertDisaster,
  type Incident,
  type InsertIncident,
  type Prediction,
  type InsertPrediction,
  type Alert,
  type InsertAlert
} from "@shared/schema";

export interface IStorage {
  // Disasters
  getDisasters(): Promise<Disaster[]>;
  getDisastersByType(type: string): Promise<Disaster[]>;
  createDisaster(disaster: InsertDisaster): Promise<Disaster>;
  
  // Incidents
  getIncidents(): Promise<Incident[]>;
  getRecentIncidents(limit: number): Promise<Incident[]>;
  createIncident(incident: InsertIncident): Promise<Incident>;
  updateIncidentVerification(id: number, verified: boolean, status: string): Promise<Incident>;
  
  // Predictions
  getPredictions(): Promise<Prediction[]>;
  getPredictionsByType(type: string): Promise<Prediction[]>;
  createPrediction(prediction: InsertPrediction): Promise<Prediction>;
  
  // Alerts
  getActiveAlerts(): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  dismissAlert(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private disasters: Map<number, Disaster>;
  private incidents: Map<number, Incident>;
  private predictions: Map<number, Prediction>;
  private alerts: Map<number, Alert>;
  private currentDisasterId: number;
  private currentIncidentId: number;
  private currentPredictionId: number;
  private currentAlertId: number;

  constructor() {
    this.disasters = new Map();
    this.incidents = new Map();
    this.predictions = new Map();
    this.alerts = new Map();
    this.currentDisasterId = 1;
    this.currentIncidentId = 1;
    this.currentPredictionId = 1;
    this.currentAlertId = 1;
    
    // Initialize with some sample data for demonstration
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Add a few sample disasters for testing
    const sampleDisasters: InsertDisaster[] = [
      {
        disasterType: "earthquake",
        location: "San Francisco, CA",
        latitude: 37.7749,
        longitude: -122.4194,
        intensity: 5.2,
        description: "Magnitude 5.2 earthquake detected",
        source: "USGS",
        verified: true
      }
    ];

    sampleDisasters.forEach(disaster => {
      this.createDisaster(disaster);
    });
  }

  async getDisasters(): Promise<Disaster[]> {
    return Array.from(this.disasters.values());
  }

  async getDisastersByType(type: string): Promise<Disaster[]> {
    return Array.from(this.disasters.values()).filter(d => d.disasterType === type);
  }

  async createDisaster(insertDisaster: InsertDisaster): Promise<Disaster> {
    const id = this.currentDisasterId++;
    const disaster: Disaster = {
      ...insertDisaster,
      id,
      timestamp: new Date(),
    };
    this.disasters.set(id, disaster);
    return disaster;
  }

  async getIncidents(): Promise<Incident[]> {
    return Array.from(this.incidents.values());
  }

  async getRecentIncidents(limit: number): Promise<Incident[]> {
    return Array.from(this.incidents.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async createIncident(insertIncident: InsertIncident): Promise<Incident> {
    const id = this.currentIncidentId++;
    const incident: Incident = {
      ...insertIncident,
      id,
      timestamp: new Date(),
      verified: false,
      verificationStatus: "pending",
    };
    this.incidents.set(id, incident);
    return incident;
  }

  async updateIncidentVerification(id: number, verified: boolean, status: string): Promise<Incident> {
    const incident = this.incidents.get(id);
    if (!incident) {
      throw new Error("Incident not found");
    }
    const updatedIncident = { ...incident, verified, verificationStatus: status };
    this.incidents.set(id, updatedIncident);
    return updatedIncident;
  }

  async getPredictions(): Promise<Prediction[]> {
    return Array.from(this.predictions.values());
  }

  async getPredictionsByType(type: string): Promise<Prediction[]> {
    return Array.from(this.predictions.values()).filter(p => p.disasterType === type);
  }

  async createPrediction(insertPrediction: InsertPrediction): Promise<Prediction> {
    const id = this.currentPredictionId++;
    const prediction: Prediction = {
      ...insertPrediction,
      id,
      timestamp: new Date(),
    };
    this.predictions.set(id, prediction);
    return prediction;
  }

  async getActiveAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(a => a.active);
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const id = this.currentAlertId++;
    const alert: Alert = {
      ...insertAlert,
      id,
      timestamp: new Date(),
      active: true,
    };
    this.alerts.set(id, alert);
    return alert;
  }

  async dismissAlert(id: number): Promise<void> {
    const alert = this.alerts.get(id);
    if (alert) {
      this.alerts.set(id, { ...alert, active: false });
    }
  }
}

export const storage = new MemStorage();
