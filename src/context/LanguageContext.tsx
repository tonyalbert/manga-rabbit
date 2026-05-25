import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'app_language';

export const DEFAULT_LANGUAGE = 'pt-br';

export const LANGUAGES = [
    { code: 'pt-br', label: 'Português (BR)', flag: '🇧🇷' },
    { code: 'pt',    label: 'Português (PT)', flag: '🇵🇹' },
    { code: 'en',    label: 'English',        flag: '🇺🇸' },
    { code: 'es',    label: 'Español',        flag: '🇪🇸' },
    { code: 'es-la', label: 'Español (LA)',   flag: '🌎' },
    { code: 'fr',    label: 'Français',       flag: '🇫🇷' },
    { code: 'de',    label: 'Deutsch',        flag: '🇩🇪' },
    { code: 'it',    label: 'Italiano',       flag: '🇮🇹' },
    { code: 'ru',    label: 'Русский',        flag: '🇷🇺' },
    { code: 'ko',    label: '한국어',          flag: '🇰🇷' },
    { code: 'zh',    label: '中文 (简)',       flag: '🇨🇳' },
    { code: 'zh-hk', label: '中文 (繁)',       flag: '🇭🇰' },
    { code: 'ja-ro', label: 'Romaji',         flag: '🇯🇵' },
];

interface LanguageContextValue {
    language: string;
    setLanguage: (lang: string) => Promise<void>;
}

export const LanguageContext = createContext<LanguageContextValue>({
    language: DEFAULT_LANGUAGE,
    setLanguage: async () => {},
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLang] = useState(DEFAULT_LANGUAGE);

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then((val) => {
            if (val) setLang(val);
        });
    }, []);

    const setLanguage = async (lang: string) => {
        setLang(lang);
        await AsyncStorage.setItem(STORAGE_KEY, lang);
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};
