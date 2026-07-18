window.PT_DOCK_TOOLS = {
    calculator: {
        id: 'calculator',
        title: '工作速度计算器',
        shortTitle: '工作速度',
        iconText: '⊕',
        defaultWidth: '620px',
        defaultHeight: 'calc(100vh - 170px)',
        description: '首个正式迁移工具，作为固定 Dock 桌面的窗口样板。',
        displayModule: 'PT_WORK_SPEED_DOCK',
        useCardShell: false
    },
    paldex: {
        id: 'paldex',
        title: '帕鲁图鉴',
        shortTitle: '帕鲁图鉴',
        iconText: '▦',
        defaultWidth: '980px',
        defaultHeight: 'calc(100vh - 170px)',
        description: '桌面模式里的帕鲁活字图鉴。',
        displayModule: 'PT_PALDEX_WEB',
        useCardShell: true
    },
    settings: {
        id: 'settings',
        title: '设置',
        shortTitle: '设置',
        iconText: '⚙',
        defaultWidth: '620px',
        defaultHeight: 'calc(100vh - 170px)',
        description: '主题、毛玻璃和特效强弱的统一设置入口。',
        displayModule: 'PT_VISUAL_SETTINGS_CARD',
        useCardShell: true
    },
    skill: {
        id: 'skill',
        title: '技能',
        shortTitle: '技能',
        iconText: '◎',
        defaultWidth: '860px',
        defaultHeight: 'calc(100vh - 170px)',
        description: '主动技能与被动技能分类查阅，支持来源追溯。',
        displayModule: 'PT_SKILL_WEB',
        useCardShell: true
    }
};
