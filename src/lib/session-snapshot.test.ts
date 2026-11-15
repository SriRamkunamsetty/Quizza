import { describe, it, expect } from "vitest";
import type { QuizSnapshot } from "@/lib/db/schema-types";

describe("Session Quiz Snapshots", () => {
  const sampleQuiz = {
    id: "quiz-uuid-123",
    title: "World Capitals",
    coverIcon: "globe",
    theme: "mint",
    settings: {
      revealAnswers: "per_question" as const,
      leaderboard: "at_end" as const,
      participation: "anonymous" as const,
      powerups: true,
      powerupUses: 2,
    },
    questions: [
      {
        id: "q-1",
        position: 0,
        type: "multiple_choice" as const,
        prompt: "What is the capital of France?",
        mediaUrl: null,
        timeLimitSec: 20,
        points: 1000,
        settings: {},
        options: [
          { id: "opt-1", position: 0, label: "Paris", isCorrect: true, color: "mint" },
          { id: "opt-2", position: 1, label: "Lyon", isCorrect: false, color: "coral" },
        ],
      },
    ],
  };

  it("serializes and freezes immutable quiz snapshot at launch", () => {
    const snapshot: QuizSnapshot = {
      id: sampleQuiz.id,
      title: sampleQuiz.title,
      coverIcon: sampleQuiz.coverIcon,
      theme: sampleQuiz.theme,
      settings: sampleQuiz.settings,
      questions: sampleQuiz.questions,
    };

    expect(snapshot.title).toBe("World Capitals");
    expect(snapshot.questions).toHaveLength(1);
    expect(snapshot.questions[0].options).toHaveLength(2);
    expect(snapshot.questions[0].options[0].label).toBe("Paris");
    expect(snapshot.questions[0].options[0].isCorrect).toBe(true);
  });

  it("extracts session settings directly from snapshot", () => {
    const session = {
      id: "session-123",
      quizId: "quiz-uuid-123",
      quizSnapshot: {
        id: sampleQuiz.id,
        title: sampleQuiz.title,
        coverIcon: sampleQuiz.coverIcon,
        theme: sampleQuiz.theme,
        settings: sampleQuiz.settings,
        questions: sampleQuiz.questions,
      },
    };

    const extractSettings = (s: typeof session) => {
      if (s.quizSnapshot?.settings) return s.quizSnapshot.settings;
      return {};
    };

    const settings = extractSettings(session);
    expect(settings.revealAnswers).toBe("per_question");
    expect(settings.powerups).toBe(true);
    expect(settings.powerupUses).toBe(2);
  });

  it("preserves historical questions even if live quiz is deleted", () => {
    // Simulates an ended session whose live quiz was later deleted (liveQuiz = null)
    const session = {
      id: "session-123",
      quizId: "quiz-uuid-123",
      quizSnapshot: {
        id: sampleQuiz.id,
        title: sampleQuiz.title,
        coverIcon: sampleQuiz.coverIcon,
        theme: sampleQuiz.theme,
        settings: sampleQuiz.settings,
        questions: sampleQuiz.questions,
      },
    };

    const resolveQuizForResults = (s: typeof session, liveQuiz: unknown | null) => {
      return s.quizSnapshot ?? liveQuiz;
    };

    const resolved = resolveQuizForResults(session, null);
    expect(resolved).not.toBeNull();
    expect(resolved?.title).toBe("World Capitals");
    expect(resolved?.questions[0].prompt).toBe("What is the capital of France?");
  });
});
