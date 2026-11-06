
/**
 * MillePlay Dice Game Engine
 *
 * Rules:
 * - Each player has two six-sided dice.
 * - The higher die is placed first.
 * - 1-1 is MILLE and beats every other combination.
 * - The highest score wins.
 * - Equal highest scores result in a tie.
 *
 * This file calculates scores only.
 * The backend will generate official dice rolls.
 */

export type DiceRoll = {
  die1: number;
  die2: number;
};

export type DiceScore = {
  isMille: boolean;
  value: number;
  label: string;
};

export type PlayerRoll = {
  playerId: string;
  playerName: string;
  dice: DiceRoll;
};

export type ScoredPlayerRoll = PlayerRoll & {
  score: DiceScore;
};

/**
 * Checks that a die contains a valid six-sided value.
 */
function validateDie(value: number): void {
  if (!Number.isInteger(value) || value < 1 || value > 6) {
    throw new Error(`Invalid die value: ${value}. Dice must be between 1 and 6.`);
  }
}

/**
 * Calculates the score of two dice.
 *
 * Examples:
 * 1 and 1 = MILLE
 * 6 and 2 = 62
 * 6 and 3 = 63
 * 4 and 2 = 42
 * 3 and 1 = 31
 */
export function scoreDice(dice: DiceRoll): DiceScore {
  const { die1, die2 } = dice;

  validateDie(die1);
  validateDie(die2);

  // Special combination: MILLE
  if (die1 === 1 && die2 === 1) {
    return {
      isMille: true,
      value: 0,
      label: 'MILLE',
    };
  }

  // Arrange dice in descending order.
  const higherDie = Math.max(die1, die2);
  const lowerDie = Math.min(die1, die2);

  // Join the numbers instead of adding them.
  const value = higherDie * 10 + lowerDie;

  return {
    isMille: false,
    value,
    label: `${higherDie}${lowerDie}`,
  };
}

/**
 * Compares two dice scores.
 *
 * Returns:
 *  1 = first score wins
 *  0 = scores are equal
 * -1 = second score wins
 */
export function compareScores(
  first: DiceScore,
  second: DiceScore,
): number {
  // MILLE beats every ordinary combination.
  if (first.isMille && !second.isMille) {
    return 1;
  }

  if (!first.isMille && second.isMille) {
    return -1;
  }

  // Compare ordinary numeric scores.
  if (first.value > second.value) {
    return 1;
  }

  if (first.value < second.value) {
    return -1;
  }

  return 0;
}

/**
 * Finds the winner or winners.
 *
 * If multiple players have the same highest score,
 * all of them are returned as tied winners.
 */
export function getWinners(
  players: PlayerRoll[],
): ScoredPlayerRoll[] {
  if (players.length === 0) {
    return [];
  }

  const scoredPlayers: ScoredPlayerRoll[] = players.map((player) => ({
    ...player,
    score: scoreDice(player.dice),
  }));

  let highestScore = scoredPlayers[0].score;

  for (const player of scoredPlayers.slice(1)) {
    if (compareScores(player.score, highestScore) > 0) {
      highestScore = player.score;
    }
  }

  return scoredPlayers.filter(
    (player) => compareScores(player.score, highestScore) === 0,
  );
}
