import { disasters, incidents, predictions, alerts, earthquakeData, modelMetrics, newsArticles, trainingMetrics, trainingGoals, trainingSessions } from "@shared/schema";
import type { 
  Disaster, InsertDisaster, 
  Incident, InsertIncident, 
  Prediction, InsertPrediction, 
  Alert, InsertAlert,
  EarthquakeData, InsertEarthquakeData,
  ModelMetrics, InsertModelMetrics,
  NewsArticle, InsertNewsArticle,
  TrainingMetrics, InsertTrainingMetrics,
  TrainingGoals, InsertTrainingGoals,
  TrainingSession, InsertTrainingSession
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte } from "drizzle-orm";

export interface IStorage {
  // Disasters
  getDisasters(type?: string): Promise<Disaster[]>;
  getDisastersByType(type: string): Promise<Disaster[]>;
  createDisaster(disaster: InsertDisaster): Promise<Disaster>;
  
  // Incidents  
  getIncidents(): Promise<Incident[]>;
  getRecentIncidents(limit?: number): Promise<Incident[]>;
  createIncident(incident: InsertIncident): Promise<Incident>;
  updateIncidentVerification(id: number, verified: boolean, status: string): Promise<void>;
  
  // Predictions
  getPredictions(): Promise<Prediction[]>;
  createPrediction(prediction: InsertPrediction): Promise<Prediction>;
  
  // Alerts
  getAlerts(): Promise<Alert[]>;
  getActiveAlerts(): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  dismissAlert(id: number): Promise<void>;
  
  // Earthquake Data
  getEarthquakeData(): Promise<EarthquakeData[]>;
  getAllEarthquakeData(): Promise<EarthquakeData[]>;
  getRecentEarthquakeData(limit: number): Promise<EarthquakeData[]>;
  createEarthquakeData(data: InsertEarthquakeData): Promise<EarthquakeData>;
  addEarthquakeData(data: InsertEarthquakeData): Promise<EarthquakeData>;
  bulkCreateEarthquakeData(data: InsertEarthquakeData[]): Promise<EarthquakeData[]>;
  
  // Predictions extended
  addPrediction(prediction: InsertPrediction): Promise<Prediction>;
  
  // Model Metrics
  getLatestModelMetrics(): Promise<ModelMetrics | undefined>;
  updateModelMetrics(metrics: InsertModelMetrics): Promise<ModelMetrics>;
  
  // News Articles
  getNewsArticles(limit?: number): Promise<NewsArticle[]>;
  getNewsArticlesByType(disasterType: string): Promise<NewsArticle[]>;
  getNewsArticleByUrl(url: string): Promise<NewsArticle | undefined>;
  createNewsArticle(article: InsertNewsArticle): Promise<NewsArticle>;
  
  // Training persistence methods
  getTrainingMetrics(modelType: string): Promise<TrainingMetrics | undefined>;
  updateTrainingMetrics(modelType: string, metrics: Partial<InsertTrainingMetrics>): Promise<TrainingMetrics>;
  getTrainingGoals(modelType: string): Promise<TrainingGoals | undefined>;
  saveTrainingGoals(goals: InsertTrainingGoals): Promise<TrainingGoals>;
  createTrainingSession(session: InsertTrainingSession): Promise<TrainingSession>;
  updateTrainingSession(sessionId: string, updates: Partial<TrainingSession>): Promise<TrainingSession | undefined>;
  getTrainingSessions(modelType: string, limit?: number): Promise<TrainingSession[]>;
}

export class DatabaseStorage implements IStorage {
  async getDisasters(type?: string): Promise<Disaster[]> {
    if (type) {
      return await db.select().from(disasters).where(eq(disasters.disasterType, type)).orderBy(desc(disasters.timestamp));
    }
    return await db.select().from(disasters).orderBy(desc(disasters.timestamp));
  }

  async getDisastersByType(type: string): Promise<Disaster[]> {
    return await db.select().from(disasters).where(eq(disasters.disasterType, type)).orderBy(desc(disasters.timestamp));
  }

  async createDisaster(disaster: InsertDisaster): Promise<Disaster> {
    const [newDisaster] = await db
      .insert(disasters)
      .values({ ...disaster, timestamp: new Date() })
      .returning();
    return newDisaster;
  }

  async getIncidents(): Promise<Incident[]> {
    return await db.select().from(incidents).orderBy(desc(incidents.timestamp));
  }

  async getRecentIncidents(limit: number = 10): Promise<Incident[]> {
    return await db.select().from(incidents).orderBy(desc(incidents.timestamp)).limit(limit);
  }

  async createIncident(incident: InsertIncident): Promise<Incident> {
    const [newIncident] = await db
      .insert(incidents)
      .values({ ...incident, timestamp: new Date() })
      .returning();
    return newIncident;
  }

  async updateIncidentVerification(id: number, verified: boolean, status: string): Promise<void> {
    await db.update(incidents)
      .set({ verified, verificationStatus: status })
      .where(eq(incidents.id, id));
  }

  async getPredictions(): Promise<Prediction[]> {
    return await db.select().from(predictions).orderBy(desc(predictions.timestamp));
  }

  async createPrediction(prediction: InsertPrediction): Promise<Prediction> {
    const [newPrediction] = await db
      .insert(predictions)
      .values({ ...prediction, timestamp: new Date() })
      .returning();
    return newPrediction;
  }

  async addPrediction(prediction: InsertPrediction): Promise<Prediction> {
    return this.createPrediction(prediction);
  }

  async getAlerts(): Promise<Alert[]> {
    return await db.select().from(alerts).where(eq(alerts.active, true)).orderBy(desc(alerts.timestamp));
  }

  async getActiveAlerts(): Promise<Alert[]> {
    return await db.select().from(alerts).where(eq(alerts.active, true)).orderBy(desc(alerts.timestamp));
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [newAlert] = await db
      .insert(alerts)
      .values({ ...alert, timestamp: new Date() })
      .returning();
    return newAlert;
  }

  async dismissAlert(id: number): Promise<void> {
    await db.update(alerts).set({ active: false }).where(eq(alerts.id, id));
  }

  async getEarthquakeData(): Promise<EarthquakeData[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return await db
      .select()
      .from(earthquakeData)
      .where(gte(earthquakeData.timestamp, thirtyDaysAgo))
      .orderBy(desc(earthquakeData.timestamp));
  }

  async getAllEarthquakeData(): Promise<EarthquakeData[]> {
    return await db.select().from(earthquakeData).orderBy(desc(earthquakeData.timestamp));
  }

  async addEarthquakeData(data: InsertEarthquakeData): Promise<EarthquakeData> {
    return this.createEarthquakeData(data);
  }

  async getRecentEarthquakeData(limit: number): Promise<EarthquakeData[]> {
    return await db
      .select()
      .from(earthquakeData)
      .orderBy(desc(earthquakeData.timestamp))
      .limit(limit);
  }

  async createEarthquakeData(data: InsertEarthquakeData): Promise<EarthquakeData> {
    const [newData] = await db
      .insert(earthquakeData)
      .values(data)
      .returning();
    return newData;
  }

  async bulkCreateEarthquakeData(data: InsertEarthquakeData[]): Promise<EarthquakeData[]> {
    if (data.length === 0) return [];
    
    return await db
      .insert(earthquakeData)
      .values(data)
      .returning();
  }

  async getLatestModelMetrics(): Promise<ModelMetrics | undefined> {
    const [metrics] = await db
      .select()
      .from(modelMetrics)
      .orderBy(desc(modelMetrics.lastUpdated))
      .limit(1);
    return metrics;
  }

  async updateModelMetrics(metrics: InsertModelMetrics): Promise<ModelMetrics> {
    const [updatedMetrics] = await db
      .insert(modelMetrics)
      .values({ ...metrics, lastUpdated: new Date() })
      .returning();
    return updatedMetrics;
  }

  async getNewsArticles(limit: number = 20): Promise<NewsArticle[]> {
    return await db.select().from(newsArticles)
      .orderBy(desc(newsArticles.publishedAt))
      .limit(limit);
  }

  async getNewsArticlesByType(disasterType: string): Promise<NewsArticle[]> {
    return await db.select().from(newsArticles)
      .where(eq(newsArticles.disasterType, disasterType))
      .orderBy(desc(newsArticles.publishedAt));
  }

  async getNewsArticleByUrl(url: string): Promise<NewsArticle | undefined> {
    const [article] = await db.select().from(newsArticles)
      .where(eq(newsArticles.url, url));
    return article || undefined;
  }

  async createNewsArticle(article: InsertNewsArticle): Promise<NewsArticle> {
    const [newArticle] = await db
      .insert(newsArticles)
      .values(article)
      .returning();
    return newArticle;
  }

  // Training persistence implementations
  async getTrainingMetrics(modelType: string): Promise<TrainingMetrics | undefined> {
    const [metrics] = await db.select().from(trainingMetrics)
      .where(eq(trainingMetrics.modelType, modelType))
      .orderBy(desc(trainingMetrics.updatedAt))
      .limit(1);
    return metrics;
  }

  async updateTrainingMetrics(modelType: string, metrics: Partial<InsertTrainingMetrics>): Promise<TrainingMetrics> {
    const existing = await this.getTrainingMetrics(modelType);
    
    if (existing) {
      const [updated] = await db.update(trainingMetrics)
        .set({ ...metrics, updatedAt: new Date() })
        .where(eq(trainingMetrics.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newMetrics] = await db.insert(trainingMetrics)
        .values({ modelType, ...metrics })
        .returning();
      return newMetrics;
    }
  }

  async getTrainingGoals(modelType: string): Promise<TrainingGoals | undefined> {
    const [goals] = await db.select().from(trainingGoals)
      .where(eq(trainingGoals.modelType, modelType))
      .orderBy(desc(trainingGoals.updatedAt))
      .limit(1);
    return goals;
  }

  async saveTrainingGoals(goals: InsertTrainingGoals): Promise<TrainingGoals> {
    const existing = await this.getTrainingGoals(goals.modelType);
    
    if (existing) {
      const [updated] = await db.update(trainingGoals)
        .set({ ...goals, updatedAt: new Date() })
        .where(eq(trainingGoals.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newGoals] = await db.insert(trainingGoals)
        .values(goals)
        .returning();
      return newGoals;
    }
  }

  async createTrainingSession(session: InsertTrainingSession): Promise<TrainingSession> {
    const [newSession] = await db.insert(trainingSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async updateTrainingSession(sessionId: string, updates: Partial<TrainingSession>): Promise<TrainingSession | undefined> {
    const [updated] = await db.update(trainingSessions)
      .set(updates)
      .where(eq(trainingSessions.sessionId, sessionId))
      .returning();
    return updated;
  }

  async getTrainingSessions(modelType: string, limit: number = 10): Promise<TrainingSession[]> {
    return await db.select().from(trainingSessions)
      .where(eq(trainingSessions.modelType, modelType))
      .orderBy(desc(trainingSessions.startTime))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();