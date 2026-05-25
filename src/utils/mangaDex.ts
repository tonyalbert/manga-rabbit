import axios from 'axios';

axios.defaults.baseURL = 'https://api.mangadex.org';

interface MangaData {
    id: string;
    title: string;
    description: string;
    year: number;
    status: string;
    lastVolume: number;
    lastChapter: number;
    cover: string;
}

class MangaApi {

    private getCoverFileName(relationships: any[]): string {
        const rel = relationships?.find(r => r.type === 'cover_art');
        return rel?.attributes?.fileName ?? '';
    }

    private parseManga(manga: any): MangaData {
        const fileName = this.getCoverFileName(manga.relationships);
        return {
            id: manga.id,
            title: manga.attributes.title.en ?? Object.values(manga.attributes.title)[0] ?? '',
            description: manga.attributes.description?.pt ?? manga.attributes.description?.en ?? '',
            year: manga.attributes.year,
            status: manga.attributes.status,
            lastVolume: manga.attributes.lastVolume,
            lastChapter: manga.attributes.lastChapter,
            cover: fileName
                ? `https://uploads.mangadex.org/covers/${manga.id}/${fileName}`
                : '',
        };
    }

    public async getPopularManga(limit: number = 20, language: string = 'pt-br'): Promise<MangaData[]> {
        const response = await axios.get('/manga', {
            params: {
                limit,
                availableTranslatedLanguage: [language],
                includes: ['cover_art'],
                'order[followedCount]': 'desc',
            },
        });
        return response.data.data.map((m: any) => this.parseManga(m));
    }

    public async getManga(id: string): Promise<MangaData> {
        const response = await axios.get(`/manga/${id}`, {
            params: { includes: ['cover_art'] },
        });
        return this.parseManga(response.data.data);
    }

    public async getMangaList(
        limit: number = 20,
        title: string = '',
        includedTags: string[] = [],
        language: string = 'pt-br',
    ): Promise<MangaData[]> {
        const response = await axios.get('/manga', {
            params: {
                limit,
                title: title || undefined,
                availableTranslatedLanguage: [language],
                includedTags: includedTags.length ? includedTags : undefined,
                includes: ['cover_art'],
                'order[followedCount]': 'desc',
            },
        });
        return response.data.data.map((m: any) => this.parseManga(m));
    }

    // Usa o endpoint batch em vez de N chamadas sequenciais
    public async getLikedMangas(ids: string[]): Promise<MangaData[]> {
        if (ids.length === 0) return [];
        const response = await axios.get('/manga', {
            params: {
                ids,
                includes: ['cover_art'],
                limit: ids.length,
                contentRating: ['safe', 'suggestive', 'erotica', 'pornographic'],
            },
        });
        return response.data.data.map((m: any) => this.parseManga(m));
    }

    public async getMangaChapters(mangaId: string, language: string = 'pt-br'): Promise<{ id: string; chapter: string; externalUrl?: string | null }[]> {
        try {
            const all: any[] = [];
            let offset = 0;
            const limit = 100;

            while (true) {
                const response = await axios.get('/chapter', {
                    params: {
                        manga: mangaId,
                        'translatedLanguage[]': language,
                        limit,
                        offset,
                        'contentRating[]': ['safe', 'suggestive', 'erotica', 'pornographic'],
                        'order[chapter]': 'asc',
                    },
                });
                const { data, total } = response.data;
                console.log(`[getMangaChapters] manga=${mangaId} offset=${offset} page=${data.length} total=${total}`);
                all.push(...data);
                if (all.length >= total) break;
                offset += limit;
            }

            // Deduplica por número de capítulo, preferindo capítulos sem URL externa
            const seen = new Map<string, any>();
            for (const ch of all) {
                const num: string = ch.attributes.chapter ?? 'Oneshot';
                const existing = seen.get(num);
                if (!existing || (existing.attributes.externalUrl && !ch.attributes.externalUrl)) {
                    seen.set(num, ch);
                }
            }

            return Array.from(seen.values())
                .sort((a, b) => parseFloat(a.attributes.chapter ?? '0') - parseFloat(b.attributes.chapter ?? '0'))
                .map((ch) => ({
                    id: ch.id,
                    chapter: ch.attributes.chapter ?? 'Oneshot',
                    externalUrl: ch.attributes.externalUrl ?? null,
                }));
        } catch (error: any) {
            console.error('[getMangaChapters] Erro:', error?.response?.status, error?.response?.data ?? error?.message);
            return [];
        }
    }

    public async getChapterData(id: string) {
        const response = await axios.get(`/at-home/server/${id}`);
        const { baseUrl } = response.data;
        const { hash, data: pages } = response.data.chapter;
        return {
            hash,
            pages: pages.map((p: string) => `${baseUrl}/data/${hash}/${p}`),
        };
    }

    public async getTags(): Promise<{ id: string; name: string }[]> {
        const response = await axios.get('/manga/tag');
        return response.data.data.map((tag: any) => ({
            id: tag.id,
            name: tag.attributes.name.en,
        }));
    }
}

export const mangaApi = new MangaApi();
