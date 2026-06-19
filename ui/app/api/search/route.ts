import { NextResponse } from 'next/server';
import { semanticSearch } from 'service';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { query, limit, filters } = body;
    const startTime = Date.now();
    const results = await semanticSearch(query, filters, limit);
    const queryTime = Date.now() - startTime;
    return NextResponse.json({ results, total: results.length, queryTime });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
