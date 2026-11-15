import { describe, it, expect } from "vitest";

describe("Participant Review & Drilldown", () => {
  it("calculates accuracy percentage and avg speed accurately", () => {
    const calculateStats = (
      answers: Array<{ isCorrect: boolean; responseMs?: number | null }>,
    ) => {
      let correctCount = 0;
      let totalResponseMs = 0;
      let responseCount = 0;

      for (const a of answers) {
        if (a.isCorrect) correctCount++;
        if (a.responseMs != null) {
          totalResponseMs += a.responseMs;
          responseCount++;
        }
      }

      const totalAnswered = answers.length;
      const accuracyPct =
        totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
      const avgResponseMs =
        responseCount > 0 ? Math.round(totalResponseMs / responseCount) : 0;

      return { totalAnswered, correctCount, accuracyPct, avgResponseMs };
    };

    const stats1 = calculateStats([
      { isCorrect: true, responseMs: 1200 },
      { isCorrect: false, responseMs: 3400 },
      { isCorrect: true, responseMs: 2000 },
    ]);

    expect(stats1.totalAnswered).toBe(3);
    expect(stats1.correctCount).toBe(2);
    expect(stats1.accuracyPct).toBe(67);
    expect(stats1.avgResponseMs).toBe(2200);

    const statsEmpty = calculateStats([]);
    expect(statsEmpty.totalAnswered).toBe(0);
    expect(statsEmpty.accuracyPct).toBe(0);
    expect(statsEmpty.avgResponseMs).toBe(0);
  });

  it("enforces scorecard authorization policy", () => {
    const authorizeReview = (
      session: { hostToken: string },
      participant: { clientToken: string },
      auth: { hostToken?: string | null; clientToken?: string | null },
    ) => {
      const isHost = Boolean(auth.hostToken && auth.hostToken === session.hostToken);
      const isSelf = Boolean(auth.clientToken && auth.clientToken === participant.clientToken);
      if (!isHost && !isSelf) {
        throw new Error("403: forbidden");
      }
      return { isHost, isSelf };
    };

    const session = { hostToken: "host-secret-key" };
    const participant = { clientToken: "player-token-abc" };

    // Host authorized
    expect(authorizeReview(session, participant, { hostToken: "host-secret-key" })).toEqual({
      isHost: true,
      isSelf: false,
    });

    // Participant authorized
    expect(authorizeReview(session, participant, { clientToken: "player-token-abc" })).toEqual({
      isHost: false,
      isSelf: true,
    });

    // Another player forbidden
    expect(() =>
      authorizeReview(session, participant, { clientToken: "other-player" }),
    ).toThrow("403: forbidden");

    // Anonymous forbidden
    expect(() => authorizeReview(session, participant, {})).toThrow("403: forbidden");
  });

  it("masks unrevealed answers for participants while showing to host", () => {
    const maskAnswer = (
      showAnswers: boolean,
      item: { isCorrect: boolean; correctAnswer: string; points: number },
    ) => {
      return {
        isCorrect: showAnswers ? item.isCorrect : null,
        correctAnswer: showAnswers ? item.correctAnswer : null,
        pointsAwarded: showAnswers ? item.points : null,
      };
    };

    const data = { isCorrect: true, correctAnswer: "Option A", points: 100 };

    // Host or revealed session sees answer
    expect(maskAnswer(true, data)).toEqual({
      isCorrect: true,
      correctAnswer: "Option A",
      pointsAwarded: 100,
    });

    // Unrevealed participant view hides correctness and answer
    expect(maskAnswer(false, data)).toEqual({
      isCorrect: null,
      correctAnswer: null,
      pointsAwarded: null,
    });
  });

  it("formats CSV row with powerup metadata", () => {
    const formatRow = (r: {
      nickname: string;
      score: number;
      answer: string;
      correct: boolean;
      powerup?: string | null;
    }) => {
      return [
        r.nickname,
        String(r.score),
        r.answer,
        r.correct ? "yes" : "no",
        r.powerup ?? "",
      ].join(",");
    };

    const row = formatRow({
      nickname: "Alice",
      score: 500,
      answer: "Paris",
      correct: true,
      powerup: "double",
    });

    expect(row).toBe("Alice,500,Paris,yes,double");
  });
});
