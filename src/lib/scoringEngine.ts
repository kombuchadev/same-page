import type { AnswerCluster, RevealedAnswer } from '@/src/types/game';

export function normalizeAnswer(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[-_]/g, ' ')       // hyphens/underscores to spaces
    .replace(/[^a-z0-9 ]/g, '')  // remove punctuation
    .replace(/\s+/g, ' ')        // collapse whitespace
    .trim();
}

export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,     // deletion
        dp[i][j - 1] + 1,     // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

function getFuzzyThreshold(answerLength: number): number {
  // Scale threshold by answer length to avoid false merges on short answers
  return Math.min(2, Math.floor(answerLength / 3));
}

export function clusterAnswers(
  answers: Record<string, string> // playerId -> raw answer
): AnswerCluster[] {
  const entries = Object.entries(answers);
  if (entries.length === 0) return [];

  // Step 1: Normalize all answers
  const normalized = entries.map(([playerId, raw]) => ({
    playerId,
    raw,
    norm: normalizeAnswer(raw),
  }));

  // Step 2: Group by exact normalized match
  const groups = new Map<string, typeof normalized>();
  for (const entry of normalized) {
    const existing = groups.get(entry.norm);
    if (existing) {
      existing.push(entry);
    } else {
      groups.set(entry.norm, [entry]);
    }
  }

  // Step 3: Fuzzy merge - merge small groups into nearby larger groups
  const clusterLabels = Array.from(groups.keys());
  const merged = new Set<string>();

  for (const label of clusterLabels) {
    if (merged.has(label)) continue;
    const group = groups.get(label)!;
    if (group.length > 1) continue; // only try to merge singletons

    const threshold = getFuzzyThreshold(label.length);
    if (threshold === 0) continue; // too short for fuzzy matching

    let bestMatch: string | null = null;
    let bestDist = Infinity;

    for (const otherLabel of clusterLabels) {
      if (otherLabel === label || merged.has(otherLabel)) continue;
      const dist = levenshteinDistance(label, otherLabel);
      if (dist <= threshold && dist < bestDist) {
        bestDist = dist;
        bestMatch = otherLabel;
      }
    }

    if (bestMatch) {
      const targetGroup = groups.get(bestMatch)!;
      targetGroup.push(...group);
      merged.add(label);
    }
  }

  // Step 4: Build clusters
  const clusters: AnswerCluster[] = [];
  for (const [label, group] of groups) {
    if (merged.has(label)) continue;

    const answersMap: Record<string, string> = {};
    const playerIds: string[] = [];
    for (const entry of group) {
      answersMap[entry.playerId] = entry.raw;
      playerIds.push(entry.playerId);
    }

    clusters.push({
      label,
      playerIds,
      answers: answersMap,
      pointsEach: playerIds.length > 1 ? 1 : 0,
    });
  }

  return clusters;
}

export function scoreRound(
  answers: Record<string, string> // playerId -> raw answer
): {
  clusters: AnswerCluster[];
  revealed: Record<string, RevealedAnswer>;
  scoreDeltas: Record<string, number>;
} {
  const clusters = clusterAnswers(answers);

  const revealed: Record<string, RevealedAnswer> = {};
  const scoreDeltas: Record<string, number> = {};

  for (const cluster of clusters) {
    for (const playerId of cluster.playerIds) {
      revealed[playerId] = {
        answer: cluster.answers[playerId],
        normalizedAnswer: normalizeAnswer(cluster.answers[playerId]),
        pointsAwarded: cluster.pointsEach,
        clusterLabel: cluster.label,
      };
      scoreDeltas[playerId] = cluster.pointsEach;
    }
  }

  return { clusters, revealed, scoreDeltas };
}
