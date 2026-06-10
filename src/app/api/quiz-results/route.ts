import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { score, totalQuestions, percentage, category, answers } = body;

    const result = await db.quizResult.create({
      data: {
        score,
        totalQuestions,
        percentage,
        category,
        answers: JSON.stringify(answers),
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save quiz result' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const results = await db.quizResult.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch quiz results' }, { status: 500 });
  }
}
