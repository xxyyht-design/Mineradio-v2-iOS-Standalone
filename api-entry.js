// API Entry for Standalone Mineradio
const netease = require('NeteaseCloudMusicApi');
const kugou = require('./kugou-api');
const qishui = require('./qishui-api');
const spotify = require('./spotify-api');

window.MineradioStandalone = {
    netease: netease,
    kugou: kugou,
    qishui: qishui,
    spotify: spotify,
    // 这里可以添加更多桥接逻辑
};

console.log("[Mineradio] Standalone APIs Loaded into window.MineradioStandalone");
