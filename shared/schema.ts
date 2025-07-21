import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
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
  predictedIntensity: real("predicted_intensity").notNull(),
  confidence: real("confidence").notNull(),
  timeframe: text("timeframe").notNull(),
  location: text("location"),
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
