// import { NextResponse } from "next/server";
// import jwt from "jsonwebtoken";

// // Protect these routes
// export const config = {
//   matcher: ["/superadmin/:path*", "/admin/:path*", "/employee/:path*"],
// };

// export function middleware(req) {
//   const token = req.cookies.get("token")?.value;

//   // If no token, redirect to login
//   if (!token) {
//     return NextResponse.redirect(new URL("/login", req.url));
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     const pathname = req.nextUrl.pathname;

//     // SuperAdmin area
//     if (pathname.startsWith("/superadmin") && decoded.role !== "SuperAdmin") {
//       return NextResponse.redirect(new URL("/employee", req.url));
//     }

//     // Admin area (allow Admin + SuperAdmin)
//     if (pathname.startsWith("/admin") && !["Admin", "SuperAdmin"].includes(decoded.role)) {
//       return NextResponse.redirect(new URL("/employee", req.url));
//     }

//     // Employee pages → everyone logged in is allowed
//     return NextResponse.next();
//   } catch (err) {
//     console.error("JWT verification failed:", err.message);
//     return NextResponse.redirect(new URL("/login", req.url));
//   }
// }
