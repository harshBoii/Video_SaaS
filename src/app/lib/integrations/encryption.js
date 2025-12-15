import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Must be 32 bytes (64 hex chars)

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
}

/**
 * Encrypt sensitive data (bot tokens, webhook URLs, etc.)
 */
export function encrypt(text) {
  if (!text) return null;
  
  try {
    // Generate random IV (initialization vector)
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get auth tag
    const authTag = cipher.getAuthTag();
    
    // Combine IV + authTag + encrypted data
    const combined = iv.toString('hex') + authTag.toString('hex') + encrypted;
    
    return combined;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedData) {
  if (!encryptedData) return null;
  
  try {
    // Extract IV (first 32 hex chars = 16 bytes)
    const iv = Buffer.from(encryptedData.slice(0, 32), 'hex');
    
    // Extract auth tag (next 32 hex chars = 16 bytes)
    const authTag = Buffer.from(encryptedData.slice(32, 64), 'hex');
    
    // Extract encrypted text (remaining chars)
    const encrypted = encryptedData.slice(64);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );
    
    // Set auth tag
    decipher.setAuthTag(authTag);
    
    // Decrypt the text
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data - data may be corrupted or key is wrong');
  }
}

/**
 * Hash data (one-way, for verification purposes)
 */
export function hash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Generate a secure random encryption key (run this once to generate your ENCRYPTION_KEY)
 */
export function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}
