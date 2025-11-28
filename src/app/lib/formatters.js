export default function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  
  // ✅ FIX: Convert BigInt to Number safely
  const value = Number(bytes); 
  
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(value) / Math.log(k));
  
  return parseFloat((value / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
