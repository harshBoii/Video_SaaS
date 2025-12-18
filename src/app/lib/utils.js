

export function generateId() {
  // Generate UUIDv4 and remove hyphens for compact 32-char ID
  return crypto.randomUUID().replace(/-/g, '').slice(0, 24);

}

export function getDashboardRoute(user){
  console.log("user is :" , user)
    if (!user) return '/';
    
    if (user.isAdmin || user.is_admin) return '/admin';
    
    if (user.role?.name === 'Solo_Creator') return '/solo';
    
    return '/employee';
  };

