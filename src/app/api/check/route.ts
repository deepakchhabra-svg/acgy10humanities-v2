import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const STUDENT_ANSWER_MAX = 4000;
const QUESTION_MAX = 1500;
const MODEL_ANSWER_MAX = 2000;

function cap(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.length > max ? value.slice(0, max) : value;
}

function fallbackResponse(maxMarks: number) {
  return NextResponse.json({
    score: 0,
    max_marks: maxMarks,
    got: ['Nice effort.'],
    add: ['Try to include one clear case-study detail.'],
    better_answer: 'Add one cause and one effect, then link to development.',
    confidence: 'revise',
    fallback: true
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const maxMarks = Number(body.marks) || 0;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallbackResponse(maxMarks);
  }

  const question = cap(body.question, QUESTION_MAX);
  const modelAnswer = cap(body.model_answer, MODEL_ANSWER_MAX);
  const studentAnswer = cap(body.student_answer, STUDENT_ANSWER_MAX);

  try {
    const client = new OpenAI({ apiKey });
    const prompt = `You are marking a Year 10 geography response. Keep it friendly and simple. Return strict JSON only with keys: score,max_marks,got,add,better_answer,confidence.
Question: ${question}
Topic: ${body.topic}
Marks: ${maxMarks}
Model answer: ${modelAnswer}
Marking checks: ${JSON.stringify(body.marking_checks)}
Student answer: ${studentAnswer}`;

    const result = await client.responses.create({
      model: 'gpt-4.1-mini',
      input: prompt,
      text: {
        format: {
          type: 'json_schema',
          name: 'marking_feedback',
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              score: { type: 'number' },
              max_marks: { type: 'number' },
              got: { type: 'array', items: { type: 'string' } },
              add: { type: 'array', items: { type: 'string' } },
              better_answer: { type: 'string' },
              confidence: { type: 'string', enum: ['ready', 'almost', 'revise'] }
            },
            required: ['score', 'max_marks', 'got', 'add', 'better_answer', 'confidence']
          }
        }
      }
    });

    const parsed = JSON.parse(result.output_text);
    const parsedMax = Number(parsed.max_marks) || maxMarks;
    const rawScore = Number(parsed.score) || 0;
    const clampedScore = Math.max(0, Math.min(rawScore, parsedMax));

    return NextResponse.json({
      ...parsed,
      score: clampedScore,
      max_marks: parsedMax,
      fallback: false
    });
  } catch {
    return fallbackResponse(maxMarks);
  }
}
