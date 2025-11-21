import type { ParsedMusic } from './excelParser';

export interface DeduplicationResult {
  unique: ParsedMusic[];
  duplicatesRemoved: number;
  totalOriginal: number;
  duplicateGroups: Map<string, ParsedMusic[]>;
}

export function deduplicateMusicData(data: ParsedMusic[]): DeduplicationResult {
  const musicMap = new Map<string, ParsedMusic[]>();

  data.forEach(music => {
    const key = `${music.titulo.toLowerCase().trim()}|${(music.artista || '').toLowerCase().trim()}`;

    if (!musicMap.has(key)) {
      musicMap.set(key, []);
    }
    musicMap.get(key)!.push(music);
  });

  const unique: ParsedMusic[] = [];

  musicMap.forEach((group, key) => {
    if (group.length === 1) {
      unique.push(group[0]);
    } else {
      const best = selectBestVersion(group);
      unique.push(best);
    }
  });

  return {
    unique,
    duplicatesRemoved: data.length - unique.length,
    totalOriginal: data.length,
    duplicateGroups: new Map(
      Array.from(musicMap.entries()).filter(([_, group]) => group.length > 1)
    )
  };
}

function selectBestVersion(versions: ParsedMusic[]): ParsedMusic {
  return versions.reduce((best, current) => {
    const bestScore = getCompletenessScore(best);
    const currentScore = getCompletenessScore(current);
    return currentScore > bestScore ? current : best;
  });
}

function getCompletenessScore(music: ParsedMusic): number {
  let score = 0;
  if (music.compositor) score += music.compositor.length;
  if (music.ano) score += music.ano.length * 2;
  if (music.artista) score += music.artista.length;
  return score;
}
