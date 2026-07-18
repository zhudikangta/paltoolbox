// ═══════════════ 取色器引擎.js — HSV 转换 + 画布渲染 + 调色函数 ═══════════════
// 纯函数模块，不依赖 DOM

window.PT_COLOR_ENGINE = (function() {

    function hexToRgb(hex) {
        var c = hex.replace('#', '');
        if (c.length !== 6) return { r: 0, g: 0, b: 0 };
        return {
            r: parseInt(c.slice(0, 2), 16),
            g: parseInt(c.slice(2, 4), 16),
            b: parseInt(c.slice(4, 6), 16)
        };
    }

    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(function(v) {
            var h = Math.max(0, Math.min(255, Math.round(v))).toString(16);
            return h.length === 1 ? '0' + h : h;
        }).join('');
    }

    function rgbToHsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, v = max;
        var d = max - min;
        s = max === 0 ? 0 : d / max;
        if (max === min) {
            h = 0;
        } else {
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: h * 360, s: s, v: v };
    }

    function hsvToRgb(h, s, v) {
        h = (h % 360) / 360;
        if (h < 0) h += 1;
        var i = Math.floor(h * 6);
        var f = h * 6 - i;
        var p = v * (1 - s);
        var q = v * (1 - f * s);
        var t = v * (1 - (1 - f) * s);
        var r, g, b;
        switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
        }
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    function updateSbCanvas(canvas, hue, saturation, value) {
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        var w = canvas.width, h = canvas.height;
        var imgData = ctx.createImageData(w, h);
        var data = imgData.data;
        for (var y = 0; y < h; y++) {
            var val = 1 - y / (h - 1);
            for (var x = 0; x < w; x++) {
                var sat = x / (w - 1);
                var rgb = hsvToRgb(hue, sat, val);
                var i = (y * w + x) * 4;
                data[i] = rgb.r;
                data[i + 1] = rgb.g;
                data[i + 2] = rgb.b;
                data[i + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);
        if (saturation != null && value != null) {
            var cx = saturation * (w - 1);
            var cy = (1 - value) * (h - 1);
            ctx.beginPath();
            ctx.arc(cx, cy, 7, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, 3, 0, Math.PI * 2);
            var crgb = hsvToRgb(hue, saturation, value);
            ctx.fillStyle = 'rgb(' + crgb.r + ',' + crgb.g + ',' + crgb.b + ')';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    function buildGradientFromStops(stops, angle) {
        var a = angle || 145;
        var parts = stops.map(function(s) {
            return 'rgba(' + (hexToRgb(s.c).r) + ',' + (hexToRgb(s.c).g) + ',' + (hexToRgb(s.c).b) + ',' + (s.a != null ? s.a : 1) + ') ' + (s.pos != null ? s.pos : 0) + '%';
        });
        return 'linear-gradient(' + a + 'deg, ' + parts.join(', ') + ')';
    }

    // 曝光 (exposure) — 整体明暗偏移，0=暗 100=不变 200=亮
    function applyExposure(rgb, exposure) {
        var e = (exposure - 100) / 50;
        var f = Math.pow(2, e);
        return {
            r: Math.max(0, Math.min(255, rgb.r * f)),
            g: Math.max(0, Math.min(255, rgb.g * f)),
            b: Math.max(0, Math.min(255, rgb.b * f))
        };
    }

    // 对比 (contrast) — 明暗拉伸，100=不变，0=扁平，200=极度
    function applyContrast(rgb, contrast, midR, midG, midB) {
        var c = (contrast - 100) / 50;
        return {
            r: Math.max(0, Math.min(255, midR + (rgb.r - midR) * (1 + c))),
            g: Math.max(0, Math.min(255, midG + (rgb.g - midG) * (1 + c))),
            b: Math.max(0, Math.min(255, midB + (rgb.b - midB) * (1 + c)))
        };
    }

    // 自然饱和 (vibrance) — 智能饱和度，只加强低饱和区
    function applyVibrance(rgb, hsv, vibrance) {
        var v = (vibrance - 100) / 100;
        var boost = v * (1 - hsv.s);
        var newSat = Math.max(0, Math.min(1, hsv.s + boost));
        var nrgb = hsvToRgb(hsv.h, newSat, hsv.v);
        return { r: Math.round(nrgb.r), g: Math.round(nrgb.g), b: Math.round(nrgb.b) };
    }

    // 色温 (temperature) — 蓝(0)↔黄(200)，100=不变
    function applyTemperature(rgb, temperature) {
        var t = (temperature - 100) / 100;
        return {
            r: Math.max(0, Math.min(255, rgb.r + t * 40)),
            g: Math.max(0, Math.min(255, rgb.g + t * 8)),
            b: Math.max(0, Math.min(255, rgb.b - t * 40))
        };
    }

    // 色调 (tint) — 绿(0)↔品红(200)，100=不变
    function applyTint(rgb, tint) {
        var t = (tint - 100) / 100;
        return {
            r: Math.max(0, Math.min(255, rgb.r + t * 30)),
            g: Math.max(0, Math.min(255, rgb.g - t * 30)),
            b: Math.max(0, Math.min(255, rgb.b + t * 30))
        };
    }

    // 高光 (highlight) — 0=不变，200=极亮（中间色标向白混合）
    function applyHighlight(stops, highlight) {
        if (!highlight || highlight === 0) return stops;
        var mid = Math.floor(stops.length / 2);
        var f = highlight / 400;
        return stops.map(function(s, i) {
            if (Math.abs(i - mid) <= 1) {
                var rgb = hexToRgb(s.c);
                rgb.r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * f));
                rgb.g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * f));
                rgb.b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * f));
                return Object.assign({}, s, { c: rgbToHex(rgb.r, rgb.g, rgb.b) });
            }
            return s;
        });
    }

    // 渐变缓动 (easing) — 在两个色标之间插入额外色标模拟缓动曲线
    function applyEasing(stops, easing) {
        if (!easing || easing === 'linear' || stops.length < 2) return stops;
        function lerpColor(a, b, t) {
            var ra = hexToRgb(a.c || '#888');
            var rb = hexToRgb(b.c || '#888');
            return {
                c: rgbToHex(
                    Math.round(ra.r + (rb.r - ra.r) * t),
                    Math.round(ra.g + (rb.g - ra.g) * t),
                    Math.round(ra.b + (rb.b - ra.b) * t)
                ),
                a: (a.a || 1) + ((b.a || 1) - (a.a || 1)) * t,
                pos: 0
            };
        }
        var result = [];
        for (var i = 0; i < stops.length - 1; i++) {
            var a = stops[i];
            var b = stops[i + 1];
            result.push(a);
            if (easing === 'ease-in') {
                result.push(lerpColor(a, b, 0.3));
            } else if (easing === 'ease-out') {
                result.push(lerpColor(a, b, 0.7));
            } else if (easing === 'ease-in-out') {
                result.push(lerpColor(a, b, 0.3));
                result.push(lerpColor(a, b, 0.7));
            }
        }
        result.push(stops[stops.length - 1]);
        return result;
    }

    return {
        hexToRgb: hexToRgb,
        rgbToHex: rgbToHex,
        rgbToHsv: rgbToHsv,
        hsvToRgb: hsvToRgb,
        updateSbCanvas: updateSbCanvas,
        buildGradientFromStops: buildGradientFromStops,
        applyExposure: applyExposure,
        applyContrast: applyContrast,
        applyVibrance: applyVibrance,
        applyTemperature: applyTemperature,
        applyTint: applyTint,
        applyHighlight: applyHighlight,
        applyEasing: applyEasing
    };

})();
