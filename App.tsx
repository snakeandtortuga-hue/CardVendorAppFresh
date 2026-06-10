import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, StyleSheet, ActivityIndicator, ScrollView, Dimensions, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import { supabase } from './supabase';
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

const SCREENS = { SEARCH: 'search', CARD: 'card', SEALED: 'sealed', BARTER: 'barter', BARTER_SEARCH: 'barter_search', SETTINGS: 'settings', DISCOVER: 'discover', WISHLIST: 'wishlist', TRACKER: 'tracker', LOGS: 'logs', BULK: 'bulk', DISPLAY: 'display' };

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
  const [searchSuggestions, setSearchSuggestions] = useState([]);
const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
const searchSuggestTimeout = useRef(null);
  const searchCache = useRef({});
  const [sets, setSets] = useState([]);
const [trendingCards, setTrendingCards] = useState([]);
const [discoverLoading, setDiscoverLoading] = useState(false);

  const [wishlist, setWishlist] = useState([]);
  const [ownedCards, setOwnedCards] = useState({});
  const [purchaseLogs, setPurchaseLogs] = useState([]);
  const [expandedLog, setExpandedLog] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [user, setUser] = useState(null);
const [authLoading, setAuthLoading] = useState(false);
const [showAuth, setShowAuth] = useState(false);
const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
const [authEmail, setAuthEmail] = useState('');
const [authPassword, setAuthPassword] = useState('');
const [authError, setAuthError] = useState('');
const [supabaseSyncing, setSupabaseSyncing] = useState(false);
const [bulkInput, setBulkInput] = useState('');
const [catalogLoading, setCatalogLoading] = useState(false);
const [catalogProgress, setCatalogProgress] = useState('');
const [catalogReady, setCatalogReady] = useState(false);
const [localCatalog, setLocalCatalog] = useState([]);
const [bulkResults, setBulkResults] = useState([]);
const [bulkLoading, setBulkLoading] = useState(false);
const [bulkProgress, setBulkProgress] = useState('');
const [lastSynced, setLastSynced] = useState(null);
const [showAddLog, setShowAddLog] = useState(false);
const [logCard, setLogCard] = useState(null);
const [logPrice, setLogPrice] = useState('');
const [logCondition, setLogCondition] = useState('NM');
const [logSource, setLogSource] = useState('Bought');
const [logNotes, setLogNotes] = useState('');
const [selectedSet, setSelectedSet] = useState(null);
const [setCards, setSetCards] = useState([]);
const [setCardsLoading, setSetCardsLoading] = useState(false);
  const [ebayPrices, setEbayPrices] = useState({});

  const t = TRANSLATIONS[appLang];

  useEffect(() => {
    loadPercentage();
    fetchExchangeRates();
    loadSettings();
    loadRecentSearches();
    loadSavedTrades();
    loadWishlist();
    fetchDiscoverData();
    loadOwnedCards();
    loadPurchaseLogs();
    getOrCreateDeviceId().then(() => loadFromSupabase());
    checkSession();
    loadLocalCatalog().then(loaded => { if (!loaded) buildLocalCatalog(); });
  }, []);
  useEffect(() => {
    if (searchSuggestTimeout.current) clearTimeout(searchSuggestTimeout.current);
    if (query.trim().length >= 1 && results.length === 0 && !loading) {
      searchSuggestTimeout.current = setTimeout(() => {
        fetchSearchSuggestions(query);
      }, 300);
    } else {
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
    }
  }, [query, results, loading]);
  // Auto-sync to Supabase when important data changes
  useEffect(() => {
    if (deviceId && purchaseLogs.length + Object.keys(ownedCards).length + wishlist.length > 0) {
      syncToSupabase({});
    }
  }, [purchaseLogs, ownedCards, wishlist, savedTrades, deviceId]);

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

  

 
  const buildLocalCatalog = async () => {
    setCatalogLoading(true);
    setCatalogProgress('Starting catalog download...');
    try {
      const allCards = [];
      let page = 1;
      let totalCount = null;
      while (true) {
        setCatalogProgress(`Downloading cards... ${allCards.length}${totalCount ? ' of ' + totalCount : ''}`);
        const response = await fetch(
          `https://api.pokemontcg.io/v2/cards?pageSize=250&page=${page}&select=id,name,set,number,rarity,images,tcgplayer,subtypes`
        );
        const data = await response.json();
        if (!totalCount) totalCount = data.totalCount;
        const cards = data.data || [];
        if (cards.length === 0) break;
        allCards.push(...cards);
        if (allCards.length >= totalCount) break;
        page++;
      }
      setCatalogProgress('Saving catalog...');
      // Save in chunks to avoid AsyncStorage limits
      const chunkSize = 500;
      for (let i = 0; i < allCards.length; i += chunkSize) {
        const chunk = allCards.slice(i, i + chunkSize);
        await AsyncStorage.setItem(`catalog_chunk_${Math.floor(i / chunkSize)}`, JSON.stringify(chunk));
      }
      await AsyncStorage.setItem('catalog_meta', JSON.stringify({
        totalCards: allCards.length,
        chunks: Math.ceil(allCards.length / chunkSize),
        lastUpdated: Date.now(),
      }));
      setLocalCatalog(allCards);
      setCatalogReady(true);
      setCatalogProgress('');
    } catch (e) {
      console.error('Catalog build error', e);
      setCatalogProgress('Download failed. Using live search.');
    }
    setCatalogLoading(false);
  };

  const loadLocalCatalog = async () => {
    try {
      const meta = await AsyncStorage.getItem('catalog_meta');
      if (!meta) return false;
      const { totalCards, chunks, lastUpdated } = JSON.parse(meta);
      // Refresh catalog if older than 7 days
      if (Date.now() - lastUpdated > 7 * 24 * 60 * 60 * 1000) {
        buildLocalCatalog();
        return false;
      }
      const allCards = [];
      for (let i = 0; i < chunks; i++) {
        const chunk = await AsyncStorage.getItem(`catalog_chunk_${i}`);
        if (chunk) allCards.push(...JSON.parse(chunk));
      }
      setLocalCatalog(allCards);
      setCatalogReady(true);
      return true;
    } catch (e) {
      return false;
    }
  };

  const searchLocalCatalog = (searchQuery) => {
    const lower = searchQuery.toLowerCase().trim();
    const words = lower.split(' ').filter(w => w.length > 0);
    const results = [];
    for (let i = 0; i < localCatalog.length; i++) {
      const card = localCatalog[i];
      const name = card.name?.toLowerCase() || '';
      // Fast name match first
      if (name.includes(lower)) {
        results.push(card);
        if (results.length >= 250) break;
        continue;
      }
      // Word match
      if (words.every(w => name.includes(w))) {
        results.push(card);
        if (results.length >= 250) break;
      }
    }
    return results;
  };
  const fetchSearchSuggestions = async (text) => {
    if (!text || text.trim().length < 1) {
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
      return;
    }
    try {
      const searchText = text.trim();
      const lower = searchText.toLowerCase();
      const querySet = new Set();
      querySet.add(`name:*${encodeURIComponent(searchText)}*`);
      if (lower.startsWith('mega') || lower.startsWith('mega ')) {
        querySet.add(`name:*${encodeURIComponent('M ' + searchText.replace(/^mega\s*/i, ''))}*`);
      }
      if (/^m\s/i.test(searchText)) {
        const withoutM = searchText.replace(/^m\s+/i, '');
        querySet.add(`name:M*${encodeURIComponent(withoutM)}*`);
      }
      const allCards = [];
      const seenIds = new Set();
      for (const q of querySet) {
        const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=${q}&pageSize=8&orderBy=name`);
        const data = await res.json();
        for (const card of (data.data || [])) {
          if (!seenIds.has(card.id)) { seenIds.add(card.id); allCards.push(card); }
        }
      }
      if (allCards.length > 0) {
        setSearchSuggestions(allCards.slice(0, 12));
        setShowSearchSuggestions(true);
      } else {
        setSearchSuggestions([]);
        setShowSearchSuggestions(false);
      }
    } catch (e) {}
  };
  const fetchDiscoverData = async () => {
    setDiscoverLoading(true);
    try {
      // Fetch recent and upcoming sets
      const setsResponse = await fetch('https://api.pokemontcg.io/v2/sets?orderBy=-releaseDate&pageSize=250');
      const setsData = await setsResponse.json();
      setSets(setsData.data || []);

      // Fetch cards with high prices for trending
      const trendingResponse = await fetch('https://api.pokemontcg.io/v2/cards?orderBy=-tcgplayer.prices.holofoil.market&pageSize=20&q=tcgplayer.prices.holofoil.market:[10 TO *]');
      const trendingData = await trendingResponse.json();
      setTrendingCards(trendingData.data || []);
    } catch (e) {
      console.error('Discover fetch error', e);
    }
    setDiscoverLoading(false);
  };

  const loadSavedTrades = async () => {
    try {
      const val = await AsyncStorage.getItem('saved_trades');
      if (val) setSavedTrades(JSON.parse(val));
    } catch (e) {}
  };

  const saveTrade = async () => {
    try {
      const tradeId = Date.now();
      const trade = {
        id: tradeId,
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

      // Create a grouped trade log entry
      const newOwned = { ...ownedCards };
      const tradeLog = {
        id: tradeId,
        type: 'trade',
        timestamp: new Date().toLocaleString(),
        date: new Date().toLocaleDateString(),
        delta,
        given: myDeck.map(entry => ({
          id: entry.card.id,
          name: entry.card.name,
          set: entry.card.set?.name,
          number: entry.card.number,
          image: entry.card.images?.small,
          price: entry.price || 0,
          condition: entry.condition,
        })),
        received: theirDeck.map(entry => {
          newOwned[entry.card.id] = true;
          return {
            id: entry.card.id,
            name: entry.card.name,
            set: entry.card.set?.name,
            number: entry.card.number,
            image: entry.card.images?.small,
            price: entry.price || 0,
            condition: entry.condition,
          };
        }),
      };

      const updatedLogs = [tradeLog, ...purchaseLogs];
      setPurchaseLogs(updatedLogs);
      await AsyncStorage.setItem('purchase_logs', JSON.stringify(updatedLogs));
      setOwnedCards(newOwned);
      await AsyncStorage.setItem('owned_cards', JSON.stringify(newOwned));
      alert(`✅ Trade saved and logged! ${myDeck.length + theirDeck.length} items recorded.`);
    } catch (e) {
      alert('Failed to save trade.');
    }
  };

  const deleteSavedTrade = async (id) => {
    const updated = savedTrades.filter(t => t.id !== id);
    setSavedTrades(updated);
    await AsyncStorage.setItem('saved_trades', JSON.stringify(updated));
  };
  const loadWishlist = async () => {
    try {
      const val = await AsyncStorage.getItem('wishlist');
      if (val) setWishlist(JSON.parse(val));
    } catch (e) {}
  };

  const saveWishlistToStorage = async (newList) => {
    try {
      await AsyncStorage.setItem('wishlist', JSON.stringify(newList));
    } catch (e) {}
  };

  const addToWishlist = (item) => {
    const id = `wish_${item.id || item.name}_${Date.now()}`;
    const entry = {
      id,
      itemId: item.id || null,
      name: item.name,
      image: item.images?.small || item.images?.large || null,
      setName: item.set?.name || item.type || '',
      number: item.number || '',
      currentPrice: getCardPrice(item) || 0,
      targetPrice: '',
      quantity: 1,
      isSealed: !item.id,
      addedAt: new Date().toISOString(),
    };
    const updated = [entry, ...wishlist];
    setWishlist(updated);
    saveWishlistToStorage(updated);
    alert('\u2705 Added to Wishlist!');
  };

  const addSealedToWishlist = (product) => {
    const id = `wish_sealed_${Date.now()}`;
    const entry = {
      id,
      itemId: null,
      name: product.name,
      image: null,
      setName: product.type || 'Sealed Product',
      number: '',
      currentPrice: 0,
      targetPrice: '',
      quantity: 1,
      isSealed: true,
      addedAt: new Date().toISOString(),
    };
    const updated = [entry, ...wishlist];
    setWishlist(updated);
    saveWishlistToStorage(updated);
    alert('\u2705 Added to Wishlist!');
  };

  const removeFromWishlist = (id) => {
    const updated = wishlist.filter(w => w.id !== id);
    setWishlist(updated);
    saveWishlistToStorage(updated);
  };

  const updateWishlistItem = (id, field, value) => {
    const updated = wishlist.map(w => w.id === id ? { ...w, [field]: value } : w);
    setWishlist(updated);
    saveWishlistToStorage(updated);
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
    // Use local catalog if available — instant search
    if (catalogReady && localCatalog.length > 0) {
      const results = searchLocalCatalog(searchQuery);
      setResults(results);
      setLoading(false);
      return results;
    }
    // Fall back to API if catalog not ready
    const cleanQuery = searchQuery.replace(/[":!@#$%^&*()+=\[\]{}|\\<>?]/g, ' ').replace(/\s+/g, ' ').trim();
    const firstResponse = await fetch(
      `https://api.pokemontcg.io/v2/cards?q=name:*${encodeURIComponent(cleanQuery)}*&pageSize=250&page=1&orderBy=name`
    );
    if (!firstResponse.ok) throw new Error(`API error: ${firstResponse.status}`);
    const firstData = await firstResponse.json();
    const totalCount = firstData.totalCount || 0;
    let allCards = firstData.data || [];
    setResults([...allCards]);
    setLoading(false);
    if (totalCount > 250) {
      let page = 2;
      while (allCards.length < totalCount && page <= 20) {
        const response = await fetch(
          `https://api.pokemontcg.io/v2/cards?q=name:*${encodeURIComponent(searchQuery)}*&pageSize=250&page=${page}&orderBy=name`
        );
        const data = await response.json();
        allCards = [...allCards, ...(data.data || [])];
        setResults([...allCards]);
        setLoadingProgress(`Loading ${allCards.length} of ${totalCount}...`);
        page++;
      }
      setLoadingProgress('');
    }
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
    setShowSearchSuggestions(false);
    setSearchSuggestions([]);
    try {
      // Check cache first
      if (searchCache.current[q.toLowerCase()]) {
        setResults(searchCache.current[q.toLowerCase()]);
        setLoading(false);
        return;
      }
      const allCards = await fetchAllCards(q);
      searchCache.current[q.toLowerCase()] = allCards;
      setResults(allCards);
      if (allCards.length === 0) setSearchError(t.noResults);
      await saveRecentSearch(q.trim());
    } catch (error) {
      console.error('Search error:', error);
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
    try {
      if (selectedGrader === 'PSA') {
        // Check cache first
        const cacheKey = `psa_cert_${certNumber.trim()}`;
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          setCertResult(JSON.parse(cached));
          setCertLoading(false);
          return;
        }
        const token = process.env.EXPO_PUBLIC_PSA_TOKEN;
        const response = await fetch(
          `https://api.psacard.com/publicapi/cert/GetByCertNumber/${certNumber.trim()}`,
          { headers: { 'Authorization': `bearer ${token}` } }
        );
        if (response.ok) {
          const data = await response.json();
          const result = {
            cardName: data.PSACert?.Subject || 'Unknown',
            grade: data.PSACert?.CardGrade || selectedGrade,
            grader: 'PSA',
            certNumber: certNumber.trim(),
            authentic: data.PSACert?.IsDNAAuthentic !== false,
            year: data.PSACert?.Year || '',
            brand: data.PSACert?.Brand || '',
          };
          await AsyncStorage.setItem(cacheKey, JSON.stringify(result));
          setCertResult(result);
        } else {
          setCertResult({ message: `PSA cert not found. Grade ${selectedGrade} recorded manually.` });
        }
      } else {
        setCertResult({ message: `${selectedGrader} cert lookup coming soon. Grade ${selectedGrade} recorded manually.` });
      }
    } catch (e) {
      setCertResult({ message: `Lookup failed. Grade ${selectedGrade} recorded manually.` });
    }
    setCertLoading(false);
  };

  const getGrades = () => {
    if (selectedGrader === 'PSA') return PSA_GRADES;
    if (selectedGrader === 'BGS') return BGS_GRADES;
    return CGC_GRADES;
  };

  const signUp = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const { data, error } = await supabase.auth.signUp({
        email: authEmail.trim(),
        password: authPassword,
      });
      if (error) {
        setAuthError(error.message);
      } else {
        setUser(data.user);
        setShowAuth(false);
        alert('Account created! Check your email to verify.');
      }
    } catch (e) {
      setAuthError('Sign up failed. Please try again.');
    }
    setAuthLoading(false);
  };

  const signIn = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword,
      });
      if (error) {
        setAuthError(error.message);
      } else {
        setUser(data.user);
        setShowAuth(false);
      }
    } catch (e) {
      setAuthError('Sign in failed. Please try again.');
    }
    setAuthLoading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const checkSession = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser(data.session.user);
      }
    } catch (e) {}
  };
  const getOrCreateDeviceId = async () => {
    try {
      let id = await AsyncStorage.getItem('device_id');
      if (!id) {
        id = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        await AsyncStorage.setItem('device_id', id);
      }
      console.log('Device ID:', id);
      setDeviceId(id);
      return id;
    } catch (e) {
      console.error('Device ID error:', e);
      return null;
    }
  };

  const syncToSupabase = async (data) => {
    try {
      const id = deviceId || await getOrCreateDeviceId();
      console.log('Syncing to Supabase with device ID:', id);
      console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
      if (!id) return;
      setSupabaseSyncing(true);
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
        const response = await fetch(`${supabaseUrl}/rest/v1/user_data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            device_id: id,
            purchase_logs: data.purchaseLogs ?? purchaseLogs,
            owned_cards: data.ownedCards ?? ownedCards,
            wishlist: data.wishlist ?? wishlist,
            saved_trades: data.savedTrades ?? savedTrades,
            vendor_percentage: data.percentage ?? percentage,
            sealed_percentage: data.sealedPercentage ?? sealedPercentage,
            graded_percentage: data.gradedPercentage ?? gradedPercentage,
            updated_at: new Date().toISOString(),
          }),
        });
        console.log('Supabase response status:', response.status);
        if (response.ok) {
          console.log('Supabase sync success!');
          setLastSynced(new Date().toLocaleTimeString());
        } else {
          const err = await response.text();
          console.error('Supabase error:', err);
        }
    } catch (e) {
      console.error('Supabase sync error', e);
    }
    setSupabaseSyncing(false);
  };

  const loadFromSupabase = async () => {
    try {
      const id = await getOrCreateDeviceId();
      if (!id) return;
      const { data, error } = await supabase
        .from('user_data')
        .select('*')
        .eq('device_id', id)
        .single();
      if (error || !data) return;
      if (data.purchase_logs) setPurchaseLogs(data.purchase_logs);
      if (data.owned_cards) setOwnedCards(data.owned_cards);
      if (data.wishlist) setWishlist(data.wishlist);
      if (data.saved_trades) setSavedTrades(data.saved_trades);
      if (data.vendor_percentage) setPercentage(data.vendor_percentage);
      if (data.sealed_percentage) setSealedPercentage(data.sealed_percentage);
      if (data.graded_percentage) setGradedPercentage(data.graded_percentage);
      setLastSynced(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('Supabase load error', e);
    }
  };
  const loadPurchaseLogs = async () => {
    try {
      const val = await AsyncStorage.getItem('purchase_logs');
      if (val) setPurchaseLogs(JSON.parse(val));
    } catch (e) {}
  };

  const addPurchaseLog = async (card, price, condition, source, notes) => {
    const log = {
      id: Date.now(),
      type: 'purchase',
      timestamp: new Date().toLocaleString(),
      date: new Date().toLocaleDateString(),
      source,
      notes,
      items: [{
        id: card.id,
        name: card.name,
        set: card.set?.name,
        number: card.number,
        image: card.images?.small,
        price: parseFloat(price) || 0,
        condition,
      }],
    };
    const updated = [log, ...purchaseLogs];
    setPurchaseLogs(updated);
    await AsyncStorage.setItem('purchase_logs', JSON.stringify(updated));
    const updatedOwned = { ...ownedCards, [card.id]: true };
    setOwnedCards(updatedOwned);
    await AsyncStorage.setItem('owned_cards', JSON.stringify(updatedOwned));
    alert('✅ Purchase logged and card marked as owned!');
  };

  const deletePurchaseLog = async (id) => {
    const updated = purchaseLogs.filter(l => l.id !== id);
    setPurchaseLogs(updated);
    await AsyncStorage.setItem('purchase_logs', JSON.stringify(updated));
  };
  const loadOwnedCards = async () => {
    try {
      const val = await AsyncStorage.getItem('owned_cards');
      if (val) setOwnedCards(JSON.parse(val));
    } catch (e) {}
  };

  const toggleOwnedCard = async (cardId) => {
    const updated = { ...ownedCards, [cardId]: !ownedCards[cardId] };
    if (!updated[cardId]) delete updated[cardId];
    setOwnedCards(updated);
    await AsyncStorage.setItem('owned_cards', JSON.stringify(updated));
  };

  const fetchSetCards = async (set) => {
    setSelectedSet(set);
    setSetCardsLoading(true);
    setSetCards([]);
    try {
      const response = await fetch(
        `https://api.pokemontcg.io/v2/cards?q=set.id:${set.id}&pageSize=250&orderBy=number`
      );
      const data = await response.json();
      setSetCards(data.data || []);
    } catch (e) {
      console.error('Set cards fetch error', e);
    }
    setSetCardsLoading(false);
  };
  const bulkSearch = async () => {
    if (!bulkInput.trim()) return;
    setBulkLoading(true);
    setBulkResults([]);
    const lines = bulkInput.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const results = [];
    for (let i = 0; i < lines.length; i++) {
      const name = lines[i];
      setBulkProgress(`Looking up ${i + 1} of ${lines.length}: ${name}`);
      try {
        const cleanName = name.replace(/[^\w\s\-]/g, ' ').trim();
        const response = await fetch(
          `https://api.pokemontcg.io/v2/cards?q=name:*${encodeURIComponent(cleanName)}*&pageSize=1&orderBy=-tcgplayer.prices.holofoil.market`
        );
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          const card = data.data[0];
          const price = card.tcgplayer?.prices?.holofoil?.market || card.tcgplayer?.prices?.normal?.market || 0;
          results.push({ name, card, price, found: true });
        } else {
          results.push({ name, card: null, price: 0, found: false });
        }
      } catch (e) {
        results.push({ name, card: null, price: 0, found: false });
      }
    }
    setBulkResults(results);
    setBulkProgress('');
    setBulkLoading(false);
  };
  const shareCard = async (card) => {
    const price = getCardPrice(card);
    const vendorPriceAmt = price ? (price * (percentage / 100)).toFixed(2) : 'N/A';
    const marketPrice = price ? `$${price.toFixed(2)}` : 'N/A';
    const shareText = `🃏 ${card.name}\n📦 ${card.set?.name} — #${card.number}\n💰 Market Price: ${marketPrice}\n🏷️ Vendor Price: $${vendorPriceAmt}\n\nPriced with TCG Market Master`;
    try {
      await Clipboard.setStringAsync(shareText);
      alert('Card info copied to clipboard! Paste it anywhere to share.');
    } catch (e) {
      console.error('Share error', e);
    }
  };
  const PROXY_URL = 'https://tcgproxyserver.onrender.com';

  const getEbayToken = async () => {
    // Token is handled by proxy server — no longer needed client-side
    return null;
  };

  const fetchEbayPrice = async (cardName) => {
    try {
      const query = encodeURIComponent(`${cardName} pokemon card`);
      const response = await fetch(`${PROXY_URL}/ebay/sold?query=${query}`);
      const data = await response.json();
      if (data.itemSummaries && data.itemSummaries.length > 0) {
        const prices = data.itemSummaries
          .map(item => parseFloat(item.price?.value || 0))
          .filter(p => p > 0);
        if (prices.length > 0) {
          const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
          const recent = parseFloat(data.itemSummaries[0].price?.value || 0);
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
    <View style={{ marginBottom: 15 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={[styles.title, { color: theme.text, flex: 1, marginBottom: 0, textAlign: 'left' }]}>TCG Market Master</Text>
        <TouchableOpacity
          style={{ padding: 8, borderRadius: 10, backgroundColor: theme.chip, marginRight: 8 }}
          onPress={() => user ? signOut() : setShowAuth(true)}
        >
          <Text style={{ fontSize: 20 }}>{user ? '👤' : '🔑'}</Text>
        </TouchableOpacity>
      <TouchableOpacity
        style={{ padding: 8, borderRadius: 10, backgroundColor: screen === SCREENS.BULK ? theme.accent : theme.chip, marginRight: 8 }}
        onPress={() => setScreen(screen === SCREENS.BULK ? SCREENS.SEARCH : SCREENS.BULK)}
      >
        <Text style={{ fontSize: 20 }}>🧮</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{ padding: 8, borderRadius: 10, backgroundColor: screen === SCREENS.LOGS ? theme.accent : theme.chip, marginRight: 8 }}
        onPress={() => setScreen(screen === SCREENS.LOGS ? SCREENS.SEARCH : SCREENS.LOGS)}
      >
        <Text style={{ fontSize: 20 }}>💰</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{ padding: 8, borderRadius: 10, backgroundColor: screen === SCREENS.SETTINGS ? theme.accent : theme.chip }}
        onPress={() => setScreen(screen === SCREENS.SETTINGS ? SCREENS.SEARCH : SCREENS.SETTINGS)}
      >
        <Text style={{ fontSize: 20 }}>⚙️</Text>
      </TouchableOpacity>
    </View>
    {lastSynced && (
      <Text style={{ color: theme.textMuted, fontSize: 10, textAlign: 'right' }}>
        {supabaseSyncing ? '🔄 Syncing...' : `☁️ Synced ${lastSynced}`}
      </Text>
    )}
  </View>
  );

  const renderTabBar = () => {
    const tabs = [
      { screen: SCREENS.SEARCH, icon: '🔍', label: 'Singles', active: screen === SCREENS.SEARCH || screen === SCREENS.CARD },
      { screen: SCREENS.SEALED, icon: '📦', label: 'Sealed', active: screen === SCREENS.SEALED },
      { screen: SCREENS.BARTER, icon: '🤝', label: 'Barter', active: screen === SCREENS.BARTER || screen === SCREENS.BARTER_SEARCH },
      { screen: SCREENS.DISCOVER, icon: '📰', label: 'Discover', active: screen === SCREENS.DISCOVER },
      { screen: SCREENS.TRACKER, icon: '📋', label: 'Tracker', active: screen === SCREENS.TRACKER },
      { screen: SCREENS.WISHLIST, icon: '⭐', label: 'Wishlist', active: screen === SCREENS.WISHLIST },
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

  if (catalogLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <Text style={{ fontSize: 48, marginBottom: 20 }}>🃏</Text>
        <Text style={{ color: theme.text, fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>TCG Market Master</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 40, textAlign: 'center' }}>
          Setting up your card catalog for instant search...{'\n'}This only happens once.
        </Text>
        <ActivityIndicator size="large" color={theme.accent} style={{ marginBottom: 20 }} />
        <Text style={{ color: theme.textMuted, fontSize: 13, textAlign: 'center' }}>{catalogProgress}</Text>
        <View style={{ width: '100%', height: 4, backgroundColor: theme.cardBorder, borderRadius: 2, marginTop: 20 }}>
          <View style={{ height: 4, backgroundColor: theme.accent, borderRadius: 2, width: catalogProgress.includes('of') ? `${Math.min(100, parseInt(catalogProgress.match(/(\d+) of (\d+)/)?.[1] || 0) / parseInt(catalogProgress.match(/(\d+) of (\d+)/)?.[2] || 1) * 100)}%` : '10%' }} />
        </View>
      </View>
    );
  }
  if (showAuth) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg, justifyContent: 'center' }]}>
        <TouchableOpacity onPress={() => setShowAuth(false)} style={{ position: 'absolute', top: 40, left: 20 }}>
          <Text style={{ color: theme.accent, fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text style={{ fontSize: 40, marginBottom: 10 }}>🃏</Text>
          <Text style={{ color: theme.text, fontSize: 28, fontWeight: 'bold' }}>TCG Market Master</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 6 }}>
            {authMode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </Text>
        </View>

        <View style={{ width: '100%', maxWidth: 400, alignSelf: 'center' }}>
          {authError ? (
            <View style={{ backgroundColor: '#2a0000', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <Text style={{ color: '#e63946', fontSize: 14 }}>{authError}</Text>
            </View>
          ) : null}

          <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 6 }}>Email</Text>
          <TextInput
            style={{ backgroundColor: theme.input, borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 10, padding: 14, color: theme.text, marginBottom: 16, fontSize: 16 }}
            placeholder="your@email.com"
            placeholderTextColor={theme.textMuted}
            value={authEmail}
            onChangeText={setAuthEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 6 }}>Password</Text>
          <TextInput
            style={{ backgroundColor: theme.input, borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 10, padding: 14, color: theme.text, marginBottom: 24, fontSize: 16 }}
            placeholder="••••••••"
            placeholderTextColor={theme.textMuted}
            value={authPassword}
            onChangeText={setAuthPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={{ backgroundColor: theme.accent, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 }}
            onPress={authMode === 'login' ? signIn : signUp}
            disabled={authLoading}
          >
            {authLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); }}
            style={{ alignItems: 'center', padding: 12 }}
          >
            <Text style={{ color: theme.accent, fontSize: 14 }}>
              {authMode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </Text>
          </TouchableOpacity>

          {authMode === 'signup' && (
            <Text style={{ color: theme.textMuted, fontSize: 11, textAlign: 'center', marginTop: 12 }}>
              By creating an account you agree to our Terms of Service. 14-day free trial included.
            </Text>
          )}
        </View>
      </View>
    );
  }
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
                <TouchableOpacity key={entry.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.deckCard, borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: theme.cardBorder }}
                  onPress={() => { selectCard(entry.card); setScreen(SCREENS.CARD); }}>
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
                </TouchableOpacity>
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
                <TouchableOpacity key={entry.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.deckCard, borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: theme.cardBorder }}
                  onPress={() => { selectCard(entry.card); setScreen(SCREENS.CARD); }}>
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
                </TouchableOpacity>
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

 
  if (screen === SCREENS.DISPLAY) {
    const displayPrice = selectedCard ? getCardPrice(selectedCard) : 0;
    const displayVendorPrice = displayPrice * (percentage / 100);
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <TouchableOpacity
          style={{ position: 'absolute', top: 40, right: 20, backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 10 }}
          onPress={() => setScreen(SCREENS.CARD)}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>✕ Exit Display Mode</Text>
        </TouchableOpacity>

        {selectedCard && (
          <>
            <Image
              source={{ uri: selectedCard.images?.large }}
              style={{ width: 220, height: 308, borderRadius: 12, marginBottom: 30 }}
            />
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 }}>
              {selectedCard.name}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, marginBottom: 40 }}>
              {selectedCard.set?.name} — #{selectedCard.number}
            </Text>

            <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: 30, alignItems: 'center', width: '100%', marginBottom: 20 }}>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, marginBottom: 8 }}>Market Price</Text>
              <Text style={{ color: '#fff', fontSize: 56, fontWeight: 'bold', letterSpacing: -2 }}>
                ${displayPrice.toFixed(2)}
              </Text>
            </View>

            <View style={{ backgroundColor: theme.accent, borderRadius: 20, padding: 30, alignItems: 'center', width: '100%' }}>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, marginBottom: 8 }}>Our Price</Text>
              <Text style={{ color: '#fff', fontSize: 64, fontWeight: 'bold', letterSpacing: -3 }}>
                ${displayVendorPrice.toFixed(2)}
              </Text>
            </View>

            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 30 }}>TCG Market Master</Text>
          </>
        )}
      </View>
    );
  }
  if (screen === SCREENS.BULK) {
    const totalValue = bulkResults.reduce((sum, r) => sum + r.price, 0);
    const vendorTotal = totalValue * (percentage / 100);
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {renderHeader()}
        {renderTabBar()}
        <ScrollView>
          <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>📋 Bulk Lookup</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 12 }}>Enter one card name per line. The app will look up the best match and price for each.</Text>

          <TextInput
            style={{ backgroundColor: theme.input, borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 10, padding: 12, color: theme.text, height: 160, textAlignVertical: 'top', marginBottom: 12, fontSize: 14 }}
            placeholder={'Charizard\nPikachu\nM Charizard EX\nBlastoise Base Set'}
            placeholderTextColor={theme.textMuted}
            value={bulkInput}
            onChangeText={setBulkInput}
            multiline
          />

          <TouchableOpacity
            style={{ backgroundColor: theme.accent, padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 16 }}
            onPress={bulkSearch}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>🔍 Look Up All Cards</Text>
          </TouchableOpacity>

          {bulkLoading && (
            <View style={{ alignItems: 'center', marginVertical: 20 }}>
              <ActivityIndicator size="large" color={theme.accent} />
              <Text style={{ color: theme.textMuted, marginTop: 8 }}>{bulkProgress}</Text>
            </View>
          )}

          {bulkResults.length > 0 && !bulkLoading && (
            <>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                <View style={{ flex: 1, backgroundColor: theme.card, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: theme.cardBorder, alignItems: 'center' }}>
                  <Text style={{ color: theme.textMuted, fontSize: 11 }}>Found</Text>
                  <Text style={{ color: '#4caf50', fontWeight: 'bold', fontSize: 20 }}>{bulkResults.filter(r => r.found).length}/{bulkResults.length}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: theme.card, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: theme.cardBorder, alignItems: 'center' }}>
                  <Text style={{ color: theme.textMuted, fontSize: 11 }}>Market Total</Text>
                  <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 20 }}>${totalValue.toFixed(2)}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: theme.card, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: theme.cardBorder, alignItems: 'center' }}>
                  <Text style={{ color: theme.textMuted, fontSize: 11 }}>Your Total ({percentage}%)</Text>
                  <Text style={{ color: theme.accent, fontWeight: 'bold', fontSize: 20 }}>${vendorTotal.toFixed(2)}</Text>
                </View>
              </View>

              {bulkResults.map((result, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => result.found && selectCard(result.card)}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: result.found ? theme.cardBorder : theme.accent, opacity: result.found ? 1 : 0.6 }}
                >
                  {result.found && result.card?.images?.small ? (
                    <Image source={{ uri: result.card.images.small }} style={{ width: 44, height: 62, borderRadius: 4, marginRight: 10 }} />
                  ) : (
                    <View style={{ width: 44, height: 62, borderRadius: 4, marginRight: 10, backgroundColor: theme.chip, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 20 }}>❓</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 14 }}>{result.name}</Text>
                    {result.found ? (
                      <>
                        <Text style={{ color: theme.textSecondary, fontSize: 11 }}>{result.card?.set?.name} — #{result.card?.number}</Text>
                        <Text style={{ color: theme.textMuted, fontSize: 11 }}>{result.card?.rarity}</Text>
                      </>
                    ) : (
                      <Text style={{ color: theme.accent, fontSize: 12 }}>Not found</Text>
                    )}
                  </View>
                  {result.found && (
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>${result.price.toFixed(2)}</Text>
                      <Text style={{ color: theme.accent, fontSize: 12 }}>${(result.price * (percentage / 100)).toFixed(2)}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    );
  }
  if (screen === SCREENS.LOGS) {
    const totalItems = purchaseLogs.reduce((sum, log) => sum + (log.type === 'trade' ? (log.given?.length || 0) + (log.received?.length || 0) : log.items?.length || 0), 0);
    const totalSpent = purchaseLogs.reduce((sum, log) => {
      if (log.type === 'purchase') return sum + (log.items?.reduce((s, i) => s + i.price, 0) || 0);
      return sum;
    }, 0);
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {renderHeader()}
        {renderTabBar()}
        <ScrollView>
          {/* Summary */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <View style={{ flex: 1, backgroundColor: theme.card, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: theme.cardBorder, alignItems: 'center' }}>
              <Text style={{ color: theme.textMuted, fontSize: 12 }}>Total Entries</Text>
              <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 24 }}>{purchaseLogs.length}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: theme.card, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: theme.cardBorder, alignItems: 'center' }}>
              <Text style={{ color: theme.textMuted, fontSize: 12 }}>Total Items</Text>
              <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 24 }}>{totalItems}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: theme.card, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: theme.cardBorder, alignItems: 'center' }}>
              <Text style={{ color: theme.textMuted, fontSize: 12 }}>Total Spent</Text>
              <Text style={{ color: theme.accent, fontWeight: 'bold', fontSize: 24 }}>${totalSpent.toFixed(2)}</Text>
            </View>
          </View>

          {purchaseLogs.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Text style={{ fontSize: 40 }}>📋</Text>
              <Text style={{ color: theme.textMuted, fontSize: 16, marginTop: 10 }}>No logs yet.</Text>
              <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 6 }}>Complete a trade or tap "Log Purchase" on any card.</Text>
            </View>
          ) : (
            purchaseLogs.map((log) => {
              const isTrade = log.type === 'trade';
              const isExpanded = expandedLog === log.id;
              const itemCount = isTrade ? (log.given?.length || 0) + (log.received?.length || 0) : log.items?.length || 0;
              const totalValue = isTrade
                ? (log.received?.reduce((s, i) => s + i.price, 0) || 0)
                : (log.items?.reduce((s, i) => s + i.price, 0) || 0);

              return (
                <TouchableOpacity key={log.id} onPress={() => setExpandedLog(isExpanded ? null : log.id)}
                  style={{ backgroundColor: theme.card, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: isExpanded ? theme.accent : theme.cardBorder }}>
                  {/* Header row */}
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 24, marginRight: 10 }}>{isTrade ? '🤝' : '💰'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 15 }}>
                        {isTrade ? `Trade — ${log.given?.length || 0} given, ${log.received?.length || 0} received` : `Purchase — ${itemCount} item${itemCount !== 1 ? 's' : ''}`}
                      </Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{log.date} • {log.timestamp}</Text>
                      {isTrade && <Text style={{ color: Math.abs(log.delta) < 0.01 ? '#4caf50' : theme.accent, fontSize: 12, marginTop: 2 }}>
                        {Math.abs(log.delta) < 0.01 ? '✅ Clean trade' : log.delta > 0 ? `They added $${Math.abs(log.delta).toFixed(2)}` : `You added $${Math.abs(log.delta).toFixed(2)}`}
                      </Text>}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: theme.accent, fontWeight: 'bold', fontSize: 16 }}>${totalValue.toFixed(2)}</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 18, marginTop: 4 }}>{isExpanded ? '▲' : '▼'}</Text>
                    </View>
                  </View>

                  {/* Expanded details */}
                  {isExpanded && (
                    <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: theme.cardBorder, paddingTop: 12 }}>
                      {isTrade ? (
                        <>
                          {log.given?.length > 0 && (
                            <>
                              <Text style={{ color: theme.accent, fontWeight: 'bold', fontSize: 13, marginBottom: 8 }}>GIVEN</Text>
                              {log.given.map((item, i) => (
                                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                  {item.image && <Image source={{ uri: item.image }} style={{ width: 36, height: 50, borderRadius: 4, marginRight: 8 }} />}
                                  <View style={{ flex: 1 }}>
                                    <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 13 }}>{item.name}</Text>
                                    <Text style={{ color: theme.textSecondary, fontSize: 11 }}>{item.set} — #{item.number} — {item.condition}</Text>
                                  </View>
                                  <Text style={{ color: theme.textMuted, fontWeight: 'bold' }}>${item.price.toFixed(2)}</Text>
                                </View>
                              ))}
                            </>
                          )}
                          {log.received?.length > 0 && (
                            <>
                              <Text style={{ color: '#4caf50', fontWeight: 'bold', fontSize: 13, marginBottom: 8, marginTop: 8 }}>RECEIVED</Text>
                              {log.received.map((item, i) => (
                                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                  {item.image && <Image source={{ uri: item.image }} style={{ width: 36, height: 50, borderRadius: 4, marginRight: 8 }} />}
                                  <View style={{ flex: 1 }}>
                                    <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 13 }}>{item.name}</Text>
                                    <Text style={{ color: theme.textSecondary, fontSize: 11 }}>{item.set} — #{item.number} — {item.condition}</Text>
                                  </View>
                                  <Text style={{ color: '#4caf50', fontWeight: 'bold' }}>${item.price.toFixed(2)}</Text>
                                </View>
                              ))}
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {log.source && <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 8 }}>Source: {log.source}</Text>}
                          {log.notes ? <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 8 }}>📝 {log.notes}</Text> : null}
                          {log.items?.map((item, i) => (
                            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                              {item.image && <Image source={{ uri: item.image }} style={{ width: 36, height: 50, borderRadius: 4, marginRight: 8 }} />}
                              <View style={{ flex: 1 }}>
                                <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 13 }}>{item.name}</Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 11 }}>{item.set} — #{item.number} — {item.condition}</Text>
                              </View>
                              <Text style={{ color: theme.accent, fontWeight: 'bold' }}>${item.price.toFixed(2)}</Text>
                            </View>
                          ))}
                        </>
                      )}
                      <TouchableOpacity onPress={() => deletePurchaseLog(log.id)} style={{ marginTop: 8, alignItems: 'center', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.clearButton }}>
                        <Text style={{ color: theme.textMuted }}>🗑 Delete this log</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  }
  if (screen === SCREENS.TRACKER) {
    const ownedCount = selectedSet ? setCards.filter(c => ownedCards[c.id]).length : 0;
    const totalCount = setCards.length;
    const completion = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0;
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {renderHeader()}
        {renderTabBar()}
        {selectedSet ? (
          <>
            <TouchableOpacity onPress={() => { setSelectedSet(null); setSetCards([]); }}>
              <Text style={[styles.back, { color: theme.accent }]}>← Back to Sets</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Image source={{ uri: selectedSet.images?.logo }} style={{ width: 80, height: 32, resizeMode: 'contain', marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>{selectedSet.name}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{ownedCount} / {totalCount} cards ({completion}%)</Text>
              </View>
            </View>
            <View style={{ height: 8, backgroundColor: theme.cardBorder, borderRadius: 4, marginBottom: 16 }}>
              <View style={{ height: 8, backgroundColor: theme.accent, borderRadius: 4, width: `${completion}%` }} />
            </View>
            {setCardsLoading ? (
              <ActivityIndicator size="large" color={theme.accent} />
            ) : (
              <FlatList
                data={setCards}
                keyExtractor={item => item.id}
                numColumns={3}
                renderItem={({ item }) => {
                  const owned = ownedCards[item.id];
                  return (
                    <TouchableOpacity
                      style={{ flex: 1, margin: 4, alignItems: 'center', opacity: owned ? 1 : 0.4 }}
                      onPress={() => toggleOwnedCard(item.id)}
                    >
                      <Image source={{ uri: item.images?.small }} style={{ width: 80, height: 112, borderRadius: 6 }} />
                      {owned && (
                        <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: '#4caf50', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>✓</Text>
                        </View>
                      )}
                      <Text style={{ color: theme.textMuted, fontSize: 9, marginTop: 2 }}>#{item.number}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </>
        ) : (
          <ScrollView>
            <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>📋 Set Completion Tracker</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 16 }}>Tap a set to track which cards you own.</Text>
            {sets.length === 0 ? (
              <ActivityIndicator size="large" color={theme.accent} />
            ) : (
              sets.map((set) => {
                const owned = setCards.length > 0 && selectedSet?.id === set.id
                  ? setCards.filter(c => ownedCards[c.id]).length
                  : Object.keys(ownedCards).filter(id => id.startsWith(set.id)).length;
                const pct = set.total > 0 ? Math.round((owned / set.total) * 100) : 0;
                return (
                  <TouchableOpacity key={set.id} onPress={() => fetchSetCards(set)}
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.cardBorder }}>
                    <Image source={{ uri: set.images?.symbol }} style={{ width: 32, height: 32, marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 14 }}>{set.name}</Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 11 }}>{set.series} • {set.total} cards • {set.releaseDate}</Text>
                      <View style={{ height: 4, backgroundColor: theme.cardBorder, borderRadius: 2, marginTop: 4 }}>
                        <View style={{ height: 4, backgroundColor: pct === 100 ? '#4caf50' : theme.accent, borderRadius: 2, width: `${pct}%` }} />
                      </View>
                    </View>
                    <Text style={{ color: pct === 100 ? '#4caf50' : theme.accent, fontWeight: 'bold', fontSize: 14, marginLeft: 8 }}>{pct}%</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        )}
      </View>
    );
  }
  if (screen === SCREENS.DISCOVER) {
    const today = new Date();
    const upcomingSets = sets.filter(s => new Date(s.releaseDate) > today).reverse();
    const recentSets = sets.filter(s => new Date(s.releaseDate) <= today);
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {renderHeader()}
        {renderTabBar()}
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* SET RELEASE CALENDAR */}
          <Text style={[styles.sectionTitle, { color: theme.text, fontSize: 18, marginBottom: 12 }]}>📅 Set Release Calendar</Text>

          {upcomingSets.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: theme.accent, fontWeight: 'bold', fontSize: 13, marginBottom: 8 }}>UPCOMING</Text>
              {upcomingSets.slice(0, 5).map((set) => {
                const release = new Date(set.releaseDate);
                const daysUntil = Math.ceil((release - today) / (1000 * 60 * 60 * 24));
                return (
                  <View key={set.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.accent }}>
                    <Image source={{ uri: set.images?.symbol }} style={{ width: 36, height: 36, marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 14 }}>{set.name}</Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{set.series} • {set.total} cards</Text>
                    </View>
                    <View style={{ alignItems: 'center', backgroundColor: theme.accent, borderRadius: 8, padding: 8 }}>
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{daysUntil}</Text>
                      <Text style={{ color: '#fff', fontSize: 9 }}>days</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <Text style={{ color: theme.textSecondary, fontWeight: 'bold', fontSize: 13, marginBottom: 8 }}>RECENT RELEASES</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {sets.slice(0, 10).map((set) => (
                <View key={set.id} style={{ width: 120, backgroundColor: theme.card, borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.cardBorder }}>
                  <Image source={{ uri: set.images?.logo }} style={{ width: 100, height: 40, resizeMode: 'contain', marginBottom: 6 }} />
                  <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 11, textAlign: 'center' }} numberOfLines={2}>{set.name}</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 2 }}>{set.releaseDate}</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 10 }}>{set.total} cards</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* TRENDING CARDS */}
          <Text style={[styles.sectionTitle, { color: theme.text, fontSize: 18, marginBottom: 12 }]}>🔥 Trending Cards</Text>
          <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 12 }}>Highest valued cards right now</Text>
          {discoverLoading ? (
            <ActivityIndicator size="large" color={theme.accent} />
          ) : (
            trendingCards.slice(0, 10).map((card, index) => {
              const price = card.tcgplayer?.prices?.holofoil?.market || card.tcgplayer?.prices?.normal?.market || 0;
              return (
                <TouchableOpacity key={card.id} onPress={() => selectCard(card)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: theme.cardBorder }}>
                    <Text style={{ color: theme.textMuted, fontWeight: 'bold', fontSize: 16, width: 28 }}>#{index + 1}</Text>
                    <Image source={{ uri: card.images?.small }} style={{ width: 44, height: 62, borderRadius: 4, marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 14 }}>{card.name}</Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{card.set?.name}</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 11 }}>#{card.number}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: theme.accent, fontWeight: 'bold', fontSize: 18 }}>${price.toFixed(2)}</Text>
                      <Text style={{ color: '#4caf50', fontSize: 11, marginTop: 2 }}>▲ Hot</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* BIGGEST GAINERS & LOSERS */}
          <Text style={[styles.sectionTitle, { color: theme.text, fontSize: 18, marginBottom: 12, marginTop: 8 }]}>📊 Price Movers</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
            <View style={{ flex: 1, backgroundColor: theme.card, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#4caf50' }}>
              <Text style={{ color: '#4caf50', fontWeight: 'bold', fontSize: 13, marginBottom: 8 }}>▲ Gainers</Text>
              {trendingCards.slice(0, 5).map((card) => {
                const price = card.tcgplayer?.prices?.holofoil?.market || card.tcgplayer?.prices?.normal?.market || 0;
                return (
                  <TouchableOpacity key={card.id} onPress={() => selectCard(card)} style={{ marginBottom: 8 }}>
                    <Text style={{ color: theme.text, fontSize: 12, fontWeight: 'bold' }} numberOfLines={1}>{card.name}</Text>
                    <Text style={{ color: '#4caf50', fontSize: 12 }}>${price.toFixed(2)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={{ flex: 1, backgroundColor: theme.card, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: theme.accent }}>
              <Text style={{ color: theme.accent, fontWeight: 'bold', fontSize: 13, marginBottom: 8 }}>▼ Losers</Text>
              {trendingCards.slice(10, 15).map((card) => {
                const price = card.tcgplayer?.prices?.holofoil?.market || card.tcgplayer?.prices?.normal?.market || 0;
                return (
                  <TouchableOpacity key={card.id} onPress={() => selectCard(card)} style={{ marginBottom: 8 }}>
                    <Text style={{ color: theme.text, fontSize: 12, fontWeight: 'bold' }} numberOfLines={1}>{card.name}</Text>
                    <Text style={{ color: theme.accent, fontSize: 12 }}>${price.toFixed(2)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity style={{ padding: 12, borderRadius: 8, borderWidth: 1, borderColor: theme.accent, alignItems: 'center', marginBottom: 30 }} onPress={fetchDiscoverData}>
            <Text style={{ color: theme.accent, fontWeight: 'bold' }}>🔄 Refresh Data</Text>
          </TouchableOpacity>

        </ScrollView>
      </View>
    );
  }
  if (screen === SCREENS.WISHLIST) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {renderHeader()}
        {renderTabBar()}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.text, flex: 1 }}>⭐ Wishlist</Text>
          <Text style={{ color: theme.textMuted, fontSize: 13 }}>{wishlist.length} item{wishlist.length !== 1 ? 's' : ''}</Text>
        </View>
        {wishlist.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 60, marginBottom: 16 }}>⭐</Text>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 8 }}>Your wishlist is empty</Text>
            <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: 'center' }}>Search for cards or sealed products and tap "Add to Wishlist" to save them here.</Text>
          </View>
        ) : (
          <FlatList
            data={wishlist}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, flexDirection: 'column', padding: 12 }]}>
                {/* Top row: image + name + delete */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={{ width: 52, height: 72, borderRadius: 4 }} />
                  ) : (
                    <View style={{ width: 52, height: 72, borderRadius: 4, backgroundColor: theme.chip, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 24 }}>📦</Text>
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 15 }} numberOfLines={2}>{item.name}</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>{item.setName}{item.number ? ` — #${item.number}` : ''}</Text>
                    {item.isSealed && (
                      <View style={{ marginTop: 4, backgroundColor: theme.chip, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' }}>
                        <Text style={{ color: theme.chipText, fontSize: 11, fontWeight: 'bold' }}>📦 Sealed</Text>
                      </View>
                    )}
                  </View>
                  {/* Red minus/delete button */}
                  <TouchableOpacity
                    onPress={() => removeFromWishlist(item.id)}
                    style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#e63946', alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}
                  >
                    <Text style={{ color: '#fff', fontSize: 20, lineHeight: 22, fontWeight: 'bold' }}>−</Text>
                  </TouchableOpacity>
                </View>

                {/* Bottom row: quantity + prices */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {/* Quantity counter */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.chip, borderRadius: 8, overflow: 'hidden' }}>
                    <TouchableOpacity
                      onPress={() => { if (item.quantity > 1) updateWishlistItem(item.id, 'quantity', item.quantity - 1); }}
                      style={{ paddingHorizontal: 12, paddingVertical: 6 }}
                    >
                      <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold' }}>−</Text>
                    </TouchableOpacity>
                    <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 15, paddingHorizontal: 6, minWidth: 24, textAlign: 'center' }}>{item.quantity}</Text>
                    <TouchableOpacity
                      onPress={() => updateWishlistItem(item.id, 'quantity', item.quantity + 1)}
                      style={{ paddingHorizontal: 12, paddingVertical: 6 }}
                    >
                      <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold' }}>+</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Current market price */}
                  {item.currentPrice > 0 && (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ color: theme.textMuted, fontSize: 10 }}>Market</Text>
                      <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 14 }}>${item.currentPrice.toFixed(2)}</Text>
                    </View>
                  )}

                  {/* Target price input */}
                  <View style={{ flex: 1, minWidth: 100 }}>
                    <Text style={{ color: theme.textMuted, fontSize: 10, marginBottom: 2 }}>Target Price ($)</Text>
                    <TextInput
                      style={{ borderWidth: 1, borderColor: item.targetPrice && item.currentPrice && parseFloat(item.targetPrice) >= item.currentPrice ? '#e63946' : '#4caf50', borderRadius: 6, padding: 6, color: theme.text, backgroundColor: theme.input, fontSize: 14, fontWeight: 'bold' }}
                      placeholder="0.00"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="decimal-pad"
                      value={String(item.targetPrice)}
                      onChangeText={(val) => updateWishlistItem(item.id, 'targetPrice', val)}
                    />
                  </View>

                  {/* Price vs target indicator */}
                  {item.targetPrice && item.currentPrice > 0 && (
                    <View style={{ alignItems: 'center' }}>
                      {parseFloat(item.targetPrice) >= item.currentPrice ? (
                        <Text style={{ color: '#4caf50', fontSize: 13, fontWeight: 'bold' }}>✅ At target</Text>
                      ) : (
                        <Text style={{ color: '#e63946', fontSize: 13, fontWeight: 'bold' }}>
                          ${(item.currentPrice - parseFloat(item.targetPrice)).toFixed(2)} above
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              </View>
            )}
          />
        )}
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
              <TouchableOpacity
                style={{ marginTop: 14, padding: 14, backgroundColor: '#e63946', borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                onPress={() => addSealedToWishlist(sealedProduct)}
              >
                <Text style={{ fontSize: 18 }}>⭐</Text>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Add to Wishlist</Text>
              </TouchableOpacity>
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
                onSubmitEditing={() => { setShowSearchSuggestions(false); setSearchSuggestions([]); searchCards(); }}
                returnKeyType="search"
              />
              <TouchableOpacity style={[styles.cameraButton, { backgroundColor: theme.chip }]} onPress={openCamera}>
                <Text style={styles.micIcon}>📷</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, { backgroundColor: theme.accent }]} onPress={() => { setShowSearchSuggestions(false); setSearchSuggestions([]); searchCards(); }}>
                <Text style={styles.buttonText}>{t.search}</Text>
              </TouchableOpacity>
            </View>
          )}
          {listening && <Text style={[styles.listeningText, { color: theme.accent }]}>{t.listening}</Text>}

          {showSearchSuggestions && searchSuggestions.length > 0 && (
            <View style={{ width: '100%', backgroundColor: theme.card, borderRadius: 10, borderWidth: 1, borderColor: theme.cardBorder, marginBottom: 8, maxHeight: 300 }}>
              <ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
              {searchSuggestions.map((suggestion) => {
                const price = suggestion.tcgplayer?.prices?.holofoil?.market || suggestion.tcgplayer?.prices?.normal?.market || 0;
                return (
                  <TouchableOpacity
                    key={suggestion.id}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: theme.cardBorder }}
                    onPress={() => {
                      setQuery(suggestion.name);
                      setShowSearchSuggestions(false);
                      selectCard(suggestion);
                    }}
                  >
                    <Image source={{ uri: suggestion.images?.small }} style={{ width: 30, height: 42, borderRadius: 3, marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 14 }}>{suggestion.name}</Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 11 }}>{suggestion.set?.name} — #{suggestion.number} — {suggestion.rarity}</Text>
                    </View>
                    {price > 0 && (
                      <Text style={{ color: theme.accent, fontWeight: 'bold', fontSize: 14 }}>${price.toFixed(2)}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
              </ScrollView>
            </View>
          )}

          {results.length === 0 && !loading && !searchError && query.trim() === '' && (
            <View style={{ alignItems: 'center', paddingTop: 40, paddingHorizontal: 20 }}>
              <Text style={{ fontSize: 60, marginBottom: 16 }}>🃏</Text>
              
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.text, marginBottom: 8, textAlign: 'center' }}>Welcome</Text>
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
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.chip, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
                  onPress={() => shareCard(selectedCard)}
                >
                  <Text style={{ fontSize: 16, marginRight: 6 }}>📤</Text>
                  <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 14 }}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
                  onPress={() => setScreen(SCREENS.DISPLAY)}
                >
                  <Text style={{ fontSize: 16, marginRight: 6 }}>🖥️</Text>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Display</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.accentLight, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
                  onPress={() => {
                    setLogCard(selectedCard);
                    setLogPrice(anchorPrice ? anchorPrice.toFixed(2) : '');
                    setLogCondition(CONDITIONS[conditionIndex].label);
                    setLogSource('Bought');
                    setLogNotes('');
                    setShowAddLog(true);
                  }}
                >
                  <Text style={{ fontSize: 16, marginRight: 6 }}>💰</Text>
                  <Text style={{ color: theme.accent, fontWeight: 'bold', fontSize: 14 }}>Log Purchase</Text>
                </TouchableOpacity>
              </View>

              {showAddLog && logCard && (
                <View style={{ width: '100%', backgroundColor: theme.card, borderRadius: 12, padding: 16, marginTop: 12, borderWidth: 1, borderColor: theme.accent }}>
                  <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>💰 Log Purchase</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 4 }}>Price Paid ($)</Text>
                  <TextInput
                    style={{ backgroundColor: theme.input, borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 8, padding: 10, color: theme.text, marginBottom: 10 }}
                    placeholder="0.00"
                    placeholderTextColor={theme.textMuted}
                    value={logPrice}
                    onChangeText={setLogPrice}
                    keyboardType="decimal-pad"
                  />
                  <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 4 }}>Source</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                    {['Bought', 'Traded', 'Gift', 'Other'].map(s => (
                      <TouchableOpacity key={s} onPress={() => setLogSource(s)}
                        style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: logSource === s ? theme.accent : theme.cardBorder, backgroundColor: logSource === s ? theme.accent : theme.card }}>
                        <Text style={{ color: logSource === s ? '#fff' : theme.textSecondary, fontSize: 12 }}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 4 }}>Notes (optional)</Text>
                  <TextInput
                    style={{ backgroundColor: theme.input, borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 8, padding: 10, color: theme.text, marginBottom: 12 }}
                    placeholder="e.g. bought from collector fair"
                    placeholderTextColor={theme.textMuted}
                    value={logNotes}
                    onChangeText={setLogNotes}
                  />
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                      style={{ flex: 1, padding: 12, backgroundColor: theme.accent, borderRadius: 8, alignItems: 'center' }}
                      onPress={() => { addPurchaseLog(logCard, logPrice, logCondition, logSource, logNotes); setShowAddLog(false); }}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>✅ Save Log</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ flex: 1, padding: 12, backgroundColor: theme.chip, borderRadius: 8, alignItems: 'center' }}
                      onPress={() => setShowAddLog(false)}
                    >
                      <Text style={{ color: theme.textSecondary, fontWeight: 'bold' }}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

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
                  <View style={[styles.certResult, { backgroundColor: certResult.authentic === false ? '#2a0000' : darkMode ? '#0a2a0a' : '#d4edda' }]}>
                    {certResult.message ? (
                      <Text style={[styles.certResultText, { color: '#856404' }]}>⚠ {certResult.message}</Text>
                    ) : (
                      <>
                        <Text style={{ color: certResult.authentic ? '#4caf50' : '#e63946', fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>
                          {certResult.authentic ? '✅ AUTHENTIC' : '❌ VERIFY — NOT AUTHENTIC'}
                        </Text>
                        <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>{certResult.cardName}</Text>
                        {certResult.year ? <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{certResult.year} {certResult.brand}</Text> : null}
                        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>PSA {certResult.grade} — Cert #{certResult.certNumber}</Text>
                      </>
                    )}
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

            <TouchableOpacity
              style={{ marginTop: 20, marginBottom: 10, padding: 14, backgroundColor: '#e63946', borderRadius: 12, width: '100%', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
              onPress={() => addToWishlist(selectedCard)}
            >
              <Text style={{ fontSize: 18 }}>⭐</Text>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Add to Wishlist</Text>
            </TouchableOpacity>
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
