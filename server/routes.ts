import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDisasterSchema, insertIncidentSchema, insertPredictionSchema, insertAlertSchema } from "@shared/schema";
import { ollamaEarthquakePredictionAI } from "./ollama-prediction";
import { pyTorchEarthquakePrediction } from "./pytorch-prediction";

// Enhanced hybrid prediction system
import { EnhancedHybridPrediction } from './enhanced-hybrid-prediction';
const enhancedHybridSystem = new EnhancedHybridPrediction();
console.log('Enhanced hybrid prediction system initialized successfully');
import { disasterNewsService } from "./news-service";
import { z } from "zod";

const routeOptimizationSchema = z.object({
  startLat: z.number(),
  startLon: z.number(),
  endLat: z.number(),
  endLon: z.number(),
  avoidHighRisk: z.boolean().optional(),
  minimizeDistance: z.boolean().optional(),
  useMajorRoads: z.boolean().optional(),
});

// Simple ML prediction function
function generatePrediction(disasterType: string, historicalData: any[]): { intensity: number; confidence: number } {
  // Basic prediction using recent disaster intensity trends
  if (historicalData.length === 0) {
    return { intensity: 0, confidence: 0 };
  }

  const recentData = historicalData.slice(-10); // Last 10 events
  const avgIntensity = recentData.reduce((sum, d) => sum + d.intensity, 0) / recentData.length;
  
  // Simple trend analysis
  const trend = recentData.length > 1 ? 
    (recentData[recentData.length - 1].intensity - recentData[0].intensity) / recentData.length : 0;
  
  const predictedIntensity = Math.max(0, avgIntensity + trend);
  const confidence = Math.min(95, 70 + (recentData.length * 2)); // More data = higher confidence
  
  return { intensity: predictedIntensity, confidence };
}

// Route optimization algorithm
function calculateOptimalRoute(params: z.infer<typeof routeOptimizationSchema>) {
  const { startLat, startLon, endLat, endLon, avoidHighRisk, minimizeDistance, useMajorRoads } = params;
  
  // Simple distance calculation using Haversine formula
  const distance = calculateDistance(startLat, startLon, endLat, endLon);
  
  // Basic routing logic - in real implementation would use proper routing API
  const routes = [
    {
      name: "Route A (Recommended)",
      description: `Optimal path from coordinates to destination`,
      distance: distance.toFixed(1),
      time: Math.round(distance / 0.8), // Assume average speed
      risk: avoidHighRisk ? "Low" : "Medium",
      safety: "Safest"
    },
    {
      name: "Route B (Alternative)", 
      description: `Alternative path avoiding high-risk zones`,
      distance: (distance * 1.2).toFixed(1),
      time: Math.round((distance * 1.2) / 1.0),
      risk: "Medium",
      safety: "Fastest"
    }
  ];

  return routes;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Fetch real earthquake data from USGS
async function fetchUSGSData() {
  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startDate}&endtime=${endDate}&minmagnitude=3.0&limit=50`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`USGS API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    const disasters = data.features.map((feature: any) => ({
      disasterType: "earthquake",
      location: feature.properties.place || "Unknown location",
      latitude: feature.geometry.coordinates[1],
      longitude: feature.geometry.coordinates[0],
      intensity: feature.properties.mag,
      description: feature.properties.title,
      source: "USGS",
      verified: true
    }));

    // Store new disasters
    for (const disaster of disasters) {
      await storage.createDisaster(disaster);
    }

    return disasters;
  } catch (error) {
    console.error("Error fetching USGS data:", error);
    return [];
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Disasters
  app.get("/api/disasters", async (req, res) => {
    try {
      // Get both disasters and earthquake data for comprehensive view
      const disasters = await storage.getDisasters();
      const earthquakeData = await storage.getEarthquakeData();
      
      // Convert earthquake data to disaster format for visualization
      const earthquakeDisasters = earthquakeData.slice(0, 50).map(eq => ({
        id: eq.id || 0,
        disasterType: 'earthquake' as const,
        intensity: eq.magnitude,
        location: eq.location,
        latitude: eq.latitude,
        longitude: eq.longitude,
        timestamp: eq.timestamp,
        verified: true,
        source: eq.source || 'USGS'
      }));
      
      const combinedData = [...disasters, ...earthquakeDisasters];
      res.json(combinedData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch disasters" });
    }
  });

  app.get("/api/disasters/:type", async (req, res) => {
    try {
      const { type } = req.params;
      
      if (type === 'earthquake') {
        // For earthquakes, return real USGS data from database
        const earthquakeData = await storage.getEarthquakeData();
        const earthquakeDisasters = earthquakeData.slice(0, 100).map(eq => ({
          id: eq.id || 0,
          disasterType: 'earthquake' as const,
          intensity: eq.magnitude,
          location: eq.location,
          latitude: eq.latitude,
          longitude: eq.longitude,
          timestamp: eq.timestamp,
          verified: true,
          source: eq.source || 'USGS'
        }));
        res.json(earthquakeDisasters);
      } else {
        // For other disaster types, use regular disasters table
        const disasters = await storage.getDisastersByType(type);
        res.json(disasters);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch disasters by type" });
    }
  });

  app.post("/api/disasters/refresh", async (req, res) => {
    try {
      const newDisasters = await fetchUSGSData();
      res.json({ message: `Refreshed ${newDisasters.length} new disasters` });
    } catch (error) {
      res.status(500).json({ error: "Failed to refresh disaster data" });
    }
  });

  // Incidents
  app.get("/api/incidents", async (req, res) => {
    try {
      const incidents = await storage.getIncidents();
      res.json(incidents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch incidents" });
    }
  });

  app.get("/api/incidents/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const incidents = await storage.getRecentIncidents(limit);
      res.json(incidents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent incidents" });
    }
  });

  app.post("/api/incidents", async (req, res) => {
    try {
      const validatedData = insertIncidentSchema.parse(req.body);
      
      // Simple NLP verification - check for disaster keywords
      const disasterKeywords = ['earthquake', 'fire', 'flood', 'landslide', 'tornado', 'hurricane'];
      const hasDisasterKeyword = disasterKeywords.some(keyword => 
        validatedData.description.toLowerCase().includes(keyword)
      );
      
      const incident = await storage.createIncident(validatedData);
      
      // Auto-verify if contains disaster keywords
      if (hasDisasterKeyword) {
        await storage.updateIncidentVerification(incident.id, true, "verified");
      }
      
      res.json(incident);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid incident data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create incident" });
      }
    }
  });

  // Predictions
  app.get("/api/predictions", async (req, res) => {
    try {
      const predictions = await storage.getPredictions();
      res.json(predictions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch predictions" });
    }
  });

  app.post("/api/predictions/generate", async (req, res) => {
    try {
      const { disasterType, region, predictionType = 'hybrid' } = req.body;
      
      if (disasterType === 'earthquake') {
        if (predictionType === 'hybrid') {
          // Use enhanced hybrid prediction system
          console.log('Generating enhanced hybrid prediction...');
          if (enhancedHybridSystem) {
            const hybridReport = await enhancedHybridSystem.generateHybridPrediction(region);
            res.json(hybridReport);
          } else {
            // Fallback to original hybrid
            const hybridPrediction = await pyTorchEarthquakePrediction.generateHybridPrediction(region);
            res.json(hybridPrediction);
          }
        } else if (predictionType === 'pytorch') {
          // Use PyTorch-only prediction
          console.log('Generating PyTorch-only earthquake prediction...');
          const earthquakeData = await storage.getRecentEarthquakeData(10);
          const sequenceData = earthquakeData.map(eq => eq.magnitude);
          
          if (sequenceData.length >= 10) {
            const magnitudePrediction = await pyTorchEarthquakePrediction.predictMagnitude(sequenceData);
            const prediction = await storage.createPrediction({
              disasterType: 'earthquake',
              predictedMagnitude: magnitudePrediction.expectedMagnitude,
              confidence: magnitudePrediction.confidence * 100,
              timeframe: '24-72 hours',
              location: region || 'Regional area',
              reasoning: `PyTorch LSTM prediction: ${magnitudePrediction.riskLevel} risk, magnitude ${magnitudePrediction.expectedMagnitude.toFixed(1)}`,
              riskLevel: magnitudePrediction.riskLevel,
              keyFactors: { model: 'PyTorch LSTM', confidence: magnitudePrediction.confidence },
              recommendedActions: ['Monitor seismic activity', 'Review emergency plans']
            });
            res.json(prediction);
          } else {
            res.json({ message: "Insufficient earthquake sequence data for PyTorch prediction" });
          }
        } else {
          // Use Ollama AI prediction for earthquakes (original)
          console.log('Generating Ollama AI earthquake prediction...');
          const aiPrediction = await ollamaEarthquakePredictionAI.generatePrediction(region);
          
          const prediction = await storage.createPrediction({
            disasterType: 'earthquake',
            predictedIntensity: aiPrediction.predictedMagnitude,
            confidence: aiPrediction.confidence,
            timeframe: aiPrediction.timeframe,
            location: aiPrediction.location
          });
          
          res.json({
            ...prediction,
            reasoning: aiPrediction.reasoning,
            riskLevel: aiPrediction.riskLevel,
            keyFactors: aiPrediction.keyFactors,
            recommendedActions: aiPrediction.recommendedActions
          });
        }
      } else {
        // Fallback to statistical prediction for other disaster types
        const historicalData = await storage.getDisastersByType(disasterType);
        const { intensity, confidence } = generatePrediction(disasterType, historicalData);
        
        if (intensity > 0) {
          const prediction = await storage.createPrediction({
            disasterType,
            predictedIntensity: intensity,
            confidence,
            timeframe: "24 hours",
            location: "Regional area"
          });
          
          res.json(prediction);
        } else {
          res.json({ message: "Insufficient data for prediction" });
        }
      }
    } catch (error) {
      console.error('Prediction generation error:', error);
      res.status(500).json({ error: "Failed to generate prediction", details: error.message });
    }
  });

  // Enhanced AI Model metrics endpoint
  app.get("/api/predictions/model-metrics", async (req, res) => {
    try {
      const { model = 'ollama' } = req.query;
      
      // Always use enhanced hybrid system if available
      if (enhancedHybridSystem) {
        const metrics = enhancedHybridSystem.getModelMetrics(model as 'pytorch' | 'ollama');
        
        // If metrics exist, return them; otherwise fall back to original
        if (metrics && (metrics.accuracy > 0 || metrics.trainingDataCount > 0)) {
          // Convert to expected format for UI
          const formattedMetrics = {
            accuracy: metrics.accuracy || 0,
            precision: metrics.precision || 0,
            recall: metrics.recall || 0,
            confidence: metrics.accuracy || 0, // Use accuracy as confidence for Ollama
            trainingDataCount: metrics.trainingDataCount || 0,
            trainingSessions: metrics.trainingSessions || 0
          };
          res.json(formattedMetrics);
          return;
        }
      }
      
      // Fallback to original metrics
      if (model === 'pytorch') {
        const metrics = pyTorchEarthquakePrediction.getModelMetrics();
        res.json(metrics);
      } else {
        const metrics = ollamaEarthquakePredictionAI.getModelMetrics();
        res.json(metrics);
      }
    } catch (error) {
      console.error('Metrics fetch error:', error);
      res.status(500).json({ error: "Failed to fetch model metrics" });
    }
  });

  // Enhanced model training endpoint
  app.post("/api/predictions/train", async (req, res) => {
    try {
      const { model = 'pytorch' } = req.body;
      console.log(`Training ${model} model...`);
      
      if (enhancedHybridSystem && (model === 'pytorch' || model === 'ollama')) {
        const trainingStatus = await enhancedHybridSystem.trainModel(model);
        res.json({
          message: `${model.toUpperCase()} model training completed successfully`,
          status: trainingStatus,
          dataPoints: trainingStatus.totalDataPoints,
          finalAccuracy: trainingStatus.currentAccuracy
        });
      } else if (model === 'pytorch') {
        const trainingResults = await pyTorchEarthquakePrediction.trainModel();
        res.json({
          message: 'PyTorch model training completed',
          metrics: trainingResults
        });
      } else {
        console.log('Fetching new earthquake data for Ollama training...');
        const earthquakeData = await ollamaEarthquakePredictionAI.fetchMultiSourceEarthquakeData();
        
        await ollamaEarthquakePredictionAI.storeTrainingData(earthquakeData);
        await ollamaEarthquakePredictionAI.evaluatePredictionAccuracy(earthquakeData);
        
        res.json({ 
          message: `Model trained with ${earthquakeData.length} earthquake records`,
          dataPoints: earthquakeData.length,
          sources: ['USGS', 'EMSC', 'Historical'],
          metrics: ollamaEarthquakePredictionAI.getModelMetrics()
        });
      }
    } catch (error) {
      console.error('Model training error:', error);
      res.status(500).json({ error: "Failed to train model", details: error.message });
    }
  });

  // Add training status endpoint
  app.get("/api/predictions/training-status/:model", async (req, res) => {
    try {
      const { model } = req.params;
      if (enhancedHybridSystem && (model === 'pytorch' || model === 'ollama')) {
        const status = enhancedHybridSystem.getTrainingStatus(model as 'pytorch' | 'ollama');
        res.json(status || { isTraining: false, progress: 0 });
      } else {
        res.json({ isTraining: false, progress: 0 });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to get training status" });
    }
  });

  // Alerts
  app.get("/api/alerts", async (req, res) => {
    try {
      const alerts = await storage.getActiveAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.post("/api/alerts", async (req, res) => {
    try {
      const validatedData = insertAlertSchema.parse(req.body);
      const alert = await storage.createAlert(validatedData);
      res.json(alert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid alert data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create alert" });
      }
    }
  });

  app.put("/api/alerts/:id/dismiss", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.dismissAlert(id);
      res.json({ message: "Alert dismissed" });
    } catch (error) {
      res.status(500).json({ error: "Failed to dismiss alert" });
    }
  });

  // Route optimization
  app.post("/api/routes/optimize", async (req, res) => {
    try {
      const validatedData = routeOptimizationSchema.parse(req.body);
      const routes = calculateOptimalRoute(validatedData);
      res.json(routes);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid route parameters", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to calculate routes" });
      }
    }
  });

  // Dashboard metrics
  app.get("/api/metrics", async (req, res) => {
    try {
      const disasters = await storage.getDisasters();
      const incidents = await storage.getIncidents();
      const alerts = await storage.getActiveAlerts();
      
      const metrics = {
        activeIncidents: alerts.length,
        highRiskZones: disasters.filter(d => d.intensity > 6.0).length,
        responseTeams: 156, // Mock value
        accuracy: 94.2 // Mock ML accuracy
      };
      
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  // News endpoints
  app.get("/api/news", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const articles = await storage.getNewsArticles(limit);
      res.json(articles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch news articles" });
    }
  });

  app.get("/api/news/:disasterType", async (req, res) => {
    try {
      const { disasterType } = req.params;
      const articles = await storage.getNewsArticlesByType(disasterType);
      res.json(articles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch news articles by type" });
    }
  });

  app.post("/api/news/refresh", async (req, res) => {
    try {
      console.log('Refreshing natural disaster news...');
      const result = await disasterNewsService.refreshNews();
      
      res.json({
        message: `Refreshed ${result.count} new disaster news articles`,
        count: result.count,
        sources: ['ReliefWeb', 'GDACS'],
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('News refresh error:', error);
      res.status(500).json({ error: "Failed to refresh news articles" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
