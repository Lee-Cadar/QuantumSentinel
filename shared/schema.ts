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

// Add AI model metrics tracking
export const modelMetrics = pgTable("model_metrics", {
  id: serial("id").primaryKey(),
  accuracy: real("accuracy").notNull(),
  precision: real("precision").notNull(),
  recall: real("recall").notNull(),
  totalPredictions: integer("total_predictions").default(0),
  lastUpdated: timestamp("last_updated").notNull(),
  modelType: text("model_type").default("ollama"),
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

export type EarthquakeData = typeof earthquakeData.$inferSelect;
export type InsertEarthquakeData = z.infer<typeof insertEarthquakeDataSchema>;
export type ModelMetrics = typeof modelMetrics.$inferSelect;
export type InsertModelMetrics = z.infer<typeof insertModelMetricsSchema>;
