(function() {
    var rafId = 0;
    var sceneState = null;
    var PARTICLE_COUNT = 33800;
    var AVATAR_IMAGE_SWITCH_MS = 8000;
    var AVATAR_CHOICE_MODE_KEY = 'PT_PORTAL_AVATAR_CHOICE_MODE';
    var AVATAR_CHOICE_SRC_KEY = 'PT_PORTAL_AVATAR_CHOICE_SRC';
    var AVATAR_RANDOM_VALUE = '__random__';
    var PAL_AVATAR_IMAGES = [
            {
                    "name": "宗铭丸",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_SamuraiDog_icon_normal.png"
            },
            {
                    "name": "幸叶茸",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_CloverFairy_icon_normal.png"
            },
            {
                    "name": "莉欧·莉涅",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_ClioneTwins_icon_normal.png"
            },
            {
                    "name": "念影喵",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_GhostBlackCat_icon_normal.png"
            },
            {
                    "name": "雪绵啾",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_FluffyBird_icon_normal.png"
            },
            {
                    "name": "电汪汪",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_ElecPomeranian_icon_normal.png"
            },
            {
                    "name": "密林陶洛斯",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_GrassMinotaur_icon_normal.png"
            },
            {
                    "name": "莉芳",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_PandaGirl_icon_normal.png"
            },
            {
                    "name": "球抱苞",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_CactusDoll_icon_normal.png"
            },
            {
                    "name": "流焰龙",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_VolcanoDragon_icon_normal.png"
            },
            {
                    "name": "紫狐娇",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_DarkFlameFox_icon_normal.png"
            },
            {
                    "name": "缚乃伊",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_MummyPal_icon_normal.png"
            },
            {
                    "name": "鞘刀鱼",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_SwordCutlassfish_icon_normal.png"
            },
            {
                    "name": "磐峰兽",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_RockBeast_icon_normal.png"
            },
            {
                    "name": "雪墩墩",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_SmallYeti_icon_normal.png"
            },
            {
                    "name": "颚莉丝",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_VenusFlytrap_icon_normal.png"
            },
            {
                    "name": "双心岩傀",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_GrassGolem_icon_normal.png"
            },
            {
                    "name": "塞赫麦特",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_Sekhmet_icon_normal.png"
            },
            {
                    "name": "重岩龟",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_CubeTurtle_icon_normal.png"
            },
            {
                    "name": "力士獒",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_SumoDog_icon_normal.png"
            },
            {
                    "name": "喵璐璐",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_LongCat_icon_normal.png"
            },
            {
                    "name": "电涡蜗",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_ElecSnail_icon_normal.png"
            },
            {
                    "name": "蒲蒲飞芽",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_DandelionGirl_icon_normal.png"
            },
            {
                    "name": "詹兔曼",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_BrownRabbit_icon_normal.png"
            },
            {
                    "name": "兜兜灵",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_HoodGhost_icon_normal.png"
            },
            {
                    "name": "电懒懒",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_ElecLizard_icon_normal.png"
            },
            {
                    "name": "吓丝妮",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_OniGhostGirl_icon_normal.png"
            },
            {
                    "name": "曼波王",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_KingSunfish_icon_normal.png"
            },
            {
                    "name": "兔绣袖",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_SleeveRabbit_icon_normal.png"
            },
            {
                    "name": "灵曦龙",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_GhostDragon_icon_normal.png"
            },
            {
                    "name": "雷云鹫",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_ThunderFluffyBird_icon_normal.png"
            },
            {
                    "name": "大红呱",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_RedFlowerBird_icon_normal.png"
            },
            {
                    "name": "昭炎狐",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_FoxExorcist_icon_normal.png"
            },
            {
                    "name": "沁莲龙",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_LotusDragon_icon_normal.png"
            },
            {
                    "name": "拉比耶尔",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_ClownRabbit_icon_normal.png"
            },
            {
                    "name": "盗影鸦",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_ThiefBird_icon_normal.png"
            },
            {
                    "name": "梅杜娜",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_SnakeGirl_icon_normal.png"
            },
            {
                    "name": "红菇娘",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_MushroomLady_icon_normal.png"
            },
            {
                    "name": "妖焰灯",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_LanternButler_icon_normal.png"
            },
            {
                    "name": "缀夜星",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_MoonChild_icon_normal.png"
            },
            {
                    "name": "墨罗娜",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_MonochromeQueen_icon_normal.png"
            },
            {
                    "name": "燎火舞伶",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_KabukiMan_icon_normal.png"
            },
            {
                    "name": "磐甲龙",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_DomeArmorDragon_icon_normal.png"
            },
            {
                    "name": "霄龙",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_BlueSkyDragon_icon_normal.png"
            },
            {
                    "name": "暮尘蛾",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_Mothman_icon_normal.png"
            },
            {
                    "name": "夜蔓爵",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_FlowerPrince_icon_normal.png"
            },
            {
                    "name": "奥沧鲸",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_KingWhale_icon_normal.png"
            },
            {
                    "name": "枯星龙",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_WorldTreeDragon_icon_normal.png"
            },
            {
                    "name": "秋叶猿",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_Monkey_Fire_icon_normal.png"
            },
            {
                    "name": "可可棉花糖",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_SweetsSheep_Ground_icon_normal.png"
            },
            {
                    "name": "梦沫姬",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_OctopusGirl_Neutral_icon_normal.png"
            },
            {
                    "name": "凌角马",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_Kirin_Ice_icon_normal.png"
            },
            {
                    "name": "巧克力豹冰",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_IceSeal_Ground_icon_normal.png"
            },
            {
                    "name": "冰峰陶洛斯",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_GrassMinotaur_Ice_icon_normal.png"
            },
            {
                    "name": "樱丽娜",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_FlowerDoll_Fire_icon_normal.png"
            },
            {
                    "name": "疾霜鸟",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_ThunderBird_Ice_icon_normal.png"
            },
            {
                    "name": "凛光犬",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_ThunderDog_Ice_icon_normal.png"
            },
            {
                    "name": "妖抱苞",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_CactusDoll_Dark_icon_normal.png"
            },
            {
                    "name": "川霜龙",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_VolcanoDragon_Ice_icon_normal.png"
            },
            {
                    "name": "绢笠蛾",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_WhiteMoth_Neutral_icon_normal.png"
            },
            {
                    "name": "炼刃鱼",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_SwordCutlassfish_Fire_icon_normal.png"
            },
            {
                    "name": "日耀驹",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_NightBlueHorse_Neutral_icon_normal.png"
            },
            {
                    "name": "寒峰兽",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_RockBeast_Ice_icon_normal.png"
            },
            {
                    "name": "咒心岩傀",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_GrassGolem_Dark_icon_normal.png"
            },
            {
                    "name": "电针妖",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_ScorpionMan_Electric_icon_normal.png"
            },
            {
                    "name": "净岩龟",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_CubeTurtle_Neutral_icon_normal.png"
            },
            {
                    "name": "碧艾莉",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_GhostRabbit_Grass_icon_normal.png"
            },
            {
                    "name": "冬丸",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_BlackPuppy_Ice_icon_normal.png"
            },
            {
                    "name": "织夜鹿",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_WhiteDeer_Dark_icon_normal.png"
            },
            {
                    "name": "丹烽",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_WingGolem_Fire_icon_normal.png"
            },
            {
                    "name": "金涡蜗",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_ElecSnail_Ground_icon_normal.png"
            },
            {
                    "name": "曼波皇",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_KingSunfish_Thunder_icon_normal.png"
            },
            {
                    "name": "狱熙龙",
                    "src": "../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/T_GhostDragon_Fire_icon_normal.png"
            }
    ];
    var TARGET_MODES = ['default', 'web', 'dock', 'immersive'];
    var PARTICLE_SHAPE = 'round-sprite';
    var CAMERA_MODEL = 'orbit-camera';
    var MOUSE_GRAVITY_WELL_RADIUS = 126;
    var MOUSE_GRAVITY_WELL_DEPTH = 150;
    var MOUSE_GRAVITY_WELL_PINCH = 20;
    var MOUSE_PARTICLE_FIELD_WIDTH = 760;
    var MOUSE_PARTICLE_FIELD_HEIGHT = 380;
    var ORBIT_POINTER_SPIN_X = 0.0032;
    var ORBIT_POINTER_SPIN_Y = 0.0034;
    var ORBIT_VELOCITY_SCALE = 0.46;
    var ORBIT_SPIN_MAX = 6.2;
    var ORBIT_SPIN_DAMPING = 0.90;
    var PARTICLE_TARGET_FOLLOW = 0.055;
    var PARTICLE_REBUILD_FOLLOW = 0.072;
    var PORTAL_BACKGROUND_FOLLOW = PARTICLE_REBUILD_FOLLOW;
    var PANEL_PARTICLE_FOLLOW = 0.075;
    function getLaunchMode() {
        try {
            var settings = typeof window.readPTSettings === 'function' ? window.readPTSettings('dock') : {};
            return settings.webMode || 'portal';
        } catch (error) {
            return 'portal';
        }
    }

    function shouldRenderPortal() {
        return getLaunchMode() === 'portal';
    }

    function renderPortal() {
        var app = document.getElementById('app');
        if (!app) return null;
        document.body.classList.add('pt-body--portal-mode');
        app.innerHTML = [
            '<section class="pt-portal-root" id="pt-portal-root">',
            '<canvas class="pt-portal-canvas" id="pt-portal-canvas" aria-hidden="true"></canvas>',
            renderAvatarPicker(),
            '<div class="pt-portal-ui">',
            '<header class="pt-portal-brand pt-portal-spatial-panel" data-portal-panel="brand"><h1>PalToolbox</h1></header>',
            '<div class="pt-portal-options">',
            renderCard('网页模式', 'web', '#87f7ff'),
            renderCard('桌面模式', 'dock', '#ffe08a'),
            renderCard('沉浸模式', 'immersive', '#b9a8ff'),
            '<p class="pt-portal-note pt-portal-spatial-panel" data-portal-panel="note">推荐使用网页模式，其他模式正在完善中。网页作者：茱蒂kangta</p>',
            '</div>',
            '</div>',
            '</section>'
        ].join('');
        return document.getElementById('pt-portal-root');
    }

    function renderCard(title, mode, accent) {
        return [
            '<button type="button" class="pt-portal-card pt-portal-spatial-panel" data-portal-panel="', mode, '" data-portal-mode="', mode, '" style="--pt-card-accent:', accent, '">',
            '<h2>', title, '</h2>',
            '<span class="pt-portal-card__beam"></span>',
            '</button>'
        ].join('');
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function(match) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[match];
        });
    }

    function renderAvatarPicker() {
        var choice = readPortalAvatarChoice();
        var html = [
            '<div class="pt-portal-image-picker" data-portal-image-picker>',
            '<select class="pt-portal-image-picker__select" data-portal-avatar-select aria-label="\u7c92\u5b50\u56fe\u7247">',
            '<option value="', AVATAR_RANDOM_VALUE, '"', choice.mode === 'random' ? ' selected' : '', '>\u968f\u673a\u64ad\u653e</option>'
        ];
        for (var i = 0; i < PAL_AVATAR_IMAGES.length; i++) {
            var item = PAL_AVATAR_IMAGES[i];
            html.push('<option value="', escapeHtml(item.src), '"', choice.mode === 'fixed' && choice.src === item.src ? ' selected' : '', '>', escapeHtml(item.name), '</option>');
        }
        html.push('</select>', '</div>');
        return html.join('');
    }

    function seededRandom(seed) {
        var value = Math.sin(seed * 12.9898) * 43758.5453;
        return value - Math.floor(value);
    }

    function writePoint(target, index, x, y, z) {
        var offset = index * 3;
        target[offset] = x;
        target[offset + 1] = y;
        target[offset + 2] = z;
    }

    function writeColor(target, index, r, g, b) {
        var offset = index * 3;
        target[offset] = r;
        target[offset + 1] = g;
        target[offset + 2] = b;
    }

    function smoothstep(value) {
        var x = Math.max(0, Math.min(1, value));
        return x * x * (3 - 2 * x);
    }

    function createParticleTexture(THREE) {
        var canvas = document.createElement('canvas');
        canvas.width = 96;
        canvas.height = 96;
        var ctx = canvas.getContext('2d');
        var gradient = ctx.createRadialGradient(48, 48, 0, 48, 48, 44);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.28, 'rgba(255,255,255,0.95)');
        gradient.addColorStop(0.62, 'rgba(255,255,255,0.36)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(48, 48, 44, 0, Math.PI * 2);
        ctx.fill();
        var texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    function getSpatialPanelDefinitions(THREE) {
        var compact = window.innerWidth < 620;
        var cardX = compact ? 150 : 300;
        var cardY = 0;
        var cardGap = compact ? 70 : 84;
        var panelZ = 35;
        var cardWidth = compact ? 116 : 174;
        var cardHeight = compact ? 44 : 54;
        var cardScale = compact ? 0.72 : 0.84;
        var brandWidth = compact ? 150 : 220;
        var brandHeight = compact ? 34 : 44;
        var brandY = cardY + cardGap + (compact ? 72 : 86);
        var noteWidth = compact ? 190 : 286;
        var noteHeight = compact ? 34 : 40;
        var noteY = cardY - cardGap - (compact ? 50 : 62);
        return [
            { id: 'brand', selector: '[data-portal-panel="brand"]', position: new THREE.Vector3(cardX, brandY, panelZ), baseScale: 0.92, width: brandWidth, height: brandHeight },
            { id: 'web', selector: '[data-portal-panel="web"]', position: new THREE.Vector3(cardX, cardY + cardGap, panelZ), baseScale: cardScale, width: cardWidth, height: cardHeight },
            { id: 'dock', selector: '[data-portal-panel="dock"]', position: new THREE.Vector3(cardX, cardY, panelZ), baseScale: cardScale, width: cardWidth, height: cardHeight },
            { id: 'immersive', selector: '[data-portal-panel="immersive"]', position: new THREE.Vector3(cardX, cardY - cardGap, panelZ), baseScale: cardScale, width: cardWidth, height: cardHeight },
            { id: 'note', selector: '[data-portal-panel="note"]', position: new THREE.Vector3(cardX, noteY, panelZ), baseScale: 0.9, width: noteWidth, height: noteHeight }
        ];
    }

    function buildSpatialPanels(THREE, root) {
        var defs = getSpatialPanelDefinitions(THREE);
        var panels = [];
        for (var i = 0; i < defs.length; i++) {
            var el = root ? root.querySelector(defs[i].selector) : null;
            if (!el) continue;
            el.style.width = defs[i].width + 'px';
            panels.push({
                id: defs[i].id,
                el: el,
                position: defs[i].position,
                baseScale: defs[i].baseScale,
                width: defs[i].width,
                height: defs[i].height
            });
            el.style.opacity = '0';
        }
        return panels;
    }

    function drawRoundRect(ctx, x, y, width, height, radius) {
        var r = Math.min(radius, width * 0.5, height * 0.5);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        ctx.lineTo(x + width, y + height - r);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        ctx.lineTo(x + r, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    function createPortalCardTexture(THREE, panels, layout, hoverMode) {
        var canvas = document.createElement('canvas');
        canvas.width = 768;
        canvas.height = 960;
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        var hitAreas = [];
        function toCanvasY(localY) {
            return canvas.height * 0.5 - (localY / layout.height) * canvas.height;
        }
        function drawCutPanelPath(x, y, width, height, cut) {
            ctx.beginPath();
            ctx.moveTo(x + cut, y);
            ctx.lineTo(x + width - cut, y);
            ctx.lineTo(x + width, y + cut);
            ctx.lineTo(x + width, y + height - cut);
            ctx.lineTo(x + width - cut, y + height);
            ctx.lineTo(x + cut, y + height);
            ctx.lineTo(x, y + height - cut);
            ctx.lineTo(x, y + cut);
            ctx.closePath();
        }
        function drawPalStatusTicks(x, y, width, height, active) {
            var tickColor = active ? 'rgba(255,181,86,0.86)' : 'rgba(255,181,86,0.42)';
            ctx.save();
            ctx.fillStyle = tickColor;
            ctx.shadowColor = active ? 'rgba(255,181,86,0.46)' : 'rgba(255,181,86,0.18)';
            ctx.shadowBlur = active ? 10 : 3;
            var dot = active ? 4 : 3;
            ctx.fillRect(x + 18, y + 8, dot, dot);
            ctx.fillRect(x + width - 18 - dot, y + 8, dot, dot);
            ctx.fillRect(x + 18, y + height - 8 - dot, dot, dot);
            ctx.fillRect(x + width - 18 - dot, y + height - 8 - dot, dot, dot);
            ctx.restore();
        }
        function drawPalTerminalFrame(x, y, width, height, active) {
            var cut = active ? 18 : 16;
            ctx.save();
            drawCutPanelPath(x, y, width, height, cut);
            var outer = ctx.createLinearGradient(x, y, x + width, y + height);
            outer.addColorStop(0, active ? 'rgba(115,239,255,0.78)' : 'rgba(115,239,255,0.36)');
            outer.addColorStop(0.45, active ? 'rgba(204,251,255,0.62)' : 'rgba(204,251,255,0.22)');
            outer.addColorStop(1, active ? 'rgba(71,174,205,0.70)' : 'rgba(71,174,205,0.30)');
            ctx.lineWidth = active ? 3.2 : 2;
            ctx.strokeStyle = outer;
            ctx.shadowColor = active ? 'rgba(109,232,255,0.42)' : 'rgba(109,232,255,0.18)';
            ctx.shadowBlur = active ? 18 : 7;
            ctx.stroke();

            drawCutPanelPath(x + 8, y + 8, width - 16, height - 16, cut - 5);
            ctx.lineWidth = active ? 1.4 : 1;
            ctx.strokeStyle = active ? 'rgba(208,252,255,0.34)' : 'rgba(208,252,255,0.16)';
            ctx.shadowBlur = 0;
            ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.lineWidth = active ? 2.2 : 1.4;
            ctx.strokeStyle = active ? 'rgba(134,243,255,0.62)' : 'rgba(134,243,255,0.24)';
            ctx.shadowColor = active ? 'rgba(134,243,255,0.40)' : 'rgba(134,243,255,0.12)';
            ctx.shadowBlur = active ? 12 : 4;
            var rail = width * 0.18;
            ctx.beginPath();
            ctx.moveTo(x + 18, y + height * 0.5);
            ctx.lineTo(x + rail, y + height * 0.5);
            ctx.moveTo(x + width - rail, y + height * 0.5);
            ctx.lineTo(x + width - 18, y + height * 0.5);
            ctx.moveTo(x + width * 0.38, y + 8);
            ctx.lineTo(x + width * 0.62, y + 8);
            ctx.moveTo(x + width * 0.38, y + height - 8);
            ctx.lineTo(x + width * 0.62, y + height - 8);
            ctx.stroke();
            ctx.restore();
            drawPalStatusTicks(x, y, width, height, active);
        }
        function drawCardPanel(panel) {
            var text = panel.el ? panel.el.textContent.trim() : '';
            var cx = canvas.width * 0.5;
            var cy = toCanvasY(panel.position.y);
            var width = (panel.width / layout.width) * canvas.width;
            var height = (panel.height / layout.height) * canvas.height;
            var active = hoverMode === panel.id;
            var x = cx - width * 0.5;
            var y = cy - height * 0.5;
            var cut = active ? 18 : 16;
            drawCutPanelPath(x, y, width, height, cut);
            var bg = ctx.createLinearGradient(x, y, x + width, y + height);
            bg.addColorStop(0, active ? 'rgba(18,50,60,0.56)' : 'rgba(10,30,38,0.34)');
            bg.addColorStop(0.52, active ? 'rgba(8,22,31,0.42)' : 'rgba(7,18,26,0.22)');
            bg.addColorStop(1, active ? 'rgba(4,12,20,0.30)' : 'rgba(3,9,15,0.16)');
            ctx.fillStyle = bg;
            ctx.fill();
            drawPalTerminalFrame(x, y, width, height, active);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = (active ? '760 ' : '700 ') + Math.round(height * 0.42) + 'px Microsoft YaHei, PingFang SC, Arial, sans-serif';
            ctx.fillStyle = '#effcff';
            ctx.shadowColor = active ? 'rgba(143,249,255,0.82)' : 'rgba(128,238,255,0.48)';
            ctx.shadowBlur = active ? 22 : 12;
            ctx.fillText(text, cx, cy);
            if (panel.id !== 'brand') {
                hitAreas.push({
                    mode: panel.id,
                    minX: x / canvas.width,
                    maxX: (x + width) / canvas.width,
                    minY: 1 - ((y + height) / canvas.height),
                    maxY: 1 - (y / canvas.height)
                });
            }
        }
        function drawNotePanel(panel) {
            var text = panel.el ? panel.el.textContent.trim() : '';
            var cx = canvas.width * 0.5;
            var cy = toCanvasY(panel.position.y);
            var width = (panel.width / layout.width) * canvas.width;
            var words = text.split('。');
            var lines = [];
            for (var i = 0; i < words.length; i++) {
                if (!words[i]) continue;
                lines.push(words[i] + (i < words.length - 1 ? '。' : ''));
            }
            if (!lines.length) lines.push(text);
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '500 21px Microsoft YaHei, PingFang SC, Arial, sans-serif';
            ctx.fillStyle = 'rgba(225, 250, 255, 0.72)';
            ctx.shadowColor = 'rgba(128,238,255,0.34)';
            ctx.shadowBlur = 12;
            for (var lineIndex = 0; lineIndex < lines.length; lineIndex++) {
                ctx.fillText(lines[lineIndex], cx, cy + (lineIndex - (lines.length - 1) * 0.5) * 26, width);
            }
            ctx.restore();
        }
        for (var i = 0; i < panels.length; i++) {
            var panel = panels[i];
            if (panel.id === 'brand') {
                var brandText = panel.el ? panel.el.textContent.trim() : '';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = '700 68px Microsoft YaHei, PingFang SC, Arial, sans-serif';
                ctx.fillStyle = '#effcff';
                ctx.shadowColor = 'rgba(128,238,255,0.72)';
                ctx.shadowBlur = 22;
                ctx.fillText(brandText, canvas.width * 0.5, toCanvasY(panel.position.y));
            } else if (panel.id === 'note') {
                drawNotePanel(panel);
            } else {
                drawCardPanel(panel);
            }
        }
        var texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return { texture: texture, hitAreas: hitAreas };
    }

    function buildSpatialPanelGroup(THREE, panels) {
        var group = new THREE.Group();
        group.renderOrder = 20;
        var layout = {
            width: 310,
            height: 390
        };
        var textureData = createPortalCardTexture(THREE, panels, layout, '');
        var material = new THREE.MeshBasicMaterial({
            map: textureData.texture,
            transparent: true,
            opacity: 0.96,
            depthWrite: false,
            depthTest: false,
            side: THREE.DoubleSide
        });
        var geometry = new THREE.PlaneGeometry(layout.width, layout.height, 1, 1);
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(panels.length ? panels[0].position.x : 300, 0, panels.length ? panels[0].position.z : 35);
        mesh.renderOrder = 20;
        mesh.userData.hitAreas = textureData.hitAreas;
        group.add(mesh);
        group.userData.cardMesh = mesh;
        group.userData.hitAreas = textureData.hitAreas;
        group.userData.layout = layout;
        return group;
    }

    function refreshPortalCardTexture(state) {
        if (!state || !state.spatialPanelGroup || !window.THREE) return;
        var mesh = state.spatialPanelGroup.userData.cardMesh;
        var layout = state.spatialPanelGroup.userData.layout;
        if (!mesh || !mesh.material || !layout) return;
        var textureData = createPortalCardTexture(window.THREE, state.spatialPanels || [], layout, state.portalHoverMode || '');
        var oldMap = mesh.material.map;
        mesh.material.map = textureData.texture;
        mesh.material.needsUpdate = true;
        mesh.userData.hitAreas = textureData.hitAreas;
        state.spatialPanelGroup.userData.hitAreas = textureData.hitAreas;
        if (oldMap && typeof oldMap.dispose === 'function') oldMap.dispose();
    }

    function setPortalCardHoverMode(state, mode) {
        if (!state) return;
        var nextMode = mode || '';
        if (state.portalHoverMode === nextMode) return;
        state.portalHoverMode = nextMode;
        refreshPortalCardTexture(state);
    }

    function getPortalCardModeAtEvent(state, event) {
        if (!state || !state.spatialPanelGroup || !state.panelTools || !state.camera || !event) return '';
        var mesh = state.spatialPanelGroup.userData.cardMesh;
        if (!mesh) return '';
        var rect = state.renderer.domElement.getBoundingClientRect();
        var tools = state.panelTools;
        tools.pointerNdc.set(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -(((event.clientY - rect.top) / rect.height) * 2 - 1)
        );
        tools.raycaster.setFromCamera(tools.pointerNdc, state.camera);
        var hits = tools.raycaster.intersectObject(mesh, false);
        if (!hits.length || !hits[0].uv) return '';
        var uv = hits[0].uv;
        var areas = mesh.userData.hitAreas || [];
        for (var i = 0; i < areas.length; i++) {
            var area = areas[i];
            if (uv.x >= area.minX && uv.x <= area.maxX && uv.y >= area.minY && uv.y <= area.maxY) {
                return area.mode;
            }
        }
        return '';
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function rgbToHslPortal(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        var max = Math.max(r, g, b);
        var min = Math.min(r, g, b);
        var h = 0;
        var s = 0;
        var l = (max + min) * 0.5;
        var d = max - min;
        if (d) {
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
            else if (max === g) h = (b - r) / d + 2;
            else h = (r - g) / d + 4;
            h /= 6;
        }
        return { h: h, s: s, l: l };
    }

    function hslToRgbPortal(h, s, l) {
        function hue(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }
        var r;
        var g;
        var b;
        if (!s) r = g = b = l;
        else {
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue(p, q, h + 1 / 3);
            g = hue(p, q, h);
            b = hue(p, q, h - 1 / 3);
        }
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    }

    function portalRgbValue(rgb) {
        return rgb.r + ', ' + rgb.g + ', ' + rgb.b;
    }

    function parsePortalRgb(value, fallback) {
        if (!value) return { r: fallback.r, g: fallback.g, b: fallback.b };
        if (value.charAt(0) === '#') {
            var hex = value.slice(1);
            if (hex.length === 3) hex = hex.charAt(0) + hex.charAt(0) + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2);
            if (hex.length === 6) {
                return {
                    r: parseInt(hex.slice(0, 2), 16),
                    g: parseInt(hex.slice(2, 4), 16),
                    b: parseInt(hex.slice(4, 6), 16)
                };
            }
        }
        var match = value.match(/(\d+)\D+(\d+)\D+(\d+)/);
        if (!match) return { r: fallback.r, g: fallback.g, b: fallback.b };
        return {
            r: clamp(parseInt(match[1], 10), 0, 255),
            g: clamp(parseInt(match[2], 10), 0, 255),
            b: clamp(parseInt(match[3], 10), 0, 255)
        };
    }

    function clonePortalRgb(rgb) {
        return { r: rgb.r, g: rgb.g, b: rgb.b };
    }

    function createPortalBackgroundState(palette) {
        var baseFallback = { r: 3, g: 7, b: 11 };
        var base = parsePortalRgb(palette.base, baseFallback);
        return {
            currentPrimary: clonePortalRgb(palette.primary),
            currentSecondary: clonePortalRgb(palette.secondary),
            currentBase: clonePortalRgb(base),
            targetPrimary: clonePortalRgb(palette.primary),
            targetSecondary: clonePortalRgb(palette.secondary),
            targetBase: clonePortalRgb(base)
        };
    }

    function easePortalRgb(current, target, follow) {
        current.r += (target.r - current.r) * follow;
        current.g += (target.g - current.g) * follow;
        current.b += (target.b - current.b) * follow;
    }

    function writePortalBackground(state) {
        if (!state || !state.root || !state.portalBackground) return;
        var background = state.portalBackground;
        state.root.style.setProperty('--pt-portal-bg-primary', Math.round(background.currentPrimary.r) + ', ' + Math.round(background.currentPrimary.g) + ', ' + Math.round(background.currentPrimary.b));
        state.root.style.setProperty('--pt-portal-bg-secondary', Math.round(background.currentSecondary.r) + ', ' + Math.round(background.currentSecondary.g) + ', ' + Math.round(background.currentSecondary.b));
        state.root.style.setProperty('--pt-portal-bg-base', 'rgb(' + Math.round(background.currentBase.r) + ', ' + Math.round(background.currentBase.g) + ', ' + Math.round(background.currentBase.b) + ')');
    }

    function tickPortalBackground(state) {
        if (!state || !state.portalBackground) return;
        var background = state.portalBackground;
        easePortalRgb(background.currentPrimary, background.targetPrimary, PORTAL_BACKGROUND_FOLLOW);
        easePortalRgb(background.currentSecondary, background.targetSecondary, PORTAL_BACKGROUND_FOLLOW);
        easePortalRgb(background.currentBase, background.targetBase, PORTAL_BACKGROUND_FOLLOW);
        writePortalBackground(state);
    }

    function selectPortalDominantColor(data, sampleSize, drawX, drawY, drawWidth, drawHeight) {
        var bucketCount = 18;
        var buckets = [];
        var coloredPixels = 0;
        for (var bucketIndex = 0; bucketIndex < bucketCount; bucketIndex++) {
            buckets.push({ weight: 0, r: 0, g: 0, b: 0 });
        }
        for (var y = drawY; y < drawY + drawHeight; y += 4) {
            for (var x = drawX; x < drawX + drawWidth; x += 4) {
                var offset = (y * sampleSize + x) * 4;
                var alpha = data[offset + 3] / 255;
                if (alpha < 0.5) continue;
                var r = data[offset];
                var g = data[offset + 1];
                var b = data[offset + 2];
                var lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
                if (lum <= 0.08 || lum >= 0.92) continue;
                var hsl = rgbToHslPortal(r, g, b);
                if (hsl.s < 0.08) continue;
                var index = Math.floor(hsl.h * bucketCount) % bucketCount;
                var weight = 0.8 + Math.min(1, hsl.s) * 0.2;
                var bucket = buckets[index];
                bucket.weight += weight;
                bucket.r += r * weight;
                bucket.g += g * weight;
                bucket.b += b * weight;
                coloredPixels++;
            }
        }
        if (!coloredPixels) return null;
        var bestIndex = 0;
        var bestWeight = -1;
        for (var i = 0; i < bucketCount; i++) {
            var previous = buckets[(i + bucketCount - 1) % bucketCount];
            var current = buckets[i];
            var next = buckets[(i + 1) % bucketCount];
            var combinedWeight = current.weight + (previous.weight + next.weight) * 0.42;
            if (combinedWeight > bestWeight) {
                bestWeight = combinedWeight;
                bestIndex = i;
            }
        }
        var selectedR = 0;
        var selectedG = 0;
        var selectedB = 0;
        var selectedWeight = 0;
        for (var neighbor = -1; neighbor <= 1; neighbor++) {
            var selectedBucket = buckets[(bestIndex + neighbor + bucketCount) % bucketCount];
            var neighborWeight = neighbor === 0 ? 1 : 0.42;
            selectedR += selectedBucket.r * neighborWeight;
            selectedG += selectedBucket.g * neighborWeight;
            selectedB += selectedBucket.b * neighborWeight;
            selectedWeight += selectedBucket.weight * neighborWeight;
        }
        if (!selectedWeight) return null;
        return {
            r: Math.round(selectedR / selectedWeight),
            g: Math.round(selectedG / selectedWeight),
            b: Math.round(selectedB / selectedWeight)
        };
    }

    function extractPortalImagePalette(image) {
        var fallback = {
            primary: { r: 80, g: 212, b: 255 },
            secondary: { r: 62, g: 154, b: 188 },
            base: '#03070b'
        };
        if (!image) return fallback;
        try {
            var sampleSize = 128;
            var naturalWidth = Math.max(1, image.naturalWidth || image.width || 1);
            var naturalHeight = Math.max(1, image.naturalHeight || image.height || 1);
            var scale = Math.min(sampleSize / naturalWidth, sampleSize / naturalHeight);
            var drawWidth = Math.max(1, Math.round(naturalWidth * scale));
            var drawHeight = Math.max(1, Math.round(naturalHeight * scale));
            var drawX = Math.floor((sampleSize - drawWidth) / 2);
            var drawY = Math.floor((sampleSize - drawHeight) / 2);
            var canvas = document.createElement('canvas');
            canvas.width = sampleSize;
            canvas.height = sampleSize;
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, sampleSize, sampleSize);
            ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
            var data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
            var sumR = 0;
            var sumG = 0;
            var sumB = 0;
            var count = 0;
            for (var y = drawY; y < drawY + drawHeight; y += 4) {
                for (var x = drawX; x < drawX + drawWidth; x += 4) {
                    var offset = (y * sampleSize + x) * 4;
                    var alpha = data[offset + 3] / 255;
                    if (alpha < 0.5) continue;
                    var r = data[offset];
                    var g = data[offset + 1];
                    var b = data[offset + 2];
                    var lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
                    sumR += r; sumG += g; sumB += b; count++;
                }
            }
            var dominant = selectPortalDominantColor(data, sampleSize, drawX, drawY, drawWidth, drawHeight);
            if (!count || !dominant) return fallback;
            var avgL = (sumR / count * 0.299 + sumG / count * 0.587 + sumB / count * 0.114) / 255;
            var hsl = rgbToHslPortal(dominant.r, dominant.g, dominant.b);
            if (avgL < 0.15 || hsl.s < 0.08) return fallback;
            var saturation = clamp(hsl.s + 0.12, 0.36, 0.78);
            var primary = hslToRgbPortal(hsl.h, saturation, 0.42);
            var secondary = hslToRgbPortal((hsl.h + 0.065) % 1, clamp(saturation * 0.82, 0.30, 0.64), 0.30);
            var baseRgb = hslToRgbPortal(hsl.h, clamp(saturation * 0.42, 0.18, 0.36), 0.035);
            return {
                primary: primary,
                secondary: secondary,
                base: 'rgb(' + baseRgb.r + ', ' + baseRgb.g + ', ' + baseRgb.b + ')',
                source: dominant
            };
        } catch (error) {
            return fallback;
        }
    }

    function applyPortalBackgroundPalette(state, palette) {
        if (!state || !state.root || !palette) return;
        state.portalBackgroundPalette = palette;
        if (!state.portalBackground) {
            state.portalBackground = createPortalBackgroundState(palette);
            writePortalBackground(state);
            return;
        }
        state.portalBackground.targetPrimary = clonePortalRgb(palette.primary);
        state.portalBackground.targetSecondary = clonePortalRgb(palette.secondary);
        state.portalBackground.targetBase = parsePortalRgb(palette.base, { r: 3, g: 7, b: 11 });
    }

    function buildImageFallbackTarget(count) {
        var target = new Float32Array(count * 3);
        var colors = new Float32Array(count * 3);
        for (var i = 0; i < count; i++) {
            var row = Math.floor(i / 84);
            var col = i % 84;
            var x = (col - 41.5) * 7.2;
            var y = (row - 24.5) * 5.4;
            var z = Math.sin(col * 0.17 + row * 0.11) * 18;
            writePoint(target, i, x, y, z);
            writeColor(colors, i, 0.35 + seededRandom(i + 1701) * 0.28, 0.74 + seededRandom(i + 1717) * 0.2, 1);
        }
        return { positions: target, colors: colors };
    }

    function buildTargets(count) {
        var avatarTarget = buildImageFallbackTarget(count);
        return {
            default: avatarTarget,
            defaultShapes: { avatar: avatarTarget }
        };
    }

    function buildAvatarParticleTarget(image, count) {
        var canvas = document.createElement('canvas');
        var naturalWidth = Math.max(1, image.naturalWidth || image.width || 1);
        var naturalHeight = Math.max(1, image.naturalHeight || image.height || 1);
        var sampleSize = 280;
        var scale = Math.min(sampleSize / naturalWidth, sampleSize / naturalHeight);
        var drawWidth = Math.max(1, Math.round(naturalWidth * scale));
        var drawHeight = Math.max(1, Math.round(naturalHeight * scale));
        var drawX = Math.floor((sampleSize - drawWidth) / 2);
        var drawY = Math.floor((sampleSize - drawHeight) / 2);
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, sampleSize, sampleSize);
        ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
        var data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
        var candidates = [];
        var step = Math.max(1, Math.floor(Math.sqrt(drawWidth * drawHeight / (count * 1.25))));
        for (var y = drawY; y < drawY + drawHeight; y += step) {
            for (var x = drawX; x < drawX + drawWidth; x += step) {
                var offset = (y * sampleSize + x) * 4;
                var alpha = data[offset + 3] / 255;
                if (alpha <= 0.08) continue;
                var r = data[offset];
                var g = data[offset + 1];
                var b = data[offset + 2];
                var brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
                candidates.push({ x: x - drawX - drawWidth / 2, y: y - drawY - drawHeight / 2, r: r / 255, g: g / 255, b: b / 255, alpha: alpha, brightness: brightness });
            }
        }
        if (!candidates.length) return buildImageFallbackTarget(count);
        var target = new Float32Array(count * 3);
        var colors = new Float32Array(count * 3);
        var fitScale = Math.min(430 / drawWidth, 330 / drawHeight);
        for (var i = 0; i < count; i++) {
            var sourceIndex = Math.floor(i * candidates.length / count);
            if (sourceIndex >= candidates.length) sourceIndex = candidates.length - 1;
            var pixel = candidates[sourceIndex];
            var jitter = candidates.length < count ? 1.6 : 0.45;
            var px = pixel.x * fitScale + (seededRandom(i + 1801) - 0.5) * jitter;
            var py = -pixel.y * fitScale + (seededRandom(i + 1811) - 0.5) * jitter;
            var pz = (pixel.brightness - 0.44) * 84 + (pixel.alpha - 0.5) * 18 + (seededRandom(i + 1823) - 0.5) * 9;
            writePoint(target, i, px, py, pz);
            writeColor(colors, i, Math.min(1, pixel.r * 1.14 + 0.04), Math.min(1, pixel.g * 1.14 + 0.04), Math.min(1, pixel.b * 1.14 + 0.05));
        }
        return { positions: target, colors: colors };
    }

    function readStorageValue(key) {
        try { return window.localStorage ? window.localStorage.getItem(key) : ''; } catch (error) { return ''; }
    }

    function writeStorageValue(key, value) {
        try {
            if (!window.localStorage) return;
            if (value) window.localStorage.setItem(key, value);
            else window.localStorage.removeItem(key);
        } catch (error) {}
    }

    function normalizeAvatarSrc(src) {
        for (var i = 0; i < PAL_AVATAR_IMAGES.length; i++) {
            if (PAL_AVATAR_IMAGES[i].src === src) return src;
        }
        return PAL_AVATAR_IMAGES.length ? PAL_AVATAR_IMAGES[0].src : '';
    }

    function getAvatarName(src) {
        for (var i = 0; i < PAL_AVATAR_IMAGES.length; i++) {
            if (PAL_AVATAR_IMAGES[i].src === src) return PAL_AVATAR_IMAGES[i].name;
        }
        return 'avatar';
    }

    function readPortalAvatarChoice() {
        var mode = readStorageValue(AVATAR_CHOICE_MODE_KEY) === 'fixed' ? 'fixed' : 'random';
        var src = normalizeAvatarSrc(readStorageValue(AVATAR_CHOICE_SRC_KEY));
        if (!src) mode = 'random';
        return { mode: mode, src: src };
    }

    function savePortalAvatarChoice(mode, src) {
        writeStorageValue(AVATAR_CHOICE_MODE_KEY, mode === 'fixed' ? 'fixed' : 'random');
        writeStorageValue(AVATAR_CHOICE_SRC_KEY, mode === 'fixed' ? normalizeAvatarSrc(src) : '');
    }

    function chooseRandomAvatarSrc(currentSrc) {
        if (!PAL_AVATAR_IMAGES.length) return '';
        if (PAL_AVATAR_IMAGES.length === 1) return PAL_AVATAR_IMAGES[0].src;
        var next = currentSrc;
        for (var i = 0; i < 8 && next === currentSrc; i++) {
            next = PAL_AVATAR_IMAGES[Math.floor(Math.random() * PAL_AVATAR_IMAGES.length)].src;
        }
        return next;
    }

    function setAvatarTarget(state, src, target) {
        if (!state || !target) return;
        state.targets.default = target;
        state.targets.defaultShapes.avatar = target;
        state.avatar.currentSrc = src;
        state.avatar.currentName = getAvatarName(src);
        state.imageParticleReady = true;
    }

    function loadAvatarParticleTarget(state, src) {
        if (!state || !src) return;
        if (!state.avatarTargets) state.avatarTargets = {};
        if (!state.avatarPalettes) state.avatarPalettes = {};
        state.avatar.requestedSrc = src;
        if (state.avatarTargets[src]) {
            setAvatarTarget(state, src, state.avatarTargets[src]);
            applyPortalBackgroundPalette(state, state.avatarPalettes[src] || extractPortalImagePalette(null));
            return;
        }
        state.avatar.loadingSrc = src;
        var image = new Image();
        image.onload = function() {
            try {
                var target = buildAvatarParticleTarget(image, PARTICLE_COUNT);
                var palette = extractPortalImagePalette(image);
                state.avatarTargets[src] = target;
                state.avatarPalettes[src] = palette;
                if (state.avatar.requestedSrc === src) {
                    setAvatarTarget(state, src, target);
                    applyPortalBackgroundPalette(state, palette);
                }
            } catch (error) { state.imageParticleReady = false; }
            if (state.avatar.loadingSrc === src) state.avatar.loadingSrc = '';
        };
        image.onerror = function() {
            if (state.avatar.loadingSrc === src) state.avatar.loadingSrc = '';
            state.imageParticleReady = false;
        };
        image.src = src;
    }

    function applyAvatarChoice(state, mode, src, persist) {
        if (!state || !state.avatar) return;
        var fixed = mode === 'fixed';
        var targetSrc = fixed ? normalizeAvatarSrc(src) : chooseRandomAvatarSrc(state.avatar.currentSrc);
        state.avatar.mode = fixed ? 'fixed' : 'random';
        state.avatar.nextSwitchAt = performance.now() + AVATAR_IMAGE_SWITCH_MS;
        if (persist) savePortalAvatarChoice(state.avatar.mode, targetSrc);
        loadAvatarParticleTarget(state, targetSrc);
    }

    function initAvatarPlayback(state) {
        var choice = readPortalAvatarChoice();
        applyAvatarChoice(state, choice.mode, choice.src, false);
    }

    function updateAvatarPlayback(state, now) {
        if (!state || !state.avatar || state.avatar.mode !== 'random') return;
        if (now < state.avatar.nextSwitchAt) return;
        state.avatar.nextSwitchAt = now + AVATAR_IMAGE_SWITCH_MS;
        loadAvatarParticleTarget(state, chooseRandomAvatarSrc(state.avatar.currentSrc));
    }

    function createScene(canvas, root) {
        if (!canvas || !window.THREE) return null;
        var THREE = window.THREE;
        var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(58, 1, 0.1, 1800);
        camera.position.set(0, 0, 760);

        var targets = buildTargets(PARTICLE_COUNT);
        var positions = new Float32Array(PARTICLE_COUNT * 3);
        var colors = new Float32Array(PARTICLE_COUNT * 3);
        var sizes = new Float32Array(PARTICLE_COUNT);
        for (var i = 0; i < PARTICLE_COUNT; i++) {
            writePoint(positions, i, targets.default.positions[i * 3], targets.default.positions[i * 3 + 1], targets.default.positions[i * 3 + 2]);
            writeColor(colors, i, targets.default.colors[i * 3], targets.default.colors[i * 3 + 1], targets.default.colors[i * 3 + 2]);
            sizes[i] = 1.1 + seededRandom(i + 1601) * 1.5;
        }
        var geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        var material = new THREE.PointsMaterial({
            size: 1.3,
            map: createParticleTexture(THREE),
            transparent: true,
            opacity: 0.96,
            vertexColors: true,
            blending: THREE.NormalBlending,
            depthWrite: false,
            alphaTest: 0.012
        });
        var points = new THREE.Points(geometry, material);
        scene.add(points);
        var spatialPanels = buildSpatialPanels(THREE, root);
        var spatialPanelGroup = buildSpatialPanelGroup(THREE, spatialPanels);
        scene.add(spatialPanelGroup);

        return {
            root: root,
            renderer: renderer,
            scene: scene,
            camera: camera,
            points: points,
            geometry: geometry,
            targets: targets,
            positions: positions,
            colors: colors,
            sizes: sizes,
            portalUi: root ? root.querySelector('.pt-portal-ui') : null,
            spatialPanelGroup: spatialPanelGroup,
            portalHoverMode: '',
            portalBackgroundPalette: extractPortalImagePalette(null),
            portalBackground: createPortalBackgroundState(extractPortalImagePalette(null)),
            imageParticleReady: false,
            avatar: { mode: 'random', currentSrc: '', currentName: 'avatar', requestedSrc: '', loadingSrc: '', nextSwitchAt: 0 },
            avatarTargets: {},
            avatarPalettes: {},
            sceneSpin: {
                target: new THREE.Vector3(0, -30, 0),
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                radius: 760,
                targetRadius: 760,
                minRadius: 460,
                maxRadius: 1120,
                dragging: false,
                lastX: 0,
                lastY: 0,
                lastPointerAt: 0,
                lastFrameAt: performance.now(),
                pointerX: 0,
                pointerY: 0
            },
            spatialPanels: spatialPanels,
            panelBinding: { x: 0, y: 0, z: 0 },
            panelTools: {
                euler: new THREE.Euler(0, 0, 0, 'XYZ'),
                local: new THREE.Vector3(),
                world: new THREE.Vector3(),
                cameraSpace: new THREE.Vector3(),
                projected: new THREE.Vector3(),
                pointerNdc: new THREE.Vector2(),
                raycaster: new THREE.Raycaster()
            },
            mouse: { x: 0, y: 0, z: 0, hit: false, insideParticleField: false, active: false },
            mouseTools: {
                ndc: new THREE.Vector3(),
                worldHit: new THREE.Vector3(),
                localOrigin: new THREE.Vector3(),
                localDirection: new THREE.Vector3(),
                localHit: new THREE.Vector3(),
                inversePointsMatrix: new THREE.Matrix4()
            },
            startedAt: performance.now()
        };
    }

    function resizeScene(state, canvas) {
        if (!state || !canvas) return;
        var rect = canvas.getBoundingClientRect();
        var width = Math.max(1, rect.width);
        var height = Math.max(1, rect.height);
        state.camera.aspect = width / height;
        state.camera.updateProjectionMatrix();
        state.renderer.setSize(width, height, false);
    }

    function updateSceneView(state, now) {
        if (!state || !state.sceneSpin) return;
        var spin = state.sceneSpin;
        spin.radius += (spin.targetRadius - spin.radius) * 0.12;
        state.camera.position.set(0, 0, spin.radius);
        state.camera.up.set(0, 1, 0);
        state.camera.lookAt(spin.target);
        state.camera.updateMatrixWorld();
        projectSpatialPanels(state);
        tickSceneSpin(spin, now);
        state.points.rotation.x += (spin.x - state.points.rotation.x) * PARTICLE_TARGET_FOLLOW;
        state.points.rotation.y += (spin.y - state.points.rotation.y) * PARTICLE_TARGET_FOLLOW;
        state.points.rotation.z += (0 - state.points.rotation.z) * PARTICLE_TARGET_FOLLOW;
    }

    function applySceneSpinDrag(spin, dx, dy, now) {
        if (!spin) return;
        var elapsed = clamp(now - spin.lastPointerAt, 8, 80) / 1000;
        var yawDelta = dx * ORBIT_POINTER_SPIN_Y;
        var pitchDelta = dy * ORBIT_POINTER_SPIN_X;
        spin.y += yawDelta;
        spin.x += pitchDelta;
        spin.vy = clamp(yawDelta / elapsed * ORBIT_VELOCITY_SCALE, -ORBIT_SPIN_MAX, ORBIT_SPIN_MAX);
        spin.vx = clamp(pitchDelta / elapsed * ORBIT_VELOCITY_SCALE, -ORBIT_SPIN_MAX, ORBIT_SPIN_MAX);
        spin.lastPointerAt = now;
    }

    function tickSceneSpin(spin, now) {
        if (!spin) return;
        var elapsed = clamp((now - spin.lastFrameAt) / 1000, 1 / 120, 0.05);
        spin.lastFrameAt = now;
        spin.x += spin.vx * elapsed;
        spin.y += spin.vy * elapsed;
        var damping = Math.pow(ORBIT_SPIN_DAMPING, elapsed * 60);
        spin.vx *= damping;
        spin.vy *= damping;
        if (Math.abs(spin.vx) < 0.01) spin.vx = 0;
        if (Math.abs(spin.vy) < 0.01) spin.vy = 0;
    }

    function projectSpatialPanels(state) {
        if (!state || !state.sceneSpin || !state.panelBinding || !state.panelTools) return;
        var spin = state.sceneSpin;
        var binding = state.panelBinding;
        var pointerX = spin.pointerX || 0;
        var pointerY = spin.pointerY || 0;
        binding.x += ((state.points.rotation.x - pointerY * 0.010) - binding.x) * PANEL_PARTICLE_FOLLOW;
        binding.y += ((state.points.rotation.y + pointerX * 0.018) - binding.y) * PANEL_PARTICLE_FOLLOW;
        binding.z += (state.points.rotation.z - binding.z) * PANEL_PARTICLE_FOLLOW;
        var groupOffsetX = pointerX * 5;
        var groupOffsetY = pointerY * 4;
        var groupOffsetZ = pointerY * 2 - pointerX * 2;
        var tools = state.panelTools;
        if (state.portalUi) state.portalUi.style.transform = '';
        if (state.spatialPanelGroup) {
            state.spatialPanelGroup.position.set(groupOffsetX, groupOffsetY, groupOffsetZ);
            state.spatialPanelGroup.rotation.x = binding.x;
            state.spatialPanelGroup.rotation.y = binding.y;
            state.spatialPanelGroup.rotation.z = binding.z;
            state.spatialPanelGroup.updateMatrixWorld();
        }
        var rect = state.renderer.domElement.getBoundingClientRect();
        for (var i = 0; i < state.spatialPanels.length; i++) {
            var panel = state.spatialPanels[i];
            if (!panel.mesh) continue;
            panel.mesh.updateMatrixWorld();
            tools.world.setFromMatrixPosition(panel.mesh.matrixWorld);
            tools.cameraSpace.copy(tools.world).applyMatrix4(state.camera.matrixWorldInverse);
            tools.projected.copy(tools.world).project(state.camera);
            var visible = tools.cameraSpace.z < -1 && tools.projected.z > -1 && tools.projected.z < 1;
            panel.el.style.visibility = visible ? 'visible' : 'hidden';
            if (!visible) continue;
            var screenX = (tools.projected.x * 0.5 + 0.5) * rect.width;
            var screenY = (-tools.projected.y * 0.5 + 0.5) * rect.height;
            var depthScale = clamp(spin.radius / -tools.cameraSpace.z, 0.48, 1.72);
            var scale = panel.baseScale * depthScale;
            panel.el.style.transform = 'translate(-50%,-50%) translate3d(' + screenX.toFixed(1) + 'px,' + screenY.toFixed(1) + 'px,0) scale(' + scale.toFixed(3) + ')';
        }
    }

    function updateMouseGravityWell(state, event, root, card) {
        if (!state || !state.mouseTools) return;
        var canvas = document.getElementById('pt-portal-canvas');
        var rect = canvas ? canvas.getBoundingClientRect() : root.getBoundingClientRect();
        var tools = state.mouseTools;
        tools.ndc.set(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -(((event.clientY - rect.top) / rect.height) * 2 - 1),
            0.5
        );
        state.camera.updateMatrixWorld();
        state.points.updateMatrixWorld();
        tools.worldHit.copy(tools.ndc).unproject(state.camera);
        tools.localOrigin.copy(state.camera.position);
        tools.localDirection.copy(tools.worldHit).sub(state.camera.position).normalize();
        tools.inversePointsMatrix.copy(state.points.matrixWorld).invert();
        tools.localOrigin.applyMatrix4(tools.inversePointsMatrix);
        tools.localDirection.transformDirection(tools.inversePointsMatrix);
        if (Math.abs(tools.localDirection.z) < 0.0001) {
            state.mouse.active = false;
            state.mouse.hit = false;
            state.mouse.insideParticleField = false;
            return;
        }
        var hitDistance = -tools.localOrigin.z / tools.localDirection.z;
        var hit = hitDistance > 0;
        tools.localHit.copy(tools.localDirection).multiplyScalar(hitDistance).add(tools.localOrigin);
        var insideField = !card && hit &&
            Math.abs(tools.localHit.x) <= MOUSE_PARTICLE_FIELD_WIDTH * 0.5 &&
            Math.abs(tools.localHit.y) <= MOUSE_PARTICLE_FIELD_HEIGHT * 0.5;
        state.mouse.x = tools.localHit.x;
        state.mouse.y = tools.localHit.y;
        state.mouse.z = tools.localHit.z;
        state.mouse.hit = hit;
        state.mouse.insideParticleField = insideField;
        state.mouse.active = insideField;
    }

    function tick() {
        if (!sceneState) return;
        var now = performance.now();
        var elapsed = now - sceneState.startedAt;
        var t = elapsed * 0.001;
        updateAvatarPlayback(sceneState, now);
        tickPortalBackground(sceneState);
        var targetData = sceneState.targets.default;
        var positionAttr = sceneState.geometry.getAttribute('position');
        var colorAttr = sceneState.geometry.getAttribute('color');
        for (var i = 0; i < PARTICLE_COUNT; i++) {
            var offset = i * 3;
            var tx;
            var ty;
            var tz;
            var cr;
            var cg;
            var cb;
            tx = targetData.positions[offset];
            ty = targetData.positions[offset + 1];
            tz = targetData.positions[offset + 2];
            cr = targetData.colors[offset];
            cg = targetData.colors[offset + 1];
            cb = targetData.colors[offset + 2];
            var breath = Math.sin(t * 1.4 + i * 0.023) * 3.5;
            var orbit = Math.sin(t * 0.45 + i * 0.011) * 2.5;
            var mx = 0;
            var my = 0;
            var mz = 0;
            if (sceneState.mouse.active && sceneState.mouse.hit && sceneState.mouse.insideParticleField) {
                var dx = tx - sceneState.mouse.x;
                var dy = ty - sceneState.mouse.y;
                var planeDistance = Math.sqrt(dx * dx + dy * dy);
                var gravityWell = 0;
                if (planeDistance < MOUSE_GRAVITY_WELL_RADIUS) {
                    var normalizedDistance = planeDistance / MOUSE_GRAVITY_WELL_RADIUS;
                    gravityWell = smoothstep(1 - normalizedDistance);
                    gravityWell = gravityWell * gravityWell * (1.12 - normalizedDistance * 0.12);
                    mx = -dx * gravityWell * (MOUSE_GRAVITY_WELL_PINCH / MOUSE_GRAVITY_WELL_RADIUS);
                    my = -dy * gravityWell * (MOUSE_GRAVITY_WELL_PINCH / MOUSE_GRAVITY_WELL_RADIUS);
                    mz = -MOUSE_GRAVITY_WELL_DEPTH * gravityWell;
                    var rim = smoothstep(1 - Math.abs(normalizedDistance - 0.72) / 0.28) * 0.16;
                    cr = Math.min(1, cr + rim);
                    cg = Math.min(1, cg + rim * 0.92);
                    cb = Math.min(1, cb + rim * 0.72);
                }
            }
            sceneState.positions[offset] += (tx + mx + orbit - sceneState.positions[offset]) * PARTICLE_REBUILD_FOLLOW;
            sceneState.positions[offset + 1] += (ty + my + breath - sceneState.positions[offset + 1]) * PARTICLE_REBUILD_FOLLOW;
            sceneState.positions[offset + 2] += (tz + mz + orbit * 0.8 - sceneState.positions[offset + 2]) * PARTICLE_REBUILD_FOLLOW;
            sceneState.colors[offset] += (cr - sceneState.colors[offset]) * PARTICLE_REBUILD_FOLLOW;
            sceneState.colors[offset + 1] += (cg - sceneState.colors[offset + 1]) * PARTICLE_REBUILD_FOLLOW;
            sceneState.colors[offset + 2] += (cb - sceneState.colors[offset + 2]) * PARTICLE_REBUILD_FOLLOW;
        }
        positionAttr.needsUpdate = true;
        colorAttr.needsUpdate = true;
        updateSceneView(sceneState, now);
        sceneState.renderer.render(sceneState.scene, sceneState.camera);
        rafId = requestAnimationFrame(tick);
    }

    function bind(root) {
        if (!root) return;
        bindAvatarPicker(root);
        root.addEventListener('pointerdown', function(event) {
            if (!sceneState || event.button !== 0) return;
            if (event.target.closest('.pt-portal-image-picker')) return;
            sceneState.sceneSpin.dragging = true;
            sceneState.sceneSpin.lastX = event.clientX;
            sceneState.sceneSpin.lastY = event.clientY;
            sceneState.sceneSpin.lastPointerAt = performance.now();
            sceneState.sceneSpin.vx = 0;
            sceneState.sceneSpin.vy = 0;
            sceneState.sceneSpin.dragMoved = false;
            setPortalCardHoverMode(sceneState, '');
            root.classList.add('pt-portal-root--rotating');
        });
        root.addEventListener('pointermove', function(event) {
            var card = event.target.closest('.pt-portal-card');
            if (sceneState) {
                var rootRect = root.getBoundingClientRect();
                sceneState.sceneSpin.pointerX = ((event.clientX - rootRect.left) / rootRect.width) * 2 - 1;
                sceneState.sceneSpin.pointerY = -(((event.clientY - rootRect.top) / rootRect.height) * 2 - 1);
                updateMouseGravityWell(sceneState, event, root, card);
                var hoverMode = sceneState.sceneSpin.dragging ? '' : getPortalCardModeAtEvent(sceneState, event);
                setPortalCardHoverMode(sceneState, hoverMode);
                if (sceneState.sceneSpin.dragging) {
                    var dx = event.clientX - sceneState.sceneSpin.lastX;
                    var dy = event.clientY - sceneState.sceneSpin.lastY;
                    sceneState.sceneSpin.lastX = event.clientX;
                    sceneState.sceneSpin.lastY = event.clientY;
                    if (Math.abs(dx) + Math.abs(dy) > 2) sceneState.sceneSpin.dragMoved = true;
                    applySceneSpinDrag(sceneState.sceneSpin, dx, dy, performance.now());
                }
            }
        });
        root.addEventListener('pointerleave', function() {
            if (sceneState) {
                sceneState.mouse.active = false;
                sceneState.mouse.hit = false;
                sceneState.mouse.insideParticleField = false;
                sceneState.sceneSpin.pointerX = 0;
                sceneState.sceneSpin.pointerY = 0;
                setPortalCardHoverMode(sceneState, '');
            }
        });
        window.addEventListener('pointerup', function() {
            if (!sceneState || !sceneState.sceneSpin.dragging) return;
            sceneState.sceneSpin.dragging = false;
            root.classList.remove('pt-portal-root--rotating');
        });
        root.addEventListener('wheel', function(event) {
            if (!sceneState || !sceneState.sceneSpin) return;
            event.preventDefault();
            sceneState.sceneSpin.targetRadius = clamp(sceneState.sceneSpin.targetRadius + event.deltaY * 0.42, sceneState.sceneSpin.minRadius, sceneState.sceneSpin.maxRadius);
        }, { passive: false });
        root.addEventListener('click', function(event) {
            if (event.target.closest('.pt-portal-image-picker')) return;
            if (sceneState && sceneState.sceneSpin && sceneState.sceneSpin.dragMoved) {
                sceneState.sceneSpin.dragMoved = false;
                return;
            }
            var mode = getPortalCardModeAtEvent(sceneState, event);
            if (!mode) return;
            if (typeof window.PT_switchModeWithTransition === 'function') {
                window.PT_switchModeWithTransition(mode);
            }
        });
    }

    function bindAvatarPicker(root) {
        var picker = root.querySelector('[data-portal-avatar-select]');
        var pickerRoot = root.querySelector('[data-portal-image-picker]');
        if (pickerRoot) {
            pickerRoot.addEventListener('pointerdown', function(event) { event.stopPropagation(); });
            pickerRoot.addEventListener('click', function(event) { event.stopPropagation(); });
            pickerRoot.addEventListener('wheel', function(event) { event.stopPropagation(); }, { passive: true });
        }
        if (!picker) return;
        picker.addEventListener('change', function(event) {
            var value = event.target.value;
            if (value === AVATAR_RANDOM_VALUE) applyAvatarChoice(sceneState, 'random', '', true);
            else applyAvatarChoice(sceneState, 'fixed', value, true);
        });
    }

    function start() {
        if (!shouldRenderPortal()) return;
        var root = renderPortal();
        bind(root);
        var canvas = document.getElementById('pt-portal-canvas');
        sceneState = createScene(canvas, root);
        if (sceneState) {
            initAvatarPlayback(sceneState);
            resizeScene(sceneState, canvas);
            window.addEventListener('resize', function() { resizeScene(sceneState, canvas); });
            tick();
        }
        if (typeof window.PT_finishModeSwitchTransition === 'function') {
            window.PT_finishModeSwitchTransition();
        }
    }

    window.PT_renderModePortal = start;
    window.PT_PORTAL_PARTICLE_DEBUG = {
        getAvailableModes: function() { return TARGET_MODES.slice(); },
        getParticleCount: function() { return PARTICLE_COUNT; },
        getParticleShape: function() { return PARTICLE_SHAPE; },
        getCameraModel: function() { return CAMERA_MODEL; },
        getOrbitControlRules: function() {
            return {
                passiveMouseAffectsCamera: false,
                dragOnly: true,
                pitchClamp: false,
                zoomUsesWheel: true
            };
        },
        getPanelOrientationMode: function() { return 'particle-bound-lagged'; },
        getParticleClarity: function() {
            return {
                lineLocked: true,
                mouseScatter: true,
                defaultMotionAmplitude: 'low',
                mouseHitMode: 'ray-plane-hit',
                mouseDepthMode: 'gravity-well'
            };
        },
        getMouseGravityWell: function() {
            return {
                enabled: true,
                radius: MOUSE_GRAVITY_WELL_RADIUS,
                depth: MOUSE_GRAVITY_WELL_DEPTH,
                pinch: MOUSE_GRAVITY_WELL_PINCH,
                active: !!(sceneState && sceneState.mouse && sceneState.mouse.active),
                hit: !!(sceneState && sceneState.mouse && sceneState.mouse.hit),
                insideParticleField: !!(sceneState && sceneState.mouse && sceneState.mouse.insideParticleField),
                hitMode: 'ray-plane-hit',
                depthMode: 'gravity-well'
            };
        },
        getSpatialPanels: function() {
            if (!sceneState || !sceneState.spatialPanels) return [];
            return sceneState.spatialPanels.map(function(panel) {
                return {
                    id: panel.id,
                    x: panel.position.x,
                    y: panel.position.y,
                    z: panel.position.z
                };
            });
        },
        isLineBased: function() { return true; },
        getDefaultShapes: function() { return ['avatar']; },
        getAvatarImages: function() { return PAL_AVATAR_IMAGES.slice(); },
        getAvatarChoice: function() { return sceneState && sceneState.avatar ? { mode: sceneState.avatar.mode, src: sceneState.avatar.currentSrc, name: sceneState.avatar.currentName } : readPortalAvatarChoice(); },
        getImageParticleSource: function() { return sceneState && sceneState.avatar ? sceneState.avatar.currentSrc : readPortalAvatarChoice().src; },
        isImageParticleReady: function() { return !!(sceneState && sceneState.imageParticleReady); },
        getPortalBackgroundPalette: function() { return sceneState ? sceneState.portalBackgroundPalette : extractPortalImagePalette(null); },
        getDefaultShapeHoldMs: function() { return AVATAR_IMAGE_SWITCH_MS; },
        areTargetsDifferent: function(a, b) {
            var targets = sceneState ? sceneState.targets : buildTargets(96);
            var first = targets[a] || targets.default;
            var second = targets[b] || targets.default;
            var firstPositions = first.positions || first;
            var secondPositions = second.positions || second;
            for (var i = 0; i < Math.min(firstPositions.length, secondPositions.length); i += 9) {
                if (Math.abs(firstPositions[i] - secondPositions[i]) > 0.01) return true;
            }
            return false;
        },
        getActiveMode: function() { return 'default'; },
        getActiveDefaultShape: function() { return 'avatar'; },
        getOrbitCameraState: function() {
            var spin = sceneState && sceneState.sceneSpin;
            return {
                canRotate360: true,
                canZoom: true,
                looksAtTarget: true,
                yaw: spin ? spin.y : 0,
                pitch: spin ? spin.x : 0,
                yawVelocity: spin ? spin.vy : 0,
                pitchVelocity: spin ? spin.vx : 0,
                radius: spin ? spin.radius : 0,
                targetRadius: spin ? spin.targetRadius : 0,
                dragging: !!(spin && spin.dragging)
            };
        },
        getRotationState: function() {
            var spin = sceneState && sceneState.sceneSpin;
            return {
                canRotate360: true,
                yaw: spin ? spin.y : 0,
                pitch: spin ? spin.x : 0,
                dragging: !!(spin && spin.dragging)
            };
        }
    };
    window.addEventListener('DOMContentLoaded', start);
})();
