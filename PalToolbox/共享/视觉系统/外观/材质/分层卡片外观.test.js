const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(
    fs.readFileSync(path.join(__dirname, '视觉总调度.js'), 'utf8'),
    context,
    { filename: '视觉总调度.js' }
);

const resolve = context.window.PT_getLayeredCardAppearanceSettings;
assert.strictEqual(typeof resolve, 'function', '视觉系统必须提供统一的大卡片/小卡片分层设置解析');

assert.deepStrictEqual(JSON.parse(JSON.stringify(resolve({
    cardBackgroundTheme: 'theme:skyVault',
    cardMaterial: 'metalGlass',
    smallCardAppearanceEnabled: false,
    smallCardTheme: 'theme:oceanic',
    smallCardMaterial: 'smokedGlass'
}))), {
    frameTheme: 'theme:skyVault',
    frameMaterial: 'metalGlass',
    cubeTheme: 'theme:skyVault',
    cubeMaterial: 'metalGlass'
});

assert.deepStrictEqual(JSON.parse(JSON.stringify(resolve({
    cardBackgroundTheme: 'theme:skyVault',
    cardMaterial: 'gradient',
    smallCardAppearanceEnabled: true,
    smallCardTheme: 'theme:oceanic',
    smallCardMaterial: 'smallTranslucent'
}))), {
    frameTheme: 'theme:skyVault',
    frameMaterial: 'gradient',
    cubeTheme: 'theme:oceanic',
    cubeMaterial: 'smallTranslucent'
});

console.log('分层卡片外观测试通过');
