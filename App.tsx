import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, StyleSheet, ActivityIndicator, ScrollView, Dimensions, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Slider from '@react-native-community/slider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LIGHT = {
  bg: '#ffffff', card: '#ffffff', cardBorder: '#eeeeee', input: '#ffffff',
  inputBorder: '#cccccc', text: '#222222', textSecondary: '#666666',
  textMuted: '#999999', accent: '#e63946', accentLight: '#fff3f3',
  priceBox: '#f8f8f8', variantBox: '#fffbf0', variantBorder: '#f4a261',
  gradedBox: '#f8f8f8', chip: '#f0f0f0', chipText: '#444444',
  tabBg: '#ffffff', deltaClean: '#d4edda', deltaPos: '#fff3cd', deltaNeg: '#fff3f3',
  deckCard: '#f8f8f8', clearButton: '#cccccc', sectionTitle: '#444444',
};

const DARK = {
  bg: '#121212', card: '#1e1e1e', cardBorder: '#2a2a2a', input: '#1e1e1e',
  inputBorder: '#333333', text: '#f0f0f0', textSecondary: '#aaaaaa',
  textMuted: '#666666', accent: '#e63946', accentLight: '#2a1515',
  priceBox: '#1e1e1e', variantBox: '#1a1500', variantBorder: '#f4a261',
  gradedBox: '#1e1e1e', chip: '#2a2a2a', chipText: '#cccccc',
  tabBg: '#1e1e1e', deltaClean: '#1a2e1a', deltaPos: '#2a2500', deltaNeg: '#2a1515',
  deckCard: '#1e1e1e', clearButton: '#333333', sectionTitle: '#aaaaaa',
};

const APP_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
];

const TRANSLATIONS = {
  en: {
    title: 'TCG Market Master', singles: '🔍 Singles', sealed: '📦 Sealed', barter: '🤝 Barter',
    searchPlaceholder: 'Search card name...', search: 'Search', back: '← Back to results',
    backTrade: '← Back to trade', confirmVariant: '⚠ Confirm Print Variant',
    variantSubtitle: 'Price varies significantly by variant', rawCard: 'Raw Card', gradedCard: 'Graded Card',
    gradingCompany: 'Grading Company', grade: 'Grade', certNumber: 'Cert Number (optional)',
    certPlaceholder: 'Enter cert number...', lookup: 'Lookup', condition: 'Condition',
    marketPrice: 'Market Price', yourPrice: 'Your Price', priceSources: 'Price Sources',
    currencyConverter: 'Currency Converter', sealedLookup: 'Sealed Product Lookup',
    sealedPlaceholder: 'Search product name...', scanBarcode: '📷 Scan Barcode',
    barcodeNote: 'Available on mobile device', sealedCondition: 'Sealed Condition',
    addingTo: 'Adding to:', yourDeck: 'YOUR DECK', theirDeck: 'THEIR DECK',
    addCard: '+ Add Card', total: 'Total:', cleanTrade: '✅ Clean Trade',
    theyAdd: 'They add', youAdd: 'You add', cash: 'cash', clearTrade: '🗑 Clear Trade',
    noPrice: 'No price data available', phase2Note: '⚠ Full pricing for this language coming in Phase 2.',
    appLanguage: 'App Language', cardLanguage: 'Card Language', pointCamera: 'Point at card to identify',
    closeCamera: '✕ Close Camera', scanCard: '📷 Scan Card', listening: 'Listening...',
    variantConfirmed: '✓ Variant confirmed', premiumVariant: '⚠ Premium variant — verify carefully before pricing',
    recentSearches: 'Recent Searches', results: 'results', priceHistory: 'Price History',
    priceHistoryNote: 'Historical data connects to TCGPlayer API on launch.',
    sortBy: 'Sort:', sortName: 'Name', sortPrice: 'Price', sortSet: 'Set',
    darkMode: 'Dark Mode', appearance: 'Appearance', noResults: 'No results found.',
  },
  fr: {
    title: 'TCG Market Master', singles: '🔍 Singles', sealed: '📦 Scellé', barter: '🤝 Échange',
    searchPlaceholder: 'Rechercher une carte...', search: 'Chercher', back: '← Retour aux résultats',
    backTrade: '← Retour à l\'échange', confirmVariant: '⚠ Confirmer la variante',
    variantSubtitle: 'Le prix varie selon la variante', rawCard: 'Carte brute', gradedCard: 'Carte gradée',
    gradingCompany: 'Société de notation', grade: 'Grade', certNumber: 'Numéro de certificat (optionnel)',
    certPlaceholder: 'Entrer le numéro...', lookup: 'Rechercher', condition: 'État',
    marketPrice: 'Prix du marché', yourPrice: 'Votre prix', priceSources: 'Sources de prix',
    currencyConverter: 'Convertisseur de devises', sealedLookup: 'Recherche produit scellé',
    sealedPlaceholder: 'Rechercher un produit...', scanBarcode: '📷 Scanner le code-barres',
    barcodeNote: 'Disponible sur mobile', sealedCondition: 'État du scellé',
    addingTo: 'Ajout à :', yourDeck: 'VOTRE DECK', theirDeck: 'LEUR DECK',
    addCard: '+ Ajouter carte', total: 'Total :', cleanTrade: '✅ Échange équilibré',
    theyAdd: 'Ils ajoutent', youAdd: 'Vous ajoutez', cash: 'en espèces', clearTrade: '🗑 Effacer l\'échange',
    noPrice: 'Aucune donnée de prix', phase2Note: '⚠ Prix complets pour cette langue en Phase 2.',
    appLanguage: 'Langue de l\'app', cardLanguage: 'Langue de la carte', pointCamera: 'Pointez vers la carte',
    closeCamera: '✕ Fermer la caméra', scanCard: '📷 Scanner la carte', listening: 'En écoute...',
    variantConfirmed: '✓ Variante confirmée', premiumVariant: '⚠ Variante premium — vérifiez avant de tarifer',
    recentSearches: 'Recherches récentes', results: 'résultats', priceHistory: 'Historique des prix',
    priceHistoryNote: 'Données historiques via TCGPlayer API au lancement.',
    sortBy: 'Trier :', sortName: 'Nom', sortPrice: 'Prix', sortSet: 'Set',
    darkMode: 'Mode sombre', appearance: 'Apparence', noResults: 'Aucun résultat.',
  },
  ja: {
    title: 'TCG Market Master', singles: '🔍 シングル', sealed: '📦 未開封', barter: '🤝 トレード',
    searchPlaceholder: 'カード名を検索...', search: '検索', back: '← 結果に戻る',
    backTrade: '← トレードに戻る', confirmVariant: '⚠ バリアントを確認',
    variantSubtitle: 'バリアントによって価格が異なります', rawCard: '生カード', gradedCard: 'グレードカード',
    gradingCompany: 'グレード会社', grade: 'グレード', certNumber: '認証番号（任意）',
    certPlaceholder: '番号を入力...', lookup: '検索', condition: 'コンディション',
    marketPrice: '市場価格', yourPrice: 'あなたの価格', priceSources: '価格ソース',
    currencyConverter: '通貨換算', sealedLookup: '未開封品検索',
    sealedPlaceholder: '商品名を検索...', scanBarcode: '📷 バーコードスキャン',
    barcodeNote: 'モバイルで利用可能', sealedCondition: '未開封状態',
    addingTo: '追加先：', yourDeck: 'あなたのデッキ', theirDeck: '相手のデッキ',
    addCard: '+ カードを追加', total: '合計：', cleanTrade: '✅ 均等トレード',
    theyAdd: '相手が追加', youAdd: 'あなたが追加', cash: '現金', clearTrade: '🗑 トレードをクリア',
    noPrice: '価格データなし', phase2Note: '⚠ この言語の完全な価格はフェーズ2で。',
    appLanguage: 'アプリ言語', cardLanguage: 'カード言語', pointCamera: 'カードに向けてください',
    closeCamera: '✕ カメラを閉じる', scanCard: '📷 カードをスキャン', listening: '聞いています...',
    variantConfirmed: '✓ バリアント確認済み', premiumVariant: '⚠ プレミアムバリアント — 価格設定前に確認',
    recentSearches: '最近の検索', results: '件', priceHistory: '価格履歴',
    priceHistoryNote: 'TCGPlayer APIで価格履歴を提供予定。',
    sortBy: '並び替え：', sortName: '名前', sortPrice: '価格', sortSet: 'セット',
    darkMode: 'ダークモード', appearance: '外観', noResults: '結果なし。',
  },
  es: {
    title: 'TCG Market Master', singles: '🔍 Singles', sealed: '📦 Sellado', barter: '🤝 Intercambio',
    searchPlaceholder: 'Buscar carta...', search: 'Buscar', back: '← Volver a resultados',
    backTrade: '← Volver al intercambio', confirmVariant: '⚠ Confirmar variante',
    variantSubtitle: 'El precio varía según la variante', rawCard: 'Carta sin graduar', gradedCard: 'Carta graduada',
    gradingCompany: 'Empresa de graduación', grade: 'Grado', certNumber: 'Número de certificado (opcional)',
    certPlaceholder: 'Ingresar número...', lookup: 'Buscar', condition: 'Condición',
    marketPrice: 'Precio de mercado', yourPrice: 'Tu precio', priceSources: 'Fuentes de precio',
    currencyConverter: 'Conversor de divisas', sealedLookup: 'Búsqueda producto sellado',
    sealedPlaceholder: 'Buscar producto...', scanBarcode: '📷 Escanear código de barras',
    barcodeNote: 'Disponible en móvil', sealedCondition: 'Condición sellado',
    addingTo: 'Añadiendo a:', yourDeck: 'TU MAZO', theirDeck: 'SU MAZO',
    addCard: '+ Añadir carta', total: 'Total:', cleanTrade: '✅ Intercambio equilibrado',
    theyAdd: 'Ellos añaden', youAdd: 'Tú añades', cash: 'en efectivo', clearTrade: '🗑 Limpiar intercambio',
    noPrice: 'Sin datos de precio', phase2Note: '⚠ Precios completos para este idioma en Fase 2.',
    appLanguage: 'Idioma de la app', cardLanguage: 'Idioma de la carta', pointCamera: 'Apunta hacia la carta',
    closeCamera: '✕ Cerrar cámara', scanCard: '📷 Escanear carta', listening: 'Escuchando...',
    variantConfirmed: '✓ Variante confirmada', premiumVariant: '⚠ Variante premium — verifica antes de fijar precio',
    recentSearches: 'Búsquedas recientes', results: 'resultados', priceHistory: 'Historial de precios',
    priceHistoryNote: 'Datos históricos via TCGPlayer API al lanzamiento.',
    sortBy: 'Ordenar:', sortName: 'Nombre', sortPrice: 'Precio', sortSet: 'Set',
    darkMode: 'Modo oscuro', appearance: 'Apariencia', noResults: 'Sin resultados.',
  },
  de: {
    title: 'TCG Market Master', singles: '🔍 Singles', sealed: '📦 Versiegelt', barter: '🤝 Tausch',
    searchPlaceholder: 'Kartenname suchen...', search: 'Suchen', back: '← Zurück zu Ergebnissen',
    backTrade: '← Zurück zum Tausch', confirmVariant: '⚠ Variante bestätigen',
    variantSubtitle: 'Preis variiert je nach Variante', rawCard: 'Rohe Karte', gradedCard: 'Bewertete Karte',
    gradingCompany: 'Bewertungsunternehmen', grade: 'Bewertung', certNumber: 'Zertifikatsnummer (optional)',
    certPlaceholder: 'Nummer eingeben...', lookup: 'Suchen', condition: 'Zustand',
    marketPrice: 'Marktpreis', yourPrice: 'Ihr Preis', priceSources: 'Preisquellen',
    currencyConverter: 'Währungsrechner', sealedLookup: 'Versiegeltes Produkt suchen',
    sealedPlaceholder: 'Produkt suchen...', scanBarcode: '📷 Barcode scannen',
    barcodeNote: 'Auf Mobilgerät verfügbar', sealedCondition: 'Versiegelter Zustand',
    addingTo: 'Hinzufügen zu:', yourDeck: 'IHR DECK', theirDeck: 'DEREN DECK',
    addCard: '+ Karte hinzufügen', total: 'Gesamt:', cleanTrade: '✅ Ausgeglichener Tausch',
    theyAdd: 'Sie fügen hinzu', youAdd: 'Sie fügen hinzu', cash: 'in bar', clearTrade: '🗑 Tausch löschen',
    noPrice: 'Keine Preisdaten', phase2Note: '⚠ Vollständige Preise für diese Sprache in Phase 2.',
    appLanguage: 'App-Sprache', cardLanguage: 'Kartensprache', pointCamera: 'Auf Karte richten',
    closeCamera: '✕ Kamera schließen', scanCard: '📷 Karte scannen', listening: 'Höre zu...',
    variantConfirmed: '✓ Variante bestätigt', premiumVariant: '⚠ Premium-Variante — vor Preisgestaltung prüfen',
    recentSearches: 'Letzte Suchen', results: 'Ergebnisse', priceHistory: 'Preisverlauf',
    priceHistoryNote: 'Historische Daten via TCGPlayer API beim Start.',
    sortBy: 'Sortieren:', sortName: 'Name', sortPrice: 'Preis', sortSet: 'Set',
    darkMode: 'Dunkelmodus', appearance: 'Erscheinungsbild', noResults: 'Keine Ergebnisse.',
  },
};

const CONDITIONS = [
  { label: 'Poor', multiplier: 0.1 },
  { label: 'HP', multiplier: 0.25 },
  { label: 'MP', multiplier: 0.45 },
  { label: 'LP', multiplier: 0.65 },
  { label: 'GD', multiplier: 0.8 },
  { label: 'NM', multiplier: 0.9 },
  { label: 'Mint', multiplier: 1.0 },
];

const CONDITION_COLORS = ['#e63946', '#e63946', '#f4a261', '#f4a261', '#a8c686', '#4caf50', '#2e7d32'];

const CARD_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', label: 'Korean', flag: '🇰🇷' },
  { code: 'zh-hant', label: 'Chinese (T)', flag: '🇹🇼' },
  { code: 'zh-hans', label: 'Chinese (S)', flag: '🇨🇳' },
  { code: 'de', label: 'German', flag: '🇩🇪' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'it', label: 'Italian', flag: '🇮🇹' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'pt', label: 'Portuguese', flag: '🇵🇹' },
  { code: 'nl', label: 'Dutch', flag: '🇳🇱' },
  { code: 'pl', label: 'Polish', flag: '🇵🇱' },
  { code: 'ru', label: 'Russian', flag: '🇷🇺' },
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', flag: '🇬🇧' },
  { code: 'AUD', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', symbol: 'C$', flag: '🇨🇦' },
  { code: 'JPY', symbol: '¥', flag: '🇯🇵' },
  { code: 'CHF', symbol: 'Fr', flag: '🇨🇭' },
  { code: 'KRW', symbol: '₩', flag: '🇰🇷' },
  { code: 'CNY', symbol: '¥', flag: '🇨🇳' },
  { code: 'BRL', symbol: 'R$', flag: '🇧🇷' },
  { code: 'PLN', symbol: 'zł', flag: '🇵🇱' },
  { code: 'SEK', symbol: 'kr', flag: '🇸🇪' },
];

const GRADERS = ['PSA', 'BGS', 'CGC', 'Other'];
const PSA_GRADES = ['1', '1.5', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const BGS_GRADES = ['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10'];
const CGC_GRADES = ['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10'];

const SEALED_CONDITIONS = [
  { label: 'Sealed (Mint)', multiplier: 1.0 },
  { label: 'Sealed (Damaged)', multiplier: 0.7 },
  { label: 'Open', multiplier: 0.4 },
];

const VARIANTS = [
  { key: '1st_edition', label: '1st Edition', premium: true },
  { key: 'shadowless', label: 'Shadowless', premium: true },
  { key: 'unlimited', label: 'Unlimited', premium: false },
  { key: 'reverse_holo', label: 'Reverse Holo', premium: false },
  { key: 'holo_rare', label: 'Holo Rare', premium: false },
  { key: 'special_illustration', label: 'Special Illus. Rare', premium: true },
  { key: 'promo', label: 'Promo', premium: false },
];

const SCREENS = { SEARCH: 'search', CARD: 'card', SEALED: 'sealed', BARTER: 'barter', BARTER_SEARCH: 'barter_search', SETTINGS: 'settings' };

const generateMockPriceHistory = (currentPrice, releaseDate) => {
  if (!currentPrice || !releaseDate) return [];
  const start = new Date(releaseDate);
  const now = new Date();
  const months = Math.max(1, Math.round((now - start) / (1000 * 60 * 60 * 24 * 30)));
  const points = Math.min(months, 24);
  const data = [];
  let price = currentPrice * (0.4 + Math.random() * 0.4);
  for (let i = 0; i <= points; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + Math.round((i / points) * months));
    price = price * (0.85 + Math.random() * 0.3);
    if (i === points) price = currentPrice;
    data.push({ date: d.toLocaleDateString('en', { month: 'short', year: '2-digit' }), price: Math.max(0.25, price) });
  }
  return data;
};

const MiniChart = ({ data, currentPrice, theme }) => {
  if (!data || data.length < 2) return null;
  const chartWidth = SCREEN_WIDTH - 80;
  const chartHeight = 80;
  const padding = 10;
  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || 1;
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - ((d.price - minPrice) / range) * (chartHeight - padding * 2);
    return `${x},${y}`;
  }).join(' ');
  const firstPrice = data[0].price;
  const trending = currentPrice >= firstPrice;
  const color = trending ? '#4caf50' : '#e63946';
  return (
    <View>
      <svg width={chartWidth} height={chartHeight} style={{ display: 'block' }}>
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = padding + (i / (data.length - 1)) * (chartWidth - padding * 2);
          const y = chartHeight - padding - ((d.price - minPrice) / range) * (chartHeight - padding * 2);
          return i === 0 || i === data.length - 1 ? <circle key={i} cx={x} cy={y} r="3" fill={color} /> : null;
        })}
      </svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <Text style={{ fontSize: 11, color: theme.textMuted }}>{data[0].date}</Text>
        <Text style={{ fontSize: 13, fontWeight: 'bold', color }}>{trending ? '▲' : '▼'} {Math.abs(((currentPrice - firstPrice) / firstPrice) * 100).toFixed(0)}%</Text>
        <Text style={{ fontSize: 11, color: theme.textMuted }}>{data[data.length - 1].date}</Text>
      </View>
    </View>
  );
};

export default function App() {
  const systemScheme = useColorScheme();
  const [darkMode, setDarkMode] = useState(false);
  const theme = darkMode ? DARK : LIGHT;

  const [screen, setScreen] = useState(SCREENS.SEARCH);
  const [appLang, setAppLang] = useState('en');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [anchorSource, setAnchorSource] = useState('tcgplayer');
  const [conditionIndex, setConditionIndex] = useState(5);
  const [percentage, setPercentage] = useState(80);
  const [sealedPercentage, setSealedPercentage] = useState(80);
const [gradedPercentage, setGradedPercentage] = useState(70);
  const [listening, setListening] = useState(false);
  const [cardLanguage, setCardLanguage] = useState('en');
  const [exchangeRates, setExchangeRates] = useState({});
  const [ratesLoading, setRatesLoading] = useState(false);
  const [isGraded, setIsGraded] = useState(false);
  const [selectedGrader, setSelectedGrader] = useState('PSA');
  const [selectedGrade, setSelectedGrade] = useState('9');
  const [certNumber, setCertNumber] = useState('');
  const [certLoading, setCertLoading] = useState(false);
  const [certResult, setCertResult] = useState(null);
  const [sealedQuery, setSealedQuery] = useState('');
  const [sealedProduct, setSealedProduct] = useState(null);
  const [sealedConditionIndex, setSealedConditionIndex] = useState(0);
  const [sealedLoading, setSealedLoading] = useState(false);
  const [myDeck, setMyDeck] = useState([]);
  const [savedTrades, setSavedTrades] = useState([]);
const [showSavedTrades, setShowSavedTrades] = useState(false);
  const [theirDeck, setTheirDeck] = useState([]);
  const [barterTarget, setBarterTarget] = useState('my');
  const [barterQuery, setBarterQuery] = useState('');
  const [barterResults, setBarterResults] = useState([]);
  const [barterLoading, setBarterLoading] = useState(false);
  const [barterConditionIndex, setBarterConditionIndex] = useState(5);
  const [myPercentage, setMyPercentage] = useState(80);
  const [theirPercentage, setTheirPercentage] = useState(80);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);
  const [searchError, setSearchError] = useState('');
  const [ebayPrices, setEbayPrices] = useState({});

  const t = TRANSLATIONS[appLang];

  useEffect(() => {
    loadPercentage();
    fetchExchangeRates();
    loadSettings();
    loadRecentSearches();
    loadSavedTrades();
  }, []);

  const loadSettings = async () => {
    try {
      const lang = await AsyncStorage.getItem('app_language');
      if (lang) setAppLang(lang);
      const cardLang = await AsyncStorage.getItem('card_language');
      if (cardLang) setCardLanguage(cardLang);
      const dark = await AsyncStorage.getItem('dark_mode');
      if (dark !== null) setDarkMode(dark === 'true');
    } catch (e) {}
  };

  const saveAppLang = async (lang) => {
    setAppLang(lang);
    await AsyncStorage.setItem('app_language', lang);
  };

  const saveCardLanguage = async (lang) => {
    setCardLanguage(lang);
    await AsyncStorage.setItem('card_language', lang);
  };

  const toggleDarkMode = async () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    await AsyncStorage.setItem('dark_mode', String(newVal));
  };

  const loadRecentSearches = async () => {
    try {
      const val = await AsyncStorage.getItem('recent_searches');
      if (val) setRecentSearches(JSON.parse(val));
    } catch (e) {}
  };

  const saveRecentSearch = async (searchQuery) => {
    try {
      const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10);
      setRecentSearches(updated);
      await AsyncStorage.setItem('recent_searches', JSON.stringify(updated));
    } catch (e) {}
  };

  useSpeechRecognitionEvent('result', (event) => {
    if (event.results[0]) setQuery(event.results[0].transcript);
  });

  useSpeechRecognitionEvent('end', () => {
    setListening(false);
    searchCards();
  });

  const startListening = async () => {
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) { alert('Microphone permission required.'); return; }
    setListening(true);
    ExpoSpeechRecognitionModule.start({ lang: 'en-US', interimResults: false });
  };

  const openCamera = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) { alert('Camera permission required.'); return; }
    }
    setCameraOpen(true);
  };

  const fetchExchangeRates = async () => {
    setRatesLoading(true);
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await response.json();
      if (data.rates) setExchangeRates(data.rates);
    } catch (error) { console.error('Failed to fetch exchange rates', error); }
    setRatesLoading(false);
  };

  const convertPrice = (usdPrice, currencyCode) => {
    if (!usdPrice || !exchangeRates[currencyCode]) return null;
    return usdPrice * exchangeRates[currencyCode];
  };

  const loadSavedTrades = async () => {
    try {
      const val = await AsyncStorage.getItem('saved_trades');
      if (val) setSavedTrades(JSON.parse(val));
    } catch (e) {}
  };

  const saveTrade = async () => {
    try {
      const trade = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        myDeck,
        theirDeck,
        myTotal,
        theirTotal,
        delta,
        myPercentage,
        theirPercentage,
      };
      const updated = [trade, ...savedTrades].slice(0, 20);
      setSavedTrades(updated);
      await AsyncStorage.setItem('saved_trades', JSON.stringify(updated));
      alert('Trade saved!');
    } catch (e) {
      alert('Failed to save trade.');
    }
  };

  const deleteSavedTrade = async (id) => {
    const updated = savedTrades.filter(t => t.id !== id);
    setSavedTrades(updated);
    await AsyncStorage.setItem('saved_trades', JSON.stringify(updated));
  };
  const loadPercentage = async () => {
    try {
      const value = await AsyncStorage.getItem('vendor_percentage');
      if (value !== null) setPercentage(Number(value));
      const sealedValue = await AsyncStorage.getItem('sealed_percentage');
      if (sealedValue !== null) setSealedPercentage(Number(sealedValue));
      const gradedValue = await AsyncStorage.getItem('graded_percentage');
      if (gradedValue !== null) setGradedPercentage(Number(gradedValue));
    } catch (error) {}
  };

  const savePercentage = async (newPercentage) => {
    setPercentage(newPercentage);
    await AsyncStorage.setItem('vendor_percentage', String(newPercentage));
  };

  const saveSealedPercentage = async (newPercentage) => {
    setSealedPercentage(newPercentage);
    await AsyncStorage.setItem('sealed_percentage', String(newPercentage));
  };

  const saveGradedPercentage = async (newPercentage) => {
    setGradedPercentage(newPercentage);
    await AsyncStorage.setItem('graded_percentage', String(newPercentage));
  };

  const [loadingProgress, setLoadingProgress] = useState('');

  const fetchAllCards = async (searchQuery) => {
    let allCards = [];
    let page = 1;
    let totalCount = 0;
    do {
      const response = await fetch(
        `https://api.pokemontcg.io/v2/cards?q=name:*${encodeURIComponent(searchQuery)}*&pageSize=250&page=${page}&orderBy=name`
      );
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      totalCount = data.totalCount || 0;
      allCards = [...allCards, ...(data.data || [])];
      setLoadingProgress(`Loading ${allCards.length} of ${totalCount} cards...`);
      page++;
    } while (allCards.length < totalCount && page <= 20);
    setLoadingProgress('');
    return allCards;
  };

  const getSortedResults = (cards) => {
    if (sortBy === 'price') return [...cards].sort((a, b) => (getCardPrice(b) || 0) - (getCardPrice(a) || 0));
    if (sortBy === 'set') return [...cards].sort((a, b) => a.set.name.localeCompare(b.set.name));
    return [...cards].sort((a, b) => a.name.localeCompare(b.name));
  };

  const searchCards = async (overrideQuery) => {
    const q = overrideQuery || query;
    if (!q.trim()) return;
    setLoading(true);
    setSelectedCard(null);
    setSearchError('');
    try {
      const allCards = await fetchAllCards(q);
      setResults(allCards);
      if (allCards.length === 0) setSearchError(t.noResults);
      await saveRecentSearch(q.trim());
    } catch (error) {
      setSearchError('Search failed. Please check your connection.');
    }
    setLoading(false);
  };

  const searchBarterCards = async () => {
    if (!barterQuery.trim()) return;
    setBarterLoading(true);
    try {
      const allCards = await fetchAllCards(barterQuery);
      setBarterResults(allCards);
    } catch (error) { console.error(error); }
    setBarterLoading(false);
  };

  const getCardPrice = (card) => {
    if (!card.tcgplayer || !card.tcgplayer.prices) return 0;
    const prices = card.tcgplayer.prices;
    if (prices.holofoil) return prices.holofoil.market || 0;
    if (prices.normal) return prices.normal.market || 0;
    if (prices.reverseHolofoil) return prices.reverseHolofoil.market || 0;
    return 0;
  };

  const [barterItemType, setBarterItemType] = useState('raw'); // 'raw', 'graded', 'sealed'
  const [barterGrader, setBarterGrader] = useState('PSA');
  const [barterGrade, setBarterGrade] = useState('9');
  const [barterSealedCondIndex, setBarterSealedCondIndex] = useState(0);

  const addToDeck = (card) => {
    const price = getCardPrice(card);
    let condMult = 1.0;
    let conditionLabel = '';

    if (barterItemType === 'raw') {
      condMult = CONDITIONS[barterConditionIndex].multiplier;
      conditionLabel = CONDITIONS[barterConditionIndex].label;
    } else if (barterItemType === 'graded') {
      condMult = 1.0;
      conditionLabel = `${barterGrader} ${barterGrade}`;
    } else if (barterItemType === 'sealed') {
      condMult = SEALED_CONDITIONS[barterSealedCondIndex].multiplier;
      conditionLabel = SEALED_CONDITIONS[barterSealedCondIndex].label;
    }

    const entry = {
      id: `${card.id}_${Date.now()}`,
      card,
      itemType: barterItemType,
      conditionIndex: barterConditionIndex,
      condition: conditionLabel,
      price,
      vendorPrice: price * ((barterTarget === 'my' ? myPercentage : theirPercentage) / 100) * condMult,
    };
    if (barterTarget === 'my') setMyDeck(prev => [...prev, entry]);
    else setTheirDeck(prev => [...prev, entry]);
    setScreen(SCREENS.BARTER);
    setBarterQuery('');
    setBarterResults([]);
  };

  const removeFromDeck = (deck, id) => {
    if (deck === 'my') setMyDeck(prev => prev.filter(e => e.id !== id));
    else setTheirDeck(prev => prev.filter(e => e.id !== id));
  };

  const getDeckTotal = (deck, pct) => deck.reduce((sum, e) => {
    const condMult = CONDITIONS[e.conditionIndex].multiplier;
    return sum + (e.price * (pct / 100) * condMult);
  }, 0);
  const myTotal = getDeckTotal(myDeck, myPercentage);
  const theirTotal = getDeckTotal(theirDeck, theirPercentage);
  const delta = myTotal - theirTotal;

  const selectCard = (card) => {
    setSelectedCard(card);
    setAnchorSource('tcgplayer');
    setConditionIndex(5);
    setIsGraded(false);
    setCertNumber('');
    setCertResult(null);
    setSelectedVariant(null);
    const currentPrice = getCardPrice(card);
    const history = generateMockPriceHistory(currentPrice, card.set?.releaseDate);
    setPriceHistory(history);
    setScreen(SCREENS.CARD);
    fetchEbayPrice(card.name);
  };

  const lookupCert = async () => {
    if (!certNumber.trim()) return;
    setCertLoading(true);
    setCertResult(null);
    await new Promise(r => setTimeout(r, 800));
    setCertResult({ message: `${selectedGrader} cert lookup requires API agreement. Grade ${selectedGrade} recorded manually.` });
    setCertLoading(false);
  };

  const getGrades = () => {
    if (selectedGrader === 'PSA') return PSA_GRADES;
    if (selectedGrader === 'BGS') return BGS_GRADES;
    return CGC_GRADES;
  };

  const getEbayToken = async () => {
    try {
      const clientId = process.env.EXPO_PUBLIC_EBAY_CLIENT_ID;
      const clientSecret = process.env.EXPO_PUBLIC_EBAY_CLIENT_SECRET;
      const credentials = btoa(`${clientId}:${clientSecret}`);
      const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
      });
      const data = await response.json();
      return data.access_token;
    } catch (e) {
      console.error('eBay token error', e);
      return null;
    }
  };

  const fetchEbayPrice = async (cardName) => {
    try {
      const token = await getEbayToken();
      if (!token) return;
      const query = encodeURIComponent(`${cardName} pokemon card`);
      const response = await fetch(
        `https://api.ebay.com/buy/marketplace-insights/v1_beta/item_sales/search?q=${query}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await response.json();
      if (data.itemSales && data.itemSales.length > 0) {
        const prices = data.itemSales
          .map(item => parseFloat(item.lastSoldPrice?.value || 0))
          .filter(p => p > 0);
        if (prices.length > 0) {
          const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
          const recent = parseFloat(data.itemSales[0].lastSoldPrice?.value || 0);
          setEbayPrices(prev => ({
            ...prev,
            [cardName]: { sold: recent, avg30: avg }
          }));
        }
      }
    } catch (e) {
      console.error('eBay fetch error', e);
    }
  };

  const getPrice = (card, source) => {
    if (source === 'tcgplayer') {
      if (!card.tcgplayer || !card.tcgplayer.prices) return null;
      const prices = card.tcgplayer.prices;
      if (prices.holofoil) return prices.holofoil.market;
      if (prices.normal) return prices.normal.market;
      if (prices.reverseHolofoil) return prices.reverseHolofoil.market;
      return null;
    }
    if (source === 'ebay_sold') {
      return ebayPrices[card.name]?.sold || null;
    }
    if (source === 'ebay_30day') {
      return ebayPrices[card.name]?.avg30 || null;
    }
    return null;
  };

  const getAnchorPrice = () => getPrice(selectedCard, anchorSource);
  const conditionMultiplier = isGraded ? 1.0 : CONDITIONS[conditionIndex].multiplier;
  const anchorPrice = selectedCard ? getAnchorPrice() : null;
  const activePercentage = isGraded ? gradedPercentage : percentage;
  const vendorPrice = anchorPrice ? anchorPrice * (activePercentage / 100) * conditionMultiplier : null;
  const isPhase2Language = !['en', 'ja'].includes(cardLanguage);

  const sourceLabel = {
    tcgplayer: 'TCGPlayer', pricecharting: 'PriceCharting',
    ebay_sold: 'eBay Sold', ebay_30day: 'eBay 30-Day',
    yahoo_japan: 'Yahoo Japan', mercari_japan: 'Mercari JP',
  };

  const availableSources = cardLanguage === 'ja'
    ? ['yahoo_japan', 'mercari_japan', 'pricecharting']
    : ['tcgplayer', 'pricecharting', 'ebay_sold', 'ebay_30day'];

  const formatCurrency = (amount, code) => {
    if (amount === null) return 'N/A';
    if (code === 'JPY' || code === 'KRW') return `${CURRENCIES.find(c => c.code === code)?.symbol}${Math.round(amount).toLocaleString()}`;
    return `${CURRENCIES.find(c => c.code === code)?.symbol}${amount.toFixed(2)}`;
  };

  const renderHeader = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
      <Text style={[styles.title, { color: theme.text, flex: 1, marginBottom: 0, textAlign: 'left' }]}>TCG Market Master</Text>
      <TouchableOpacity
        style={{ padding: 8, borderRadius: 10, backgroundColor: screen === SCREENS.SETTINGS ? theme.accent : theme.chip }}
        onPress={() => setScreen(screen === SCREENS.SETTINGS ? SCREENS.SEARCH : SCREENS.SETTINGS)}
      >
        <Text style={{ fontSize: 20 }}>⚙️</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTabBar = () => {
    const tabs = [
      { screen: SCREENS.SEARCH, icon: '🔍', label: 'Singles', active: screen === SCREENS.SEARCH || screen === SCREENS.CARD },
      { screen: SCREENS.SEALED, icon: '📦', label: 'Sealed', active: screen === SCREENS.SEALED },
      { screen: SCREENS.BARTER, icon: '🤝', label: 'Barter', active: screen === SCREENS.BARTER || screen === SCREENS.BARTER_SEARCH },
    ];
    return (
      <View style={{ flexDirection: 'row', marginBottom: 15, backgroundColor: theme.tabBg, borderRadius: 16, padding: 4, borderWidth: 1, borderColor: theme.cardBorder }}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.screen}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: tab.active ? theme.accent : 'transparent' }}
            onPress={() => setScreen(tab.screen)}
          >
            <Text style={{ fontSize: 18 }}>{tab.icon}</Text>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: tab.active ? '#fff' : theme.textSecondary, marginTop: 2 }}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (screen === SCREENS.SETTINGS) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {renderHeader()}
        {renderTabBar()}
        <ScrollView>
          <Text style={[styles.sectionTitle, { color: theme.sectionTitle }]}>{t.appearance}</Text>
          <TouchableOpacity style={[styles.darkModeRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} onPress={toggleDarkMode}>
            <Text style={[styles.darkModeLabel, { color: theme.text }]}>{t.darkMode}</Text>
            <View style={[styles.toggle, { backgroundColor: darkMode ? theme.accent : theme.cardBorder }]}>
              <View style={[styles.toggleKnob, { marginLeft: darkMode ? 20 : 2 }]} />
            </View>
          </TouchableOpacity>
          <Text style={[styles.sectionTitle, { color: theme.sectionTitle }]}>{t.appLanguage}</Text>
          <View style={styles.settingsLangGrid}>
            {APP_LANGUAGES.map((lang) => (
              <TouchableOpacity key={lang.code} style={[styles.settingsLangButton, { borderColor: appLang === lang.code ? theme.accent : theme.cardBorder, backgroundColor: appLang === lang.code ? theme.accentLight : theme.card }]} onPress={() => saveAppLang(lang.code)}>
                <Text style={styles.settingsLangFlag}>{lang.flag}</Text>
                <Text style={[styles.settingsLangLabel, { color: appLang === lang.code ? theme.accent : theme.text }]}>{lang.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.sectionTitle, { color: theme.sectionTitle }]}>{t.cardLanguage}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.languageRow}>
              {CARD_LANGUAGES.map((lang) => (
                <TouchableOpacity key={lang.code} style={[styles.langButton, { borderColor: cardLanguage === lang.code ? theme.accent : theme.cardBorder, backgroundColor: cardLanguage === lang.code ? theme.accentLight : theme.card }]} onPress={() => saveCardLanguage(lang.code)}>
                  <Text style={styles.langFlag}>{lang.flag}</Text>
                  <Text style={[styles.langLabel, { color: cardLanguage === lang.code ? theme.accent : theme.textSecondary }]}>{lang.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          {isPhase2Language && <Text style={[styles.phase2Note, { color: theme.variantBorder }]}>{t.phase2Note}</Text>}

          <Text style={[styles.sectionTitle, { color: theme.sectionTitle }]}>Vendor Price Defaults</Text>

          <View style={[styles.darkModeRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.darkModeLabel, { color: theme.text }]}>Singles</Text>
            <Text style={[styles.percentageValue, { color: theme.accent }]}>{percentage}%</Text>
          </View>
          <View style={styles.sliderRow}>
            <Text style={[styles.sliderLabel, { color: theme.textMuted }]}>10%</Text>
            <Slider style={styles.slider} minimumValue={10} maximumValue={100} step={5} value={percentage} onValueChange={(val) => savePercentage(val)} minimumTrackTintColor={theme.accent} maximumTrackTintColor={theme.cardBorder} thumbTintColor={theme.accent} />
            <Text style={[styles.sliderLabel, { color: theme.textMuted }]}>100%</Text>
          </View>

          <View style={[styles.darkModeRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.darkModeLabel, { color: theme.text }]}>Sealed Products</Text>
            <Text style={[styles.percentageValue, { color: theme.accent }]}>{sealedPercentage}%</Text>
          </View>
          <View style={styles.sliderRow}>
            <Text style={[styles.sliderLabel, { color: theme.textMuted }]}>10%</Text>
            <Slider style={styles.slider} minimumValue={10} maximumValue={100} step={5} value={sealedPercentage} onValueChange={(val) => saveSealedPercentage(val)} minimumTrackTintColor={theme.accent} maximumTrackTintColor={theme.cardBorder} thumbTintColor={theme.accent} />
            <Text style={[styles.sliderLabel, { color: theme.textMuted }]}>100%</Text>
          </View>

          <View style={[styles.darkModeRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.darkModeLabel, { color: theme.text }]}>Graded Cards</Text>
            <Text style={[styles.percentageValue, { color: theme.accent }]}>{gradedPercentage}%</Text>
          </View>
          <View style={styles.sliderRow}>
            <Text style={[styles.sliderLabel, { color: theme.textMuted }]}>10%</Text>
            <Slider style={styles.slider} minimumValue={10} maximumValue={100} step={5} value={gradedPercentage} onValueChange={(val) => saveGradedPercentage(val)} minimumTrackTintColor={theme.accent} maximumTrackTintColor={theme.cardBorder} thumbTintColor={theme.accent} />
            <Text style={[styles.sliderLabel, { color: theme.textMuted }]}>100%</Text>
          </View>

        </ScrollView>
      </View>
    );
  }

  if (screen === SCREENS.BARTER_SEARCH) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <Text style={[styles.title, { color: theme.text }]}>{t.title}</Text>
        {renderTabBar()}
        <TouchableOpacity onPress={() => setScreen(SCREENS.BARTER)}>
          <Text style={[styles.back, { color: theme.accent }]}>{t.backTrade}</Text>
        </TouchableOpacity>
        <Text style={[styles.sectionTitle, { color: theme.sectionTitle }]}>{t.addingTo} {barterTarget === 'my' ? t.yourDeck : t.theirDeck}</Text>

        {/* Item Type Selector */}
        <View style={{ flexDirection: 'row', marginBottom: 12, gap: 8 }}>
          {['raw', 'graded', 'sealed'].map((type) => (
            <TouchableOpacity key={type} style={{ flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center', borderColor: barterItemType === type ? theme.accent : theme.cardBorder, backgroundColor: barterItemType === type ? theme.accent : theme.card }} onPress={() => setBarterItemType(type)}>
              <Text style={{ color: barterItemType === type ? '#fff' : theme.textSecondary, fontWeight: 'bold', fontSize: 12 }}>
                {type === 'raw' ? '🃏 Raw' : type === 'graded' ? '🏆 Graded' : '📦 Sealed'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Raw card condition */}
        {barterItemType === 'raw' && (
          <View style={styles.conditionRow}>
            {CONDITIONS.map((c, i) => (
              <TouchableOpacity key={c.label} style={[styles.conditionButton, { backgroundColor: barterConditionIndex === i ? CONDITION_COLORS[i] : theme.chip }]} onPress={() => setBarterConditionIndex(i)}>
                <Text style={[styles.conditionText, { color: barterConditionIndex === i ? '#fff' : theme.textSecondary }]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Graded card options */}
        {barterItemType === 'graded' && (
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              {GRADERS.map((g) => (
                <TouchableOpacity key={g} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: barterGrader === g ? theme.accent : theme.cardBorder, backgroundColor: barterGrader === g ? theme.accent : theme.card }} onPress={() => setBarterGrader(g)}>
                  <Text style={{ color: barterGrader === g ? '#fff' : theme.textSecondary, fontWeight: 'bold' }}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {PSA_GRADES.map((g) => (
                  <TouchableOpacity key={g} style={{ width: 44, height: 44, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', borderColor: barterGrade === g ? theme.accent : theme.cardBorder, backgroundColor: barterGrade === g ? theme.accent : theme.card }} onPress={() => setBarterGrade(g)}>
                    <Text style={{ color: barterGrade === g ? '#fff' : theme.textSecondary, fontWeight: 'bold' }}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Sealed condition */}
        {barterItemType === 'sealed' && (
          <View style={{ marginBottom: 12 }}>
            {SEALED_CONDITIONS.map((c, i) => (
              <TouchableOpacity key={c.label} style={{ padding: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center', marginBottom: 6, borderColor: barterSealedCondIndex === i ? theme.accent : theme.cardBorder, backgroundColor: barterSealedCondIndex === i ? theme.accent : theme.card }} onPress={() => setBarterSealedCondIndex(i)}>
                <Text style={{ color: barterSealedCondIndex === i ? '#fff' : theme.textSecondary, fontWeight: 'bold' }}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={styles.searchRow}>
          <TouchableOpacity style={[styles.cameraButton, { backgroundColor: theme.chip }]} onPress={openCamera}>
            <Text style={styles.micIcon}>📷</Text>
          </TouchableOpacity>
          <TextInput style={[styles.input, { backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]} placeholder={t.searchPlaceholder} placeholderTextColor={theme.textMuted} value={barterQuery} onChangeText={setBarterQuery} onSubmitEditing={searchBarterCards} returnKeyType="search" />
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.accent }]} onPress={searchBarterCards}>
            <Text style={styles.buttonText}>{t.search}</Text>
          </TouchableOpacity>
        </View>

        {cameraOpen && (
          <View style={styles.cameraContainer}>
            <CameraView style={styles.camera} facing="back">
              <View style={styles.cameraOverlay}>
                <View style={styles.cameraFrame} />
                <Text style={styles.cameraHint}>Point at card to identify</Text>
                <TouchableOpacity style={styles.cameraClose} onPress={() => setCameraOpen(false)}>
                  <Text style={styles.cameraCloseText}>✕ Close Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cameraScanButton} onPress={() => { setCameraOpen(false); alert('Camera card recognition coming in final build. Use search for now.'); }}>
                  <Text style={styles.cameraScanButtonText}>📷 Scan Card</Text>
                </TouchableOpacity>
              </View>
            </CameraView>
          </View>
        )}
        {barterLoading && <ActivityIndicator size="large" color={theme.accent} />}
        <FlatList
          data={barterResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => addToDeck(item)}>
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Image source={{ uri: item.images.small }} style={styles.cardImage} />
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardName, { color: theme.text }]}>{item.name}</Text>
                  <Text style={[styles.cardSet, { color: theme.textSecondary }]}>{item.set.name}</Text>
                  <Text style={[styles.cardNumber, { color: theme.textMuted }]}>#{item.number} — ${getCardPrice(item).toFixed(2)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  if (screen === SCREENS.BARTER) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {renderHeader()}
        {renderTabBar()}
        <ScrollView>
          <View style={styles.barterContainer}>
            <View style={styles.deckColumn}>
              <Text style={[styles.deckTitle, { color: theme.accent }]}>{t.yourDeck} ({myDeck.length})</Text>
              {myDeck.map((entry) => (
                <View key={entry.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.deckCard, borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: theme.cardBorder }}>
                  <Image source={{ uri: entry.card.images.small }} style={{ width: 44, height: 62, borderRadius: 4 }} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 14 }} numberOfLines={1}>{entry.card.name}</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>{entry.card.set?.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
                      <View style={{ backgroundColor: theme.chip, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ color: theme.chipText, fontSize: 11, fontWeight: 'bold' }}>{entry.condition}</Text>
                      </View>
                      <Text style={{ color: theme.accent, fontWeight: 'bold', fontSize: 14 }}>${(entry.price * (entry.itemType === 'raw' ? CONDITIONS[entry.conditionIndex]?.multiplier || 1 : 1) * ((entry.id.includes('my') ? myPercentage : theirPercentage) / 100)).toFixed(2)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => removeFromDeck('my', entry.id)} style={{ padding: 8 }}>
                    <Text style={{ color: theme.textMuted, fontSize: 20 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={[styles.addCardButton, { borderColor: theme.accent }]} onPress={() => { setBarterTarget('my'); setScreen(SCREENS.BARTER_SEARCH); }}>
                <Text style={[styles.addCardButtonText, { color: theme.accent }]}>{t.addCard}</Text>
              </TouchableOpacity>
              <Text style={[styles.percentageValue, { color: theme.accent }]}>{myPercentage}%</Text>
              <View style={styles.sliderRow}>
                <Text style={[styles.sliderLabel, { color: theme.textMuted }]}>10%</Text>
                <Slider style={styles.slider} minimumValue={10} maximumValue={100} step={1} value={myPercentage} onValueChange={(val) => setMyPercentage(val)} minimumTrackTintColor={theme.accent} maximumTrackTintColor={theme.cardBorder} thumbTintColor={theme.accent} />
                <Text style={[styles.sliderLabel, { color: theme.textMuted }]}>100%</Text>
              </View>
              <Text style={[styles.deckTotal, { color: theme.text }]}>{t.total} ${myTotal.toFixed(2)}</Text>
            </View>
            <View style={[styles.deckDivider, { backgroundColor: theme.cardBorder }]} />
            <View style={styles.deckColumn}>
              <Text style={[styles.deckTitle, { color: theme.accent }]}>{t.theirDeck} ({theirDeck.length})</Text>
              {theirDeck.map((entry) => (
                <View key={entry.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.deckCard, borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: theme.cardBorder }}>
                  <Image source={{ uri: entry.card.images.small }} style={{ width: 44, height: 62, borderRadius: 4 }} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 14 }} numberOfLines={1}>{entry.card.name}</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>{entry.card.set?.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
                      <View style={{ backgroundColor: theme.chip, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ color: theme.chipText, fontSize: 11, fontWeight: 'bold' }}>{entry.condition}</Text>
                      </View>
                      <Text style={{ color: theme.accent, fontWeight: 'bold', fontSize: 14 }}>${(entry.price * (entry.itemType === 'raw' ? CONDITIONS[entry.conditionIndex]?.multiplier || 1 : 1) * (theirPercentage / 100)).toFixed(2)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => removeFromDeck('their', entry.id)} style={{ padding: 8 }}>
                    <Text style={{ color: theme.textMuted, fontSize: 20 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={[styles.addCardButton, { borderColor: theme.accent }]} onPress={() => { setBarterTarget('their'); setScreen(SCREENS.BARTER_SEARCH); }}>
                <Text style={[styles.addCardButtonText, { color: theme.accent }]}>{t.addCard}</Text>
              </TouchableOpacity>
              <Text style={[styles.percentageValue, { color: theme.accent }]}>{theirPercentage}%</Text>
              <View style={styles.sliderRow}>
                <Text style={[styles.sliderLabel, { color: theme.textMuted }]}>10%</Text>
                <Slider style={styles.slider} minimumValue={10} maximumValue={100} step={1} value={theirPercentage} onValueChange={(val) => setTheirPercentage(val)} minimumTrackTintColor={theme.accent} maximumTrackTintColor={theme.cardBorder} thumbTintColor={theme.accent} />
                <Text style={[styles.sliderLabel, { color: theme.textMuted }]}>100%</Text>
              </View>
              <Text style={[styles.deckTotal, { color: theme.text }]}>{t.total} ${theirTotal.toFixed(2)}</Text>
            </View>
          </View>
          <View style={[styles.deltaBox, { backgroundColor: delta === 0 ? theme.deltaClean : delta > 0 ? theme.deltaPos : theme.deltaNeg }]}>
            {delta === 0 ? (
              <Text style={[styles.deltaText, { color: theme.text }]}>{t.cleanTrade}</Text>
            ) : delta > 0 ? (
              <Text style={[styles.deltaText, { color: theme.text }]}>{t.theyAdd} ${Math.abs(delta).toFixed(2)} {t.cash}</Text>
            ) : (
              <Text style={[styles.deltaText, { color: theme.text }]}>{t.youAdd} ${Math.abs(delta).toFixed(2)} {t.cash}</Text>
            )}
          </View>
          <TouchableOpacity style={[styles.clearButton, { borderColor: theme.clearButton }]} onPress={() => { setMyDeck([]); setTheirDeck([]); }}>
            <Text style={[styles.clearButtonText, { color: theme.textMuted }]}>{t.clearTrade}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.clearButton, { borderColor: theme.accent }]} onPress={saveTrade}>
            <Text style={[styles.clearButtonText, { color: theme.accent }]}>💾 Save Trade Record</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.clearButton, { borderColor: theme.cardBorder }]} onPress={() => setShowSavedTrades(!showSavedTrades)}>
            <Text style={[styles.clearButtonText, { color: theme.textSecondary }]}>{showSavedTrades ? '▲ Hide Saved Trades' : '▼ View Saved Trades'}</Text>
          </TouchableOpacity>

          {showSavedTrades && (
            <View style={{ marginTop: 10 }}>
              {savedTrades.length === 0 ? (
                <Text style={{ color: theme.textMuted, textAlign: 'center', marginVertical: 20 }}>No saved trades yet.</Text>
              ) : (
                savedTrades.map((trade) => (
                  <View key={trade.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontWeight: 'bold', marginBottom: 4 }}>{trade.timestamp}</Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Your deck: ${trade.myTotal.toFixed(2)} ({trade.myDeck.length} cards)</Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Their deck: ${trade.theirTotal.toFixed(2)} ({trade.theirDeck.length} cards)</Text>
                      <Text style={{ color: trade.delta === 0 ? '#4caf50' : theme.accent, fontWeight: 'bold', marginTop: 4 }}>
                        {trade.delta === 0 ? '✅ Clean Trade' : trade.delta > 0 ? `They owe $${Math.abs(trade.delta).toFixed(2)}` : `You owe $${Math.abs(trade.delta).toFixed(2)}`}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => deleteSavedTrade(trade.id)}>
                      <Text style={{ color: theme.textMuted, fontSize: 18, paddingHorizontal: 8 }}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  if (screen === SCREENS.SEALED) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <Text style={[styles.title, { color: theme.text }]}>{t.title}</Text>
        {renderTabBar()}
        <ScrollView>
          <Text style={[styles.sectionTitle, { color: theme.sectionTitle }]}>{t.sealedLookup}</Text>
          <View style={styles.searchRow}>
            <TextInput style={[styles.input, { backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]} placeholder={t.sealedPlaceholder} placeholderTextColor={theme.textMuted} value={sealedQuery} onChangeText={setSealedQuery} returnKeyType="search" />
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.accent }]} onPress={async () => {
              if (!sealedQuery.trim()) return;
              setSealedLoading(true);
              setSealedProduct(null);
              await new Promise(r => setTimeout(r, 800));
              setSealedProduct({ name: sealedQuery, type: 'Booster Box', set: 'Unknown Set', note: 'PriceCharting API connection coming soon.' });
              setSealedLoading(false);
            }}>
              <Text style={styles.buttonText}>{t.search}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.barcodeButton, { borderColor: theme.accent }]}>
            <Text style={[styles.barcodeButtonText, { color: theme.accent }]}>{t.scanBarcode}</Text>
            <Text style={[styles.barcodeNote, { color: theme.textMuted }]}>{t.barcodeNote}</Text>
          </TouchableOpacity>
          {sealedLoading && <ActivityIndicator size="large" color={theme.accent} />}
          {sealedProduct && (
            <View style={[styles.sealedResult, { backgroundColor: theme.priceBox }]}>
              <Text style={[styles.sealedName, { color: theme.text }]}>{sealedProduct.name}</Text>
              <Text style={[styles.sealedType, { color: theme.textSecondary }]}>{sealedProduct.type} — {sealedProduct.set}</Text>
              <Text style={[styles.sectionTitle, { color: theme.sectionTitle }]}>{t.sealedCondition}</Text>
              <View style={styles.sealedConditionRow}>
                {SEALED_CONDITIONS.map((c, i) => (
                  <TouchableOpacity key={c.label} style={[styles.sealedCondButton, { borderColor: sealedConditionIndex === i ? theme.accent : theme.cardBorder, backgroundColor: sealedConditionIndex === i ? theme.accent : theme.card }]} onPress={() => setSealedConditionIndex(i)}>
                    <Text style={[styles.sealedCondText, { color: sealedConditionIndex === i ? '#fff' : theme.textSecondary }]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={[styles.priceBox, { backgroundColor: theme.priceBox }]}>
                <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>{t.marketPrice}</Text>
                <Text style={[styles.noPrice, { color: theme.textMuted }]}>{sealedProduct.note}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  const sortedResults = getSortedResults(results);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {renderHeader()}
      {renderTabBar()}

      {screen === SCREENS.SEARCH && (
        <>
          {cameraOpen ? (
            <View style={styles.cameraContainer}>
              <CameraView style={styles.camera} facing="back">
                <View style={styles.cameraOverlay}>
                  <View style={styles.cameraFrame} />
                  <Text style={styles.cameraHint}>{t.pointCamera}</Text>
                  <TouchableOpacity style={styles.cameraClose} onPress={() => setCameraOpen(false)}>
                    <Text style={styles.cameraCloseText}>{t.closeCamera}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cameraScanButton} onPress={() => { setCameraOpen(false); alert('Camera card recognition coming in final build.'); }}>
                    <Text style={styles.cameraScanButtonText}>{t.scanCard}</Text>
                  </TouchableOpacity>
                </View>
              </CameraView>
            </View>
          ) : (
            <View style={styles.searchRow}>
              <TouchableOpacity style={[styles.micButton, { backgroundColor: listening ? '#ffd6d6' : theme.chip }]} onPress={startListening}>
                <Text style={styles.micIcon}>{listening ? '🔴' : '🎤'}</Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.input, { backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]}
                placeholder={t.searchPlaceholder}
                placeholderTextColor={theme.textMuted}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => searchCards()}
                returnKeyType="search"
              />
              <TouchableOpacity style={[styles.cameraButton, { backgroundColor: theme.chip }]} onPress={openCamera}>
                <Text style={styles.micIcon}>📷</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, { backgroundColor: theme.accent }]} onPress={() => searchCards()}>
                <Text style={styles.buttonText}>{t.search}</Text>
              </TouchableOpacity>
            </View>
          )}
          {listening && <Text style={[styles.listeningText, { color: theme.accent }]}>{t.listening}</Text>}

          {results.length === 0 && !loading && !searchError && query.trim() === '' && (
            <View style={{ alignItems: 'center', paddingTop: 40, paddingHorizontal: 20 }}>
              <Text style={{ fontSize: 60, marginBottom: 16 }}>🃏</Text>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.text, marginBottom: 8, textAlign: 'center' }}>Welcome to TCG Market Master</Text>
              <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginBottom: 30, lineHeight: 22 }}>Search any card, check live prices, evaluate trades and manage your barter sessions.</Text>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 30 }}>
                <View style={{ alignItems: 'center', backgroundColor: theme.card, borderRadius: 12, padding: 16, flex: 1, borderWidth: 1, borderColor: theme.cardBorder }}>
                  <Text style={{ fontSize: 28 }}>💰</Text>
                  <Text style={{ color: theme.text, fontWeight: 'bold', marginTop: 6, fontSize: 12, textAlign: 'center' }}>Live Prices</Text>
                </View>
                <View style={{ alignItems: 'center', backgroundColor: theme.card, borderRadius: 12, padding: 16, flex: 1, borderWidth: 1, borderColor: theme.cardBorder }}>
                  <Text style={{ fontSize: 28 }}>🤝</Text>
                  <Text style={{ color: theme.text, fontWeight: 'bold', marginTop: 6, fontSize: 12, textAlign: 'center' }}>Barter Engine</Text>
                </View>
                <View style={{ alignItems: 'center', backgroundColor: theme.card, borderRadius: 12, padding: 16, flex: 1, borderWidth: 1, borderColor: theme.cardBorder }}>
                  <Text style={{ fontSize: 28 }}>🏆</Text>
                  <Text style={{ color: theme.text, fontWeight: 'bold', marginTop: 6, fontSize: 12, textAlign: 'center' }}>Graded Lookup</Text>
                </View>
              </View>
            </View>
          )}

          {results.length === 0 && !loading && recentSearches.length > 0 && !searchError && query.trim() === '' && (
            <View style={styles.recentContainer}>
              <Text style={[styles.recentTitle, { color: theme.textMuted }]}>{t.recentSearches}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.recentRow}>
                  {recentSearches.map((s, i) => (
                    <TouchableOpacity key={i} style={[styles.recentChip, { backgroundColor: theme.chip }]} onPress={() => { setQuery(s); searchCards(s); }}>
                      <Text style={[styles.recentChipText, { color: theme.chipText }]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {searchError ? (
            <View style={{ alignItems: 'center', marginVertical: 40 }}>
              <Text style={{ fontSize: 40 }}>⚠️</Text>
              <Text style={[styles.errorText, { color: theme.accent }]}>{searchError}</Text>
              <TouchableOpacity style={{ marginTop: 12, padding: 10, backgroundColor: theme.accent, borderRadius: 8 }} onPress={() => searchCards()}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : results.length > 0 && (
            <View style={styles.resultsHeader}>
              <Text style={[styles.resultsCount, { color: theme.textMuted }]}>{results.length} {t.results}</Text>
              <View style={styles.sortRow}>
                <Text style={[styles.sortLabel, { color: theme.textSecondary }]}>{t.sortBy}</Text>
                {['name', 'price', 'set'].map((s) => (
                  <TouchableOpacity key={s} style={[styles.sortButton, { borderColor: sortBy === s ? theme.accent : theme.cardBorder, backgroundColor: sortBy === s ? theme.accent : theme.card }]} onPress={() => setSortBy(s)}>
                    <Text style={[styles.sortButtonText, { color: sortBy === s ? '#fff' : theme.textSecondary }]}>
                      {s === 'name' ? t.sortName : s === 'price' ? t.sortPrice : t.sortSet}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {loading && (
            <View style={{ alignItems: 'center', marginVertical: 20 }}>
              <ActivityIndicator size="large" color={theme.accent} />
              {loadingProgress ? <Text style={{ color: theme.textMuted, marginTop: 8, fontSize: 13 }}>{loadingProgress}</Text> : null}
            </View>
          )}
          {!loading && results.length === 0 && !searchError && query.trim() !== '' && (
            <View style={{ alignItems: 'center', marginVertical: 40 }}>
              <Text style={{ fontSize: 40 }}>🔍</Text>
              <Text style={{ color: theme.textMuted, fontSize: 16, marginTop: 10 }}>No cards found for "{query}"</Text>
              <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 6 }}>Try a different name or set</Text>
            </View>
          )}
          <FlatList
            data={sortedResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => selectCard(item)}>
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <Image source={{ uri: item.images.small }} style={styles.cardImage} />
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardName, { color: theme.text }]}>{item.name}</Text>
                    <Text style={[styles.cardSet, { color: theme.textSecondary }]}>{item.set.name}</Text>
                    <Text style={[styles.cardNumber, { color: theme.textMuted }]}>#{item.number}</Text>
                  </View>
                  {getCardPrice(item) > 0 && (
                    <Text style={[styles.cardPriceTag, { color: theme.accent }]}>${getCardPrice(item).toFixed(2)}</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        </>
      )}

      {screen === SCREENS.CARD && selectedCard && (
        <ScrollView>
          <TouchableOpacity onPress={() => setScreen(SCREENS.SEARCH)}>
            <Text style={[styles.back, { color: theme.accent }]}>{t.back}</Text>
          </TouchableOpacity>
          <View style={styles.detailContainer}>
            <View style={[styles.languageBadge, { backgroundColor: theme.chip }]}>
              <Text style={[styles.languageBadgeText, { color: theme.chipText }]}>
                {CARD_LANGUAGES.find(l => l.code === cardLanguage)?.flag} {CARD_LANGUAGES.find(l => l.code === cardLanguage)?.label}
              </Text>
            </View>
            <Image source={{ uri: selectedCard.images.large }} style={styles.largeImage} />
            <Text style={[styles.cardName, { color: theme.text }]}>{selectedCard.name}</Text>
            <Text style={[styles.cardSet, { color: theme.textSecondary }]}>{selectedCard.set.name} — #{selectedCard.number}</Text>

            {priceHistory.length > 1 && (
              <View style={[styles.priceHistoryBox, { backgroundColor: theme.priceBox }]}>
                <Text style={[styles.priceHistoryTitle, { color: theme.text }]}>{t.priceHistory}</Text>
                <MiniChart data={priceHistory} currentPrice={getCardPrice(selectedCard)} theme={theme} />
                <Text style={[styles.priceHistoryNote, { color: theme.textMuted }]}>{t.priceHistoryNote}</Text>
              </View>
            )}

            <View style={[styles.variantBox, { backgroundColor: theme.variantBox, borderColor: theme.variantBorder }]}>
              <Text style={[styles.variantTitle, { color: '#c77b2e' }]}>{t.confirmVariant}</Text>
              <Text style={[styles.variantSubtitle, { color: theme.textMuted }]}>{t.variantSubtitle}</Text>
              <View style={styles.variantGrid}>
                {VARIANTS.map((variant) => (
                  <TouchableOpacity key={variant.key} style={[styles.variantButton, { borderColor: selectedVariant === variant.key ? theme.accent : variant.premium ? theme.variantBorder : theme.cardBorder, backgroundColor: selectedVariant === variant.key ? theme.accent : theme.card }]} onPress={() => setSelectedVariant(variant.key)}>
                    {variant.premium && <Text style={styles.variantPremiumBadge}>★ </Text>}
                    <Text style={[styles.variantLabel, { color: selectedVariant === variant.key ? '#fff' : theme.text }]}>{variant.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {selectedVariant && (
                <View style={[styles.variantSelected, { backgroundColor: darkMode ? '#2a2000' : '#fff3cd' }]}>
                  <Text style={[styles.variantSelectedText, { color: '#856404' }]}>
                    {['1st_edition', 'shadowless', 'special_illustration'].includes(selectedVariant) ? t.premiumVariant : t.variantConfirmed}
                  </Text>
                </View>
              )}
            </View>

            <View style={[styles.gradedToggleRow, { borderColor: theme.accent }]}>
              <TouchableOpacity style={[styles.gradedToggle, { backgroundColor: !isGraded ? theme.accent : theme.card }]} onPress={() => setIsGraded(false)}>
                <Text style={[styles.gradedToggleText, { color: !isGraded ? '#fff' : theme.accent }]}>{t.rawCard}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.gradedToggle, { backgroundColor: isGraded ? theme.accent : theme.card }]} onPress={() => setIsGraded(true)}>
                <Text style={[styles.gradedToggleText, { color: isGraded ? '#fff' : theme.accent }]}>{t.gradedCard}</Text>
              </TouchableOpacity>
            </View>

            {isGraded ? (
              <View style={[styles.gradedBox, { backgroundColor: theme.gradedBox }]}>
                <Text style={[styles.sectionTitle, { color: theme.sectionTitle }]}>{t.gradingCompany}</Text>
                <View style={styles.graderRow}>
                  {GRADERS.map((g) => (
                    <TouchableOpacity key={g} style={[styles.graderButton, { borderColor: selectedGrader === g ? theme.accent : theme.cardBorder, backgroundColor: selectedGrader === g ? theme.accent : theme.card }]} onPress={() => setSelectedGrader(g)}>
                      <Text style={[styles.graderText, { color: selectedGrader === g ? '#fff' : theme.textSecondary }]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.sectionTitle, { color: theme.sectionTitle }]}>{t.grade}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.gradeRow}>
                    {getGrades().map((g) => (
                      <TouchableOpacity key={g} style={[styles.gradeButton, { borderColor: selectedGrade === g ? theme.accent : theme.cardBorder, backgroundColor: selectedGrade === g ? theme.accent : theme.card }]} onPress={() => setSelectedGrade(g)}>
                        <Text style={[styles.gradeText, { color: selectedGrade === g ? '#fff' : theme.textSecondary }]}>{g}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                <Text style={[styles.sectionTitle, { color: theme.sectionTitle }]}>{t.certNumber}</Text>
                <View style={styles.certRow}>
                  <TextInput style={[styles.certInput, { backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]} placeholder={t.certPlaceholder} placeholderTextColor={theme.textMuted} value={certNumber} onChangeText={setCertNumber} keyboardType="numeric" />
                  <TouchableOpacity style={[styles.certButton, { backgroundColor: theme.accent }]} onPress={lookupCert}>
                    {certLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.certButtonText}>{t.lookup}</Text>}
                  </TouchableOpacity>
                </View>
                {certResult && (
                  <View style={[styles.certResult, { backgroundColor: darkMode ? '#2a2000' : '#fff3cd' }]}>
                    <Text style={[styles.certResultText, { color: '#856404' }]}>⚠ {certResult.message}</Text>
                  </View>
                )}
                <View style={[styles.gradeSummary, { backgroundColor: theme.accent }]}>
                  <Text style={styles.gradeSummaryText}>{selectedGrader} {selectedGrade}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.conditionContainer}>
                <Text style={[styles.conditionTitle, { color: theme.text }]}>{t.condition}</Text>
                <View style={styles.conditionRow}>
                  {CONDITIONS.map((c, i) => (
                    <TouchableOpacity key={c.label} style={[styles.conditionButton, { backgroundColor: conditionIndex === i ? CONDITION_COLORS[i] : theme.chip }]} onPress={() => setConditionIndex(i)}>
                      <Text style={[styles.conditionText, { color: conditionIndex === i ? '#fff' : theme.textSecondary }]}>{c.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={[styles.priceBox, { backgroundColor: theme.priceBox }]}>
              <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>{sourceLabel[anchorSource]} {t.marketPrice}</Text>
              {getAnchorPrice() ? <Text style={[styles.price, { color: theme.text }]}>${getAnchorPrice().toFixed(2)}</Text> : <Text style={[styles.noPrice, { color: theme.textMuted }]}>{t.noPrice}</Text>}
            </View>

            <View style={[styles.vendorBox, { backgroundColor: theme.accentLight }]}>
              <Text style={[styles.vendorLabel, { color: theme.accent }]}>{t.yourPrice} ({activePercentage}% — {isGraded ? `${selectedGrader} ${selectedGrade}` : CONDITIONS[conditionIndex].label})</Text>
              {vendorPrice ? <Text style={[styles.vendorPrice, { color: theme.accent }]}>${vendorPrice.toFixed(2)}</Text> : <Text style={[styles.noPrice, { color: theme.textMuted }]}>—</Text>}
              <Text style={[styles.percentageValue, { color: theme.accent }]}>{percentage}%</Text>
              <View style={styles.sliderRow}>
                <Text style={[styles.sliderLabel, { color: theme.textMuted }]}>10%</Text>
                <Slider style={styles.slider} minimumValue={10} maximumValue={100} step={1} value={percentage} onValueChange={(val) => savePercentage(val)} minimumTrackTintColor={theme.accent} maximumTrackTintColor={theme.cardBorder} thumbTintColor={theme.accent} />
                <Text style={[styles.sliderLabel, { color: theme.textMuted }]}>100%</Text>
              </View>
            </View>

            {anchorPrice && (
              <View style={[styles.currencyBox, { backgroundColor: theme.priceBox }]}>
                <Text style={[styles.currencyTitle, { color: theme.text }]}>{t.currencyConverter}</Text>
                {ratesLoading ? <ActivityIndicator size="small" color={theme.accent} /> : (
                  <View style={styles.currencyGrid}>
                    {CURRENCIES.filter(c => c.code !== 'USD').map((currency) => {
                      const converted = convertPrice(anchorPrice, currency.code);
                      return (
                        <View key={currency.code} style={[styles.currencyItem, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                          <Text style={styles.currencyFlag}>{currency.flag}</Text>
                          <Text style={[styles.currencyCode, { color: theme.textSecondary }]}>{currency.code}</Text>
                          <Text style={[styles.currencyAmount, { color: theme.text }]}>{formatCurrency(converted, currency.code)}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {isPhase2Language && <Text style={[styles.phase2Note, { color: theme.variantBorder }]}>{t.phase2Note}</Text>}

            <Text style={[styles.sourcesTitle, { color: theme.text }]}>{t.priceSources}</Text>
            <View style={styles.sourcesRow}>
              {availableSources.map((source) => (
                <TouchableOpacity key={source} style={[styles.sourceButton, { borderColor: anchorSource === source ? theme.accent : theme.cardBorder, backgroundColor: anchorSource === source ? theme.accentLight : theme.card }]} onPress={() => setAnchorSource(source)}>
                  <Text style={[styles.sourceButtonText, { color: anchorSource === source ? theme.accent : theme.textSecondary }]}>{sourceLabel[source]}</Text>
                  <Text style={[styles.sourcePrice, { color: anchorSource === source ? theme.accent : theme.text }]}>
                    {getPrice(selectedCard, source) ? `$${getPrice(selectedCard, source).toFixed(2)}` : 'N/A'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 0, textAlign: 'left' },
  tabBar: { flexDirection: 'row', marginBottom: 15, borderRadius: 8, overflow: 'hidden', borderWidth: 1 },
  tab: { flex: 1, padding: 10, alignItems: 'center' },
  tabText: { fontSize: 12, fontWeight: 'bold' },
  darkModeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderRadius: 10, borderWidth: 1, marginBottom: 20 },
  darkModeLabel: { fontSize: 16, fontWeight: 'bold' },
  toggle: { width: 44, height: 24, borderRadius: 12, justifyContent: 'center' },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  settingsLangGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  settingsLangButton: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, minWidth: '45%' },
  settingsLangFlag: { fontSize: 24, marginRight: 8 },
  settingsLangLabel: { fontSize: 14, fontWeight: 'bold' },
  languageRow: { flexDirection: 'row', gap: 8, paddingBottom: 5 },
  langButton: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, borderWidth: 1, justifyContent: 'center' },
  langFlag: { fontSize: 18, marginRight: 6 },
  langLabel: { fontSize: 13 },
  phase2Note: { fontSize: 12, marginVertical: 10, textAlign: 'center' },
  searchRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'center' },
  micButton: { padding: 10, borderRadius: 8, marginRight: 8, justifyContent: 'center', alignItems: 'center' },
  micIcon: { fontSize: 18 },
  cameraButton: { padding: 10, borderRadius: 8, marginRight: 8, justifyContent: 'center', alignItems: 'center' },
  cameraContainer: { width: '100%', height: 300, borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  cameraFrame: { width: 200, height: 140, borderWidth: 2, borderColor: '#fff', borderRadius: 8, marginTop: 20 },
  cameraHint: { color: '#fff', fontSize: 14, fontWeight: 'bold', textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  cameraClose: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  cameraCloseText: { color: '#fff', fontWeight: 'bold' },
  cameraScanButton: { backgroundColor: '#e63946', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  cameraScanButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  listeningText: { textAlign: 'center', marginBottom: 10, fontWeight: 'bold' },
  input: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 10, marginRight: 10 },
  button: { padding: 10, borderRadius: 8, justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  recentContainer: { marginBottom: 15 },
  recentTitle: { fontSize: 13, marginBottom: 8 },
  recentRow: { flexDirection: 'row', gap: 8 },
  recentChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  recentChipText: { fontSize: 13 },
  resultsHeader: { marginBottom: 10 },
  resultsCount: { fontSize: 13, marginBottom: 6 },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sortLabel: { fontSize: 13 },
  sortButton: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  sortButtonText: { fontSize: 12 },
  errorText: { textAlign: 'center', fontSize: 14, marginVertical: 20, fontWeight: 'bold' },
  card: { flexDirection: 'row', marginBottom: 10, borderWidth: 1, borderRadius: 8, padding: 10, alignItems: 'center' },
  cardImage: { width: 60, height: 84, borderRadius: 4 },
  cardInfo: { marginLeft: 10, justifyContent: 'center', flex: 1 },
  cardName: { fontSize: 16, fontWeight: 'bold' },
  cardSet: { fontSize: 13 },
  cardNumber: { fontSize: 13 },
  cardPriceTag: { fontSize: 14, fontWeight: 'bold', marginLeft: 8 },
  detailContainer: { alignItems: 'center' },
  back: { marginBottom: 15, fontSize: 16 },
  languageBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 10 },
  languageBadgeText: { fontSize: 13 },
  largeImage: { width: 200, height: 280, borderRadius: 8, marginBottom: 15 },
  priceHistoryBox: { width: '100%', borderRadius: 10, padding: 15, marginBottom: 15 },
  priceHistoryTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 10 },
  priceHistoryNote: { fontSize: 11, marginTop: 6, textAlign: 'center' },
  variantBox: { width: '100%', borderWidth: 1, borderRadius: 10, padding: 15, marginVertical: 15 },
  variantTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  variantSubtitle: { fontSize: 12, marginBottom: 12 },
  variantGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  variantButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  variantPremiumBadge: { fontSize: 10, color: '#f4a261' },
  variantLabel: { fontSize: 12, fontWeight: 'bold' },
  variantSelected: { marginTop: 10, padding: 8, borderRadius: 6 },
  variantSelectedText: { fontSize: 12 },
  gradedToggleRow: { flexDirection: 'row', marginVertical: 15, borderWidth: 1, borderRadius: 8, overflow: 'hidden', width: '100%' },
  gradedToggle: { flex: 1, padding: 10, alignItems: 'center' },
  gradedToggleText: { fontSize: 14, fontWeight: 'bold' },
  gradedBox: { width: '100%', borderRadius: 10, padding: 15, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, marginTop: 10 },
  graderRow: { flexDirection: 'row', gap: 8 },
  graderButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  graderText: { fontSize: 14, fontWeight: 'bold' },
  gradeRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  gradeButton: { width: 44, height: 44, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  gradeText: { fontSize: 13, fontWeight: 'bold' },
  certRow: { flexDirection: 'row', gap: 8 },
  certInput: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 10 },
  certButton: { paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  certButtonText: { color: '#fff', fontWeight: 'bold' },
  certResult: { marginTop: 8, padding: 10, borderRadius: 8 },
  certResultText: { fontSize: 12 },
  gradeSummary: { marginTop: 12, padding: 12, borderRadius: 8, alignItems: 'center' },
  gradeSummaryText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  conditionContainer: { marginTop: 10, width: '100%' },
  conditionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  conditionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  conditionButton: { padding: 8, borderRadius: 6, alignItems: 'center', minWidth: 40 },
  conditionText: { fontSize: 12, fontWeight: 'bold' },
  priceBox: { marginTop: 20, alignItems: 'center', padding: 15, borderRadius: 10, width: '100%' },
  priceLabel: { fontSize: 14, marginBottom: 5 },
  price: { fontSize: 32, fontWeight: 'bold' },
  noPrice: { fontSize: 16 },
  vendorBox: { marginTop: 10, alignItems: 'center', padding: 15, borderRadius: 10, width: '100%' },
  vendorLabel: { fontSize: 14, marginBottom: 5 },
  vendorPrice: { fontSize: 36, fontWeight: 'bold', letterSpacing: -1 },
  percentageValue: { fontSize: 18, fontWeight: 'bold', marginVertical: 6 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginTop: 4 },
  slider: { flex: 1, height: 40 },
  sliderLabel: { fontSize: 11, width: 35, textAlign: 'center' },
  currencyBox: { marginTop: 20, width: '100%', padding: 15, borderRadius: 10 },
  currencyTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  currencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  currencyItem: { alignItems: 'center', borderRadius: 8, padding: 8, minWidth: '22%', borderWidth: 1 },
  currencyFlag: { fontSize: 20, marginBottom: 2 },
  currencyCode: { fontSize: 11, marginBottom: 2 },
  currencyAmount: { fontSize: 13, fontWeight: 'bold' },
  sourcesTitle: { marginTop: 20, marginBottom: 10, fontSize: 16, fontWeight: 'bold', alignSelf: 'flex-start' },
  sourcesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%' },
  sourceButton: { borderWidth: 1, borderRadius: 8, padding: 10, minWidth: '45%', alignItems: 'center' },
  sourceButtonText: { fontSize: 13 },
  sourcePrice: { fontSize: 15, fontWeight: 'bold', marginTop: 3 },
  barcodeButton: { borderWidth: 2, borderRadius: 8, borderStyle: 'dashed', padding: 20, alignItems: 'center', marginBottom: 20 },
  barcodeButtonText: { fontSize: 18, fontWeight: 'bold' },
  barcodeNote: { fontSize: 12, marginTop: 4 },
  sealedResult: { borderRadius: 10, padding: 15 },
  sealedName: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  sealedType: { fontSize: 14, marginBottom: 10 },
  sealedConditionRow: { flexDirection: 'column', gap: 8, marginBottom: 15 },
  sealedCondButton: { padding: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  sealedCondText: { fontSize: 14, fontWeight: 'bold' },
  barterContainer: { flexDirection: 'row', gap: 10 },
  deckColumn: { flex: 1 },
  deckTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  deckCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, padding: 6, marginBottom: 6 },
  deckCardImage: { width: 36, height: 50, borderRadius: 4 },
  deckCardInfo: { flex: 1, marginLeft: 6 },
  deckCardName: { fontSize: 11, fontWeight: 'bold' },
  deckCardCond: { fontSize: 10 },
  deckCardPrice: { fontSize: 11, fontWeight: 'bold' },
  removeBtn: { fontSize: 16, paddingHorizontal: 4 },
  addCardButton: { borderWidth: 1, borderRadius: 8, borderStyle: 'dashed', padding: 8, alignItems: 'center', marginTop: 6 },
  addCardButtonText: { fontWeight: 'bold', fontSize: 13 },
  deckTotal: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginTop: 8 },
  deckDivider: { width: 1 },
  deltaBox: { marginTop: 20, padding: 20, borderRadius: 12, alignItems: 'center' },
  deltaText: { fontSize: 20, fontWeight: 'bold' },
  clearButton: { marginTop: 15, marginBottom: 30, padding: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  clearButtonText: { fontWeight: 'bold' },
});