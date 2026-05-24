import { useEffect, useState, useRef, useCallback } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet, Dimensions, Alert } from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { mangaApi } from '../utils/mangaDex';
import dataStorage from '../utils/DataStorage';

const { width: W, height: H } = Dimensions.get('window');
const CACHE_DIR = `${FileSystem.cacheDirectory}chapters/`;

export const MangaPages = ({ route, navigation }: any) => {
  const { chapterId } = route.params;
  const insets = useSafeAreaInsets();

  const [localPages, setLocalPages] = useState<string[]>([]);
  const [activePage, setActivePage] = useState(0);
  const [dlCurrent, setDlCurrent] = useState(0);
  const [dlTotal, setDlTotal] = useState(0);
  const [isDownloading, setIsDownloading] = useState(true);
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Refs para evitar stale closures nos gestos
  const activePageRef = useRef(0);
  const totalPagesRef = useRef(0);
  const toolbarVisibleRef = useRef(true);
  const mountedRef = useRef(true);
  useEffect(() => { activePageRef.current = activePage; }, [activePage]);
  useEffect(() => { totalPagesRef.current = dlTotal; }, [dlTotal]);
  useEffect(() => {
    if (!isDownloading) {
      dataStorage.saveChapterProgress(chapterId, activePage);
    }
  }, [activePage, isDownloading]);

  // Toolbar animation (RN Animated — separada do Reanimated)
  const toolbarAnim = useRef(new Animated.Value(1)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      Animated.timing(toolbarAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      toolbarVisibleRef.current = false;
      setToolbarVisible(false);
    }, 3500);
  }, []);

  const showToolbar = useCallback(() => {
    toolbarVisibleRef.current = true;
    setToolbarVisible(true);
    Animated.timing(toolbarAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    scheduleHide();
  }, [scheduleHide]);

  const toggleToolbar = useCallback(() => {
    if (toolbarVisibleRef.current) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      Animated.timing(toolbarAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      toolbarVisibleRef.current = false;
      setToolbarVisible(false);
    } else {
      showToolbar();
    }
  }, [showToolbar]);

  const goToPrev = useCallback(() => {
    if (activePageRef.current > 0) {
      setActivePage(p => p - 1);
      showToolbar();
    }
  }, [showToolbar]);

  const goToNext = useCallback(() => {
    if (activePageRef.current < totalPagesRef.current - 1) {
      setActivePage(p => p + 1);
      showToolbar();
    } else {
      dataStorage.clearChapterProgress(chapterId);
      navigation.goBack();
    }
  }, [navigation, showToolbar, chapterId]);

  // ── Reanimated: zoom + pan ─────────────────────────────────
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);
  const swipeOffset = useSharedValue(0);

  // Reset ao trocar de página
  useEffect(() => {
    scale.value = withSpring(1);
    savedScale.value = 1;
    tx.value = withSpring(0);
    ty.value = withSpring(0);
    savedTx.value = 0;
    savedTy.value = 0;
    swipeOffset.value = 0;
  }, [activePage]);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, 1), 4);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < 1.1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        tx.value = withSpring(0);
        ty.value = withSpring(0);
        savedTx.value = 0;
        savedTy.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .minDistance(10)
    .minPointers(1)
    .maxPointers(1)
    .onUpdate((e) => {
      if (scale.value > 1) {
        const maxX = ((scale.value - 1) * W) / 2;
        const maxY = ((scale.value - 1) * H) / 2;
        tx.value = Math.min(Math.max(savedTx.value + e.translationX, -maxX), maxX);
        ty.value = Math.min(Math.max(savedTy.value + e.translationY, -maxY), maxY);
      } else {
        swipeOffset.value = e.translationX;
      }
    })
    .onEnd((e) => {
      if (scale.value > 1) {
        savedTx.value = tx.value;
        savedTy.value = ty.value;
      } else {
        const hitDist = Math.abs(e.translationX) > W * 0.25;
        const hitVel = Math.abs(e.velocityX) > 500;
        if (hitDist || hitVel) {
          if (e.translationX > 0) {
            runOnJS(goToPrev)();
          } else {
            runOnJS(goToNext)();
          }
        } else {
          swipeOffset.value = withSpring(0);
        }
      }
    });

  const lastTapTime = useRef(0);

  const tap = Gesture.Tap()
    .numberOfTaps(1)
    .maxDistance(25)
    .runOnJS(true)
    .onEnd((e) => {
      const now = Date.now();
      const isDouble = now - lastTapTime.current < 300;
      lastTapTime.current = now;

      if (isDouble) {
        // Double tap: toggle zoom (run animation on worklet thread)
        if (scale.value > 1) {
          scale.value = withSpring(1);
          savedScale.value = 1;
          tx.value = withSpring(0);
          ty.value = withSpring(0);
          savedTx.value = 0;
          savedTy.value = 0;
        } else {
          scale.value = withSpring(2.5);
          savedScale.value = 2.5;
        }
        return;
      }

      if (scale.value > 1.1) {
        toggleToolbar();
        return;
      }
      const x = e.absoluteX;
      if (x < W * 0.28) {
        goToPrev();
      } else if (x > W * 0.72) {
        goToNext();
      } else {
        toggleToolbar();
      }
    });

  const composed = Gesture.Simultaneous(pinch, pan, tap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value + swipeOffset.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  // ── Download ───────────────────────────────────────────────
  const downloadPage = async (url: string, dir: string, index: number) => {
    const ext = url.split('.').pop()?.split('?')[0] ?? 'jpg';
    const dest = `${dir}${String(index).padStart(3, '0')}.${ext}`;
    const info = await FileSystem.getInfoAsync(dest);
    if (!info.exists) await FileSystem.downloadAsync(url, dest);
    return dest;
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await mangaApi.getChapterData(chapterId);
        const total = data.pages.length;
        setDlTotal(total);

        const dir = `${CACHE_DIR}${chapterId}/`;
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

        // Baixa as 3 primeiras páginas e abre o leitor
        const INITIAL = Math.min(3, total);
        const initial: string[] = [];
        for (let i = 0; i < INITIAL; i++) {
          initial.push(await downloadPage(data.pages[i], dir, i));
          setDlCurrent(i + 1);
        }
        if (!mountedRef.current) return;
        setLocalPages(initial);
        setIsDownloading(false);
        scheduleHide();

        const savedPage = await dataStorage.getChapterProgress(chapterId);
        if (savedPage > 0 && mountedRef.current) {
          setActivePage(Math.min(savedPage, total - 1));
        }

        // Continua baixando o restante em segundo plano
        for (let i = INITIAL; i < total; i++) {
          if (!mountedRef.current) break;
          const path = await downloadPage(data.pages[i], dir, i);
          setLocalPages(prev => [...prev, path]);
          setDlCurrent(i + 1);
        }
      } catch (err) {
        if (!mountedRef.current) return;
        console.error('[Leitor] Erro ao carregar capítulo:', err);
        Alert.alert('Erro', 'Não foi possível carregar o capítulo. Tente novamente.', [
          { text: 'Voltar', onPress: () => navigation.goBack() },
        ]);
      }
    })();
    return () => {
      mountedRef.current = false;
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const savePage = async () => {
    setIsSaving(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Indisponível', 'Compartilhamento não suportado.');
        return;
      }
      await Sharing.shareAsync(localPages[activePage], { mimeType: 'image/jpeg', dialogTitle: 'Salvar página' });
    } catch {
      Alert.alert('Erro', 'Não foi possível compartilhar a imagem.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Tela de download ───────────────────────────────────────
  if (isDownloading) {
    const pct = dlTotal > 0 ? dlCurrent / dlTotal : 0;
    return (
      <View style={styles.loadingScreen}>
        <StatusBar style="light" translucent backgroundColor="transparent" />
        <Ionicons name="book-outline" size={56} color="#EB5757" />
        <Text style={styles.loadingTitle}>Preparando leitura...</Text>
        <Text style={styles.loadingSubtitle}>
          {dlTotal === 0 ? 'Obtendo informações...' : `Baixando página ${dlCurrent} de ${dlTotal}`}
        </Text>
        {dlTotal > 0 && (
          <>
            <ProgressBar progress={pct} color="#EB5757" style={styles.progressBar} />
            <Text style={styles.progressPct}>{Math.round(pct * 100)}%</Text>
          </>
        )}
      </View>
    );
  }

  // ── Leitor ─────────────────────────────────────────────────
  return (
    <View style={styles.reader}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <GestureDetector gesture={composed}>
        <Reanimated.View style={[styles.imageWrap, animatedStyle]}>
          {localPages[activePage] ? (
            <Image
              source={{ uri: localPages[activePage] }}
              style={styles.pageImage}
              contentFit="contain"
            />
          ) : (
            <View style={styles.pageLoading}>
              <Ionicons name="image-outline" size={40} color="#333" />
              <Text style={styles.pageLoadingText}>Baixando página...</Text>
            </View>
          )}
        </Reanimated.View>
      </GestureDetector>

      {/* Botão de voltar sempre visível */}
      <TouchableOpacity
        style={[styles.backAlways, { top: insets.top + 8 }]}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={20} color="#fff" />
      </TouchableOpacity>

      {/* Toolbar superior */}
      <Animated.View
        pointerEvents={toolbarVisible ? 'box-none' : 'none'}
        style={[styles.topBar, { opacity: toolbarAnim, paddingTop: insets.top + 4 }]}
      >
        <View style={styles.iconBtn} />
        <Text style={styles.topTitle}>Capítulo</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={savePage} disabled={isSaving}>
          <Ionicons name={isSaving ? 'hourglass-outline' : 'download-outline'} size={20} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Toolbar inferior */}
      <Animated.View
        pointerEvents={toolbarVisible ? 'box-none' : 'none'}
        style={[styles.bottomBar, { opacity: toolbarAnim, paddingBottom: insets.bottom + 10 }]}
      >
        <Text style={styles.pageHint}>‹ arraste ou toque nas bordas ›</Text>
        <View style={styles.pageCounter}>
          <Text style={styles.pageNum}>{activePage + 1}</Text>
          <Text style={styles.pageSep}> / </Text>
          <Text style={styles.pageTotal}>{dlTotal}</Text>
        </View>
        {dlCurrent < dlTotal && (
          <Text style={styles.bgDownload}>↓ {dlCurrent}/{dlTotal}</Text>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1, backgroundColor: '#0F0F0F',
    alignItems: 'center', justifyContent: 'center',
    padding: 40, gap: 12,
  },
  loadingTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 8 },
  loadingSubtitle: { fontSize: 13, color: '#666', textAlign: 'center' },
  progressBar: { width: W - 80, height: 6, borderRadius: 3, backgroundColor: '#2C2C2E', marginTop: 8 },
  progressPct: { fontSize: 13, color: '#EB5757', fontWeight: '700' },

  reader: { flex: 1, backgroundColor: '#000' },
  imageWrap: { width: W, height: H },
  pageImage: { width: W, height: H },

  backAlways: {
    position: 'absolute', left: 12, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingBottom: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    alignItems: 'center', paddingTop: 14, gap: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 15, fontWeight: '600', color: '#fff' },
  pageHint: { fontSize: 11, color: '#555' },
  pageCounter: { flexDirection: 'row', alignItems: 'baseline' },
  pageNum: { fontSize: 22, fontWeight: '800', color: '#fff' },
  pageSep: { fontSize: 14, color: '#555' },
  pageTotal: { fontSize: 14, color: '#888' },
  bgDownload: { fontSize: 11, color: '#444', marginTop: 2 },
  pageLoading: { width: W, height: H, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  pageLoadingText: { marginTop: 12, fontSize: 13, color: '#444' },
});
