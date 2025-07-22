import { disasters, incidents, predictions, alerts, earthquakeData, modelMetrics, newsArticles } from "@shared/schema";
import type { 
  Disaster, InsertDisaster, 
  Incident, InsertIncident, 
  Prediction, InsertPrediction, 
  Alert, InsertAlert,
  EarthquakeData, InsertEarthquakeData,
  ModelMetrics, InsertModelMetrics,
  NewsArticle, InsertNewsArticle
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
  getRecentEarthquakeData(limit: number): Promise<EarthquakeData[]>;
  createEarthquakeData(data: InsertEarthquakeData): Promise<EarthquakeData>;
  bulkCreateEarthquakeData(data: InsertEarthquakeData[]): Promise<EarthquakeData[]>;
  
  // Model Metrics
  getLatestModelMetrics(): Promise<ModelMetrics | undefined>;
  updateModelMetrics(metrics: InsertModelMetrics): Promise<ModelMetrics>;
  
  // News Articles
  getNewsArticles(limit?: number): Promise<NewsArticle[]>;
  getNewsArticlesByType(disasterType: string): Promise<NewsArticle[]>;
  getNewsArticleByUrl(url: string): Promise<NewsArticle | undefined>;
  createNewsArticle(article: InsertNewsArticle): Promise<NewsArticle>;
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
}

export const storage = new DatabaseStorage();