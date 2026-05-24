import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Text, ActivityIndicator } from "react-native-paper";
import { Image } from "expo-image";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { mangaApi } from "../utils/mangaDex";
import dataStorage from "../utils/DataStorage";

const BLURHASH = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

export const LikedMangas = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [mangas, setMangas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      dataStorage.getLikedMangas().then(async (ids) => {
        const validIds = ids.filter((id) => id && id.trim().length > 0);
        if (validIds.length === 0) {
          setMangas([]);
          setIsLoading(false);
          return;
        }
        try {
          const list = await mangaApi.getLikedMangas(validIds);
          setMangas(list);
        } catch (err) {
          console.error('[Favoritos] Erro na API:', err);
          setMangas([]);
        } finally {
          setIsLoading(false);
        }
      });
    }, [])
  );

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={22} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Favoritos</Text>
      <View style={styles.backBtn} />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#EB5757" />
        </View>
      </View>
    );
  }

  if (mangas.length === 0) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.centered}>
          <Ionicons name="heart-dislike-outline" size={56} color="#333" />
          <Text style={styles.emptyTitle}>Nenhum favorito</Text>
          <Text style={styles.emptySubtitle}>
            Toque no coração em qualquer manga para salvar aqui
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {header}
      <ScrollView contentContainerStyle={styles.grid}>
        {mangas.map((manga) => (
          <TouchableOpacity
            key={manga.id}
            style={styles.card}
            onPress={() => navigation.navigate("Manga", { mangaId: manga.id })}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: manga.cover }}
              style={styles.cover}
              contentFit="cover"
              placeholder={BLURHASH}
              transition={250}
            />
            <View style={styles.cardInfo}>
              <Text numberOfLines={2} style={styles.cardTitle}>{manga.title}</Text>
              {manga.year ? <Text style={styles.cardYear}>{manga.year}</Text> : null}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0F0F0F" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 12,
    backgroundColor: "#0F0F0F",
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "700",
    color: "#444",
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 13,
    color: "#333",
    textAlign: "center",
    lineHeight: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
    paddingBottom: 40,
  },
  card: { width: "50%", padding: 6 },
  cover: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 10,
    backgroundColor: "#1C1C1E",
  },
  cardInfo: { paddingTop: 6, paddingHorizontal: 2 },
  cardTitle: { fontSize: 12, fontWeight: "600", color: "#E5E5E5", lineHeight: 16 },
  cardYear: { marginTop: 2, fontSize: 11, color: "#555" },
});
