import prisma from "@/app/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

    const roles = await prisma.role.findMany({
      where: companyId ? { companyId } : {},
      select: {
        id: true,
        name: true,
        description: true,
        companyId: true,
      },
      orderBy: { name: "asc" },
    });

    return new Response(JSON.stringify({ success: true, data: roles }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Roles API Error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Failed to fetch roles" }),
      { status: 500 }
    );
  }
}
