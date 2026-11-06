
import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { compareScores, scoreDice, DiceRoll } from './dice';

type Props = {
  language: 'en' | 'fr';
  balance: number;
  onBalanceChange: React.Dispatch<React.SetStateAction<number>>;
  onBack: () => void;
};

type Outcome = 'won' | 'lost' | 'draw';

type MatchPhase = 'setup' | 'playing' | 'finished';

type LastRoll = {
  player: DiceRoll;
  opponent: DiceRoll;
  playerScore: string;
  opponentScore: string;
};

const COLORS = {
  background: '#101D18',
  card: '#192B23',
  cardLight: '#22382D',
  gold: '#D5A747',
  green: '#26966A',
  white: '#FFFFFF',
  muted: '#A8B7AE',
  red: '#D95D5D',
};

const ROUND_OPTIONS = [1, 3, 5, 10];
const STAKE_OPTIONS = [500, 1000, 2000, 5000];

function rollDice(): DiceRoll {
  return {
    die1: Math.floor(Math.random() * 6) + 1,
    die2: Math.floor(Math.random() * 6) + 1,
  };
}

function DiceFace({ value }: { value: number }) {
  const faces = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

  return <Text style={styles.diceFace}>{faces[value]}</Text>;
}

export default function DiceGameScreen({
  language,
  balance,
  onBalanceChange,
  onBack,
}: Props) {
  const isFrench = language === 'fr';

  const [phase, setPhase] = useState<MatchPhase>('setup');
  const [selectedRounds, setSelectedRounds] = useState(5);
  const [selectedStake, setSelectedStake] = useState(1000);

  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [playerPoints, setPlayerPoints] = useState(0);
  const [opponentPoints, setOpponentPoints] = useState(0);

  const [lastRoll, setLastRoll] = useState<LastRoll | null>(null);
  const [roundMessage, setRoundMessage] = useState('');
  const [matchOutcome, setMatchOutcome] = useState<Outcome | null>(null);

  const [showRules, setShowRules] = useState(false);

  const t = {
    title: isFrench ? 'Jeu de dés' : 'Dice Game',
    back: isFrench ? 'Retour' : 'Back',
    setup: isFrench ? 'Configurer le match' : 'Set Up Your Match',
    rounds: isFrench ? 'Nombre de manches' : 'Number of Rounds',
    stake: isFrench ? 'Mise par joueur' : 'Entry Stake Per Player',
    balance: isFrench ? 'Votre solde' : 'Your Balance',
    pot: isFrench ? 'Cagnotte totale' : 'Total Match Pot',
    start: isFrench ? 'Commencer le match' : 'Start Match',
    round: isFrench ? 'Manche' : 'Round',
    you: isFrench ? 'Vous' : 'You',
    opponent: isFrench ? 'Adversaire' : 'Opponent',
    points: isFrench ? 'Points' : 'Points',
    roll: isFrench ? 'Lancer les dés' : 'Roll Dice',
    tie: isFrench
      ? 'Égalité ! Les joueurs à égalité relancent.'
      : 'Tie! The tied players must roll again.',
    roundWon: isFrench ? 'Vous gagnez cette manche !' : 'You won this round!',
    roundLost: isFrench ? 'Votre adversaire gagne cette manche.' : 'Your opponent won this round.',
    won: isFrench ? 'Vous avez gagné le match !' : 'You won the match!',
    lost: isFrench ? 'Vous avez perdu le match.' : 'You lost the match.',
    draw: isFrench ? 'Match nul !' : 'The match ended in a draw!',
    payout: isFrench ? 'Gain ajouté au solde' : 'Winnings added to your balance',
    refund: isFrench ? 'Mise remboursée' : 'Entry stake refunded',
    playAgain: isFrench ? 'Rejouer' : 'Play Again',
    forfeit: isFrench ? 'Abandonner le match' : 'Forfeit Match',
    forfeitConfirm: isFrench
      ? 'Vous abandonnez le match et perdez votre mise. Continuer ?'
      : 'You will forfeit the match and lose your entry stake. Continue?',
    rules: isFrench ? 'Règles du jeu' : 'Game Rules',
    hideRules: isFrench ? 'Masquer les règles' : 'Hide Rules',
    rule1: isFrench ? 'Chaque joueur lance deux dés.' : 'Each player rolls two dice.',
    rule2: isFrench
      ? 'Les dés sont classés du plus grand au plus petit puis assemblés : 6 et 2 donnent 62.'
      : 'Arrange dice from highest to lowest and join them: 6 and 2 make 62.',
    rule3: isFrench
      ? 'Le double 1 (MILLE) bat toutes les autres combinaisons.'
      : 'Double 1 (MILLE) beats every other combination.',
    rule4: isFrench
      ? 'Le gagnant de chaque manche reçoit un point.'
      : 'The winner of each round earns one point.',
    rule5: isFrench
      ? 'En cas d’égalité, les joueurs concernés relancent.'
      : 'If a round is tied, the tied players roll again.',
    rule6: isFrench
      ? 'Le joueur avec le plus de points gagne le match.'
      : 'The player with the most points wins the match.',
    insufficient: isFrench
      ? 'Solde insuffisant pour cette mise.'
      : 'You do not have enough credits for this stake.',
    demo: isFrench
      ? 'Mode démo : votre adversaire est simulé sur cet appareil.'
      : 'Demo mode: your opponent is simulated on this device.',
    finished: isFrench ? 'Match terminé' : 'Match Finished',
  };

  const pot = selectedStake * 2;

  function startMatch() {
    if (balance < selectedStake) {
      setRoundMessage(t.insufficient);
      return;
    }

    // Deduct the player's entry stake once, when the match starts.
    onBalanceChange((previous) => previous - selectedStake);

    setRoundsPlayed(0);
    setPlayerPoints(0);
    setOpponentPoints(0);
    setLastRoll(null);
    setRoundMessage('');
    setMatchOutcome(null);
    setPhase('playing');
  }

  function finishMatch(outcome: Outcome) {
    setMatchOutcome(outcome);
    setPhase('finished');

    if (outcome === 'won') {
      // Return the player's stake plus the opponent's simulated stake.
      onBalanceChange((previous) => previous + pot);
    } else if (outcome === 'draw') {
      // Refund the player's original entry stake.
      onBalanceChange((previous) => previous + selectedStake);
    }
    // A loss means the player's entry stake remains in the pot.
  }

  function playRound() {
    const playerDice = rollDice();
    const opponentDice = rollDice();

    const playerScore = scoreDice(playerDice);
    const opponentScore = scoreDice(opponentDice);

    const comparison = compareScores(playerScore, opponentScore);

    setLastRoll({
      player: playerDice,
      opponent: opponentDice,
      playerScore: playerScore.label,
      opponentScore: opponentScore.label,
    });

    if (comparison === 0) {
      setRoundMessage(t.tie);
      return;
    }

    const nextPlayerPoints = playerPoints + (comparison > 0 ? 1 : 0);
    const nextOpponentPoints = opponentPoints + (comparison < 0 ? 1 : 0);
    const nextRoundsPlayed = roundsPlayed + 1;

    setPlayerPoints(nextPlayerPoints);
    setOpponentPoints(nextOpponentPoints);
    setRoundsPlayed(nextRoundsPlayed);

    setRoundMessage(comparison > 0 ? t.roundWon : t.roundLost);

    if (nextRoundsPlayed === selectedRounds) {
      if (nextPlayerPoints > nextOpponentPoints) {
        finishMatch('won');
      } else if (nextOpponentPoints > nextPlayerPoints) {
        finishMatch('lost');
      } else {
        finishMatch('draw');
      }
    }
  }

function forfeitMatch() {
  Alert.alert(
    isFrench ? 'Abandonner le match ?' : 'Forfeit Match?',
    t.forfeitConfirm,
    [
      {
        text: isFrench ? 'Annuler' : 'Cancel',
        style: 'cancel',
      },
      {
        text: isFrench ? 'Abandonner' : 'Forfeit',
        style: 'destructive',
        onPress: () => finishMatch('lost'),
      },
    ],
  );
}

  function resetMatch() {
    setPhase('setup');
    setRoundsPlayed(0);
    setPlayerPoints(0);
    setOpponentPoints(0);
    setLastRoll(null);
    setRoundMessage('');
    setMatchOutcome(null);
  }

  function renderDice(dice: DiceRoll) {
    return (
      <View style={styles.diceRow}>
        <View style={styles.diceBox}>
          <DiceFace value={dice.die1} />
        </View>
        <View style={styles.diceBox}>
          <DiceFace value={dice.die2} />
        </View>
      </View>
    );
  }

  function renderSetup() {
    return (
      <>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t.setup}</Text>

          <Text style={styles.fieldTitle}>{t.rounds}</Text>
          <View style={styles.optionsRow}>
            {ROUND_OPTIONS.map((round) => (
              <TouchableOpacity
                key={round}
                style={[
                  styles.optionButton,
                  selectedRounds === round && styles.optionSelected,
                ]}
                onPress={() => setSelectedRounds(round)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedRounds === round && styles.optionTextSelected,
                  ]}
                >
                  {round}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldTitle}>{t.stake}</Text>
          <View style={styles.stakeGrid}>
            {STAKE_OPTIONS.map((stake) => (
              <TouchableOpacity
                key={stake}
                style={[
                  styles.stakeButton,
                  selectedStake === stake && styles.optionSelected,
                ]}
                onPress={() => setSelectedStake(stake)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedStake === stake && styles.optionTextSelected,
                  ]}
                >
                  {stake.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.muted}>{t.balance}</Text>
              <Text style={styles.summaryValue}>
                {balance.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.muted}>{t.stake}</Text>
              <Text style={styles.summaryValue}>
                {selectedStake.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.muted}>{t.pot}</Text>
              <Text style={styles.potValue}>{pot.toLocaleString()}</Text>
            </View>
          </View>

          {roundMessage ? (
            <Text style={styles.errorText}>{roundMessage}</Text>
          ) : null}

          <TouchableOpacity
            style={[
              styles.primaryButton,
              balance < selectedStake && styles.disabledButton,
            ]}
            onPress={startMatch}
          >
            <Text style={styles.primaryButtonText}>{t.start}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.demoNotice}>{t.demo}</Text>
      </>
    );
  }

  function renderPlaying() {
    return (
      <>
        <View style={styles.scoreboard}>
          <View style={styles.scoreItem}>
            <Text style={styles.muted}>{t.you}</Text>
            <Text style={styles.scoreNumber}>{playerPoints}</Text>
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreItem}>
            <Text style={styles.muted}>{t.opponent}</Text>
            <Text style={styles.scoreNumber}>{opponentPoints}</Text>
          </View>
        </View>

        <View style={styles.roundInfo}>
          <Text style={styles.roundText}>
            {t.round} {Math.min(roundsPlayed + 1, selectedRounds)} / {selectedRounds}
          </Text>
          <Text style={styles.muted}>
            {t.pot}: {pot.toLocaleString()}
          </Text>
        </View>

        <View style={styles.card}>
          {lastRoll ? (
            <>
              <Text style={styles.playerLabel}>{t.you}</Text>
              {renderDice(lastRoll.player)}
              <Text style={styles.resultNumber}>{lastRoll.playerScore}</Text>

              <View style={styles.vsDivider}>
                <Text style={styles.vsText}>VS</Text>
              </View>

              <Text style={styles.playerLabel}>{t.opponent}</Text>
              {renderDice(lastRoll.opponent)}
              <Text style={styles.resultNumber}>{lastRoll.opponentScore}</Text>
            </>
          ) : (
            <Text style={styles.muted}>
              {isFrench ? 'Prêt à jouer ?' : 'Ready to play?'}
            </Text>
          )}

          {roundMessage ? (
            <Text style={styles.roundMessage}>{roundMessage}</Text>
          ) : null}

          <TouchableOpacity style={styles.primaryButton} onPress={playRound}>
            <Text style={styles.primaryButtonText}>{t.roll}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.forfeitButton} onPress={forfeitMatch}>
          <Text style={styles.forfeitText}>{t.forfeit}</Text>
        </TouchableOpacity>
      </>
    );
  }

  function renderFinished() {
    const won = matchOutcome === 'won';
    const draw = matchOutcome === 'draw';

    return (
      <View style={styles.card}>
        <Text style={styles.finishedIcon}>{won ? '🏆' : draw ? '🤝' : '🎲'}</Text>
        <Text style={styles.finishedTitle}>
          {won ? t.won : draw ? t.draw : t.lost}
        </Text>

        <View style={styles.scoreboard}>
          <View style={styles.scoreItem}>
            <Text style={styles.muted}>{t.you}</Text>
            <Text style={styles.scoreNumber}>{playerPoints}</Text>
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreItem}>
            <Text style={styles.muted}>{t.opponent}</Text>
            <Text style={styles.scoreNumber}>{opponentPoints}</Text>
          </View>
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.muted}>{t.balance}</Text>
          <Text style={styles.potValue}>{balance.toLocaleString()}</Text>

          {won ? (
            <Text style={styles.successText}>
              {t.payout}: {pot.toLocaleString()}
            </Text>
          ) : draw ? (
            <Text style={styles.successText}>
              {t.refund}: {selectedStake.toLocaleString()}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={resetMatch}>
          <Text style={styles.primaryButtonText}>{t.playAgain}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backText}>‹ {t.back}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.title}</Text>
          <View style={{ width: 55 }} />
        </View>

        {phase === 'setup' && renderSetup()}
        {phase === 'playing' && renderPlaying()}
        {phase === 'finished' && renderFinished()}

        <TouchableOpacity
          style={styles.rulesButton}
          onPress={() => setShowRules(!showRules)}
        >
          <Text style={styles.rulesButtonText}>
            {showRules ? t.hideRules : t.rules}
          </Text>
        </TouchableOpacity>

        {showRules ? (
          <View style={styles.rulesCard}>
            {[t.rule1, t.rule2, t.rule3, t.rule4, t.rule5, t.rule6].map(
              (rule, index) => (
                <Text key={index} style={styles.ruleText}>
                  {index + 1}. {rule}
                </Text>
              ),
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backText: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
    alignItems: 'center',
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginBottom: 22,
  },
  fieldTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginTop: 14,
    marginBottom: 10,
  },
  optionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  optionButton: {
    flex: 1,
    backgroundColor: COLORS.cardLight,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: COLORS.gold,
    backgroundColor: '#3B3521',
  },
  optionText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: COLORS.gold,
  },
  stakeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: '100%',
  },
  stakeButton: {
    width: '48%',
    backgroundColor: COLORS.cardLight,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  summaryBox: {
    width: '100%',
    backgroundColor: COLORS.cardLight,
    borderRadius: 12,
    padding: 15,
    marginTop: 22,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  muted: {
    color: COLORS.muted,
    fontSize: 13,
  },
  summaryValue: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
  potValue: {
    color: COLORS.gold,
    fontWeight: 'bold',
    fontSize: 22,
  },
  primaryButton: {
    backgroundColor: COLORS.gold,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 22,
  },
  primaryButtonText: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  errorText: {
    color: COLORS.red,
    marginTop: 12,
    textAlign: 'center',
  },
  demoNotice: {
    color: COLORS.muted,
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 20,
  },
  scoreboard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  scoreItem: {
    alignItems: 'center',
    flex: 1,
  },
  scoreNumber: {
    color: COLORS.gold,
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 5,
  },
  scoreDivider: {
    height: 42,
    width: 1,
    backgroundColor: '#405348',
  },
  roundInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  roundText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  playerLabel: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  diceRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 10,
  },
  diceBox: {
    width: 68,
    height: 68,
    backgroundColor: '#F7F8F5',
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diceFace: {
    fontSize: 48,
    color: '#101D18',
    lineHeight: 58,
  },
  resultNumber: {
    color: COLORS.gold,
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 7,
  },
  vsDivider: {
    width: '100%',
    borderTopWidth: 1,
    borderColor: '#405348',
    marginTop: 18,
    paddingTop: 12,
    alignItems: 'center',
  },
  vsText: {
    color: COLORS.gold,
    fontWeight: 'bold',
    fontSize: 17,
  },
  roundMessage: {
    color: COLORS.white,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 18,
  },
  forfeitButton: {
    alignItems: 'center',
    padding: 14,
  },
  forfeitText: {
    color: COLORS.red,
    fontWeight: '600',
  },
  finishedIcon: {
    fontSize: 55,
    marginBottom: 12,
  },
  finishedTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  successText: {
    color: COLORS.green,
    fontWeight: '600',
    marginTop: 8,
  },
  rulesButton: {
    padding: 14,
    alignItems: 'center',
  },
  rulesButtonText: {
    color: COLORS.gold,
    fontWeight: '600',
  },
  rulesCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 14,
    gap: 12,
  },
  ruleText: {
    color: COLORS.muted,
    lineHeight: 21,
    fontSize: 13,
  },
});
