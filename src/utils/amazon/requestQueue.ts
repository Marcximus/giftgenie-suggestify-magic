interface QueuedRequest<T> {
  id: string;
  execute: () => Promise<T>;
  priority?: number;
  timestamp: number;
  result?: T;
  error?: any;
}

class RequestQueue {
  private queue: QueuedRequest<any>[] = [];
  private processing = false;
  private concurrentRequests = 0;
  private readonly maxConcurrent: number;
  private readonly processDelay: number;

  constructor(maxConcurrent = 4, processDelay = 250) {
    this.maxConcurrent = maxConcurrent;
    this.processDelay = processDelay;
  }

  async add<T>(request: () => Promise<T>, priority = 0): Promise<T> {
    const id = Math.random().toString(36).substring(7);
    
    const queuedRequest: QueuedRequest<T> = {
      id,
      execute: request,
      priority,
      timestamp: Date.now()
    };

    this.queue.push(queuedRequest);
    this.queue.sort((a, b) => b.priority - a.priority);
    
    if (!this.processing) {
      this.processQueue();
    }

    return new Promise((resolve, reject) => {
      const checkResult = setInterval(() => {
        const index = this.queue.findIndex(req => req.id === id);
        if (index === -1) {
          clearInterval(checkResult);
          resolve(queuedRequest.result!);
        }
      }, 100);

      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(checkResult);
        const index = this.queue.findIndex(req => req.id === id);
        if (index !== -1) {
          this.queue.splice(index, 1);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  private async processQueue() {
    this.processing = true;

    while (this.queue.length > 0 && this.concurrentRequests < this.maxConcurrent) {
      const request = this.queue.shift();
      if (!request) continue;

      this.concurrentRequests++;

      try {
        const result = await request.execute();
        request.result = result;
      } catch (error) {
        console.error(`Error processing request ${request.id}:`, error);
        request.error = error;
      } finally {
        this.concurrentRequests--;
        await new Promise(resolve => setTimeout(resolve, this.processDelay));
      }
    }

    if (this.queue.length === 0) {
      this.processing = false;
    } else {
      setTimeout(() => this.processQueue(), this.processDelay);
    }
  }

  clear() {
    this.queue = [];
    this.processing = false;
    this.concurrentRequests = 0;
  }

  get length() {
    return this.queue.length;
  }

  get active() {
    return this.concurrentRequests;
  }
}

export const amazonRequestQueue = new RequestQueue(
  4, // Max concurrent requests
  250 // Delay between requests
);