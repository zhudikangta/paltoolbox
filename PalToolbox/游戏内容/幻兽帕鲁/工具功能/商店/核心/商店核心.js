var PT_SHOP_CORE = (function() {
    var rawData = null;

    function load(callback) {
        fetch('../游戏内容/幻兽帕鲁1.0/数据包/商店.json')
            .then(function(response) { return response.json(); })
            .then(function(data) {
                rawData = data;
                if (callback) callback(data);
            })
            .catch(function() {
                if (callback) callback(null);
            });
    }

    function getData() { return rawData; }
    function getShops() { return (rawData && rawData.shops) || []; }
    function getSpecialShops() { return (rawData && rawData.specialShops) || {}; }
    function getLotteries() { return (rawData && rawData.lotteries) || {}; }
    function getShopById(id) {
        var shops = getShops();
        for (var i = 0; i < shops.length; i++) {
            if (shops[i].id === id) return shops[i];
        }
        return null;
    }

    return {
        load: load,
        getData: getData,
        getShops: getShops,
        getSpecialShops: getSpecialShops,
        getLotteries: getLotteries,
        getShopById: getShopById
    };
})();
if (typeof window !== 'undefined') window.PT_SHOP_CORE = PT_SHOP_CORE;
