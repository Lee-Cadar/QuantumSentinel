import { storage } from "./storage";
import type { TrainingMetrics, InsertTrainingMetrics, TrainingGoals, InsertTrainingGoals } from "@shared/schema";

export class TrainingPersistence {
  private static instance: TrainingPersistence;
  
  static getInstance(): TrainingPersistence {
    if (!TrainingPersistence.instance) {
      TrainingPersistence.instance = new TrainingPersistence();
    }
    return TrainingPersistence.instance;
  }

  // Load training metrics from database
  async loadModelMetrics(modelType: 'pytorch' | 'ollama'): Promise<TrainingMetrics | null> {
    try {
      const metrics = await storage.getTrainingMetrics(modelType);
      if (metrics) {
        console.log(`Loaded ${modelType} metrics from database:`, {
          accuracy: metrics.accuracy,
          dataCount: metrics.trainingDataCount,
          sessions: metrics.trainingSessions
        });
        return metrics;
      }
    } catch (error) {
      console.log(`No persisted metrics found for ${modelType}, starting fresh`);
    }
    return null;
  }

  // Save training metrics to database with real progress
  async saveModelMetrics(modelType: 'pytorch' | 'ollama', currentMetrics: any): Promise<TrainingMetrics> {
    try {
      const metricsToSave: Partial<InsertTrainingMetrics> = {
        accuracy: currentMetrics.accuracy || 0,
        precision: currentMetrics.precision || 0,
        recall: currentMetrics.recall || 0,
        confidence: currentMetrics.confidence || currentMetrics.accuracy || 0,
        trainingDataCount: currentMetrics.trainingDataCount || 0,
        trainingSessions: currentMetrics.trainingSessions || 0,
        lastTrainedAt: new Date()
      };

      const savedMetrics = await storage.updateTrainingMetrics(modelType, metricsToSave);
      
      console.log(`Saved ${modelType} metrics to database:`, {
        accuracy: savedMetrics.accuracy,
        dataCount: savedMetrics.trainingDataCount,
        sessions: savedMetrics.trainingSessions,
        improvement: `+${(savedMetrics.accuracy! - (currentMetrics.previousAccuracy || 0)).toFixed(1)}%`
      });
      
      return savedMetrics;
    } catch (error) {
      console.error(`Failed to save ${modelType} metrics:`, error);
      throw error;
    }
  }

  // Load training goals from database
  async loadTrainingGoals(modelType: 'pytorch' | 'ollama'): Promise<TrainingGoals | null> {
    try {
      const goals = await storage.getTrainingGoals(modelType);
      if (goals) {
        console.log(`Loaded ${modelType} training goals:`, {
          targetAccuracy: goals.targetAccuracy,
          targetDataPoints: goals.targetDataPoints,
          isEnabled: goals.isEnabled,
          progress: goals.currentProgress
        });
        return goals;
      }
    } catch (error) {
      console.log(`No training goals found for ${modelType}`);
    }
    return null;
  }

  // Save training goals to database
  async saveTrainingGoals(goals: InsertTrainingGoals): Promise<TrainingGoals> {
    try {
      const savedGoals = await storage.saveTrainingGoals(goals);
      console.log(`Saved training goals for ${goals.modelType}:`, {
        targetAccuracy: savedGoals.targetAccuracy,
        targetDataPoints: savedGoals.targetDataPoints,
        enabled: savedGoals.isEnabled
      });
      return savedGoals;
    } catch (error) {
      console.error(`Failed to save training goals for ${goals.modelType}:`, error);
      throw error;
    }
  }

  // Create training session log
  async createTrainingSession(modelType: 'pytorch' | 'ollama', initialAccuracy: number) {
    try {
      const sessionId = `${modelType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const session = await storage.createTrainingSession({
        modelType,
        sessionId,
        initialAccuracy,
        status: 'running'
      });
      
      console.log(`Started training session ${sessionId} for ${modelType}`);
      return session;
    } catch (error) {
      console.error(`Failed to create training session for ${modelType}:`, error);
      throw error;
    }
  }

  // Update training session with final results
  async completeTrainingSession(sessionId: string, finalAccuracy: number, dataPointsProcessed: number) {
    try {
      const improvementRate = finalAccuracy - (await this.getSessionInitialAccuracy(sessionId) || 0);
      
      await storage.updateTrainingSession(sessionId, {
        endTime: new Date(),
        finalAccuracy,
        dataPointsProcessed,
        improvementRate,
        status: 'completed'
      });
      
      console.log(`Completed training session ${sessionId}:`, {
        finalAccuracy,
        dataPointsProcessed,
        improvement: `+${improvementRate.toFixed(1)}%`
      });
    } catch (error) {
      console.error(`Failed to complete training session ${sessionId}:`, error);
    }
  }

  // Get session initial accuracy for improvement calculation
  private async getSessionInitialAccuracy(sessionId: string): Promise<number | null> {
    try {
      // This would need to be implemented in storage, for now return null
      return null;
    } catch (error) {
      return null;
    }
  }

  // Get training history for a model
  async getTrainingHistory(modelType: 'pytorch' | 'ollama', limit: number = 5) {
    try {
      const sessions = await storage.getTrainingSessions(modelType, limit);
      return sessions.map(session => ({
        sessionId: session.sessionId,
        startTime: session.startTime,
        endTime: session.endTime,
        initialAccuracy: session.initialAccuracy,
        finalAccuracy: session.finalAccuracy,
        improvementRate: session.improvementRate,
        dataPointsProcessed: session.dataPointsProcessed,
        status: session.status
      }));
    } catch (error) {
      console.error(`Failed to get training history for ${modelType}:`, error);
      return [];
    }
  }
}

// Export singleton instance
export const trainingPersistence = TrainingPersistence.getInstance();