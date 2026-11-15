import { describe, expect, it } from "vitest";
import {
  applyPowerup,
  enabledPowerups,
  planAttackSettlements,
  powerupsLeft,
  selectFiftyFiftyOptionIds,
  type AttackAnswer,
} from "./powerups";

describe("powerup scoring", () => {
  it("doubles earned points without awarding points for a wrong answer", () => {
    expect(applyPowerup(750, 1000, true, "double")).toBe(1500);
    expect(applyPowerup(0, 1000, false, "double")).toBe(0);
  });
  it("gives a safety net one third on a miss and keeps shields defensive", () => {
    expect(applyPowerup(0, 1000, false, "safety_net")).toBe(333);
    expect(applyPowerup(800, 1000, true, "safety_net")).toBe(800);
    expect(applyPowerup(0, 1000, false, "shield")).toBe(0);
    expect(applyPowerup(500, 1000, true, "fifty_fifty")).toBe(500);
  });
  it("excludes live-only powers from scheduled play while keeping 50:50", () => {
    expect(enabledPowerups({ powerups: true }, "scheduled")).toEqual([
      "double",
      "safety_net",
      "fifty_fifty",
    ]);
  });
  it("uses one shared charge pool across all powers", () => {
    expect(powerupsLeft(2, ["shield"])).toBe(1);
    expect(powerupsLeft(2, ["shield", "double"])).toBe(0);
  });
  it("settles attacks in a fixed order, with shields and no negative scores", () => {
    const time = new Date();
    const rows: AttackAnswer[] = [
      { id: "a1", participantId: "attacker1", powerup: "attack" as const, powerupTargetId: "victim", isCorrect: false, points: 0, createdAt: time },
      { id: "a2", participantId: "attacker2", powerup: "attack" as const, powerupTargetId: "victim", isCorrect: false, points: 0, createdAt: time },
      { id: "v", participantId: "victim", powerup: null, powerupTargetId: null, isCorrect: true, points: 100, createdAt: time },
    ];
    const result = planAttackSettlements(rows, [
      { id: "attacker1", score: 0 }, { id: "attacker2", score: 0 }, { id: "victim", score: 100 },
    ], 100);
    expect(result.outcomes.map((o) => o.stolen)).toEqual([100, 0]);
    expect(result.scores.get("victim")).toBe(0);
    rows[2].powerup = "shield";
    const blocked = planAttackSettlements(rows, [
      { id: "attacker1", score: 0 }, { id: "attacker2", score: 0 }, { id: "victim", score: 100 },
    ], 100);
    expect(blocked.outcomes.every((o) => o.blocked && o.stolen === 0)).toBe(true);
  });
  it("takes a third from the target's existing balance on a miss, capped at zero", () => {
    const rows: AttackAnswer[] = [
      { id: "a", participantId: "attacker", powerup: "attack", powerupTargetId: "victim", isCorrect: true, points: 100, createdAt: new Date() },
      { id: "v", participantId: "victim", powerup: null, powerupTargetId: null, isCorrect: false, points: 0, createdAt: new Date() },
    ];
    const result = planAttackSettlements(rows, [
      { id: "attacker", score: 100 }, { id: "victim", score: 20 },
    ], 100);
    expect(result.outcomes[0].stolen).toBe(20);
    expect(result.scores.get("victim")).toBe(0);
    expect(result.scores.get("attacker")).toBe(120);
  });

  describe("selectFiftyFiftyOptionIds", () => {
    const fourOptions = [
      { id: "opt-1", isCorrect: false },
      { id: "opt-2", isCorrect: true },
      { id: "opt-3", isCorrect: false },
      { id: "opt-4", isCorrect: false },
    ];

    it("eliminates exactly two incorrect options", () => {
      const eliminated = selectFiftyFiftyOptionIds(fourOptions, "player-1");
      expect(eliminated).toHaveLength(2);
      expect(eliminated).not.toContain("opt-2"); // Never eliminates the correct answer
      expect(eliminated.every((id) => ["opt-1", "opt-3", "opt-4"].includes(id))).toBe(true);
    });

    it("is deterministic for identical seedKey", () => {
      const run1 = selectFiftyFiftyOptionIds(fourOptions, "player-test-seed");
      const run2 = selectFiftyFiftyOptionIds(fourOptions, "player-test-seed");
      expect(run1).toEqual(run2);
    });

    it("returns empty array for questions with <= 2 options", () => {
      const twoOptions = [
        { id: "t", isCorrect: true },
        { id: "f", isCorrect: false },
      ];
      expect(selectFiftyFiftyOptionIds(twoOptions, "player-1")).toEqual([]);
    });
  });
});
