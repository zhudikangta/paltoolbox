var PT_DATA_LOADER = (function() {
    var cache = {};

    function getFetch() {
        if (typeof window !== 'undefined' && typeof window.fetch === 'function') return window.fetch.bind(window);
        if (typeof fetch === 'function') return fetch;
        return null;
    }

    function loadJson(url) {
        if (cache[url]) return cache[url];
        var fetchFn = getFetch();
        if (!fetchFn) return Promise.reject(new Error('当前环境不能读取 JSON 数据'));
        cache[url] = fetchFn(url).then(function(response) {
            if (!response || !response.ok) {
                var status = response && response.status ? response.status : '未知';
                throw new Error('加载失败：' + url + '（' + status + '）');
            }
            return response.json();
        }).catch(function(error) {
            delete cache[url];
            throw error;
        });
        return cache[url];
    }

    function getCached(url) {
        return cache[url] || null;
    }

    return {
        loadJson: loadJson,
        getCached: getCached
    };
})();

if (typeof window !== 'undefined') window.PT_DATA_LOADER = PT_DATA_LOADER;
if (typeof module !== 'undefined' && module.exports) module.exports = { PT_DATA_LOADER: PT_DATA_LOADER };
