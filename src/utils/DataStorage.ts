import AsyncStorage from '@react-native-async-storage/async-storage';

class DataStorage {
    private static likedMangas: string[] = [];

    public async LikeManga(id: string) {
        await this.getLikedMangas();
        if (!DataStorage.likedMangas.includes(id)) {
            DataStorage.likedMangas.push(id);
            await AsyncStorage.setItem('likedMangas', JSON.stringify(DataStorage.likedMangas));
        }
    }

    public async UnLikeManga(id: string) {
        await this.getLikedMangas();
        const index = DataStorage.likedMangas.indexOf(id);
        if (index > -1) {
            DataStorage.likedMangas.splice(index, 1);
            await AsyncStorage.setItem('likedMangas', JSON.stringify(DataStorage.likedMangas));
        }
    }

    public async getLikedMangas() {
        const likedMangas = await AsyncStorage.getItem('likedMangas');
        if (likedMangas) {
            const parsed: string[] = JSON.parse(likedMangas);
            const cleaned = parsed.filter((id) => id && id.trim().length > 0);
            if (cleaned.length !== parsed.length) {
                await AsyncStorage.setItem('likedMangas', JSON.stringify(cleaned));
            }
            DataStorage.likedMangas = cleaned;
        }
        return DataStorage.likedMangas;
    }

    /* clear */
    public async clearLikedMangas() {
        DataStorage.likedMangas = [];
        await AsyncStorage.setItem('likedMangas', JSON.stringify(DataStorage.likedMangas));
    }

    public async saveLastReadChapter(mangaId: string, chapterId: string) {
        try {
            const key = `readChapters_${mangaId}`;

            const existingChapters = await AsyncStorage.getItem(key);
            let updatedChapters = [];
    
            if (existingChapters) {
                updatedChapters = JSON.parse(existingChapters);
            }
    
            updatedChapters.push(chapterId);
    
            await AsyncStorage.setItem(key, JSON.stringify(updatedChapters));
        } catch (error) {
            console.error('Erro ao salvar o último capítulo lido:', error);
        }
    }

    public async getReadChapters(mangaId: string) {
        try {
            const key = `readChapters_${mangaId}`;
            const readChapters = await AsyncStorage.getItem(key);
            return readChapters ? JSON.parse(readChapters) : [];
        } catch (error) {
            console.error('Erro ao obter os capítulos lidos:', error);
            return [];
        }
    }

    public async saveChapterProgress(chapterId: string, page: number) {
        try {
            await AsyncStorage.setItem(`chapterProgress_${chapterId}`, String(page));
        } catch (error) {
            console.error('Erro ao salvar progresso do capítulo:', error);
        }
    }

    public async getChapterProgress(chapterId: string): Promise<number> {
        try {
            const val = await AsyncStorage.getItem(`chapterProgress_${chapterId}`);
            return val ? parseInt(val, 10) : 0;
        } catch {
            return 0;
        }
    }

    public async clearChapterProgress(chapterId: string) {
        try {
            await AsyncStorage.removeItem(`chapterProgress_${chapterId}`);
        } catch {}
    }

}



const dataStorage = new DataStorage();
export default dataStorage;