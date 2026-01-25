/**
 * Message Queue Service
 * Handles queuing messages when offline and sending them when connection is restored
 */

class MessageQueueService {
  constructor() {
    this.queue = [];
    this.retryAttempts = new Map();
    this.maxRetries = 5;
    this.loadQueue();
  }

  // Load queue from localStorage
  loadQueue() {
    try {
      const stored = localStorage.getItem('messageQueue');
      this.queue = stored ? JSON.parse(stored) : [];
      console.log(`📋 Loaded ${this.queue.length} queued messages`);
    } catch (error) {
      console.error('Error loading message queue:', error);
      this.queue = [];
    }
  }

  // Save queue to localStorage
  saveQueue() {
    try {
      localStorage.setItem('messageQueue', JSON.stringify(this.queue));
    } catch (error) {
      console.error('Error saving message queue:', error);
    }
  }

  // Add message to queue
  enqueue(message) {
    const queuedMessage = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...message,
      queuedAt: new Date().toISOString(),
      status: 'pending',
      retries: 0
    };

    this.queue.push(queuedMessage);
    this.saveQueue();

    console.log(`📝 Message queued:`, queuedMessage.id);
    return queuedMessage;
  }

  // Get all queued messages
  getAllQueued() {
    return [...this.queue];
  }

  // Get queued messages for a contact
  getQueuedByContact(contactId) {
    return this.queue.filter(msg => msg.contactId === contactId);
  }

  // Mark message as sent
  markAsSent(queuedId, serverMessageId) {
    const index = this.queue.findIndex(msg => msg.id === queuedId);
    if (index !== -1) {
      this.queue[index].status = 'sent';
      this.queue[index].serverMessageId = serverMessageId;
      this.queue[index].sentAt = new Date().toISOString();
      this.saveQueue();
      console.log(`✅ Message marked as sent: ${queuedId}`);
    }
  }

  // Mark message as failed
  markAsFailed(queuedId) {
    const index = this.queue.findIndex(msg => msg.id === queuedId);
    if (index !== -1) {
      this.queue[index].status = 'failed';
      this.queue[index].retries = (this.queue[index].retries || 0) + 1;
      this.saveQueue();
      console.log(`❌ Message marked as failed: ${queuedId} (attempt ${this.queue[index].retries})`);
    }
  }

  // Remove message from queue
  remove(queuedId) {
    const index = this.queue.findIndex(msg => msg.id === queuedId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.saveQueue();
      this.retryAttempts.delete(queuedId);
      console.log(`🗑️ Message removed from queue: ${queuedId}`);
    }
  }

  // Clear all queued messages
  clear() {
    const count = this.queue.length;
    this.queue = [];
    this.retryAttempts.clear();
    this.saveQueue();
    console.log(`🧹 Cleared ${count} messages from queue`);
  }

  // Get queue size
  getSize() {
    return this.queue.length;
  }

  // Check if should retry
  shouldRetry(queuedId) {
    const message = this.queue.find(msg => msg.id === queuedId);
    if (!message) return false;

    const attempts = this.retryAttempts.get(queuedId) || 0;
    return attempts < this.maxRetries;
  }

  // Increment retry count
  incrementRetry(queuedId) {
    const attempts = (this.retryAttempts.get(queuedId) || 0) + 1;
    this.retryAttempts.set(queuedId, attempts);
    return attempts;
  }
}

// Export singleton instance
export const messageQueueService = new MessageQueueService();

export default MessageQueueService;
