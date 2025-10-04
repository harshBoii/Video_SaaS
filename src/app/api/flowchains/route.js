import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import * as jose from "jose";

/** ✅ Helper: Verify JWT token */
async function verifyToken(request) {
  const token = request.cookies.get("token")?.value;
  if (!token) throw new Error("Unauthorized");

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const { payload } = await jose.jwtVerify(token, secret);

  if (!payload.companyId) throw new Error("Invalid token — company not found");
  return payload;
}

/** ✅ GET — Fetch all flowchains for the company */
export async function GET(request) {
  try {
    const payload = await verifyToken(request);

    const flowchains = await prisma.flowChain.findMany({
      where: { companyId: payload.companyId },
      include: {
        steps: {
          include: {
            role: true,
            nextSteps: {
              include: {
                toStep: true,
              },
            },
            previousSteps: {
              include: {
                fromStep: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(flowchains);
  } catch (err) {
    console.error("❌ Error fetching flowchains:", err);
    return NextResponse.json(
      { error: "Unauthorized or failed to fetch flowchains" },
      { status: 401 }
    );
  }
}

/** ✅ POST — Create a new flowchain with steps and optional transitions */
export async function POST(request) {
  try {
    const payload = await verifyToken(request);
    const { name, description, steps } = await request.json();

    if (!name || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json(
        { error: "Flowchain name and steps are required" },
        { status: 400 }
      );
    }

    // 1️⃣ Create FlowChain
    const newFlowChain = await prisma.flowChain.create({
      data: {
        name,
        description: description || null,
        companyId: payload.companyId,
      },
    });

    // 2️⃣ Create Steps
    const createdSteps = [];
    for (const step of steps) {
      const newStep = await prisma.flowStep.create({
        data: {
          name: step.name,
          description: step.description || null,
          roleId: step.roleId || null,
          chainId: newFlowChain.id,
        },
      });
      createdSteps.push(newStep);
    }

    // 3️⃣ Create Transitions (if provided)
    if (steps.some((s) => s.transitions)) {
      for (const step of steps) {
        const fromStep = createdSteps.find((s) => s.name === step.name);
        if (!fromStep || !step.transitions) continue;

        for (const transition of step.transitions) {
          const toStep = createdSteps.find((s) => s.name === transition.toStepName);
          if (!toStep) continue;

          await prisma.flowTransition.create({
            data: {
              fromStepId: fromStep.id,
              toStepId: toStep.id,
              condition: transition.condition || "SUCCESS",
            },
          });
        }
      }
    }

    // 4️⃣ Return full chain with relations
    const fullFlowChain = await prisma.flowChain.findUnique({
      where: { id: newFlowChain.id },
      include: {
        steps: {
          include: {
            nextSteps: { include: { toStep: true } },
            previousSteps: { include: { fromStep: true } },
          },
        },
      },
    });

    return NextResponse.json(fullFlowChain);
  } catch (err) {
    console.error("❌ Error creating flowchain:", err);
    return NextResponse.json({ error: "Failed to create flowchain" }, { status: 500 });
  }
}
