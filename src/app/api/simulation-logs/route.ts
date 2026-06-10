import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { faultType, relayActivated, cbStatus, eventLog, duration } = body;

    const result = await db.simulationLog.create({
      data: {
        faultType,
        relayActivated,
        cbStatus,
        eventLog: JSON.stringify(eventLog),
        duration,
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save simulation log' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const logs = await db.simulationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch simulation logs' }, { status: 500 });
  }
}
