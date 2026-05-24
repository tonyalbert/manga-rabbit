import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: W } = Dimensions.get('window');

const FEATURES = [
  {
    icon: 'book-outline' as const,
    title: 'Leia seus mangás',
    desc: 'Acesse milhares de títulos com tradução em português.',
  },
  {
    icon: 'download-outline' as const,
    title: 'Capítulos em cache',
    desc: 'Cada capítulo é baixado antes da leitura para uma experiência fluida e sem travamentos.',
  },
  {
    icon: 'share-outline' as const,
    title: 'Salve suas páginas favoritas',
    desc: 'Compartilhe ou salve qualquer página direto na galeria do seu celular.',
  },
  {
    icon: 'heart-outline' as const,
    title: 'Sua lista de favoritos',
    desc: 'Guarde os mangás que você acompanha e acesse rapidamente pelo menu.',
  },
];

export const Onboarding = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();

  const handleStart = async () => {
    await AsyncStorage.setItem('onboarding_done', '1');
    navigation.replace('HomeDrawer');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* Logo */}
      <View style={styles.hero}>
        <View style={styles.logoWrap}>
          <Ionicons name="book" size={48} color="#EB5757" />
        </View>
        <Text style={styles.appName}>MangaRabbit</Text>
        <Text style={styles.appSub}>Seu leitor de manga em português</Text>
      </View>

      {/* Features */}
      <View style={styles.features}>
        {FEATURES.map((f) => (
          <View key={f.title} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name={f.icon} size={22} color="#EB5757" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity style={styles.btn} onPress={handleStart} activeOpacity={0.85}>
        <Text style={styles.btnText}>Começar a ler</Text>
        <Ionicons name="arrow-forward" size={18} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.note}>
        Ao continuar, o app poderá pedir acesso à sua galeria para que você possa salvar páginas dos mangás.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },

  hero: {
    alignItems: 'center',
    paddingTop: 32,
    gap: 10,
  },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  appSub: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },

  features: {
    gap: 20,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: { flex: 1 },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 3,
  },
  featureDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EB5757',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    marginBottom: 14,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  note: {
    fontSize: 11,
    color: '#333',
    textAlign: 'center',
    lineHeight: 16,
  },
});
