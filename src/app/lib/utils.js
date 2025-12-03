

export function generateId() {
  // Generate UUIDv4 and remove hyphens for compact 32-char ID
  return crypto.randomUUID().replace(/-/g, '').slice(0, 24);

}