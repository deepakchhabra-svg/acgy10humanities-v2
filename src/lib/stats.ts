import { Attempt } from './types';
import { CORE_TOPICS } from './question-bank';

export function getSummary(attempts: Attempt[]) {
  const completedQuestions = attempts.length;
  const totalScore = attempts.reduce((sum, a) => sum + a.feedback.score, 0);
  const totalMax = attempts.reduce((sum, a) => sum + a.feedback.max_marks, 0);
  const averageScore = totalMax ? Math.round((totalScore / totalMax) * 100) : 0;

  const byTopic = CORE_TOPICS.map((topic) => {
    const rows = attempts.filter((a) => a.topic === topic);
    const s = rows.reduce((sum, a) => sum + a.feedback.score, 0);
    const m = rows.reduce((sum, a) => sum + a.feedback.max_marks, 0);
    return {
      topic,
      count: rows.length,
      avg: m ? Math.round((s / m) * 100) : 0
    };
  });

  const weakTopics = byTopic.filter((t) => t.count === 0 || t.avg < 75).map((t) => t.topic);
  const readinessStatus = averageScore >= 75 && completedQuestions >= 20 ? 'ready' : averageScore >= 60 ? 'almost' : 'revise';

  return {
    completedQuestions,
    averageScore,
    weakTopics,
    readinessStatus,
    recentAttempts: attempts.slice(0, 8),
    byTopic
  };
}
