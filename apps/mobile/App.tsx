
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DiceGameScreen from './src/game/DiceGameScreen';

type Language = 'en' | 'fr';
type Tab = 'home' | 'games' | 'wallet' | 'profile';

const STORAGE_KEY = 'milleplay_language';

const COLORS = {
  background: '#101D18',
  card: '#1B2B23',
  cardLight: '#24382D',
  gold: '#D5A747',
  green: '#26966A',
  white: '#FFFFFF',
  muted: '#AAB7AF',
  border: '#34483D',
};

const translations = {
  en: {
    chooseLanguage: 'Choose your language',
    chooseSubtitle: 'Select your preferred language to continue.',
    continue: 'Continue',
    home: 'Home',
    games: 'Games',
    wallet: 'Wallet',
    profile: 'Profile',
    welcome: 'Welcome to MillePlay',
    tagline: 'ROLL. COMPETE. WIN.',
    balance: 'Wallet Balance',
    addCredits: 'Add demo credits',
    playNow: 'Play Now',
    playSubtitle: 'Ready to test your luck?',
    oneVsOne: '1 vs 1',
    oneVsOneDescription: 'Challenge another player',
    multiplayer: 'Multiplayer',
    multiplayerDescription: 'Compete with more players',
    recentActivity: 'Recent Activity',
    noActivity: 'No games played yet.',
    demoNotice: 'Demo credits only. No real money is involved.',
    availableGames: 'Available Games',
    diceGame: 'Dice Challenge',
    comingSoon: 'Try the dice game demonstration',
    walletTitle: 'My Wallet',
    demoBalance: 'Demo balance',
    walletDescription: 'Your balance currently uses simulated credits.',
    profileTitle: 'My Profile',
    player: 'MillePlay Player',
    settings: 'Settings',
    language: 'Language',
    languageDescription: 'Choose your preferred app language.',
    english: 'English',
    french: 'Français',
    changeLanguage: 'Change language',
    saved: 'Your language preference is saved.',
  },
  fr: {
    chooseLanguage: 'Choisissez votre langue',
    chooseSubtitle: 'Sélectionnez votre langue préférée pour continuer.',
    continue: 'Continuer',
    home: 'Accueil',
    games: 'Jeux',
    wallet: 'Portefeuille',
    profile: 'Profil',
    welcome: 'Bienvenue sur MillePlay',
    tagline: 'LANCE. AFFRONTE. GAGNE.',
    balance: 'Solde du portefeuille',
    addCredits: 'Ajouter des crédits démo',
    playNow: 'Jouer maintenant',
    playSubtitle: 'Prêt à tenter votre chance ?',
    oneVsOne: '1 contre 1',
    oneVsOneDescription: 'Défiez un autre joueur',
    multiplayer: 'Multijoueur',
    multiplayerDescription: 'Affrontez plusieurs joueurs',
    recentActivity: 'Activité récente',
    noActivity: 'Aucune partie jouée pour le moment.',
    demoNotice: 'Crédits de démonstration uniquement. Aucun argent réel.',
    availableGames: 'Jeux disponibles',
    diceGame: 'Défi de dés',
    comingSoon: 'Essayer la démonstration du jeu de dés',
    walletTitle: 'Mon portefeuille',
    demoBalance: 'Solde démo',
    walletDescription: 'Votre solde utilise actuellement des crédits simulés.',
    profileTitle: 'Mon profil',
    player: 'Joueur MillePlay',
    settings: 'Paramètres',
    language: 'Langue',
    languageDescription: 'Choisissez la langue de votre application.',
    english: 'English',
    french: 'Français',
    changeLanguage: 'Changer de langue',
    saved: 'Votre préférence linguistique est enregistrée.',
  },
};

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [languageLoaded, setLanguageLoaded] = useState(false);
  const [showLanguageScreen, setShowLanguageScreen] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [balance, setBalance] = useState(10000);

  // Dice game navigation state belongs inside App().
  const [showDiceGame, setShowDiceGame] = useState(false);

  const t = translations[language];

  useEffect(() => {
    async function loadLanguage() {
      try {
        const savedLanguage = await AsyncStorage.getItem(STORAGE_KEY);

        if (savedLanguage === 'en' || savedLanguage === 'fr') {
          setLanguage(savedLanguage);
          setSelectedLanguage(savedLanguage);
          setShowLanguageScreen(false);
        }
      } catch (error) {
        console.log('Could not load saved language:', error);
      } finally {
        setLanguageLoaded(true);
      }
    }

    loadLanguage();
  }, []);

  async function saveLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    setSelectedLanguage(nextLanguage);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, nextLanguage);
    } catch (error) {
      console.log('Could not save language:', error);
    }
  }

  async function confirmLanguage() {
    await saveLanguage(selectedLanguage);
    setShowLanguageScreen(false);
  }

  function renderLanguageScreen() {
    return (
      <SafeAreaView style={styles.container}>
<StatusBar barStyle="light-content" />
        <View style={styles.languageScreen}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoDice}>⚄</Text>
          </View>

          <Text style={styles.brand}>
            Mille<Text style={styles.goldText}>Play</Text>
          </Text>

          <Text style={styles.languageHeading}>
            {translations[selectedLanguage].chooseLanguage}
          </Text>

          <Text style={styles.languageSubtitle}>
            {translations[selectedLanguage].chooseSubtitle}
          </Text>

          <TouchableOpacity
            style={[
              styles.languageOption,
              selectedLanguage === 'en' && styles.selectedLanguage,
            ]}
            onPress={() => setSelectedLanguage('en')}
          >
            <Text style={styles.languageFlag}>🇬🇧</Text>
            <Text style={styles.languageOptionText}>English</Text>
            {selectedLanguage === 'en' && (
              <Text style={styles.selectedMark}>✓</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.languageOption,
              selectedLanguage === 'fr' && styles.selectedLanguage,
            ]}
            onPress={() => setSelectedLanguage('fr')}
          >
            <Text style={styles.languageFlag}>🇫🇷</Text>
            <Text style={styles.languageOptionText}>Français</Text>
            {selectedLanguage === 'fr' && (
              <Text style={styles.selectedMark}>✓</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButton} onPress={confirmLanguage}>
            <Text style={styles.primaryButtonText}>
              {translations[selectedLanguage].continue}
            </Text>
          </TouchableOpacity>

          <Text style={styles.languageFooter}>ROLL. COMPETE. WIN.</Text>
        </View>
      </SafeAreaView>
    );
  }

  function renderHeader() {
    return (
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>
            Mille<Text style={styles.goldText}>Play</Text>
          </Text>
          <Text style={styles.tagline}>{t.tagline}</Text>
        </View>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>P</Text>
        </View>
      </View>
    );
  }

  function renderHome() {
    return (
      <>
        <Text style={styles.welcome}>{t.welcome} 👋</Text>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t.balance}</Text>
          <Text style={styles.balanceAmount}>
            {balance.toLocaleString()} <Text style={styles.currency}>FCFA</Text>
          </Text>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setBalance((current) => current + 5000)}
          >
            <Text style={styles.addButtonText}>+ {t.addCredits}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.playCard}
          onPress={() => {
            setActiveTab('games');
            setShowDiceGame(false);
          }}
        >
          <View style={styles.playCardContent}>
            <Text style={styles.playTitle}>{t.playNow}</Text>
            <Text style={styles.playDescription}>{t.playSubtitle}</Text>

            <View style={styles.playButton}>
              <Text style={styles.playButtonText}>{t.playNow} →</Text>
            </View>
          </View>

          <Text style={styles.bigDice}>🎲</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>{t.availableGames}</Text>

        <View style={styles.modeRow}>
          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => {
              setActiveTab('games');
              setShowDiceGame(true);
            }}
          >
            <Text style={styles.modeIcon}>👥</Text>
            <Text style={styles.modeTitle}>{t.oneVsOne}</Text>
            <Text style={styles.modeDescription}>{t.oneVsOneDescription}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => setActiveTab('games')}
          >
            <Text style={styles.modeIcon}>🏆</Text>
            <Text style={styles.modeTitle}>{t.multiplayer}</Text>
            <Text style={styles.modeDescription}>{t.multiplayerDescription}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>{t.recentActivity}</Text>

        <View style={styles.activityCard}>
          <Text style={styles.mutedText}>{t.noActivity}</Text>
        </View>

        <Text style={styles.notice}>{t.demoNotice}</Text>
      </>
    );
  }

  function renderGames() {
    if (showDiceGame) {
      return (
        <DiceGameScreen
          language={language}
          balance={balance}
          onBalanceChange={setBalance}
          onBack={() => setShowDiceGame(false)}
        />
      );
    }

    return (
      <>
        <Text style={styles.screenTitle}>{t.games}</Text>

        <TouchableOpacity
          style={styles.activityCard}
          onPress={() => setShowDiceGame(true)}
        >
          <Text style={styles.modeIcon}>🎲</Text>
          <Text style={styles.modeTitle}>{t.diceGame}</Text>
          <Text style={styles.mutedText}>{t.comingSoon}</Text>
        </TouchableOpacity>
      </>
    );
  }

  function renderWallet() {
    return (
      <>
        <Text style={styles.screenTitle}>{t.walletTitle}</Text>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t.demoBalance}</Text>

          <Text style={styles.balanceAmount}>
            {balance.toLocaleString()} <Text style={styles.currency}>FCFA</Text>
          </Text>

          <Text style={styles.notice}>{t.walletDescription}</Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setBalance((current) => current + 5000)}
        >
          <Text style={styles.primaryButtonText}>+ {t.addCredits}</Text>
        </TouchableOpacity>
      </>
    );
  }

  function renderProfile() {
    return (
      <>
        <Text style={styles.screenTitle}>{t.profileTitle}</Text>

        <View style={styles.profileCard}>
          <View style={styles.largeAvatar}>
            <Text style={styles.avatarText}>P</Text>
          </View>

          <Text style={styles.modeTitle}>{t.player}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t.settings}</Text>

        <View style={styles.settingsCard}>
          <View>
            <Text style={styles.modeTitle}>{t.language}</Text>
            <Text style={styles.mutedText}>{t.languageDescription}</Text>
          </View>

          <View style={styles.settingLanguageRow}>
            <TouchableOpacity
              style={[
                styles.smallLanguageButton,
                language === 'en' && styles.selectedLanguage,
              ]}
              onPress={() => saveLanguage('en')}
            >
              <Text style={styles.smallLanguageText}>🇬🇧 EN</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.smallLanguageButton,
                language === 'fr' && styles.selectedLanguage,
              ]}
              onPress={() => saveLanguage('fr')}
            >
              <Text style={styles.smallLanguageText}>🇫🇷 FR</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.savedText}>{t.saved}</Text>
        </View>
      </>
    );
  }

  function renderContent() {
    switch (activeTab) {
      case 'games':
        return renderGames();
      case 'wallet':
        return renderWallet();
      case 'profile':
        return renderProfile();
      default:
        return renderHome();
    }
  }

  function renderNavigation() {
    const tabs: { key: Tab; icon: string; label: string }[] = [
      { key: 'home', icon: '⌂', label: t.home },
      { key: 'games', icon: '🎲', label: t.games },
      { key: 'wallet', icon: '▣', label: t.wallet },
      { key: 'profile', icon: '♙', label: t.profile },
    ];

    return (
      <View style={styles.bottomNav}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.navItem}
            onPress={() => {
              setActiveTab(tab.key);
              setShowDiceGame(false);
            }}
          >
            <Text
              style={[
                styles.navIcon,
                activeTab === tab.key && styles.activeNavText,
              ]}
            >
              {tab.icon}
            </Text>

            <Text
              style={[
                styles.navLabel,
                activeTab === tab.key && styles.activeNavText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  if (!languageLoaded) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </SafeAreaView>
    );
  }

  if (showLanguageScreen) {
    return renderLanguageScreen();
  }

  return (
    <SafeAreaView style={styles.container}>
<StatusBar barStyle="light-content" />
      {renderHeader()}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>

      {renderNavigation()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageScreen: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.cardLight,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoDice: {
    color: COLORS.gold,
    fontSize: 43,
  },
  brand: {
    color: COLORS.white,
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: -1,
  },
  goldText: {
    color: COLORS.gold,
  },
  languageHeading: {
    color: COLORS.white,
    fontSize: 25,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 45,
  },
  languageSubtitle: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  languageOption: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 13,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedLanguage: {
    borderColor: COLORS.gold,
    backgroundColor: '#26382B',
    borderWidth: 2,
  },
  languageFlag: {
    fontSize: 25,
    marginRight: 15,
  },
  languageOptionText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  selectedMark: {
    color: COLORS.gold,
    fontSize: 22,
    fontWeight: '900',
    marginLeft: 'auto',
  },
  primaryButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    padding: 17,
    alignItems: 'center',
    marginTop: 18,
  },
  primaryButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '900',
  },
  languageFooter: {
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 45,
    letterSpacing: 3,
    fontSize: 11,
    fontWeight: '800',
  },
  header: {
    paddingHorizontal: 22,
    paddingVertical: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
  },
  tagline: {
    color: COLORS.muted,
    fontSize: 9,
    letterSpacing: 2,
    marginTop: 4,
  },
  avatar: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.background,
    fontSize: 19,
    fontWeight: '900',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 30,
  },
  welcome: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 20,
  },
  balanceCard: {
    backgroundColor: COLORS.card,
    borderRadius: 17,
    padding: 21,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  balanceLabel: {
    color: COLORS.muted,
    fontSize: 13,
  },
  balanceAmount: {
    color: COLORS.white,
    fontSize: 31,
    fontWeight: '900',
    marginTop: 9,
  },
  currency: {
    color: COLORS.gold,
    fontSize: 15,
  },
  addButton: {
    backgroundColor: COLORS.cardLight,
    padding: 11,
    borderRadius: 9,
    alignSelf: 'flex-start',
    marginTop: 17,
  },
  addButtonText: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '800',
  },
  playCard: {
    backgroundColor: COLORS.green,
    borderRadius: 17,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  playCardContent: {
    flex: 1,
  },
  playTitle: {
    color: COLORS.white,
    fontSize: 23,
    fontWeight: '900',
  },
  playDescription: {
    color: '#E0F0E7',
    fontSize: 12,
    marginTop: 6,
  },
  playButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9,
    alignSelf: 'flex-start',
    marginTop: 15,
  },
  playButtonText: {
    color: COLORS.background,
    fontWeight: '800',
    fontSize: 12,
  },
  bigDice: {
    fontSize: 57,
    marginLeft: 10,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 13,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 25,
  },
  modeCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: 15,
    borderRadius: 14,
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  modeIcon: {
    fontSize: 27,
    marginBottom: 11,
  },
  modeTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  modeDescription: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
  },
  activityCard: {
    backgroundColor: COLORS.card,
    padding: 18,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 17,
  },
  mutedText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  notice: {
    color: COLORS.muted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 13,
    lineHeight: 17,
  },
  screenTitle: {
    color: COLORS.white,
    fontSize: 25,
    fontWeight: '900',
    marginBottom: 22,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 25,
    borderRadius: 16,
    marginBottom: 25,
  },
  largeAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  settingsCard: {
    backgroundColor: COLORS.card,
    padding: 17,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingLanguageRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 17,
  },
  smallLanguageButton: {
    flex: 1,
    backgroundColor: COLORS.cardLight,
    padding: 12,
    borderRadius: 9,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  smallLanguageText: {
    color: COLORS.white,
    fontWeight: '800',
  },
  savedText: {
    color: COLORS.green,
    fontSize: 11,
    marginTop: 12,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.card,
    paddingTop: 11,
    paddingBottom: 9,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navIcon: {
    color: COLORS.muted,
    fontSize: 20,
    marginBottom: 4,
  },
  navLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  activeNavText: {
    color: COLORS.gold,
  },
});
