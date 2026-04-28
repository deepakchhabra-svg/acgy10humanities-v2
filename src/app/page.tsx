'use client';

import { useEffect, useMemo, useState } from 'react';
import { QUESTION_BANK, LEARN_PACK } from '@/lib/question-bank';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { Attempt, FeedbackResult } from '@/lib/types';
import { getSummary } from '@/lib/stats';
import { loadLocalAttempts, saveLocalAttempt } from '@/lib/storage';

type Tab = 'learn' | 'read' | 'practice' | 'review' | 'parent';

const AUTO = QUESTION_BANK.auto as any[];

export default function Home() {
  const [tab, setTab] = useState<Tab>('learn');
  const [userEmail, setUserEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState('');
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [busy, setBusy] = useState(false);

  const question = AUTO[idx % AUTO.length];
  const summary = useMemo(() => getSummary(attempts), [attempts]);

  useEffect(() => {
    const local = loadLocalAttempts();
    setAttempts(local);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setIsLoggedIn(true);
        setUserId(data.session.user.id);
        loadRemoteAttempts(data.session.user.id);
      }
    });
  }, []);

  async function loadRemoteAttempts(uid: string) {
    const res = await fetch(`/api/attempts?user_id=${uid}`, { method: 'GET' });
    if (!res.ok) return;
    const data = (await res.json()) as Attempt[];
    setAttempts(data);
  }

  async function login() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithPassword({ email: userEmail, password });
    if (!error) {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user.id ?? "";
      setIsLoggedIn(true);
      setUserId(uid);
      await loadRemoteAttempts(uid);
    }
  }

  async function checkAnswer() {
    setBusy(true);
    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.q,
          topic: question.topic,
          marks: question.marks,
          model_answer: question.model,
          marking_checks: question.checks,
          student_answer: answer
        })
      });
      const data = (await res.json()) as FeedbackResult;
      setFeedback(data);

      const attempt: Attempt & { user_id?: string } = {
        id: crypto.randomUUID(),
        user_id: userId,
        qid: question.id,
        topic: question.topic,
        question: question.q,
        marks: question.marks,
        student_answer: answer,
        feedback: data,
        created_at: new Date().toISOString()
      };

      if (isLoggedIn) {
        await fetch('/api/attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(attempt)
        });
      } else {
        saveLocalAttempt(attempt);
      }
      setAttempts((prev) => [attempt, ...prev].slice(0, 500));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="wrap">
      <div className="hero">
        <div>
          <h1>Year 10 Geography Exam Coach v47</h1>
          <div className="small">Learn. Read Q&amp;A. Practice. Review. Parent View.</div>
        </div>
        <div>{isLoggedIn ? 'Logged in' : 'Teacher-focus first'}</div>
      </div>

      <div className="card">
        <h2>Login</h2>
        <input placeholder="Email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn dark" onClick={login}>Login</button>
        <div className="small">If you stay logged out, progress is saved to localStorage on this device.</div>
      </div>

      <div className="nav">
        {(['learn', 'read', 'practice', 'review', 'parent'] as Tab[]).map((t) => (
          <button key={t} className={`btn ${tab === t ? 'dark' : ''}`} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {tab === 'learn' && (
        <div className="card">
          <h2>Learn</h2>
          <div className="grid g2">
            {(LEARN_PACK as any[]).map((item) => (
              <div className="neutral" key={item.topic}>
                <b>{item.topic}</b>
                <ul>{item.must.map((m: string) => <li key={m}>{m}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'read' && (
        <div className="card">
          <h2>Read Q&amp;A</h2>
          {AUTO.slice(0, 70).map((q) => (
            <div className="neutral" key={q.id}>
              <b>{q.topic}</b>
              <p>{q.q}</p>
              <p className="small">Model: {q.model}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'practice' && (
        <div className="card">
          <h2>Practice</h2>
          <div className="small">Question → Student types answer → Check → Feedback → Try again / Next.</div>
          <div className="neutral">
            <b>{question.topic} · {question.marks} marks</b>
            <p>{question.q}</p>
            <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type your answer here" />
            <button className="btn dark" onClick={checkAnswer} disabled={busy}>{busy ? 'Checking...' : 'Check'}</button>
            <button className="btn" onClick={() => { setAnswer(''); setFeedback(null); }}>Try again</button>
            <button className="btn" onClick={() => { setIdx((v) => v + 1); setAnswer(''); setFeedback(null); }}>Next</button>

            {feedback && (
              <div className={`feedback ${feedback.confidence === 'revise' ? 'bad' : ''}`}>
                <b>Score: {feedback.score}/{feedback.max_marks}</b>
                <div>You got:</div>
                <ul>{feedback.got.map((g) => <li key={g}>{g}</li>)}</ul>
                <div>Add this:</div>
                <ul>{feedback.add.map((a) => <li key={a}>{a}</li>)}</ul>
                <div><b>Better answer:</b> {feedback.better_answer}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'review' && (
        <div className="card">
          <h2>Review</h2>
          <p>Completed questions: <b>{summary.completedQuestions}</b></p>
          <p>Average score: <b>{summary.averageScore}%</b></p>
          <p>Weak topics: <b>{summary.weakTopics.join(', ') || 'None'}</b></p>
          <div className="grid g2">
            {summary.recentAttempts.map((a) => (
              <div className="neutral" key={a.id}>
                <b>{a.topic}</b>
                <div>{a.feedback.score}/{a.feedback.max_marks}</div>
                <div className="small">{new Date(a.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'parent' && (
        <div className="card">
          <h2>Parent View</h2>
          <p>Questions completed: <b>{summary.completedQuestions}</b></p>
          <p>Average score: <b>{summary.averageScore}%</b></p>
          <p>Weak topics: <b>{summary.weakTopics.join(', ') || 'None'}</b></p>
          <p>Readiness status: <b>{summary.readinessStatus}</b></p>
        </div>
      )}
    </main>
  );
}
