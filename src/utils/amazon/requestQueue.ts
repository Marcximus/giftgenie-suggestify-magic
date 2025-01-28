interface QueuedRequest<T> {
  id: string;
  execute: () => Promise<T>;
  priority?: number;
  timestamp: number;
  result?: T;
  error?: Error;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

class RequestQueue {
  private queue: QueuedRequest<any>[] = [];
  private processing = false;
  private maxConcurrent = 4;
  private currentProcessing = 0;

  async add<T>(
    execute: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    const request: QueuedRequest<T> = {
      id: Math.random().toString(36).substring(7),
      execute,
      priority,
      timestamp: Date.now(),
      status: 'pending'
    };

    this.queue.push(request);
    this.queue.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    if (!this.processing) {
      this.processQueue();
    }

    return new Promise<T>((resolve, reject) => {
      const checkResult = setInterval(() => {
        const queuedRequest = this.queue.find(req => req.id === request.id);
        
        if (!queuedRequest) {
          clearInterval(checkResult);
          if (request.error) {
            reject(request.error);
          } else if (request.result !== undefined) {
            resolve(request.result);
          }
          return;
        }

        if (queuedRequest.status === 'completed' && queuedRequest.result !== undefined) {
          clearInterval(checkResult);
          resolve(queuedRequest.result);
        } else if (queuedRequest.status === 'error' && queuedRequest.error) {
          clearInterval(checkResult);
          reject(queuedRequest.error);
        }
      }, 100);
    });
  }

  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0 && this.currentProcessing < this.maxConcurrent) {
      const request = this.queue[0];
      this.queue.shift();
      this.currentProcessing++;

      try {
        request.status = 'processing';
        request.result = await request.execute();
        request.status = 'completed';
      } catch (error) {
        request.error = error instanceof Error ? error : new Error(String(error));
        request.status = 'error';
      } finally {
        this.currentProcessing--;
      }

      // Process next request if available
      if (this.queue.length > 0 && this.currentProcessing < this.maxConcurrent) {
        continue;
      }
    }

    this.processing = false;
  }

  clear() {
    this.queue = [];
    this.processing = false;
    this.currentProcessing = 0;
  }
}

export const amazonRequestQueue = new RequestQueue();