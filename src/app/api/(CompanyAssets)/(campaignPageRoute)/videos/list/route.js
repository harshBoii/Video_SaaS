// // app/api/videos/list/route.js
// import prisma from "@/app/lib/prisma";
// import { NextResponse } from "next/server";
// import { verifyJWT } from "@/app/lib/auth";
// import { listVideosSchema, formatZodError } from "@/app/lib/validation";

// export async function GET(request) {
//   try {
//     // ✅ 1. AUTHENTICATE USER
//     const { employee: user, error: authError } = await verifyJWT(request);
//     if (authError) {
//       return NextResponse.json(
//         { success: false, error: authError },
//         { status: 401 }
//       );
//     }

//     // ✅ 2. PARSE AND VALIDATE QUERY PARAMS
//     const { searchParams } = new URL(request.url);
    
//     const queryObject = {
//       page: searchParams.get('page'),
//       limit: searchParams.get('limit'),
//       sortBy: searchParams.get('sortBy'),
//       sortOrder: searchParams.get('sortOrder'),
//       projectId: searchParams.get('projectId'),
//       userId: searchParams.get('userId'),
//       status: searchParams.get('status'),
//       search: searchParams.get('search'),
//       tags: searchParams.get('tags'),
//       startDate: searchParams.get('startDate'),
//       endDate: searchParams.get('endDate'),
//     };
    
//     // Remove null/undefined values
//     Object.keys(queryObject).forEach(key => {
//       if (queryObject[key] === null || queryObject[key] === undefined) {
//         delete queryObject[key];
//       }
//     });

//     const validation = listVideosSchema.safeParse(queryObject);

//     if (!validation.success) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: "Invalid query parameters",
//           details: formatZodError(validation.error),
//         },
//         { status: 400 }
//       );
//     }

//     const {
//       page,
//       limit,
//       sortBy,
//       sortOrder,
//       projectId,
//       userId,
//       status,
//       search,
//       tags,
//       startDate,
//       endDate,
//     } = validation.data;

//     // ✅ 3. BUILD WHERE CLAUSE
//     const where = {};

//     if (projectId) {
//       where.campaignId = projectId;
//     } else {
//       where.campaign = {
//         companyId: user.companyId,
//       };
//     }

//     if (userId) {
//       where.uploadedBy = userId;
//     }

//     if (status) {
//       where.status = status;
//     }

//     if (search) {
//       where.OR = [
//         { title: { contains: search, mode: "insensitive" } },
//         { filename: { contains: search, mode: "insensitive" } },
//         { description: { contains: search, mode: "insensitive" } },
//       ];
//     }

//     if (tags && tags.length > 0) {
//       where.tags = {
//         hasSome: tags,
//       };
//     }

//     if (startDate || endDate) {
//       where.createdAt = {};
//       if (startDate) where.createdAt.gte = new Date(startDate);
//       if (endDate) where.createdAt.lte = new Date(endDate);
//     }

//     // ✅ 4. BUILD ORDER BY
//     const orderBy = {};
//     if (sortBy) {
//       orderBy[sortBy] = sortOrder;
//     } else {
//       orderBy.createdAt = "desc";
//     }

//     // ✅ 5. PAGINATION
//     const skip = (page - 1) * limit;

//     // ✅ 6. EXECUTE QUERIES IN PARALLEL
//     const [videos, totalCount] = await Promise.all([
//       prisma.video.findMany({
//         where,
//         skip,
//         take: limit,
//         orderBy,
//         include: {
//           campaign: {
//             select: {
//               id: true,
//               name: true,
//               company: {
//                 select: {
//                   id: true,
//                   name: true,
//                 },
//               },
//             },
//           },
//           uploader: {
//             select: {
//               id: true,
//               firstName: true,
//               lastName: true,
//               email: true,
//             },
//           },
//           versions: {
//             where: {
//               isActive: true,
//             },
//             select: {
//               id: true,
//               version: true,
//               status: true,
//               streamId: true,
//               playbackUrl: true,
//               thumbnailUrl: true,
//               fileSize: true,
//             },
//             take: 1,
//           },
//           _count: {
//             select: {
//               versions: true,
//             },
//           },
//         },
//       }),
//       prisma.video.count({ where }),
//     ]);

//     // ✅ 7. CALCULATE STATISTICS
//     const stats = {
//       totalVideos: totalCount,
//       totalSize: videos.reduce((sum, v) => sum + Number(v.originalSize), 0),
//       statusBreakdown: {},
//     };

//     const statusCounts = await prisma.video.groupBy({
//       by: ["status"],
//       where: {
//         campaign: {
//           companyId: user.companyId,
//         },
//       },
//       _count: true,
//     });

//     statusCounts.forEach((stat) => {
//       stats.statusBreakdown[stat.status] = stat._count;
//     });

//     // ✅ 8. FORMAT RESPONSE - USE ACTIVE VERSION DATA
//     const formattedVideos = videos.map((video) => {
//       const activeVersion = video.versions[0]; // Get active version
      
//       // Use active version's data if available, fallback to main video data
//       const thumbnailUrl = activeVersion?.thumbnailUrl || video.thumbnailUrl;
//       const playbackUrl = activeVersion?.playbackUrl || video.playbackUrl;
//       const streamId = activeVersion?.streamId || video.streamId;
//       const versionStatus = activeVersion?.status || video.status;

//       return {
//         id: video.id,
//         title: video.title,
//         description: video.description,
//         filename: video.filename,
//         status: versionStatus, // Use active version status
//         duration: video.duration,
//         durationFormatted: formatDuration(video.duration),
//         resolution: video.resolution,
//         fps: video.fps,
//         codec: video.codec,
//         originalSize: Number(video.originalSize),
//         originalSizeFormatted: formatBytes(video.originalSize),
//         tags: video.tags,
//         streamId: streamId, // ✅ From active version
//         playbackUrl: playbackUrl, // ✅ From active version
//         thumbnailUrl: thumbnailUrl, // ✅ From active version
//         currentVersion: video.currentVersion, // ✅ Active version number
//         versionCount: video._count.versions, // ✅ Total version count
//         campaign: video.campaign,
//         uploader: video.uploader,
//         createdAt: video.createdAt,
//         updatedAt: video.updatedAt,
//       };
//     });

//     const totalPages = Math.ceil(totalCount / limit);

//     return NextResponse.json({
//       success: true,
//       data: formattedVideos,
//       stats: {
//         ...stats,
//         totalSizeFormatted: formatBytes(stats.totalSize),
//       },
//       pagination: {
//         page,
//         limit,
//         totalCount,
//         totalPages,
//         hasNextPage: page < totalPages,
//         hasPreviousPage: page > 1,
//       },
//     });
//   } catch (error) {
//     console.error("[LIST VIDEOS ERROR]", error);

//     return NextResponse.json(
//       {
//         success: false,
//         error: "Failed to list videos",
//         message: process.env.NODE_ENV === "development" ? error.message : "An unexpected error occurred",
//       },
//       { status: 500 }
//     );
//   }
// }

// // ============================================
// // HELPER FUNCTIONS
// // ============================================

// function formatBytes(bytes) {
//   if (bytes === 0 || bytes === 0n) return "0 Bytes";
  
//   const numBytes = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  
//   const k = 1024;
//   const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
//   const i = Math.floor(Math.log(numBytes) / Math.log(k));
  
//   return Math.round((numBytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
// }

// function formatDuration(seconds) {
//   if (!seconds || seconds === 0) return "0:00";
  
//   const hrs = Math.floor(seconds / 3600);
//   const mins = Math.floor((seconds % 3600) / 60);
//   const secs = Math.floor(seconds % 60);
  
//   if (hrs > 0) {
//     return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   }
  
//   return `${mins}:${secs.toString().padStart(2, '0')}`;
// }
