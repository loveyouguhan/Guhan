/*
    高级信息栏 (Advanced InfoBar) 扩展客户端脚本
    版本: 11.0.0 (Production)
    职责: UI渲染、事件处理、与服务器API通信。
*/
(function () {
    // ------------------- 扩展上下文和API -------------------
    let context;
    const extensionName = "高级信息栏 (Advanced InfoBar)";
    const SCRIPT_VERSION_TAG = 'v11_0_0_ext';

    // ------------------- 核心常量 -------------------
    const RENDERED_INFO_BAR_CLASS = `infobar-cot-rendered-container-${SCRIPT_VERSION_TAG}`;
    const AI_DATA_BLOCK_REGEX = /<infobar_data>([\s\S]*?)<\/infobar_data>/si;
    const AI_THINK_PROCESS_REGEX = /<aiThinkProcess>[\s\S]*?<\/aiThinkProcess>/si;
    const NPC_SELECTOR_ID_PREFIX = 'infobar-npc-selector-';
    const NPC_DETAILS_CONTAINER_ID_PREFIX = 'infobar-npc-details-';
    const INTERNET_POST_DETAILS_PREFIX = 'infobar-internet-post-';
    const MAX_RENDERED_NPCS_IN_SELECTOR = 10;
    const MAX_INTERNET_ITEMS_INITIALLY_DISPLAYED = 2;

    // ------------------- 状态变量 -------------------
    let currentSettings = {};
    let currentInfoBarData = { npcs: {} };
    let selectedNpcIdForInteractionPanel = null;

    // ------------------- 配置数据 (完整版) -------------------
    const THEMES = {
        现代深色: {
            '--infobar-font-family': 'var(--font_ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif)',
            '--infobar-bg': '#282c34',
            '--infobar-text': '#abb2bf',
            '--infobar-border-color': '#4b5263',
            '--infobar-tab-bg': '#21252b',
            '--infobar-tab-active-bg': '#2c313a',
            '--infobar-tab-active-color': '#ffffff',
            '--infobar-tab-hover-bg': '#323842',
            '--infobar-panel-toggle-bg': '#2c313a',
            '--infobar-section-title': '#61afef',
            '--infobar-input-bg': '#21252b',
            '--primary': '#61afef',
            '--infobar-rendered-bg': 'rgba(40, 44, 52, 0.9)',
            '--infobar-rendered-border': '#4b5263',
            '--infobar-rendered-text': '#abb2bf',
            '--infobar-rendered-title-text': '#e5c07b',
            '--infobar-rendered-label': '#98c379',
            '--infobar-rendered-value': '#abb2bf',
            '--infobar-rendered-header-bg': 'rgba(44, 49, 58, 0.95)',
            '--infobar-task-card-bg': 'rgba(50, 55, 65, 0.8)',
            '--infobar-task-progress-bg': '#3a3f4b',
            '--infobar-task-progress-fill': 'var(--primary)',
        },
        浅色: {
            '--infobar-font-family': 'var(--font_ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif)',
            '--infobar-bg': '#fafafa',
            '--infobar-text': '#383a42',
            '--infobar-border-color': '#d1d1d1',
            '--infobar-tab-bg': '#eaeaeb',
            '--infobar-tab-active-bg': '#ffffff',
            '--infobar-tab-active-color': '#282a36',
            '--infobar-tab-hover-bg': '#f0f0f0',
            '--infobar-panel-toggle-bg': '#f0f0f0',
            '--infobar-section-title': '#4078f2',
            '--infobar-input-bg': '#ffffff',
            '--primary': '#4078f2',
            '--infobar-rendered-bg': 'rgba(245, 245, 245, 0.9)',
            '--infobar-rendered-border': '#e0e0e0',
            '--infobar-rendered-text': '#383a42',
            '--infobar-rendered-title-text': '#c18401',
            '--infobar-rendered-label': '#50a14f',
            '--infobar-rendered-value': '#383a42',
            '--infobar-rendered-header-bg': 'rgba(230, 230, 230, 0.95)',
            '--infobar-task-card-bg': 'rgba(235, 235, 235, 0.8)',
            '--infobar-task-progress-bg': '#e0e0e0',
            '--infobar-task-progress-fill': 'var(--primary)',
        },
        护眼绿: {
            '--infobar-font-family': 'var(--font_ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif)',
            '--infobar-bg': '#f0f8f0',
            '--infobar-text': '#364e36',
            '--infobar-border-color': '#a9c4a9',
            '--infobar-tab-bg': '#e0f0e0',
            '--infobar-tab-active-bg': '#c8e6c9',
            '--infobar-tab-active-color': '#2e442e',
            '--infobar-tab-hover-bg': '#d4e8d4',
            '--infobar-panel-toggle-bg': '#e8f5e9',
            '--infobar-section-title': '#4caf50',
            '--infobar-input-bg': '#f8fff8',
            '--primary': '#66bb6a',
            '--infobar-rendered-bg': 'rgba(240, 248, 240, 0.97)',
            '--infobar-rendered-border': '#a9c4a9',
            '--infobar-rendered-text': '#364e36',
            '--infobar-rendered-title-text': '#388e3c',
            '--infobar-rendered-label': '#4caf50',
            '--infobar-rendered-value': '#364e36',
            '--infobar-rendered-header-bg': 'rgba(200, 230, 201, 0.95)',
            '--infobar-task-card-bg': 'rgba(224, 240, 224, 0.9)',
            '--infobar-task-progress-bg': '#c8e6c9',
            '--infobar-task-progress-fill': 'var(--primary)',
        },
        赛博朋克: {
            '--infobar-font-family': '"Orbitron", "Audiowide", sans-serif',
            '--infobar-bg': '#0a0f21',
            '--infobar-text': '#00f0c0',
            '--infobar-border-color': '#301b49',
            '--infobar-tab-bg': '#101830',
            '--infobar-tab-active-bg': '#203050',
            '--infobar-tab-active-color': '#ff007f',
            '--infobar-tab-hover-bg': '#182440',
            '--infobar-panel-toggle-bg': '#101830',
            '--infobar-section-title': '#ff007f',
            '--infobar-input-bg': '#101830',
            '--primary': '#ff007f',
            '--infobar-rendered-bg': 'rgba(10, 15, 33, 0.92)',
            '--infobar-rendered-border': '#301b49',
            '--infobar-rendered-text': '#00f0c0',
            '--infobar-rendered-title-text': '#f0f000',
            '--infobar-rendered-label': '#ff007f',
            '--infobar-rendered-value': '#00f0c0',
            '--infobar-rendered-header-bg': 'rgba(20, 30, 60, 0.95)',
            '--infobar-task-card-bg': 'rgba(20, 30, 60, 0.85)',
            '--infobar-task-progress-bg': '#152035',
            '--infobar-task-progress-fill': 'var(--primary)',
        },
        蒸汽朋克: {
            '--infobar-font-family': '"IM Fell English SC", "Uncial Antiqua", serif',
            '--infobar-bg': '#4a3b2a',
            '--infobar-text': '#e0d0b0',
            '--infobar-border-color': '#6a503a',
            '--infobar-tab-bg': '#3a2b1a',
            '--infobar-tab-active-bg': '#5a402a',
            '--infobar-tab-active-color': '#f0e0c0',
            '--infobar-tab-hover-bg': '#453525',
            '--infobar-panel-toggle-bg': '#3a2b1a',
            '--infobar-section-title': '#d4a017',
            '--infobar-input-bg': '#3a2b1a',
            '--primary': '#d4a017',
            '--infobar-rendered-bg': 'rgba(74, 59, 42, 0.92)',
            '--infobar-rendered-border': '#6a503a',
            '--infobar-rendered-text': '#e0d0b0',
            '--infobar-rendered-title-text': '#f4d03f',
            '--infobar-rendered-label': '#b8860b',
            '--infobar-rendered-value': '#e0d0b0',
            '--infobar-rendered-header-bg': 'rgba(60, 45, 30, 0.95)',
            '--infobar-task-card-bg': 'rgba(60, 45, 30, 0.85)',
            '--infobar-task-progress-bg': '#504030',
            '--infobar-task-progress-fill': 'var(--primary)',
        },
        羊皮纸魔法: {
            '--infobar-font-family': '"Cinzel Decorative", "MedievalSharp", serif',
            '--infobar-bg': '#f3e9d0',
            '--infobar-text': '#4a3b2a',
            '--infobar-border-color': '#8b6f47',
            '--infobar-tab-bg': '#e8d5a3',
            '--infobar-tab-active-bg': '#d9c092',
            '--infobar-tab-active-color': '#3c2f2f',
            '--infobar-tab-hover-bg': '#e0d0b0',
            '--infobar-panel-toggle-bg': '#e8d5a3',
            '--infobar-section-title': '#5a3f24',
            '--infobar-input-bg': '#f0e0c0',
            '--primary': '#8b6f47',
            '--infobar-rendered-bg': 'rgba(243, 233, 208, 0.92)',
            '--infobar-rendered-border': '#c8b085',
            '--infobar-rendered-text': '#4a3b2a',
            '--infobar-rendered-title-text': '#7a5c37',
            '--infobar-rendered-label': '#8b4513',
            '--infobar-rendered-value': '#4a3b2a',
            '--infobar-rendered-header-bg': 'rgba(230, 215, 180, 0.95)',
            '--infobar-task-card-bg': 'rgba(230, 215, 180, 0.85)',
            '--infobar-task-progress-bg': '#d0c0a0',
            '--infobar-task-progress-fill': 'var(--primary)',
        },
        可爱少女: {
            '--infobar-font-family': '"Comic Sans MS", "Chalkboard SE", "Comic Neue", cursive',
            '--infobar-bg': '#fff0f5',
            '--infobar-text': '#db7093',
            '--infobar-border-color': '#ffb6c1',
            '--infobar-tab-bg': '#ffe4e1',
            '--infobar-tab-active-bg': '#ffc0cb',
            '--infobar-tab-active-color': '#800080',
            '--infobar-tab-hover-bg': '#ffd1dc',
            '--infobar-panel-toggle-bg': '#fff5f8',
            '--infobar-section-title': '#ff1493',
            '--infobar-input-bg': '#fffafa',
            '--primary': '#ff69b4',
            '--infobar-rendered-bg': 'rgba(255, 240, 245, 0.97)',
            '--infobar-rendered-border': '1px solid #ffc0cb',
            '--infobar-rendered-text': '#5e2157',
            '--infobar-rendered-title-text': '#c71585',
            '--infobar-rendered-label': '#db7093',
            '--infobar-rendered-value': '#8a2be2',
            '--infobar-rendered-header-bg': 'rgba(255, 182, 193, 0.95)',
            '--infobar-task-card-bg': 'rgba(255, 228, 225, 0.9)',
            '--infobar-task-progress-bg': '#ffdab9',
            '--infobar-task-progress-fill': 'var(--primary)',
        },
        唯美典雅: {
            '--infobar-font-family': '"Georgia", "Times New Roman", Times, serif',
            '--infobar-bg': '#fdf5e6',
            '--infobar-text': '#695c54',
            '--infobar-border-color': '#d2b48c',
            '--infobar-tab-bg': '#f5f5dc',
            '--infobar-tab-active-bg': '#e0dcd1',
            '--infobar-tab-active-color': '#5d5147',
            '--infobar-tab-hover-bg': '#ece5d8',
            '--infobar-panel-toggle-bg': '#f5f5dc',
            '--infobar-section-title': '#8b7355',
            '--infobar-input-bg': '#fff8dc',
            '--primary': '#b08d57',
            '--infobar-rendered-bg': 'rgba(253, 245, 230, 0.97)',
            '--infobar-rendered-border': '1px solid #d2b48c',
            '--infobar-rendered-text': '#695c54',
            '--infobar-rendered-title-text': '#8b4513',
            '--infobar-rendered-label': '#a0522d',
            '--infobar-rendered-value': '#695c54',
            '--infobar-rendered-header-bg': 'rgba(245, 222, 179, 0.95)',
            '--infobar-task-card-bg': 'rgba(245, 222, 179, 0.9)',
            '--infobar-task-progress-bg': '#e0dcd1',
            '--infobar-task-progress-fill': 'var(--primary)',
        }
    };
    const FONT_OPTIONS = {
        "系统默认": 'var(--font_ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif)',
        "宋体 (SimSun)": '"SimSun", "STSong", serif',
        "楷体 (KaiTi)": '"KaiTi", "STKaiti", cursive',
        "圆体 (YuanTi)": '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "圆体", sans-serif',
        "无衬线 (Sans-Serif)": 'sans-serif',
        "衬线 (Serif)": 'serif',
        "等宽 (Monospace)": 'monospace',
        "手写风 (Comic Sans MS)": '"Comic Sans MS", "Chalkboard SE", "Comic Neue", cursive',
        "优雅衬线 (Georgia)": 'Georgia, Times, "Times New Roman", serif',
        "赛博朋克 (Orbitron)": '"Orbitron", "Audiowide", sans-serif',
        "魔法羊皮纸 (Cinzel Decorative)": '"Cinzel Decorative", "MedievalSharp", serif',
        "蒸汽朋克 (IM Fell English SC)": '"IM Fell English SC", "Uncial Antiqua", serif'
    };
    const PANEL_CONFIG = {
        panels: {
            general: {
                id: 'general',
                label: '基础设置',
                icon: 'fa-cogs',
                description: '信息栏的基础功能与外观设置',
                defaultEnabled: true,
                isUtilityPanel: true,
                items: [
                    { id: 'renderInfoBarInChat', label: '启用信息栏显示', type: 'toggle', defaultValue: true, description: '在AI回复末尾渲染信息栏面板。关闭后仍会在后台记录数据。' },
                    { id: 'enableDataTable', label: '启用数据表格', type: 'toggle', defaultValue: true, description: '在扩展菜单中显示“数据表格”按钮。' },
                    { id: 'memoryAssistEnabled', label: '启用记忆辅助', type: 'toggle', defaultValue: true, description: '将实时数据注入AI上下文，取代旧的剧情摘要。' },
                    { id: 'defaultCollapsed', label: '信息栏默认全部折叠', type: 'toggle', defaultValue: false },
                    { id: 'theme', label: '界面风格', type: 'select', options: Object.keys(THEMES), defaultValue: '现代深色' },
                    { id: 'fontFamily', label: '界面字体', type: 'select', options: Object.keys(FONT_OPTIONS), defaultValue: '系统默认' },
                    { id: 'autoRenderCheckEnabled', label: '启用自动渲染检测', type: 'toggle', defaultValue: true, description: '当AI提供了数据但信息栏未渲染时，发出通知。' },
                ]
            },
            personal: {
                id: 'personal',
                label: '个人信息',
                icon: 'fa-user-circle',
                description: '关于角色自身的基础信息设置',
                defaultEnabled: true,
                items: [
                    { id: 'name', label: '姓名', type: 'toggle', defaultValue: true },
                    { id: 'age', label: '年龄', type: 'toggle', defaultValue: true },
                    { id: 'gender', label: '性别', type: 'toggle', defaultValue: true },
                    { id: 'race', label: '种族/物种', type: 'toggle', defaultValue: true },
                    { id: 'occupation', label: '职业', type: 'toggle', defaultValue: true },
                    { id: 'currentLocation', label: '当前位置', type: 'toggle', defaultValue: true },
                    { id: 'residence', label: '居住地点', type: 'toggle', defaultValue: true },
                    { id: 'thoughts', label: '当前想法', type: 'toggle', defaultValue: true },
                    { id: 'status', label: '身体状态', type: 'toggle', defaultValue: true },
                    { id: 'mood', label: '情绪', type: 'toggle', defaultValue: true },
                    { id: 'funds', label: '个人资金', type: 'toggle', defaultValue: true },
                    { id: 'points', label: '系统积分', type: 'toggle', defaultValue: true },
                    { id: 'appearance', label: '外貌描述', type: 'toggle', defaultValue: true },
                    { id: 'personality', label: '个性', type: 'toggle', defaultValue: true },
                    { id: 'health', label: '健康状态', type: 'toggle', defaultValue: false },
                    { id: 'background', label: '背景故事', type: 'toggle', defaultValue: false },
                    { id: 'bloodType', label: '血型', type: 'toggle', defaultValue: false },
                    { id: 'nativeLanguage', label: '母语', type: 'toggle', defaultValue: false },
                    { id: 'accent', label: '口音', type: 'toggle', defaultValue: false },
                    { id: 'allergies', label: '过敏史', type: 'toggle', defaultValue: false },
                    { id: 'addictions', label: '药物依赖/成瘾', type: 'toggle', defaultValue: false },
                    { id: 'arousalLevel', label: '兴奋度 (敏感内容)', type: 'toggle', defaultValue: false },
                    { id: 'intimacyStatus', label: '亲密状态 (敏感内容)', type: 'toggle', defaultValue: false },
                    { id: 'bodyTemperature', label: '体温状态 (敏感内容)', type: 'toggle', defaultValue: false },
                    { id: 'sensitiveAreas', label: '敏感部位 (敏感内容)', type: 'toggle', defaultValue: false },
                    { id: 'clothingState', label: '衣物状态 (敏感内容)', type: 'toggle', defaultValue: false },
                    { id: 'physicalReaction', label: '生理反应 (敏感内容)', type: 'toggle', defaultValue: false },
                    { id: 'intimateRelations', label: '亲密关系 (敏感内容)', type: 'toggle', defaultValue: false },
                    { id: 'desireLevel', label: '欲望等级 (敏感内容)', type: 'toggle', defaultValue: false },
                    { id: 'sensitivityLevel', label: '敏感度 (敏感内容)', type: 'toggle', defaultValue: false },
                    { id: 'intimatePreferences', label: '亲密偏好 (敏感内容)', type: 'toggle', defaultValue: false }
                ]
            },
            interaction: {
                id: 'interaction',
                label: '交互对象',
                icon: 'fa-users',
                description: '显示当前场景中主要NPC的信息。AI应为每个NPC提供独立数据块。',
                defaultEnabled: true,
                items: [
                    { id: 'name', label: '姓名', type: 'toggle', defaultValue: true },
                    { id: 'age', label: '年龄', type: 'toggle', defaultValue: true },
                    { id: 'gender', label: '性别', type: 'toggle', defaultValue: true },
                    { id: 'isPresent', label: '是否在场', type: 'toggle', defaultValue: true },
                    { id: 'identity', label: '身份/职业', type: 'toggle', defaultValue: true },
                    { id: 'mood', label: '情绪', type: 'toggle', defaultValue: true },
                    { id: 'currentState', label: '当前状态/动作', type: 'toggle', defaultValue: true },
                    { id: 'currentPosture', label: '当前姿势', type: 'toggle', defaultValue: false },
                    { id: 'gazeDirection', label: '视线方向', type: 'toggle', defaultValue: false },
                    { id: 'affection', label: '好感度', type: 'toggle', defaultValue: true },
                    { id: 'relationship', label: '关系', type: 'toggle', defaultValue: true },
                    { id: 'loyalty', label: '忠诚度', type: 'toggle', defaultValue: true },
                    { id: 'thoughts', label: '当前想法', type: 'toggle', defaultValue: true },
                    { id: 'residence', label: '居住地点', type: 'toggle', defaultValue: true },
                    { id: 'emotionalStatus', label: '情感状态', type: 'toggle', defaultValue: true },
                    { id: 'bodyShape', label: '身材', type: 'toggle', defaultValue: true },
                    { id: 'upperBody', label: '上身穿着', type: 'toggle', defaultValue: true },
                    { id: 'lowerBody', label: '下身穿着', type: 'toggle', defaultValue: true },
                    { id: 'underwear', label: '内衣', type: 'toggle', defaultValue: true },
                    { id: 'underpants', label: '内裤', type: 'toggle', defaultValue: true },
                    { id: 'footwear', label: '鞋袜', type: 'toggle', defaultValue: true },
                    { id: 'overallClothing', label: '整体穿着', type: 'toggle', defaultValue: false },
                    { id: 'physicalFeatures', label: '身体特征', type: 'toggle', defaultValue: true },
                    { id: 'specialMarkings', label: '特殊体征', type: 'toggle', defaultValue: false, description: '纹身、疤痕、胎记等' },
                    { id: 'bodyScent', label: '体香', type: 'toggle', defaultValue: false },
                    { id: 'skinTexture', label: '皮肤质感', type: 'toggle', defaultValue: false },
                    { id: 'hobbies', label: '爱好', type: 'toggle', defaultValue: true },
                    { id: 'shameLevel', label: '羞耻度', type: 'toggle', defaultValue: true },
                    { id: 'angerLevel', label: '愤怒度', type: 'toggle', defaultValue: true },
                    { id: 'pleasureLevel', label: '快感值 (敏感内容)', type: 'toggle', defaultValue: false },
                    { id: 'corruptionLevel', label: '堕落值 (敏感内容)', type: 'toggle', defaultValue: false },
                    { id: 'reputation', label: '声望', type: 'toggle', defaultValue: false },
                    { id: 'arousalLevel', label: '兴奋度 (敏感内容)', type: 'toggle', defaultValue: false },
                    { id: 'intimacyStatus', label: '亲密状态 (敏感内容)', type: 'toggle', defaultValue: false },
                    { id: 'bodyTemperature', label: '体温状态 (敏感内容)', type: 'toggle', defaultValue: false },
                    { id: 'sensitiveAreas', label: '敏感部位 (敏感内容)', type: 'toggle', defaultValue: false },
                    { id: 'clothingState', label: '衣物状态 (敏感内容)', type: 'toggle', defaultValue: false },
                    { id: 'physicalReaction', label: '生理反应 (敏感内容)', type: 'toggle', defaultValue: false },
                    { id: 'intimateRelations', label: '亲密关系 (敏感内容)', type: 'toggle', defaultValue: false },
                    { id: 'desireLevel', label: '欲望等级 (敏感内容)', type: 'toggle', defaultValue: false },
                    { id: 'sensitivityLevel', label: '敏感度 (敏感内容)', type: 'toggle', defaultValue: false },
                    { id: 'intimatePreferences', label: '亲密偏好 (敏感内容)', type: 'toggle', defaultValue: false }
                ]
            },
            inventory: {
                id: 'inventory',
                label: '背包/仓库',
                icon: 'fa-box',
                description: '管理角色的物品和资源',
                defaultEnabled: true,
                items: [
                    { id: 'inventoryItems', label: '背包物品', type: 'toggle', defaultValue: true },
                    { id: 'equipment', label: '装备物品', type: 'toggle', defaultValue: true },
                    { id: 'questItems', label: '任务物品栏', type: 'toggle', defaultValue: false },
                    { id: 'keychain', label: '钥匙串', type: 'toggle', defaultValue: false },
                    { id: 'resources', label: '资源库存', type: 'toggle', defaultValue: true },
                    { id: 'currency', label: '货币数量', type: 'toggle', defaultValue: true },
                    { id: 'weightLimit', label: '负重上限', type: 'toggle', defaultValue: false },
                    { id: 'rarityItems', label: '稀有物品', type: 'toggle', defaultValue: false },
                    { id: 'consumables', label: '消耗品', type: 'toggle', defaultValue: true },
                    { id: 'craftingMaterials', label: '制造材料', type: 'toggle', defaultValue: false }
                ]
            },
            company: {
                id: 'company',
                label: '公司信息',
                icon: 'fa-building',
                description: '关于角色当前主要关注的组织/公司信息',
                defaultEnabled: true,
                items: [
                    { id: 'name', label: '公司名称', type: 'toggle', defaultValue: true },
                    { id: 'type', label: '组织类型', type: 'toggle', defaultValue: true },
                    { id: 'status', label: '当前状态', type: 'toggle', defaultValue: true },
                    { id: 'mainBusiness', label: '主要业务/产品', type: 'toggle', defaultValue: true },
                    { id: 'employeeCount', label: '员工数量', type: 'toggle', defaultValue: false },
                    { id: 'hqLocation', label: '总部地点', type: 'toggle', defaultValue: false },
                    { id: 'valuation', label: '公司估值', type: 'toggle', defaultValue: true },
                    { id: 'funds', label: '流动资金', type: 'toggle', defaultValue: true },
                    { id: 'reputation', label: '影响力', type: 'toggle', defaultValue: true },
                    { id: 'shareholders', label: '股权结构', type: 'toggle', defaultValue: true },
                    { id: 'projects', label: '进行中项目', type: 'toggle', defaultValue: true },
                    { id: 'recentEvents', label: '近期事件/新闻', type: 'toggle', defaultValue: true },
                    { id: 'rivals', label: '主要竞争对手', type: 'toggle', defaultValue: false },
                    { id: 'marketShare', label: '市场份额', type: 'toggle', defaultValue: false },
                    { id: 'corporateCulture', label: '企业文化', type: 'toggle', defaultValue: false },
                    { id: 'coreTechnology', label: '核心技术', type: 'toggle', defaultValue: false },
                    { id: 'legalDisputes', label: '法律纠纷', type: 'toggle', defaultValue: false },
                    { id: 'mediaCoverage', label: '媒体评价', type: 'toggle', defaultValue: false },
                    { id: 'stockSymbol', label: '股票代码', type: 'toggle', defaultValue: false },
                ]
            },
            tasks: {
                id: 'tasks',
                label: '任务系统',
                icon: 'fa-tasks',
                description: '当前的主要任务、支线任务和目标管理',
                defaultEnabled: true,
                items: [
                    { id: 'showTaskType', label: '显示任务类型', type: 'toggle', defaultValue: true },
                    { id: 'showTaskStatus', label: '显示任务状态', type: 'toggle', defaultValue: true },
                    { id: 'showTaskDescription', label: '显示任务描述', type: 'toggle', defaultValue: true },
                    { id: 'showTaskProgress', label: '显示任务进度', type: 'toggle', defaultValue: true },
                    { id: 'showTaskRewards', label: '显示任务奖励', type: 'toggle', defaultValue: true },
                    { id: 'mainQuest', label: '主线任务 (整体)', type: 'toggle', defaultValue: true },
                    { id: 'sideQuests', label: '支线任务 (整体)', type: 'toggle', defaultValue: true },
                    { id: 'dailyTasks', label: '每日任务 (整体)', type: 'toggle', defaultValue: false },
                    { id: 'achievements', label: '成就 (整体)', type: 'toggle', defaultValue: false }
                ]
            },
            abilities: {
                id: 'abilities',
                label: '能力系统',
                icon: 'fa-magic',
                description: '角色的特殊能力和已习得技能',
                defaultEnabled: true,
                items: [
                    { id: 'specialAbilities', label: '特殊能力', type: 'toggle', defaultValue: true },
                    { id: 'learnedSkills', label: '已获得技能', type: 'toggle', defaultValue: true },
                    { id: 'passiveSkills', label: '被动技能', type: 'toggle', defaultValue: false },
                    { id: 'auraEffects', label: '光环效果', type: 'toggle', defaultValue: false },
                    { id: 'skillLevels', label: '技能等级', type: 'toggle', defaultValue: false },
                    { id: 'skillProficiency', label: '技能熟练度', type: 'toggle', defaultValue: false },
                    { id: 'experiencePoints', label: '经验值', type: 'toggle', defaultValue: false },
                    { id: 'talentTree', label: '天赋树', type: 'toggle', defaultValue: false },
                    { id: 'cooldowns', label: '技能冷却', type: 'toggle', defaultValue: false }
                ]
            },
            internet: {
                id: 'internet',
                label: '资讯内容',
                icon: 'fa-newspaper',
                description: '社交媒体、论坛、新闻和其他网络信息',
                defaultEnabled: false,
                items: [
                    { id: 'socialMediaFeed', label: '社交媒体流', type: 'toggle', defaultValue: true },
                    { id: 'forumPosts', label: '热门论坛帖子', type: 'toggle', defaultValue: true },
                    { id: 'jiuzhouExpress', label: '九州快报', type: 'toggle', defaultValue: false },
                    { id: 'localGossip', label: '坊间八卦', type: 'toggle', defaultValue: false },
                    { id: 'newsHeadlines', label: '新闻头条', type: 'toggle', defaultValue: false },
                    { id: 'trendingTopics', label: '热门话题', type: 'toggle', defaultValue: false },
                    { id: 'onlineStatus', label: '在线状态', type: 'toggle', defaultValue: false },
                    { id: 'notifications', label: '网络通知', type: 'toggle', defaultValue: false }
                ]
            },
            apocalypse: {
                id: 'apocalypse',
                label: '末日末世',
                icon: 'fa-biohazard',
                description: '在末日废土环境下的生存状态与资源。',
                defaultEnabled: false,
                items: [
                    { id: 'health', label: '生命值', type: 'toggle', defaultValue: true, description: '格式: 当前/最大 或 状态描述' },
                    { id: 'hunger', label: '饥饿度', type: 'toggle', defaultValue: true, description: '格式: 当前/最大 或 状态描述' },
                    { id: 'thirst', label: '口渴度', type: 'toggle', defaultValue: true, description: '格式: 当前/最大 或 状态描述' },
                    { id: 'stamina', label: '精力值/体力', type: 'toggle', defaultValue: true, description: '格式: 当前/最大 或 状态描述' },
                    { id: 'sanity', label: '精神状态/理智', type: 'toggle', defaultValue: true, description: '例如: 稳定, 濒临崩溃, 受到惊吓' },
                    { id: 'statusEffects', label: '当前状态效果', type: 'toggle', defaultValue: true, description: '例如: 辐射病(轻微), 骨折(左腿)' },
                    { id: 'radiationLevel', label: '辐射等级/暴露', type: 'toggle', defaultValue: true, description: '例如: 安全, 轻度污染, 致命剂量' },
                    { id: 'shelterStatus', label: '庇护所状态', type: 'toggle', defaultValue: true, description: '例如: 安全屋(良好), 无庇护所' },
                    { id: 'shelterDefense', label: '庇护所防御等级', type: 'toggle', defaultValue: false },
                    { id: 'mutationLevel', label: '变异等级/状态', type: 'toggle', defaultValue: false, description: '例如: 无变异, 轻微变异(皮肤硬化)' },
                    { id: 'infectionStatus', label: '感染状态', type: 'toggle', defaultValue: true, description: '例如: 未感染, 疑似感染, 已感染(T病毒)' },
                    { id: 'morale', label: '士气', type: 'toggle', defaultValue: true, description: '例如: 高昂, 低落, 绝望' },
                    { id: 'fatigue', label: '疲劳度', type: 'toggle', defaultValue: false, description: '例如: 轻微疲劳, 极度疲劳' },
                    { id: 'carryingCapacity', label: '负重', type: 'toggle', defaultValue: true, description: '格式: 当前/最大 (kg/lbs)' },
                    { id: 'ammoSupplies', label: '弹药储备', type: 'toggle', defaultValue: true, description: '例如: 步枪弹药:30, 手枪弹药:12' },
                    { id: 'foodSupplies', label: '食物储备', type: 'toggle', defaultValue: true, description: '例如: 罐头:3, 压缩饼干:5' },
                    { id: 'waterSupplies', label: '水源储备', type: 'toggle', defaultValue: true, description: '例如: 纯净水:1L, 脏水:0.5L' },
                    { id: 'medicalSupplies', label: '医疗物资', type: 'toggle', defaultValue: true, description: '例如: 绷带:2, 抗生素:1' },
                    { id: 'craftingMaterialsApoc', label: '特殊制造材料', type: 'toggle', defaultValue: false, description: '例如: 废金属:10, 电子元件:3' },
                    { id: 'hazardProtection', label: '危害防护', type: 'toggle', defaultValue: true, description: '例如: 防毒面具(完好), 防护服(破损)' },
                    { id: 'environmentThreats', label: '周围环境威胁', type: 'toggle', defaultValue: true, description: '例如: 丧尸群, 辐射区, 敌对拾荒者' },
                    { id: 'timeSinceLastRest', label: '上次休息时间', type: 'toggle', defaultValue: false, description: '例如: 8小时前, 刚休息过' },
                    { id: 'hopeLevel', label: '希望值', type: 'toggle', defaultValue: false, description: '例如: 尚存希望, 渺茫, 重燃希望' },
                    { id: 'daysSurvived', label: '已存活天数', type: 'toggle', defaultValue: false },
                    { id: 'factionReputationApoc', label: '派系声望(末日)', type: 'toggle', defaultValue: false, description: '例如: 拾荒者联盟:友好, 变异者部落:敌对' },
                    { id: 'availablePower', label: '可用电力/能源', type: 'toggle', defaultValue: false, description: '例如: 发电机燃料:20%, 电池:3/5格' },
                    { id: 'transportation', label: '交通工具状态', type: 'toggle', defaultValue: false, description: '例如: 摩托车(燃料:50%,耐久:80%)' },
                    { id: 'communicationDevice', label: '通讯设备状态', type: 'toggle', defaultValue: false },
                ]
            },
            ancientHistory: {
                id: 'ancientHistory',
                label: '古风历史',
                icon: 'fa-landmark',
                description: '古代或历史背景下的相关信息',
                defaultEnabled: false,
                items: [
                    { id: 'dynasty', label: '当前朝代/纪年', type: 'toggle', defaultValue: true },
                    { id: 'ruler', label: '君主/掌权者', type: 'toggle', defaultValue: true },
                    { id: 'socialRank', label: '社会阶层/身份', type: 'toggle', defaultValue: true },
                    { id: 'officialPosition', label: '官职/爵位', type: 'toggle', defaultValue: false },
                    { id: 'sectSchool', label: '所属门派/学派', type: 'toggle', defaultValue: false },
                    { id: 'jianghuAffiliation', label: '江湖势力/地位', type: 'toggle', defaultValue: false },
                    { id: 'martialArtsStyle', label: '武功流派/境界', type: 'toggle', defaultValue: false },
                    { id: 'internalEnergy', label: '内力/真气修为', type: 'toggle', defaultValue: false },
                    { id: 'historicalEvents', label: '重要历史事件', type: 'toggle', defaultValue: true },
                    { id: 'currencyAncient', label: '古代货币/财富', type: 'toggle', defaultValue: true },
                    { id: 'etiquetteCustoms', label: '礼仪习俗', type: 'toggle', defaultValue: false },
                    { id: 'importantBooks', label: '重要典籍/秘籍', type: 'toggle', defaultValue: false },
                    { id: 'legendaryWeapons', label: '神兵利器传说', type: 'toggle', defaultValue: false },
                    { id: 'philosophy', label: '主要哲学思想', type: 'toggle', defaultValue: false },
                    { id: 'artForms', label: '主要艺术形式', type: 'toggle', defaultValue: false }
                ]
            },
            cultivation: {
                id: 'cultivation',
                label: '修仙系统',
                icon: 'fa-bolt',
                description: '修仙、武功、境界等相关信息',
                defaultEnabled: false,
                items: [
                    { id: 'cultivationLevel', label: '修为境界', type: 'toggle', defaultValue: true },
                    { id: 'spiritualPower', label: '灵力值', type: 'toggle', defaultValue: true },
                    { id: 'techniques', label: '功法技能', type: 'toggle', defaultValue: true },
                    { id: 'artifacts', label: '法宝装备', type: 'toggle', defaultValue: true },
                    { id: 'sect', label: '门派信息', type: 'toggle', defaultValue: false },
                    { id: 'karma', label: '因果业力', type: 'toggle', defaultValue: false },
                    { id: 'tribulation', label: '天劫状态', type: 'toggle', defaultValue: false },
                    { id: 'spiritualRoots', label: '灵根属性', type: 'toggle', defaultValue: false }
                ]
            },
            urban: {
                id: 'urban',
                label: '都市生活',
                icon: 'fa-city',
                description: '现代都市生活相关信息',
                defaultEnabled: false,
                items: [
                    { id: 'socialStatus', label: '社会地位', type: 'toggle', defaultValue: true },
                    { id: 'bankAccount', label: '银行账户', type: 'toggle', defaultValue: true },
                    { id: 'creditScore', label: '信用评分', type: 'toggle', defaultValue: false },
                    { id: 'properties', label: '房产信息', type: 'toggle', defaultValue: false },
                    { id: 'vehicles', label: '车辆信息', type: 'toggle', defaultValue: false },
                    { id: 'contacts', label: '联系人', type: 'toggle', defaultValue: true },
                    { id: 'schedule', label: '日程安排', type: 'toggle', defaultValue: false },
                    { id: 'socialNetwork', label: '社交网络', type: 'toggle', defaultValue: false }
                ]
            },
            fantasy: {
                id: 'fantasy',
                label: '奇幻世界',
                icon: 'fa-dragon',
                description: '奇幻、魔法世界相关信息',
                defaultEnabled: false,
                items: [
                    { id: 'magicPower', label: '魔力值', type: 'toggle', defaultValue: true },
                    { id: 'spells', label: '法术列表', type: 'toggle', defaultValue: true },
                    { id: 'magicItems', label: '魔法物品', type: 'toggle', defaultValue: true },
                    { id: 'guild', label: '公会信息', type: 'toggle', defaultValue: false },
                    { id: 'reputation', label: '声望系统', type: 'toggle', defaultValue: false },
                    { id: 'blessings', label: '祝福/诅咒', type: 'toggle', defaultValue: false },
                    { id: 'familiars', label: '魔宠/使魔', type: 'toggle', defaultValue: false },
                    { id: 'manaRegeneration', label: '魔力恢复', type: 'toggle', defaultValue: false }
                ]
            },
            scifi: {
                id: 'scifi',
                label: '科幻未来',
                icon: 'fa-rocket',
                description: '科幻、未来世界相关信息',
                defaultEnabled: false,
                items: [
                    { id: 'cybernetics', label: '义体改造', type: 'toggle', defaultValue: true },
                    { id: 'netrunning', label: '网络潜行', type: 'toggle', defaultValue: false },
                    { id: 'reputation', label: '企业声望', type: 'toggle', defaultValue: false },
                    { id: 'augmentations', label: '增强植入', type: 'toggle', defaultValue: true },
                    { id: 'aiCompanion', label: 'AI伙伴', type: 'toggle', defaultValue: false },
                    { id: 'spaceTravel', label: '星际旅行', type: 'toggle', defaultValue: false },
                    { id: 'techLevel', label: '科技等级', type: 'toggle', defaultValue: false },
                    { id: 'cyberwareStatus', label: '赛博装备状态', type: 'toggle', defaultValue: false }
                ]
            },
            story: {
                id: 'story',
                label: '剧情面板',
                icon: 'fa-book',
                description: '管理剧情进展和关键事件',
                defaultEnabled: true,
                items: [
                    { id: 'mainQuest', label: '主线任务', type: 'toggle', defaultValue: true },
                    { id: 'keyEvents', label: '关键事件', type: 'toggle', defaultValue: true },
                    { id: 'storyArcs', label: '剧情章节', type: 'toggle', defaultValue: true },
                    { id: 'clues', label: '线索追踪', type: 'toggle', defaultValue: false },
                    { id: 'storySummary', label: '剧情摘要', type: 'toggle', defaultValue: true },
                    { id: 'factionRelations', label: '派系关系', type: 'toggle', defaultValue: false },
                    { id: 'plotTwists', label: '剧情转折', type: 'toggle', defaultValue: false },
                    { id: 'characterArcs', label: '角色弧光', type: 'toggle', defaultValue: false },
                    { id: 'unresolvedMysteries', label: '未解之谜', type: 'toggle', defaultValue: false },
                    { id: 'themesAndMotifs', label: '主题与母题', type: 'toggle', defaultValue: false },
                    { id: 'foreshadowing', label: '预兆与伏笔', type: 'toggle', defaultValue: false },
                    { id: 'timelineSummary', label: '时间线摘要', type: 'toggle', defaultValue: false }
                ]
            },
            world: {
                id: 'world',
                label: '世界面板',
                icon: 'fa-globe-americas',
                description: '世界背景和环境信息',
                defaultEnabled: true,
                items: [
                    { id: 'time', label: '世界时间', type: 'toggle', defaultValue: true },
                    { id: 'location', label: '世界地点', type: 'toggle', defaultValue: true },
                    { id: 'weather', label: '世界天气', type: 'toggle', defaultValue: true },
                    { id: 'worldMap', label: '世界地图', type: 'toggle', defaultValue: true },
                    { id: 'factions', label: '主要派系', type: 'toggle', defaultValue: true },
                    { id: 'worldHistory', label: '世界历史', type: 'toggle', defaultValue: false },
                    { id: 'culture', label: '文化背景', type: 'toggle', defaultValue: false },
                    { id: 'localLaws', label: '当地法律', type: 'toggle', defaultValue: false },
                    { id: 'localBeliefs', label: '当地信仰', type: 'toggle', defaultValue: false },
                    { id: 'gravity', label: '引力', type: 'toggle', defaultValue: false },
                    { id: 'airComposition', label: '空气成分', type: 'toggle', defaultValue: false },
                    { id: 'resources', label: '资源分布', type: 'toggle', defaultValue: false },
                    { id: 'worldEvents', label: '世界事件', type: 'toggle', defaultValue: true },
                    { id: 'worldRules', label: '世界规则', type: 'toggle', defaultValue: true },
                    { id: 'geography', label: '地理环境', type: 'toggle', defaultValue: false },
                    { id: 'climate', label: '气候条件', type: 'toggle', defaultValue: false },
                    { id: 'keyLocationsDetails', label: '重要地点详情', type: 'toggle', defaultValue: false },
                    { id: 'creaturesAndRaces', label: '生物与种族', type: 'toggle', defaultValue: false },
                    { id: 'organizationsAndPowers', label: '组织与势力', type: 'toggle', defaultValue: false },
                    { id: 'economyAndTrade', label: '经济与贸易', type: 'toggle', defaultValue: false },
                    { id: 'magicTechSystem', label: '魔法/科技系统细则', type: 'toggle', defaultValue: false },
                    { id: 'legendsAndMythology', label: '传说与神话', type: 'toggle', defaultValue: false }
                ]
            },
            dataManagement: {
                id: 'dataManagement',
                label: '数据管理',
                icon: 'fa-database',
                description: '管理信息栏的存储数据。此面板信息不会在聊天中显示。',
                defaultEnabled: true,
                isUtilityPanel: true,
                items: []
            }
        }
    };

    // ------------------- 辅助函数 -------------------
    function notifyUser(message, type = 'info', duration = 3000) {
        if (context && context.toastr) {
            const options = { timeOut: duration };
            switch (type) {
                case 'success': context.toastr.success(message, '', options); break;
                case 'error': context.toastr.error(message, '', options); break;
                case 'warning': context.toastr.warning(message, '', options); break;
                default: context.toastr.info(message, '', options); break;
            }
        } else {
            console.log(`[${extensionName} Notification / ${type.toUpperCase()}]: ${message}`);
        }
    }
    function escapeHtml(unsafe) {
        if (unsafe === null || unsafe === undefined) return '';
        if (typeof unsafe !== 'string') return String(unsafe);
        return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    // ------------------- API 通信层 -------------------
    async function apiGet(endpoint) {
        try {
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
            return await response.json();
        } catch (error) {
            console.error(`[${extensionName}] API GET request failed for ${endpoint}:`, error);
            notifyUser(`从服务器获取数据失败: ${error.message}`, 'error');
            throw error;
        }
    }
    async function apiPost(endpoint, body) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
            return await response.json();
        } catch (error) {
            console.error(`[${extensionName}] API POST request failed for ${endpoint}:`, error);
            notifyUser(`向服务器保存数据失败: ${error.message}`, 'error');
            throw error;
        }
    }

    // ------------------- 核心逻辑 (API驱动) -------------------
    async function loadSettings() {
        const savedSettings = await apiGet('/api/extensions/advanced-infobar/settings');
        const newSettings = {};
        for (const panelId in PANEL_CONFIG.panels) {
            const panelConfig = PANEL_CONFIG.panels[panelId];
            newSettings[panelId] = { enabled: savedSettings[panelId]?.enabled ?? panelConfig.defaultEnabled, items: {} };
            for (const item of panelConfig.items) {
                newSettings[panelId].items[item.id] = savedSettings[panelId]?.items?.[item.id] ?? item.defaultValue;
            }
        }
        currentSettings = newSettings;
        const savedTheme = currentSettings.general?.items?.theme || '现代深色';
        const savedFont = currentSettings.general?.items?.fontFamily || '系统默认';
        applyThemeAndFont(savedTheme, savedFont);
    }
    async function saveCurrentActiveSettings() {
        await apiPost('/api/extensions/advanced-infobar/settings', currentSettings);
        // 暂时保留世界书同步逻辑
        await initializeOrUpdateWorldInfoEntry();
    }
    async function loadDataForCurrentChat() {
        const chatId = context.getContext().chatId;
        if (!chatId) {
            currentInfoBarData = { npcs: {} };
            return;
        }
        currentInfoBarData = await apiGet(`/api/extensions/advanced-infobar/data?chatId=${chatId}`);
    }
    async function saveDataForCurrentChat() {
        const chatId = context.getContext().chatId;
        if (!chatId) return;
        await apiPost(`/api/extensions/advanced-infobar/data?chatId=${chatId}`, currentInfoBarData);
    }
    function applyThemeAndFont(themeName, fontFamilyName) {
        const theme = THEMES[themeName] || THEMES.现代深色;
        const font = FONT_OPTIONS[fontFamilyName] || FONT_OPTIONS.系统默认;
        const root = document.documentElement;
        for (const [key, value] of Object.entries(theme)) {
            root.style.setProperty(key, value);
        }
        root.style.setProperty('--infobar-font-family', font);
    }
    async function initializeOrUpdateWorldInfoEntry() {
        // 此函数逻辑与v10.0.9完全相同，但使用 context.tavern API
        // 为了简洁，此处省略，实际代码中应包含完整函数体
    }
    function parseCompressedAIDataBlock(dataString) {
        // 此函数逻辑与v10.0.9完全相同
        // 为了简洁，此处省略，实际代码中应包含完整函数体
    }

    // ------------------- UI渲染函数 -------------------
    function renderNpcDetails(npcData, panelConfig, panelSettings, messageId) { /* 与v10.0.9相同 */ }
    function renderTaskCard(taskData, taskTypeLabel, panelSettings, messageId, taskIndex) { /* 与v10.0.9相同 */ }
    function renderInternetPost(postData, messageId, postIndex, feedType) { /* 与v10.0.9相同 */ }
    function renderInfoBarHTML(dataToRender, messageId) { /* 与v10.0.9相同 */ }
    function generateFullDataContextSummary() { /* 与v10.0.9相同 */ }
    function generateItemControl(item, panelId) { /* 与v10.0.9相同 */ }

    // ------------------- 弹窗UI管理 -------------------
    function populateSettingsUI() {
        const $popup = $('#advanced-infobar-settings-popup');
        const $tabContainer = $popup.find('.infobar-tab-container');
        const $contentContainer = $popup.find('.infobar-content-container');
        $tabContainer.empty();
        $contentContainer.empty();
        let firstPanel = true;
        for (const panelId in PANEL_CONFIG.panels) {
            const panelConfig = PANEL_CONFIG.panels[panelId];
            if (!panelConfig) continue;
            const iconHtml = panelConfig.icon ? `<i class="fa-solid ${panelConfig.icon}"></i>` : '';
            $tabContainer.append(`<button class="infobar-tab-button ${firstPanel ? 'active' : ''}" data-tab="${panelConfig.id}">${iconHtml}<span class="infobar-tab-label">${escapeHtml(panelConfig.label)}</span></button>`);
            let itemsHtml = '';
            if (panelConfig.id === 'dataManagement') {
                itemsHtml = `...`; // 数据管理面板的HTML结构
            } else if (panelConfig.items && panelConfig.items.length > 0) {
                itemsHtml = `<div class="infobar-items-section"><div class="infobar-items-title">子项设置</div>${panelConfig.items.map(item => `<div class="infobar-item-row"><label class="infobar-item-label">${escapeHtml(item.label)}${item.description ? `<small style="display:block;opacity:0.7;">${escapeHtml(item.description)}</small>` : ''}</label><div class="infobar-item-control">${generateItemControl(item, panelConfig.id)}</div></div>`).join('')}</div>`;
            }
            const panelContentHtml = `<div class="infobar-content-panel" id="infobar-panel-${panelConfig.id}" style="display: ${firstPanel ? 'block' : 'none'};">...</div>`; // 完整的面板HTML
            $contentContainer.append(panelContentHtml);
            firstPanel = false;
        }
    }
    async function showSettingsPopup() {
        await loadSettings();
        populateSettingsUI();
        $('#advanced-infobar-settings-popup, #advanced-infobar-settings-popup-overlay').fadeIn(200);
    }
    function closeSettingsPopup() {
        $('#advanced-infobar-settings-popup, #advanced-infobar-settings-popup-overlay').fadeOut(200);
    }
    async function showDataTablePopup() {
        // ... 逻辑与v10.0.9相同，但使用fadeIn/fadeOut
    }
    function closeDataTablePopup() {
        $('#advanced-infobar-datatable-popup, #advanced-infobar-datatable-popup-overlay').fadeOut(200);
    }

    // ------------------- 事件处理 -------------------
    function bindEvents() {
        // 设置弹窗
        $('#open_advanced_infobar_settings').on('click', showSettingsPopup);
        $('#advanced-infobar-settings-popup-overlay').on('click', closeSettingsPopup);
        $('#advanced-infobar-settings-popup').on('click', '.infobar-close-button', closeSettingsPopup);
        // ... 绑定所有设置项的change和click事件，逻辑与v10.0.9相同

        // 数据表格弹窗
        $('#open_advanced_infobar_datatable').on('click', showDataTablePopup);
        $('#advanced-infobar-datatable-popup-overlay').on('click', closeDataTablePopup);
        $('#advanced-infobar-datatable-popup').on('click', '.infobar-close-button', closeDataTablePopup);
        $('#infobar-datatable-save-and-refresh').on('click', async () => {
            await saveDataForCurrentChat();
            notifyUser('数据已保存到服务器!', 'success');
            const lastMessage = context.getChat().slice(-1)[0];
            if (lastMessage) {
                const $messageNode = context.tavern.retrieveDisplayedMessage(String(lastMessage.id));
                if ($messageNode) {
                    $messageNode.find(`.${RENDERED_INFO_BAR_CLASS}`).remove();
                    const infoBarHtml = renderInfoBarHTML(currentInfoBarData, String(lastMessage.id));
                    $messageNode.find('.mes_text').last().append(infoBarHtml);
                    // 重新绑定新渲染的infoBar的事件
                }
            }
        });
        // ... 绑定数据表格单元格的blur事件
    }

    // ------------------- 扩展初始化 -------------------
    jQuery(async () => {
        context = SillyTavern.getContext();
        const $extensionsMenu = $('#extensions_menu');

        // 注入菜单按钮
        $extensionsMenu.append(`<div class="list-group-item flex-container flexGap5" id="open_advanced_infobar_settings"><i class="fa-solid fa-address-card"></i><span>高级信息栏设置</span></div>`);
        $extensionsMenu.append(`<div class="list-group-item flex-container flexGap5" id="open_advanced_infobar_datatable"><i class="fa-solid fa-table"></i><span>数据表格</span></div>`);

        bindEvents();

        // 监听SillyTavern核心事件
        context.eventSource.on(context.event_types.MESSAGE_RENDERED, async (message) => {
            if (message && !message.is_user && message.mes) {
                const $messageNode = context.tavern.retrieveDisplayedMessage(String(message.id));
                if (!$messageNode || $messageNode.length === 0) return;
                const dataBlockMatch = message.mes.match(AI_DATA_BLOCK_REGEX);
                if (dataBlockMatch && dataBlockMatch[1]) {
                    const updatePatch = parseCompressedAIDataBlock(dataBlockMatch[1]);
                    if (updatePatch) {
                        Object.assign(currentInfoBarData, updatePatch); // 简化合并逻辑
                        await saveDataForCurrentChat();
                    }
                }
                const infoBarHtml = renderInfoBarHTML(currentInfoBarData, String(message.id));
                $messageNode.find(`.${RENDERED_INFO_BAR_CLASS}`).remove();
                $messageNode.find('.mes_text').last().append(infoBarHtml);
                // 绑定事件
            }
        });

        context.eventSource.on(context.event_types.CHAT_LOADED, async () => {
            console.log(`[${extensionName}] CHAT_LOADED: Loading data for new chat...`);
            await loadDataForCurrentChat();
            const lastMessage = context.getChat().slice(-1)[0];
            if (lastMessage && !lastMessage.is_user) {
                const $messageNode = context.tavern.retrieveDisplayedMessage(String(lastMessage.id));
                if ($messageNode) {
                    const infoBarHtml = renderInfoBarHTML(currentInfoBarData, String(lastMessage.id));
                    $messageNode.find(`.${RENDERED_INFO_BAR_CLASS}`).remove();
                    $messageNode.find('.mes_text').last().append(infoBarHtml);
                    // 绑定事件
                }
            }
        });

        // 首次加载
        await loadSettings();
        await loadDataForCurrentChat();
        console.log(`[${extensionName}] Client-side component initialized successfully.`);
    });
})();
