import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  LogBox,
  Dimensions,
  Linking,
} from "react-native";
import { Text, Chip, ActivityIndicator } from "react-native-paper";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { FlashList } from "@shopify/flash-list";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { mangaApi } from "../utils/mangaDex";
import dataStorage from "../utils/DataStorage";

const { width: SCREEN_W } = Dimensions.get("window");
const COVER_HEIGHT = Math.round(SCREEN_W * 1.1);
const BLURHASH = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

interface Manga {
  id: string; title: string; description: string;
  year: number; status: string; lastVolume: number;
  lastChapter: number; cover: string;
}

const STATUS_LABEL: Record<string, string> = {
  ongoing: "Em andamento",
  completed: "Completo",
  hiatus: "Hiato",
  cancelled: "Cancelado",
};

export const MangaPage = ({ route, navigation }: any) => {
  const { mangaId } = route.params;
  const insets = useSafeAreaInsets();

  const [manga, setManga] = useState<Manga>({
    id: "", title: "", description: "",
    year: 0, status: "", lastVolume: 0, lastChapter: 0, cover: "",
  });
  const [chapters, setChapters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [readChapters, setReadChapters] = useState<string[]>([]);
  const [lastReadChapterId, setLastReadChapterId] = useState<string | null>(null);

  const loadReadChapters = async () => {
    const read = await dataStorage.getReadChapters(mangaId);
    setReadChapters(read);
    setLastReadChapterId(read.length > 0 ? read[read.length - 1] : null);
  };

  const toggleLike = async () => {
    const liked = await dataStorage.getLikedMangas();
    if (liked.includes(mangaId)) {
      await dataStorage.UnLikeManga(mangaId);
      setIsLiked(false);
    } else {
      await dataStorage.LikeManga(mangaId);
      setIsLiked(true);
    }
  };

  const goToChapter = async (id: string, externalUrl?: string | null) => {
    if (externalUrl) {
      Linking.openURL(externalUrl);
      return;
    }
    await dataStorage.saveLastReadChapter(mangaId, id);
    setLastReadChapterId(id);
    navigation.navigate("Chapter", { chapterId: id });
    loadReadChapters();
  };

  useEffect(() => {
    mangaApi.getManga(mangaId).then(setManga);
    mangaApi.getMangaChapters(mangaId).then((ch) => {
      setChapters(ch ?? []);
      setIsLoading(false);
    });
    dataStorage.getLikedMangas().then((liked) => setIsLiked(liked.includes(mangaId)));
    loadReadChapters();
    LogBox.ignoreLogs(["VirtualizedLists should never be nested"]);
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <ScrollView style={styles.scroll} bounces>
        {/* Cover full-bleed */}
        <View style={{ height: COVER_HEIGHT }}>
          <Image
            source={{ uri: manga.cover }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            placeholder={BLURHASH}
            transition={400}
          />
          {/* Gradiente escuro no fundo da imagem */}
          <View style={styles.coverGradient} />
        </View>

        {/* Card de info que sobe sobre a imagem */}
        <View style={styles.infoCard}>
          <Text style={styles.mangaTitle}>{manga.title}</Text>

          <View style={styles.badges}>
            {manga.year ? (
              <View style={styles.badge}>
                <Ionicons name="calendar-outline" size={12} color="#888" />
                <Text style={styles.badgeText}>{manga.year}</Text>
              </View>
            ) : null}
            {manga.status ? (
              <View style={[styles.badge, styles.badgeAccent]}>
                <Text style={[styles.badgeText, styles.badgeAccentText]}>
                  {STATUS_LABEL[manga.status] ?? manga.status}
                </Text>
              </View>
            ) : null}
            {manga.lastChapter ? (
              <View style={styles.badge}>
                <Ionicons name="book-outline" size={12} color="#888" />
                <Text style={styles.badgeText}>Cap. {manga.lastChapter}</Text>
              </View>
            ) : null}
          </View>

          {manga.description ? (
            <Text numberOfLines={4} style={styles.description}>
              {manga.description}
            </Text>
          ) : null}

          <View style={styles.divider} />

          {(() => {
            const lastChapter = lastReadChapterId
              ? chapters.find((ch) => ch.id === lastReadChapterId)
              : null;
            return lastChapter ? (
              <TouchableOpacity
                style={styles.continueBtn}
                onPress={() => goToChapter(lastChapter.id, lastChapter.externalUrl)}
                activeOpacity={0.85}
              >
                <Ionicons name="play-circle" size={20} color="#fff" />
                <Text style={styles.continueBtnText}>Continuar — Cap. {lastChapter.chapter}</Text>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            ) : null;
          })()}

          <Text style={styles.chaptersLabel}>
            Capítulos {chapters.length > 0 ? `(${chapters.length})` : ""}
          </Text>

          {isLoading ? (
            <ActivityIndicator color="#EB5757" style={{ marginTop: 20 }} />
          ) : (
            <FlashList
              data={chapters}
              numColumns={5}
              estimatedItemSize={56}
              scrollEnabled={false}
              keyExtractor={(item: any) => item.id}
              renderItem={({ item }: any) => {
                const read = readChapters.includes(item.id);
                const isExternal = !!item.externalUrl;
                return (
                  <TouchableOpacity
                    style={[styles.chBtn, read && styles.chBtnRead, isExternal && !read && styles.chBtnExternal]}
                    onPress={() => goToChapter(item.id, item.externalUrl)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chText, read && styles.chTextRead, isExternal && !read && styles.chTextExternal]}>
                      {item.chapter}
                    </Text>
                    {isExternal && (
                      <Ionicons name="open-outline" size={9} color={read ? "#fff" : "#666"} style={{ marginTop: 1 }} />
                    )}
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          )}
        </View>
      </ScrollView>

      {/* Botões flutuantes sobre a imagem */}
      <View style={[styles.floatingBar, { top: insets.top + 4 }]}>
        <TouchableOpacity style={styles.floatBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.floatBtn} onPress={toggleLike}>
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={22}
            color={isLiked ? "#EB5757" : "#fff"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0F0F0F" },
  scroll: { flex: 1 },

  coverGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: "transparent",
    // gradiente manual via múltiplas camadas não funciona bem no RN,
    // mas o card sobreposto cria o efeito naturalmente
  },

  infoCard: {
    backgroundColor: "#0F0F0F",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
    minHeight: 400,
  },

  mangaTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 12,
    letterSpacing: -0.3,
  },

  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#1C1C1E",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeAccent: { backgroundColor: "#3A1515" },
  badgeText: { fontSize: 12, color: "#888" },
  badgeAccentText: { color: "#EB5757" },

  description: {
    fontSize: 13,
    color: "#888",
    lineHeight: 20,
    marginBottom: 20,
  },

  divider: { height: 1, backgroundColor: "#1C1C1E", marginBottom: 16 },

  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#EB5757",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  continueBtnText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },

  chaptersLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 14,
  },

  chBtn: {
    width: 56,
    height: 44,
    margin: 4,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1C1C1E",
  },
  chBtnRead: { backgroundColor: "#EB5757" },
  chBtnExternal: { backgroundColor: "#1C1C1E", borderWidth: 1, borderColor: "#2C2C2E" },
  chText: { fontSize: 12, fontWeight: "600", color: "#aaa" },
  chTextRead: { color: "#fff" },
  chTextExternal: { color: "#666" },

  floatingBar: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  floatBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
});
