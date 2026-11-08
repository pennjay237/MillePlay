import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { compareScores, scoreDice } from './dice';
import type { DiceRoll } from './dice';

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

// ---------- Dice geometry constants ----------
const FACE_SIZE = 60;             // px — the length of each cube edge
const HALF = FACE_SIZE / 2;       // 30 — translateZ distance to each face
const CUBE_STAGE = FACE_SIZE * 2; // 120 — wrapper big enough for rotated cube

const PIP_LAYOUTS: Record<number, Array<{ top: number; left: number }>> = {
  1: [{ top: 25, left: 25 }],
  2: [
    { top: 10, left: 10 },
    { top: 40, left: 40 },
  ],
  3: [
    { top: 10, left: 10 },
    { top: 25, left: 25 },
    { top: 40, left: 40 },
  ],
  4: [
    { top: 10, left: 10 },
    { top: 10, left: 40 },
    { top: 40, left: 10 },
    { top: 40, left: 40 },
  ],
  5: [
    { top: 10, left: 10 },
    { top: 10, left: 40 },
    { top: 25, left: 25 },
    { top: 40, left: 10 },
    { top: 40, left: 40 },
  ],
  6: [
    { top: 10, left: 10 },
    { top: 10, left: 40 },
    { top: 25, left: 10 },
    { top: 25, left: 40 },
    { top: 40, left: 10 },
    { top: 40, left: 40 },
  ],
};

type DieFace = 1 | 2 | 3 | 4 | 5 | 6;

// Rotation that puts each face toward the viewer.
const SNAP_ROTATIONS: Record<DieFace, [number, number, number]> = {
  1: [0, 0, 0],
  2: [-Math.PI / 2, 0, 0],
  3: [0, -Math.PI / 2, 0],
  4: [0, Math.PI / 2, 0],
  5: [Math.PI / 2, 0, 0],
  6: [0, Math.PI, 0],
};

function normalizeAngle(angle: number): number {
  const TAU = Math.PI * 2;
  const n = angle % TAU;
  return n < 0 ? n + TAU : n;
}

function snapAngle(current: number, target: number): number {
  const TAU = Math.PI * 2;
  const normCurrent = normalizeAngle(current);
  const normTarget = normalizeAngle(target);
  let diff = normTarget - normCurrent;
  if (diff < 0) diff += TAU;
  return current + diff + TAU * 2;
}

// On web/Android, RN doesn't set transform-style: preserve-3d by default,
// which is required for children with translateZ to form a real 3D cube.
const preserve3D: any =
  Platform.OS === 'web'
    ? { transformStyle: 'preserve-3d' }
    : Platform.OS === 'android'
      ? { renderToHardwareTextureAndroid: true }
      : {};

function AnimatedDice({ value, rolling }: { value: number; rolling: boolean }) {
  const rotateX = useRef(new Animated.Value(0)).current;
  const rotateY = useRef(new Animated.Value(0)).current;
  const rotateZ = useRef(new Animated.Value(0)).current;
  const offsetY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const frameRef = useRef<number | null>(null);

  const rotateXStyle = rotateX.interpolate({
    inputRange: [0, Math.PI * 2],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  });
  const rotateYStyle = rotateY.interpolate({
    inputRange: [0, Math.PI * 2],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  });
  const rotateZStyle = rotateZ.interpolate({
    inputRange: [0, Math.PI * 2],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  });

  useEffect(() => {
    if (!rolling) {
      const [fx, fy, fz] = SNAP_ROTATIONS[value as DieFace];
      rotateX.setValue(fx);
      rotateY.setValue(fy);
      rotateZ.setValue(fz);
      offsetY.setValue(0);
      scale.setValue(1);
      return;
    }

    rotateX.stopAnimation();
    rotateY.stopAnimation();
    rotateZ.stopAnimation();
    offsetY.stopAnimation();
    scale.stopAnimation();

    // Continue from wherever we are.
    let currentX = normalizeAngle(
      (rotateX as unknown as { __getValue: () => number }).__getValue?.() ??
        Math.random() * Math.PI * 2,
    );
    let currentY = normalizeAngle(
      (rotateY as unknown as { __getValue: () => number }).__getValue?.() ??
        Math.random() * Math.PI * 2,
    );
    let currentZ = normalizeAngle(
      (rotateZ as unknown as { __getValue: () => number }).__getValue?.() ??
        Math.random() * Math.PI * 2,
    );

    let velocityX = (Math.random() * 0.35 + 0.22) * (Math.random() > 0.5 ? 1 : -1);
    let velocityY = (Math.random() * 0.35 + 0.22) * (Math.random() > 0.5 ? 1 : -1);
    let velocityZ = (Math.random() * 0.25 + 0.12) * (Math.random() > 0.5 ? 1 : -1);

    const startTime = Date.now();
    const rollingDuration = 2050;

    rotateX.setValue(currentX);
    rotateY.setValue(currentY);
    rotateZ.setValue(currentZ);

    const animate = (timestamp: number) => {
      const elapsed = Date.now() - startTime;

      if (elapsed < rollingDuration) {
        currentX += velocityX;
        currentY += velocityY;
        currentZ += velocityZ;

        velocityX *= 0.97;
        velocityY *= 0.97;
        velocityZ *= 0.97;

        rotateX.setValue(currentX);
        rotateY.setValue(currentY);
        rotateZ.setValue(currentZ);

        const speed =
          Math.abs(velocityX) + Math.abs(velocityY) + Math.abs(velocityZ);
        const bounce =
          Math.sin(timestamp * 0.02) * 8 * Math.min(1, speed * 1.4);
        offsetY.setValue(-Math.abs(bounce));
        scale.setValue(1 + Math.min(0.1, speed * 0.16));

        frameRef.current = requestAnimationFrame(animate);
      } else {
        if (frameRef.current !== null) {
          cancelAnimationFrame(frameRef.current);
          frameRef.current = null;
        }

        const target = SNAP_ROTATIONS[value as DieFace];
        const finalX = snapAngle(currentX, target[0]);
        const finalY = snapAngle(currentY, target[1]);
        const finalZ = snapAngle(currentZ, target[2]);

        Animated.parallel([
          Animated.timing(rotateX, {
            toValue: finalX,
            duration: 520,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(rotateY, {
            toValue: finalY,
            duration: 520,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(rotateZ, {
            toValue: finalZ,
            duration: 520,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(offsetY, {
            toValue: 0,
            duration: 380,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 380,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
        ]).start();
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      rotateX.stopAnimation();
      rotateY.stopAnimation();
      rotateZ.stopAnimation();
      offsetY.stopAnimation();
      scale.stopAnimation();
    };
  }, [rolling, value, rotateX, rotateY, rotateZ, offsetY, scale]);

  function renderPips(faceValue: number) {
    return PIP_LAYOUTS[faceValue].map((pip, index) => (
      <View
        key={`${faceValue}-${index}`}
        style={[styles.dicePip, { top: pip.top, left: pip.left }]}
      />
    ));
  }

  return (
    <View style={styles.diceStage}>
      <View style={styles.diceShadow} />

      {/* Outer wrapper: same size as the cube stage, so perspective
          doesn't squish the child. Must NOT clip. */}
      <View style={styles.cubeStage}>
        <Animated.View
          style={[
            styles.diceCube,
            preserve3D,
            {
              transform: [
                { perspective: 800 },
                { translateY: offsetY },
                { scale },
                { rotateX: rotateXStyle },
                { rotateY: rotateYStyle },
                { rotateZ: rotateZStyle },
              ],
            },
          ]}
        >
          {/* FRONT — 1 */}
          <View
            style={[
              styles.face,
              styles.faceFront,
              { width: FACE_SIZE, height: FACE_SIZE, left: 0, top: 0 },
            ]}
          >
            {renderPips(1)}
          </View>

          {/* BACK — 6 */}
          <View
            style={[
              styles.face,
              styles.faceBack,
              { width: FACE_SIZE, height: FACE_SIZE, left: 0, top: 0 },
            ]}
          >
            {renderPips(6)}
          </View>

          {/* RIGHT — 3 */}
          <View
            style={[
              styles.face,
              styles.faceRight,
              { width: FACE_SIZE, height: FACE_SIZE, left: 0, top: 0 },
            ]}
          >
            {renderPips(3)}
          </View>

          {/* LEFT — 4 */}
          <View
            style={[
              styles.face,
              styles.faceLeft,
              { width: FACE_SIZE, height: FACE_SIZE, left: 0, top: 0 },
            ]}
          >
            {renderPips(4)}
          </View>

          {/* TOP — 2 */}
          <View
            style={[
              styles.face,
              styles.faceTop,
              { width: FACE_SIZE, height: FACE_SIZE, left: 0, top: 0 },
            ]}
          >
            {renderPips(2)}
          </View>

          {/* BOTTOM — 5 */}
          <View
            style={[
              styles.face,
              styles.faceBottom,
              { width: FACE_SIZE, height: FACE_SIZE, left: 0, top: 0 },
            ]}
          >
            {renderPips(5)}
          </View>
        </Animated.View>
      </View>
    </View>
  );
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
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);
  const [isRolling, setIsRolling] = useState(false);

  const rollingLock = useRef(false);

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
    roll: isFrench ? 'Lancer les dés' : 'Roll Dice',
    rolling: isFrench ? 'Les dés roulent...' : 'Dice rolling...',
    ready: isFrench ? 'Prêt à jouer ?' : 'Ready to play?',
    tie: isFrench
      ? 'Égalité ! Les joueurs à égalité relancent.'
      : 'Tie! The tied players must roll again.',
    roundWon: isFrench ? 'Vous gagnez cette manche !' : 'You won this round!',
    roundLost: isFrench
      ? 'Votre adversaire gagne cette manche.'
      : 'Your opponent won this round.',
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
  };

  const pot = selectedStake * 2;

  function startMatch() {
    if (balance < selectedStake) {
      setRoundMessage(t.insufficient);
      return;
    }
    onBalanceChange((previous) => previous - selectedStake);
    setRoundsPlayed(0);
    setPlayerPoints(0);
    setOpponentPoints(0);
    setLastRoll(null);
    setRoundMessage('');
    setMatchOutcome(null);
    setShowForfeitConfirm(false);
    setPhase('playing');
  }

  function finishMatch(outcome: Outcome) {
    setMatchOutcome(outcome);
    setPhase('finished');
    if (outcome === 'won') {
      onBalanceChange((previous) => previous + pot);
    } else if (outcome === 'draw') {
      onBalanceChange((previous) => previous + selectedStake);
    }
  }

  function playRound() {
    if (rollingLock.current || phase !== 'playing') return;
    rollingLock.current = true;
    setIsRolling(true);
    setRoundMessage('');

    const playerDice = rollDice();
    const opponentDice = rollDice();

    setTimeout(() => {
      const playerScore = scoreDice(playerDice);
      const opponentScore = scoreDice(opponentDice);
      const comparison = compareScores(playerScore, opponentScore);

      setLastRoll({
        player: playerDice,
        opponent: opponentDice,
        playerScore: playerScore.label,
        opponentScore: opponentScore.label,
      });

      setIsRolling(false);
      rollingLock.current = false;

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
        if (nextPlayerPoints > nextOpponentPoints) finishMatch('won');
        else if (nextOpponentPoints > nextPlayerPoints) finishMatch('lost');
        else finishMatch('draw');
      }
    }, 2050);
  }

  function forfeitMatch() {
    if (phase !== 'playing' || isRolling) return;
    setShowForfeitConfirm(true);
  }

  function confirmForfeit() {
    setShowForfeitConfirm(false);
    finishMatch('lost');
  }

  function resetMatch() {
    setShowForfeitConfirm(false);
    rollingLock.current = false;
    setIsRolling(false);
    setPhase('setup');
    setRoundsPlayed(0);
    setPlayerPoints(0);
    setOpponentPoints(0);
    setLastRoll(null);
    setRoundMessage('');
    setMatchOutcome(null);
  }

  function renderDice(dice: DiceRoll | null) {
    return (
      <View style={styles.diceRow}>
        <AnimatedDice value={dice?.die1 ?? 1} rolling={isRolling} />
        <AnimatedDice value={dice?.die2 ?? 1} rolling={isRolling} />
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
              <Text style={styles.summaryValue}>{balance.toLocaleString()}</Text>
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
            disabled={balance < selectedStake}
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
          <Text style={styles.playerLabel}>{t.you}</Text>
          {renderDice(lastRoll?.player ?? null)}
          {lastRoll ? (
            <Text style={styles.resultNumber}>{lastRoll.playerScore}</Text>
          ) : null}

          <View style={styles.vsDivider}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          <Text style={styles.playerLabel}>{t.opponent}</Text>
          {renderDice(lastRoll?.opponent ?? null)}
          {lastRoll ? (
            <Text style={styles.resultNumber}>{lastRoll.opponentScore}</Text>
          ) : null}

          {!lastRoll && !isRolling ? (
            <Text style={styles.muted}>{t.ready}</Text>
          ) : null}
          {isRolling ? (
            <Text style={styles.rollingText}>{t.rolling}</Text>
          ) : null}
          {roundMessage ? (
            <Text style={styles.roundMessage}>{roundMessage}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.primaryButton, isRolling && styles.disabledButton]}
            onPress={playRound}
            disabled={isRolling}
          >
            <Text style={styles.primaryButtonText}>
              {isRolling ? t.rolling : t.roll}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.forfeitButton, isRolling && styles.disabledButton]}
          onPress={forfeitMatch}
          disabled={isRolling}
        >
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
        <Text style={styles.finishedIcon}>
          {won ? '🏆' : draw ? '🤝' : '🎲'}
        </Text>
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
              )
            )}
          </View>
        ) : null}

        {showForfeitConfirm ? (
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmCard}>
              <Text style={styles.confirmTitle}>
                {isFrench ? 'Abandonner le match ?' : 'Forfeit Match?'}
              </Text>
              <Text style={styles.confirmMessage}>{t.forfeitConfirm}</Text>
              <View style={styles.confirmActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowForfeitConfirm(false)}
                >
                  <Text style={styles.cancelButtonText}>
                    {isFrench ? 'Annuler' : 'Cancel'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmForfeitButton}
                  onPress={confirmForfeit}
                >
                  <Text style={styles.confirmForfeitText}>
                    {isFrench ? 'Abandonner' : 'Forfeit'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backText: { color: COLORS.gold, fontSize: 16, fontWeight: '600' },
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: 'bold' },
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
  optionsRow: { flexDirection: 'row', width: '100%', gap: 10 },
  optionButton: {
    flex: 1,
    backgroundColor: COLORS.cardLight,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionSelected: { borderColor: COLORS.gold, backgroundColor: '#3B3521' },
  optionText: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  optionTextSelected: { color: COLORS.gold },
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
  muted: { color: COLORS.muted, fontSize: 13 },
  summaryValue: { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },
  potValue: { color: COLORS.gold, fontWeight: 'bold', fontSize: 22 },
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
  disabledButton: { opacity: 0.5 },
  errorText: { color: COLORS.red, marginTop: 12, textAlign: 'center' },
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
  scoreItem: { alignItems: 'center', flex: 1 },
  scoreNumber: {
    color: COLORS.gold,
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 5,
  },
  scoreDivider: { height: 42, width: 1, backgroundColor: '#405348' },
  roundInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  roundText: { color: COLORS.white, fontWeight: 'bold' },
  playerLabel: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },

  // ---------- Dice styles ----------
  diceRow: {
    flexDirection: 'row',
    gap: 22,
    marginTop: 14,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diceStage: {
    width: CUBE_STAGE + 10,
    height: CUBE_STAGE + 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diceShadow: {
    position: 'absolute',
    width: FACE_SIZE * 0.9,
    height: 16,
    bottom: 8,
    borderRadius: 20,
    backgroundColor: '#000000',
    opacity: 0.35,
    transform: [{ scaleX: 1.15 }],
  },
  cubeStage: {
    width: CUBE_STAGE,
    height: CUBE_STAGE,
    alignItems: 'center',
    justifyContent: 'center',
    // no overflow: hidden — faces fly toward camera
  },
  diceCube: {
    width: FACE_SIZE,
    height: FACE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    // no overflow: hidden
  },
  face: {
    position: 'absolute',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#9BA79B',
    alignItems: 'center',
    justifyContent: 'center',
    // NOTE: do NOT use backfaceVisibility: 'hidden' here.
    // The back faces are hidden naturally by depth sorting; hiding
    // them causes flicker on Android.
  },
  // Each face is pushed out along its axis by HALF (30px).
  // This is what makes 6 squares form a real 3D cube.
  faceFront: {
    backgroundColor: '#F7F8F5',
    transform: [{ translateZ: HALF } as any],
  },
  faceBack: {
    backgroundColor: '#C8CFC8',
    transform: [
      { rotateY: '180deg' },
      { translateZ: HALF } as any,
    ],
  },
  faceRight: {
    backgroundColor: '#CFD8CF',
    transform: [
      { rotateY: '90deg' },
      { translateZ: HALF } as any,
    ],
  },
  faceLeft: {
    backgroundColor: '#D9E0D9',
    transform: [
      { rotateY: '-90deg' },
      { translateZ: HALF } as any,
    ],
  },
  faceTop: {
    backgroundColor: '#FFFFFF',
    transform: [
      { rotateX: '90deg' },
      { translateZ: HALF } as any,
    ],
  },
  faceBottom: {
    backgroundColor: '#A6B0A6',
    transform: [
      { rotateX: '-90deg' },
      { translateZ: HALF } as any,
    ],
  },
  dicePip: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#17251E',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },

  rollingText: {
    color: COLORS.gold,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
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
  vsText: { color: COLORS.gold, fontWeight: 'bold', fontSize: 17 },
  roundMessage: {
    color: COLORS.white,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 18,
  },
  forfeitButton: { alignItems: 'center', padding: 14 },
  forfeitText: { color: COLORS.red, fontWeight: '600' },
  finishedIcon: { fontSize: 55, marginBottom: 12 },
  finishedTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  successText: { color: COLORS.green, fontWeight: '600', marginTop: 8 },
  rulesButton: { padding: 14, alignItems: 'center' },
  rulesButtonText: { color: COLORS.gold, fontWeight: '600' },
  rulesCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 14,
    gap: 12,
  },
  confirmOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 20,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: '#405348',
  },
  confirmTitle: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  confirmMessage: { color: COLORS.muted, fontSize: 14, lineHeight: 21 },
  confirmActions: { flexDirection: 'row', gap: 12, marginTop: 22 },
  cancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: COLORS.cardLight,
  },
  cancelButtonText: { color: COLORS.white, fontWeight: '600' },
  confirmForfeitButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: COLORS.red,
  },
  confirmForfeitText: { color: COLORS.white, fontWeight: 'bold' },
  ruleText: { color: COLORS.muted, lineHeight: 21, fontSize: 13 },
});