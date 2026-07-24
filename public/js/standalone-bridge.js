/**
 * Mineradio Standalone iOS Bridge v2.1
 * 完全本地化的网易云 API 拦截器
 */
(function() {
    console.log("[Mineradio] Standalone Bridge v2.1 Initializing...");

    // 检查 Capacitor
    if (typeof window.Capacitor === 'undefined') {
        console.warn("[Mineradio] Capacitor not found. Native features disabled.");
    }

    const originalFetch = window.fetch;

    // 通用映射函数
    const mapArtists = (list) => (Array.isArray(list) ? list : []).map(a => ({ id: a.id, name: a.name }));
    const mapSongRecord = (s) => {
        s = s || {};
        const artists = mapArtists(s.ar || s.artists);
        const album = s.al || s.album || {};
        return {
            provider: 'netease',
            source: 'netease',
            type: 'song',
            id: s.id,
            name: s.name,
            artist: artists.map(a => a.name).join(' / '),
            artists,
            artistId: artists[0] && artists[0].id,
            album: album.name || '',
            albumId: album.id || '',
            cover: album.picUrl || album.coverUrl || '',
            duration: s.dt || s.duration || 0,
            popularity: Number(s.pop || s.popularity || s.score || s.hotScore || 0) || 0,
            searchRank: (s.rank === null || s.rank === undefined) ? null : Number(s.rank),
            fee: s.fee,
        };
    };

    window.fetch = async function(url, opts) {
        const urlStr = typeof url === 'string' ? url : url.url;
        
        if (urlStr.startsWith('/api/')) {
            const pn = urlStr.split('?')[0];
            const searchParams = new URLSearchParams(urlStr.split('?')[1] || "");
            
            // 路由处理
            if (pn === '/api/search' || pn === '/api/netease/search') {
                return handleSearch(searchParams);
            }
            if (pn === '/api/song/url' || pn === '/api/netease/song_url') {
                return handleSongUrl(searchParams);
            }
            if (pn === '/api/netease/playlist/detail') {
                return handlePlaylistDetail(searchParams);
            }
            if (pn === '/api/netease/lyric' || pn === '/api/lyric') {
                return handleLyric(searchParams);
            }

            // 其他 API 暂时 fallback 到 Capacitor Native (虽然可能未实现)
            console.log("[Mineradio] Intercepted unhandled API:", pn);
        }
        
        return originalFetch.apply(this, arguments);
    };

    async function handleSearch(params) {
        const keywords = params.get('keywords') || '';
        const limit = parseInt(params.get('limit') || '20', 10);
        const offset = parseInt(params.get('offset') || '0', 10);

        console.log("[Mineradio] Local Search:", keywords);

        try {
            if (!window.NeteaseApi) throw new Error("NeteaseApi bundle not loaded");
            
            // 优先使用 cloudsearch
            const searchFn = window.NeteaseApi.cloudsearch || window.NeteaseApi.search;
            const result = await searchFn({
                keywords,
                limit,
                offset,
                type: 1 // 1: 单曲
            });

            const rawSongs = result.body?.result?.songs || [];
            const mappedSongs = rawSongs.map(mapSongRecord);

            return createJsonResponse({
                songs: mappedSongs,
                offset,
                limit,
                nextOffset: offset + mappedSongs.length,
                hasMore: mappedSongs.length >= limit
            });
        } catch (e) {
            console.error("[Mineradio] Search Error:", e);
            return createJsonResponse({ error: e.message, songs: [] }, 500);
        }
    }

    async function handleSongUrl(params) {
        const id = params.get('id');
        const quality = params.get('quality') || 'standard';

        console.log("[Mineradio] Local SongUrl:", id, quality);

        try {
            if (!window.NeteaseApi) throw new Error("NeteaseApi bundle not loaded");

            const result = await window.NeteaseApi.song_url({
                id: id,
                br: qualityToBr(quality)
            });

            const data = result.body?.data?.[0] || {};
            
            return createJsonResponse({
                provider: 'netease',
                url: data.url,
                trial: !!data.freeTrialInfo,
                playable: !!data.url,
                level: brToQuality(data.br),
                br: data.br,
                size: data.size,
                md5: data.md5,
                code: 200
            });
        } catch (e) {
            console.error("[Mineradio] SongUrl Error:", e);
            return createJsonResponse({ error: e.message }, 500);
        }
    }

    async function handlePlaylistDetail(params) {
        const id = params.get('id');
        try {
            const result = await window.NeteaseApi.playlist_detail({ id });
            return createJsonResponse(result.body);
        } catch (e) {
            return createJsonResponse({ error: e.message }, 500);
        }
    }

    async function handleLyric(params) {
        const id = params.get('id');
        try {
            const result = await window.NeteaseApi.lyric({ id });
            return createJsonResponse(result.body);
        } catch (e) {
            return createJsonResponse({ error: e.message }, 500);
        }
    }

    // 辅助函数
    function createJsonResponse(data, status = 200) {
        return new Response(JSON.stringify(data), {
            status: status,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    function qualityToBr(q) {
        if (q === 'jymaster') return 999000;
        if (q === 'hires') return 999000;
        if (q === 'lossless') return 999000;
        if (q === 'exhigh') return 320000;
        return 128000;
    }

    function brToQuality(br) {
        if (br >= 900000) return 'lossless';
        if (br >= 320000) return 'exhigh';
        return 'standard';
    }

    // 禁用弹性滚动和长按菜单
    document.documentElement.style.webkitUserSelect = 'none';
    document.documentElement.style.webkitTouchCallout = 'none';
    
    // 注入 CSS 修复 iOS 齐刘海
    const style = document.createElement('style');
    style.innerHTML = `
        body {
            padding-top: env(safe-area-inset-top);
            padding-bottom: env(safe-area-inset-bottom);
            background: #000; /* 齐刘海背景深色 */
        }
        #top-bar {
            top: env(safe-area-inset-top);
        }
    `;
    document.head.appendChild(style);

    console.log("[Mineradio] Standalone Bridge Ready.");
})();
