import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const service = process.env.SUPABASE_SECRET_KEY;
  if (!url || !anon || !service) return null;
  return { url, anon, service };
}

async function getAuthenticatedUser(req: Request) {
  const env = getEnv();
  if (!env) return null;

  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;

  const authClient = createClient(env.url, env.anon);
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

function getAdminClient() {
  const env = getEnv();
  if (!env) return null;
  return createClient(env.url, env.service);
}

export async function GET(req: Request) {
  const user = await getAuthenticatedUser(req);
  const admin = getAdminClient();

  if (!user || !admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await admin
    .from('attempts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: 'Failed to load attempts' }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser(req);
  const admin = getAdminClient();

  if (!user || !admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { error } = await admin.from('attempts').insert({
    id: body.id,
    user_id: user.id,
    qid: body.qid,
    topic: body.topic,
    question: body.question,
    marks: body.marks,
    student_answer: body.student_answer,
    feedback: body.feedback,
    weak_topics: body.feedback?.confidence === 'revise' ? [body.topic] : []
  });

  if (error) {
    return NextResponse.json({ error: 'Failed to save attempt' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
