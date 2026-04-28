export type Confidence = 'ready' | 'almost' | 'revise';

export type FeedbackResult = {
  score: number;
  max_marks: number;
  got: string[];
  add: string[];
  better_answer: string;
  confidence: Confidence;
};

export type Attempt = {
  id: string;
  user_id?: string;
  qid: string;
  topic: string;
  question: string;
  marks: number;
  student_answer: string;
  feedback: FeedbackResult;
  created_at: string;
};
