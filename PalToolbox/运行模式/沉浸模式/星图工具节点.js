var PT_IMMERSIVE_TOOL_ORBIT = (function() {
    function getNodeLayout(index, total) {
        var angle = total ? (index * 360 / total) : 0;
        var rad = angle * Math.PI / 180;
        var depth = Math.round(Math.sin(rad) * 120);
        var scale = 1 + Math.max(0, Math.sin(rad)) * 0.16;
        return {
            angle: angle,
            depth: depth,
            scale: scale,
            x: Math.cos(rad),
            y: Math.sin(rad)
        };
    }

    function renderToolNode(tool, index, total) {
        var layout = getNodeLayout(index, total);
        var status = tool.status === 'ready' ? '可用' : '建设中';
        return [
            '<button type="button" class="pt-immersive-tool-node', tool.status === 'ready' ? '' : ' pt-immersive-tool-node--placeholder', '" data-immersive-tool="', tool.id, '" data-tool-index="', index, '" style="--pt-node-angle:', layout.angle, 'deg;--pt-node-z:', layout.depth, 'px;--pt-node-scale:', layout.scale.toFixed(3), ';--pt-tool-accent:', tool.accent || '#9df7ff', '">',
            '<span class="pt-immersive-tool-node__halo"></span>',
            '<b>', tool.shortTitle || tool.title, '</b>',
            '<span>', status, '</span>',
            '</button>'
        ].join('');
    }

    function markActive(toolId) {
        document.querySelectorAll('.pt-immersive-tool-node').forEach(function(node) {
            node.classList.toggle('pt-immersive-tool-node--active', node.getAttribute('data-immersive-tool') === toolId);
        });
    }

    function getToolIndex(toolId) {
        var node = document.querySelector('[data-immersive-tool="' + toolId + '"]');
        if (!node) return -1;
        var index = parseInt(node.getAttribute('data-tool-index'), 10);
        return isFinite(index) ? index : -1;
    }

    return {
        getNodeLayout: getNodeLayout,
        renderToolNode: renderToolNode,
        markActive: markActive,
        getToolIndex: getToolIndex
    };
})();

if (typeof window !== 'undefined') {
    window.PT_IMMERSIVE_TOOL_ORBIT = PT_IMMERSIVE_TOOL_ORBIT;
}
