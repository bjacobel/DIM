import { CuratedRoll } from './curatedRoll';

function toCuratedRoll(bansheeTextLine: string): CuratedRoll | null {
  if (!bansheeTextLine || bansheeTextLine.length === 0) {
    return null;
  }

  const matchResults = bansheeTextLine.match(
    /https:\/\/banshee-44\.com\/\?weapon=(\d.+)&socketEntries=(.*)/
  );

  if (!matchResults || matchResults.length !== 3) {
    return null;
  }

  const itemHash = +matchResults[1];
  const recommendedPerks = matchResults[2].split(',').map((s) => +s);

  return {
    itemHash,
    recommendedPerks
  };
}

export function toCuratedRolls(bansheeText: string): CuratedRoll[] {
  const textArray = bansheeText.split('\n');

  return textArray.map(toCuratedRoll).filter((cr) => cr !== null) as CuratedRoll[];
}
