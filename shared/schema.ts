import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const disasters = pgTable("disasters", {
  id: serial("id").primaryKey(),
  disasterType: text("disaster_type").notNull(),
  location: text("location").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  intensity: real("intensity").notNull(),
  description: text("description"),
  timestamp: timestamp("timestamp").notNull(),
  source: text("source").notNull(),
  verified: boolean("verified").default(false),
});

export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  incidentType: text("incident_type").notNull(),
  location: text("location").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  description: text("description").notNull(),
  severity: text("severity").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  verified: boolean("verified").default(false),
  verificationStatus: text("verification_status").default("pending"),
});

export const predictions = pgTable("predictions", {
  id: serial("id").primaryKey(),
  disasterType: text("disaster_type").notNull(),
  predictedIntensity: real("predicted_intensity"),
  predictedMagnitude: real("predicted_magnitude"),
  confidence: real("confidence").notNull(),
  timeframe: text("timeframe").notNull(),
  location: text("location"),
  reasoning: text("reasoning"),
  riskLevel: text("risk_level"),
  keyFactors: jsonb("key_factors"),
  recommendedActions: jsonb("recommended_actions"),
  timestamp: timestamp("timestamp").notNull(),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  alertType: text("alert_type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: text("severity").notNull(),
  location: text("location"),
  timestamp: timestamp("timestamp").notNull(),
  active: boolean("active").default(true),
});

export const insertDisasterSchema = createInsertSchema(disasters).omit({
  id: true,
  timestamp: true,
});

export const insertIncidentSchema = createInsertSchema(incidents).omit({
  id: true,
  timestamp: true,
  verified: true,
  verificationStatus: true,
});

export const insertPredictionSchema = createInsertSchema(predictions).omit({
  id: true,
  timestamp: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  timestamp: true,
});

export type Disaster = typeof disasters.$inferSelect;
export type InsertDisaster = z.infer<typeof insertDisasterSchema>;
export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

// Add earthquake data table for comprehensive seismic tracking
export const earthquakeData = pgTable("earthquake_data", {
  id: serial("id").primaryKey(),
  magnitude: real("magnitude").notNull(),
  location: text("location").notNull(),
  depth: real("depth").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  source: text("source").default("USGS"),
});

// Add AI model metrics tracking with training session data
export const modelMetrics = pgTable("model_metrics", {
  id: serial("id").primaryKey(),
  modelType: text("model_type").notNull(), // 'pytorch', 'ollama', 'hybrid'
  accuracy: real("accuracy").notNull(),
  precision: real("precision").notNull(),
  recall: real("recall").notNull(),
  f1Score: real("f1_score"),
  totalPredictions: integer("total_predictions").default(0),
  correctPredictions: integer("correct_predictions").default(0),
  trainingDataCount: integer("training_data_count").default(0),
  trainingSessions: integer("training_sessions").default(0),
  lastTrainingDuration: integer("last_training_duration"), // in seconds
  modelVersion: text("model_version").default("1.0"),
  lastUpdated: timestamp("last_updated").notNull(),
});

// Add training session logs
export const trainingLogs = pgTable("training_logs", {
  id: serial("id").primaryKey(),
  modelType: text("model_type").notNull(),
  sessionId: text("session_id").notNull(),
  epoch: integer("epoch"),
  loss: real("loss"),
  accuracy: real("accuracy"),
  precision: real("precision"),
  recall: real("recall"),
  f1Score: real("f1_score"),
  dataPointsUsed: integer("data_points_used"),
  timestamp: timestamp("timestamp").notNull(),
});

// Add prediction reports table
export const predictionReports = pgTable("prediction_reports", {
  id: serial("id").primaryKey(),
  predictionId: integer("prediction_id").notNull().references(() => predictions.id),
  modelType: text("model_type").notNull(),
  inputFeatures: jsonb("input_features"), // Recent earthquake sequence data
  outputAnalysis: jsonb("output_analysis"), // Detailed prediction breakdown
  confidenceFactors: jsonb("confidence_factors"), // What contributed to confidence
  riskFactors: jsonb("risk_factors"), // Key risk indicators
  historicalComparison: jsonb("historical_comparison"), // Similar past events
  dataQuality: jsonb("data_quality"), // Quality metrics of input data
  timestamp: timestamp("timestamp").notNull(),
});

// Define relations
export const disastersRelations = relations(disasters, ({ many }) => ({
  relatedPredictions: many(predictions),
}));

export const predictionsRelations = relations(predictions, ({ one }) => ({
  relatedDisaster: one(disasters, {
    fields: [predictions.location],
    references: [disasters.location],
  }),
}));

export const earthquakeDataRelations = relations(earthquakeData, ({ many }) => ({
  predictions: many(predictions),
}));

// Export schemas for new tables
export const insertEarthquakeDataSchema = createInsertSchema(earthquakeData).omit({
  id: true,
});

export const insertModelMetricsSchema = createInsertSchema(modelMetrics).omit({
  id: true,
});

// Training metrics schema
export const trainingMetrics = pgTable("training_metrics", {
  id: serial("id").primaryKey(),
  modelType: text("model_type").notNull(), // 'pytorch' or 'ollama'
  accuracy: real("accuracy").default(0),
  precision: real("precision").default(0),
  recall: real("recall").default(0),
  confidence: real("confidence").default(0),
  trainingDataCount: integer("training_data_count").default(0),
  trainingSessions: integer("training_sessions").default(0),
  lastTrainedAt: timestamp("last_trained_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Training goals schema  
export const trainingGoals = pgTable("training_goals", {
  id: serial("id").primaryKey(),
  modelType: text("model_type").notNull(),
  targetAccuracy: real("target_accuracy").notNull(),
  targetDataPoints: integer("target_data_points").notNull(),
  maxSessions: integer("max_sessions").default(10),
  trainingInterval: text("training_interval").default('daily'),
  isEnabled: boolean("is_enabled").default(false),
  currentProgress: real("current_progress").default(0),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Training sessions log
export const trainingSessions = pgTable("training_sessions", {
  id: serial("id").primaryKey(),
  modelType: text("model_type").notNull(),
  sessionId: text("session_id").notNull().unique(),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  dataPointsProcessed: integer("data_points_processed").default(0),
  initialAccuracy: real("initial_accuracy").default(0),
  finalAccuracy: real("final_accuracy").default(0),
  improvementRate: real("improvement_rate").default(0),
  status: text("status").default('running'), // 'running', 'completed', 'failed'
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow()
});

export const newsArticles = pgTable("news_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content"),
  url: text("url").notNull(),
  source: text("source").notNull(),
  category: text("category").notNull().default("natural-disaster"),
  publishedAt: timestamp("published_at").notNull(),
  imageUrl: text("image_url"),
  relevanceScore: real("relevance_score").default(0),
  disasterType: text("disaster_type"),
  location: text("location"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertNewsArticleSchema = createInsertSchema(newsArticles).omit({
  id: true,
});

// Training schemas
export const insertTrainingMetricsSchema = createInsertSchema(trainingMetrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertTrainingGoalsSchema = createInsertSchema(trainingGoals).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertTrainingSessionSchema = createInsertSchema(trainingSessions).omit({
  id: true,
  createdAt: true
});

export type EarthquakeData = typeof earthquakeData.$inferSelect;
export type InsertEarthquakeData = z.infer<typeof insertEarthquakeDataSchema>;
export type ModelMetrics = typeof modelMetrics.$inferSelect;
export type InsertModelMetrics = z.infer<typeof insertModelMetricsSchema>;
export type NewsArticle = typeof newsArticles.$inferSelect;
export type InsertNewsArticle = z.infer<typeof insertNewsArticleSchema>;
export type TrainingMetrics = typeof trainingMetrics.$inferSelect;
export type InsertTrainingMetrics = z.infer<typeof insertTrainingMetricsSchema>;
export type TrainingGoals = typeof trainingGoals.$inferSelect;
export type InsertTrainingGoals = z.infer<typeof insertTrainingGoalsSchema>;
export type TrainingSession = typeof trainingSessions.$inferSelect;
export type InsertTrainingSession = z.infer<typeof insertTrainingSessionSchema>;
