import { Client } from '@upstash/qstash';

// Initialize QStash client
const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN,
});

// Topic names for different notification channels
export const TOPICS = {
  EMAIL: 'notifications-email',
  SLACK: 'notifications-slack',
  TEAMS: 'notifications-teams',
  DLQ: 'notifications-dlq',
};

/**
 * Publish notification to a specific topic
 */
export async function publishToTopic({ topic, payload, deduplicationId, retries = 3 }) {
  try {
    const result = await qstashClient.publishJSON({
      topic: topic,
      body: payload,
      retries: retries,
      deduplicationId: deduplicationId,
      // Optional: Add delay if needed
      // delay: 10, // seconds
    });

    console.log(`Published to topic ${topic}:`, result.messageId);

    return {
      success: true,
      messageId: result.messageId,
      topic: topic,
    };
  } catch (error) {
    console.error(`Failed to publish to topic ${topic}:`, error);
    throw new Error(`QStash publish failed: ${error.message}`);
  }
}

/**
 * Publish notification to multiple topics (parallel)
 */
export async function publishToMultipleTopics(messages) {
  try {
    const publishPromises = messages.map(({ topic, payload, deduplicationId, retries }) =>
      publishToTopic({ topic, payload, deduplicationId, retries })
    );

    const results = await Promise.allSettled(publishPromises);

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return {
      success: failed === 0,
      successful,
      failed,
      total: messages.length,
      results: results,
    };
  } catch (error) {
    console.error('Batch publish error:', error);
    throw new Error(`Batch publish failed: ${error.message}`);
  }
}

/**
 * Publish directly to an endpoint (bypass topics)
 * Useful for one-off or urgent notifications
 */
export async function publishToEndpoint({ url, payload, retries = 3, headers = {} }) {
  try {
    const result = await qstashClient.publishJSON({
      url: url,
      body: payload,
      retries: retries,
      headers: headers,
    });

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error('Direct endpoint publish error:', error);
    throw new Error(`Endpoint publish failed: ${error.message}`);
  }
}

/**
 * Create or update a topic
 */
export async function createTopic(topicName, endpoints) {
  try {
    // Topics in QStash are created by adding endpoints to them
    // This is typically done via the Upstash dashboard or API
    console.log(`Topic ${topicName} should be configured with endpoints:`, endpoints);
    
    // For now, this is a placeholder - topics are managed via dashboard
    return {
      success: true,
      topic: topicName,
      message: 'Topics are managed via Upstash QStash dashboard',
    };
  } catch (error) {
    console.error('Topic creation error:', error);
    throw new Error(`Topic creation failed: ${error.message}`);
  }
}

/**
 * Get message status by ID
 */
export async function getMessageStatus(messageId) {
  try {
    // Note: This requires QStash API endpoint
    const response = await fetch(`https://qstash.upstash.io/v2/messages/${messageId}`, {
      headers: {
        Authorization: `Bearer ${process.env.QSTASH_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch message status: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching message status:', error);
    throw new Error(`Failed to get message status: ${error.message}`);
  }
}

/**
 * Verify QStash signature (use in worker routes)
 */
export async function verifySignature(signature, currentSignature, body) {
  try {
    const { Receiver } = await import('@upstash/qstash');
    
    const receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
    });

    const isValid = await receiver.verify({
      signature: signature,
      body: body,
    });

    return isValid;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Generate deduplication ID for notification
 */
export function generateDeduplicationId(companyId, notificationType, resourceId = null) {
  const timestamp = Math.floor(Date.now() / 1000 / 60); // Group by minute
  const parts = [companyId, notificationType, timestamp];
  
  if (resourceId) {
    parts.push(resourceId);
  }
  
  return parts.join('-');
}

export default qstashClient;
