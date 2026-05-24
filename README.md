# MangaRabbit

Leitor de manga em React Native / Expo focado em traduções em português (pt-br), usando a API do [MangaDex](https://mangadex.org).

## Funcionalidades

- Listagem de mangas populares e busca por título
- Filtro por gênero (tags)
- Leitor de capítulos com download automático de páginas
- Navegação por toque nas bordas ou arraste horizontal
- Zoom por pinça e duplo toque
- Progresso salvo por capítulo (retoma na página onde parou)
- Botão "Continuar Lendo" na tela do manga
- Favoritos com acesso rápido pela gaveta lateral
- Botão de favorito direto nos cards da tela inicial
- Capítulos externos (Manga Plus, Viz, etc.) abrem no navegador

## Stack

- [Expo SDK 51](https://expo.dev) (React Native)
- [React Navigation](https://reactnavigation.org) — Stack + Drawer
- [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) + [Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [React Native Paper](https://reactnativepaper.com)
- [Expo Image](https://docs.expo.dev/versions/latest/sdk/image/)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- [MangaDex API v5](https://api.mangadex.org/docs)

## Como rodar

```bash
# Instalar dependências
npm install

# Iniciar servidor Expo (abre QR code para o Expo Go)
npm start

# Rodar direto no dispositivo/emulador
npm run android
npm run ios
```

## Build

```bash
npx eas build
```

## Estrutura

```
src/
├── components/     # AppDrawer
├── pages/          # Home, Manga, MangaPages, LikedMangas, Onboarding
├── router/         # Router.tsx (NavigationContainer)
├── utils/          # mangaDex.ts (API), DataStorage.ts (AsyncStorage)
└── styles/         # Estilos do leitor
```
