import { describe, expect, it } from "vitest";
import { computeStandings, rewardProgress, standingFor, type StandingInput } from "../position";

const t = (daysAgo: number) => new Date(Date.UTC(2026, 0, 31) - daysAgo * 86_400_000).toISOString();

function member(id: string, tier: "waitlist" | "reserved", daysAgo: number, refs = 0): StandingInput {
  return { id, tier, createdAt: t(daysAgo), confirmedReferrals: refs };
}

describe("computeStandings", () => {
  it("orders by signup time when nobody has referrals", () => {
    const s = computeStandings([member("c", "waitlist", 1), member("a", "waitlist", 3), member("b", "waitlist", 2)]);
    expect(s.get("a")?.position).toBe(1);
    expect(s.get("b")?.position).toBe(2);
    expect(s.get("c")?.position).toBe(3);
    expect(s.get("a")?.total).toBe(3);
  });

  it("puts deposit holders above free members regardless of signup order or referrals", () => {
    const s = computeStandings([
      member("early-free", "waitlist", 10, 50),
      member("late-paid", "reserved", 1),
    ]);
    expect(s.get("late-paid")?.position).toBe(1);
    expect(s.get("early-free")?.position).toBe(2);
  });

  it("subtracts 5 per referral for waitlist members", () => {
    const list = [
      member("m1", "waitlist", 10),
      member("m2", "waitlist", 9),
      member("m3", "waitlist", 8),
      member("m4", "waitlist", 7),
      member("m5", "waitlist", 6),
      member("m6", "waitlist", 5),
      member("m7", "waitlist", 4, 1), // index 7 - 5 = 2 -> ties m2 (score 2); m2 signed up earlier so keeps 2
    ];
    const s = computeStandings(list);
    expect(s.get("m7")?.signupIndex).toBe(7);
    expect(s.get("m7")?.boost).toBe(5);
    expect(s.get("m7")?.position).toBe(3);
    expect(s.get("m2")?.position).toBe(2);
    expect(s.get("m3")?.position).toBe(4);
  });

  it("subtracts 10 per referral for deposit holders", () => {
    const list = Array.from({ length: 12 }, (_, i) => member(`p${i + 1}`, "reserved", 20 - i));
    list.push(member("boosted", "reserved", 1, 1)); // index 13 - 10 = 3
    const s = computeStandings(list);
    expect(s.get("boosted")?.boost).toBe(10);
    expect(s.get("boosted")?.position).toBe(4); // p3 has score 3 and is earlier; boosted ties then loses the tiebreak
    expect(s.get("p4")?.position).toBe(5);
  });

  it("never produces duplicate positions and covers 1..n", () => {
    const list: StandingInput[] = [];
    for (let i = 0; i < 200; i++) {
      list.push(member(`x${i}`, i % 3 === 0 ? "reserved" : "waitlist", 200 - i, i % 7 === 0 ? i % 5 : 0));
    }
    const s = computeStandings(list);
    const positions = [...s.values()].map((v) => v.position).sort((a, b) => a - b);
    expect(positions).toEqual(Array.from({ length: 200 }, (_, i) => i + 1));
  });

  it("standingFor returns null for unknown members", () => {
    expect(standingFor([member("a", "waitlist", 1)], "zzz")).toBeNull();
  });
});

describe("rewardProgress", () => {
  it("reports the next tier and progress toward it", () => {
    const p0 = rewardProgress(0);
    expect(p0.unlocked).toHaveLength(0);
    expect(p0.next?.referrals).toBe(1);
    expect(p0.remaining).toBe(1);

    const p2 = rewardProgress(2);
    expect(p2.unlocked.map((u) => u.referrals)).toEqual([1]);
    expect(p2.next?.referrals).toBe(3);
    expect(p2.progress).toBeCloseTo(0.5);

    const p10 = rewardProgress(10);
    expect(p10.next).toBeNull();
    expect(p10.progress).toBe(1);
    expect(p10.unlocked).toHaveLength(4);
  });
});
