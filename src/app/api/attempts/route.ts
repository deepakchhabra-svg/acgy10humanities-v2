import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function serverClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(req: Request) {
  const supabase = serverClient();
  if (!supabase) return NextResponse.json([]);
  const userId = new URL(req.url).searchParams.get('user_id');
  if (!userId) return NextResponse.json([]);
  const { data } = await supabase
    .from('attempts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const supabase = serverClient();
  if (!supabase) return NextResponse.json({ ok: false }, { status: 500 });
  const body = await req.json();
  await supabase.from('attempts').insert({
    id: body.id,
    user_id: body.user_id,
    qid: body.qid,
    topic: body.topic,
    question: body.question,
    marks: body.marks,
    student_answer: body.student_answer,
    feedback: body.feedback,
    weak_topics: body.feedback?.confidence === 'revise' ? [body.topic] : []
  });
  return NextResponse.json({ ok: true });
}
