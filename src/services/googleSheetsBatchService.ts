import { supabase } from '@/lib/supabase';
import { batchMLOptimizationService } from './batchMLOptimizationService';

interface QueuedLog {
  userId: string;
  spreadsheetId: string;
  userEmail: string;
  query: string;
  category: string;
  response: string;
  timestamp: string;
  retries: number;
}

class GoogleSheetsBatchService {
  private queue: QueuedLog[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private BATCH_SIZE = 10;
  private FLUSH_INTERVAL = 5000; // 5 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second
  private lastOptimizationCheck = Date.now();
  private readonly OPTIMIZATION_CHECK_INTERVAL = 60000; // 1 minute

  async addToQueue(
    userId: string,
    spreadsheetId: string,
    userEmail: string,
    query: string,
    category: string,
    response: string
  ): Promise<void> {
    // Check if we should optimize configuration
    if (Date.now() - this.lastOptimizationCheck > this.OPTIMIZATION_CHECK_INTERVAL) {
      await this.optimizeConfiguration();
      this.lastOptimizationCheck = Date.now();
    }

    this.queue.push({
      userId,
      spreadsheetId,
      userEmail,
      query,
      category,
      response,
      timestamp: new Date().toISOString(),
      retries: 0
    });

    // Auto-flush if batch size reached
    if (this.queue.length >= this.BATCH_SIZE) {
      await this.flush();
    } else {
      this.scheduleFlush();
    }
  }

  private async optimizeConfiguration(): Promise<void> {
    try {
      const recommendation = await batchMLOptimizationService.getOptimalConfiguration();
      
      if (recommendation.confidence > 0.7) {
        this.BATCH_SIZE = recommendation.batchSize;
        this.FLUSH_INTERVAL = recommendation.flushInterval;
        console.log('Updated batch configuration:', recommendation);
      }
    } catch (error) {
      console.warn('Failed to optimize configuration:', error);
    }
  }


  private scheduleFlush(): void {
    if (this.flushTimer) return;
    
    this.flushTimer = setTimeout(() => {
      this.flush();
    }, this.FLUSH_INTERVAL);
  }

  async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.queue.length === 0) return;

    const batch = [...this.queue];
    this.queue = [];

    await this.processBatch(batch);
  }

  private async processBatch(batch: QueuedLog[]): Promise<void> {
    const startTime = Date.now();
    let success = false;

    try {
      const { error } = await supabase.functions.invoke('google-sheets-logger', {
        body: {
          action: 'batch_log',
          logs: batch.map(log => ({
            spreadsheetId: log.spreadsheetId,
            userEmail: log.userEmail,
            query: log.query,
            category: log.category,
            response: log.response,
            timestamp: log.timestamp
          }))
        }
      });

      if (error) throw error;
      success = true;

      // Update query counts
      const updates = new Map<string, number>();
      batch.forEach(log => {
        updates.set(log.userId, (updates.get(log.userId) || 0) + 1);
      });

      for (const [userId, count] of updates) {
        await supabase.rpc('increment_query_count', { 
          user_id: userId, 
          increment: count 
        }).catch(console.warn);
      }

      // Record usage pattern for ML
      const now = new Date();
      await batchMLOptimizationService.recordUsagePattern({
        batchSize: batch.length,
        flushInterval: this.FLUSH_INTERVAL,
        queueWaitTime: Date.now() - startTime,
        apiCallsSaved: Math.max(0, batch.length - 1),
        successRate: 100,
        hourOfDay: now.getHours(),
        dayOfWeek: now.getDay(),
        totalLogsProcessed: batch.length
      });

    } catch (error) {
      console.error('Batch processing failed:', error);
      
      // Record failed pattern
      const now = new Date();
      await batchMLOptimizationService.recordUsagePattern({
        batchSize: batch.length,
        flushInterval: this.FLUSH_INTERVAL,
        queueWaitTime: Date.now() - startTime,
        apiCallsSaved: 0,
        successRate: 0,
        hourOfDay: now.getHours(),
        dayOfWeek: now.getDay(),
        totalLogsProcessed: 0
      }).catch(console.warn);

      await this.retryBatch(batch);
    }
  }


  private async retryBatch(batch: QueuedLog[]): Promise<void> {
    const retryable = batch.filter(log => log.retries < this.MAX_RETRIES);
    
    if (retryable.length === 0) {
      console.warn(`Dropped ${batch.length} logs after max retries`);
      return;
    }

    retryable.forEach(log => log.retries++);
    
    await new Promise(resolve => 
      setTimeout(resolve, this.RETRY_DELAY * Math.pow(2, retryable[0].retries))
    );

    await this.processBatch(retryable);
  }

  getQueueSize(): number {
    return this.queue.length;
  }
}

export const batchService = new GoogleSheetsBatchService();
