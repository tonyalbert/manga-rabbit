import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  LogBox,
} from "react-native";
import { Text, Searchbar, Chip, ActivityIndicator } from "react-native-paper";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { mangaApi } from "../utils/mangaDex";
import dataStorage from "../utils/DataStorage";

const BLURHASH = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

export const Home = ({ navigation }: { navigation: any }) => {
  const insets = useSafeAreaInsets();

  const [mangaList, setMangaList] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [activeTag, setActiveTag] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sectionLabel, setSectionLabel] = useState("Populares");
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const loadPopular = () => {
    setIsLoading(true);
    mangaApi.getPopularManga(20).then((list) => {
      setMangaList(list);
      setIsLoading(false);
      setRefreshing(false);
    });
  };

  const loadList = (tag = "", title = "") => {
    setIsLoading(true);
    mangaApi.getMangaList(20, title, tag ? [tag] : []).then((list) => {
      setMangaList(list);
      setIsLoading(false);
      setRefreshing(false);
    });
  };

  useEffect(() => {
    loadPopular();
    mangaApi.getTags().then(setTags);
    LogBox.ignoreLogs(["VirtualizedLists should never be nested"]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      dataStorage.getLikedMangas().then((ids) => setLikedIds(new Set(ids)));
    }, [])
  );

  const toggleLike = useCallback(async (mangaId: string) => {
    const isLiked = likedIds.has(mangaId);
    if (isLiked) {
      await dataStorage.UnLikeManga(mangaId);
      setLikedIds((prev) => { const next = new Set(prev); next.delete(mangaId); return next; });
    } else {
      await dataStorage.LikeManga(mangaId);
      setLikedIds((prev) => new Set(prev).add(mangaId));
    }
  }, [likedIds]);

  const onSearch = (text: string) => {
    setSearchQuery(text);
    setActiveTag("");
    if (text === "") {
      setSectionLabel("Populares");
      loadPopular();
    } else {
      setSectionLabel(`Resultados para "${text}"`);
      loadList("", text);
    }
  };

  const onTagPress = (tagId: string, tagName: string) => {
    if (activeTag === tagId) {
      setActiveTag("");
      setSectionLabel("Populares");
      loadPopular();
      return;
    }
    setActiveTag(tagId);
    setSectionLabel(tagName);
    loadList(tagId);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setActiveTag("");
    setSearchQuery("");
    setSectionLabel("Populares");
    loadPopular();
    mangaApi.getTags().then(setTags);
  }, []);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <View style={styles.titleRow}>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => navigation.openDrawer()}
            hitSlop={12}
          >
            <Ionicons name="menu" size={22} color="#aaa" />
          </TouchableOpacity>

          <View style={styles.titleCenter}>
            <View style={styles.logoCircle}>
              <Ionicons name="book" size={14} color="#EB5757" />
            </View>
            <Text style={styles.appName}>MangaRabbit</Text>
          </View>

          <View style={styles.menuPlaceholder} />
        </View>

        <Searchbar
          placeholder="Buscar manga..."
          placeholderTextColor="#444"
          onChangeText={onSearch}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
          iconColor="#555"
          theme={{ colors: { onSurface: "#fff" } }}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <Chip
            selected={activeTag === ""}
            onPress={() => { setActiveTag(""); setSectionLabel("Populares"); loadPopular(); }}
            style={[styles.chip, activeTag === "" && styles.chipActive]}
            textStyle={[styles.chipText, activeTag === "" && styles.chipTextActive]}
            showSelectedCheck={false}
          >
            Tudo
          </Chip>
          {tags.map((tag) => (
            <Chip
              key={tag.id}
              selected={activeTag === tag.id}
              onPress={() => onTagPress(tag.id, tag.name)}
              style={[styles.chip, activeTag === tag.id && styles.chipActive]}
              textStyle={[styles.chipText, activeTag === tag.id && styles.chipTextActive]}
              showSelectedCheck={false}
            >
              {tag.name}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Lista */}
      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EB5757" />
        }
      >
        {/* Label da seção */}
        <View style={styles.sectionRow}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionLabel}>{sectionLabel}</Text>
        </View>

        {isLoading && !refreshing ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#EB5757" />
          </View>
        ) : (
          <View style={styles.grid}>
            {mangaList.map((manga) => (
              <TouchableOpacity
                key={manga.id}
                style={styles.card}
                onPress={() => navigation.getParent()?.navigate("Manga", { mangaId: manga.id })}
                activeOpacity={0.75}
              >
                <View style={styles.coverWrap}>
                  <Image
                    source={{ uri: manga.cover }}
                    style={styles.cover}
                    contentFit="cover"
                    placeholder={BLURHASH}
                    transition={250}
                  />
                  <TouchableOpacity
                    style={styles.heartBtn}
                    onPress={() => toggleLike(manga.id)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={likedIds.has(manga.id) ? "heart" : "heart-outline"}
                      size={18}
                      color={likedIds.has(manga.id) ? "#EB5757" : "#fff"}
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.cardInfo}>
                  <Text numberOfLines={2} style={styles.cardTitle}>{manga.title}</Text>
                  {manga.year ? <Text style={styles.cardYear}>{manga.year}</Text> : null}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0F0F0F" },

  // ── Header ──────────────────────────────────────────────
  header: {
    backgroundColor: "#1C1C1E",
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#2C2C2E",
    // sombra para separar do conteúdo
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#2C2C2E",
    alignItems: "center",
    justifyContent: "center",
  },
  menuPlaceholder: {
    width: 36,
    height: 36,
  },
  titleCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoCircle: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#2C2C2E",
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },

  searchbar: {
    backgroundColor: "#2C2C2E",
    borderRadius: 12,
    height: 44,
    elevation: 0,
    marginBottom: 12,
  },
  searchInput: {
    color: "#fff",
    fontSize: 14,
    alignSelf: "center",
  },

  chips: { gap: 8, alignItems: "center" },
  chip: {
    backgroundColor: "#2C2C2E",
    borderRadius: 20,
    borderWidth: 0,
    height: 30,
  },
  chipActive: { backgroundColor: "#EB5757" },
  chipText: { color: "#666", fontSize: 12, lineHeight: 14 },
  chipTextActive: { color: "#fff", fontWeight: "700" },

  // ── Conteúdo ─────────────────────────────────────────────
  scroll: { flex: 1 },

  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    gap: 10,
  },
  sectionAccent: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: "#EB5757",
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ddd",
  },

  loaderWrap: { paddingTop: 80, alignItems: "center" },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    paddingBottom: 32,
  },
  card: { width: "50%", padding: 6 },
  coverWrap: { position: "relative" },
  cover: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 10,
    backgroundColor: "#1C1C1E",
  },
  heartBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    backgroundColor: "#1C1C1E",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    padding: 8,
    marginTop: -6,
    height: 62,
    overflow: "hidden",
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E0E0E0",
    lineHeight: 16,
  },
  cardYear: {
    marginTop: 3,
    fontSize: 11,
    color: "#555",
  },
});
