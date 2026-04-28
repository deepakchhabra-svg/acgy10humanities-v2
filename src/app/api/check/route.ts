import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const body = await req.json();
  const maxMarks = Number(body.marks) || 0;

  try {
    const prompt = `You are marking a Year 10 geography response. Keep it friendly and simple. Return strict JSON only with keys: score,max_marks,got,add,better_answer,confidence.
Question: ${body.question}
Topic: ${body.topic}
Marks: ${maxMarks}
Model answer: ${body.model_answer}
Marking checks: ${JSON.stringify(body.marking_checks)}
Student answer: ${body.student_answer}`;

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
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({
      score: 0,
      max_marks: maxMarks,
      got: ['Nice effort.'],
      add: ['Try to include one clear case-study detail.'],
      better_answer: 'Add one cause and one effect, then link to development.',
      confidence: 'revise'
    });
  }
}
