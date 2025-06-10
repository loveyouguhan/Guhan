/*
    高级信息栏 (Advanced InfoBar) 扩展客户端脚本
    版本: 11.0.0
*/
(function () {
    // ------------------- 扩展上下文和API -------------------
    let context;
    const extensionName = "高级信息栏 (Advanced InfoBar)";
    const SCRIPT_VERSION_TAG = 'v11_0_0_ext'; // 使用新的版本标签以避免与旧脚本冲突

    // ------------------- 核心常量 (从Userscript迁移) -------------------
    const WORLD_INFO_COMMENT_KEY = '[DO NOT EDIT] Infobar Settings Tasklist';
    const TARGET_LOREBOOK_NAME = "信息栏 aplon";
    const STORAGE_KEY_CURRENT_SETTINGS = `advanced_infobar_cot_current_settings_${SCRIPT_VERSION_TAG}`;
    const GLOBAL_VAR_KEY_NAMED_CONFIGS = `infobar_named_configs_global_${SCRIPT_VERSION_TAG}`;
    const CHAT_VAR_KEY_INFOBAR_DATA_HISTORY = `infobar_cot_data_history_${SCRIPT_VERSION_TAG}`;
    const CHAT_VAR_KEY_AI_PROMPT = `infobar_ai_prompt_package_${SCRIPT_VERSION_TAG}`;
    const RENDERED_INFO_BAR_CLASS = `infobar-cot-rendered-container-${SCRIPT_VERSION_TAG}`;
    const MAX_DATA_HISTORY_ENTRIES = 50;
    const NPC_SELECTOR_ID_PREFIX = 'infobar-npc-selector-';
    const NPC_DETAILS_CONTAINER_ID_PREFIX = 'infobar-npc-details-';
    const INTERNET_POST_DETAILS_PREFIX = 'infobar-internet-post-';
    const MAX_RENDERED_NPCS_IN_SELECTOR = 10;
    const MAX_INTERNET_ITEMS_INITIALLY_DISPLAYED = 2;
    const AI_DATA_BLOCK_REGEX = /<infobar_data>([\s\S]*?)<\/infobar_data>/si;
    const AI_THINK_PROCESS_REGEX = /<aiThinkProcess>[\s\S]*?<\/aiThinkProcess>/si;

    // ------------------- 状态变量 (从Userscript迁移) -------------------
    let currentSettings = {};
    let currentInfoBarData = { npcs: {} };
    let selectedNpcIdForInteractionPanel = null;
    let dataTableInstance = null;

    // ------------------- 配置数据 (从Userscript迁移) -------------------
    const THEMES = { /* ... 内容与v10.0.9完全相同 ... */ };
    const FONT_OPTIONS = { /* ... 内容与v10.0.9完全相同 ... */ };
    const PANEL_CONFIG = { /* ... 内容与v10.0.9完全相同 ... */ };
    // 为了简洁，这里省略了THEMES, FONT_OPTIONS, PANEL_CONFIG的巨大JSON定义
    // 实际使用时，请将v10.0.9脚本中的这三个巨大常量完整复制到此处

    // ------------------- 辅助函数 (从Userscript迁移) -------------------
    function errorCatched(fn, context = null, functionName = 'anonymous') { /* ... 与v10.0.9相同 ... */ }
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
    function escapeHtml(unsafe) { /* ... 与v10.0.9相同 ... */ }

    // ------------------- 核心逻辑 (从Userscript迁移并重构) -------------------

    function applyThemeAndFont(themeName, fontFamilyName) {
        // 注意：在扩展中，我们不再需要动态添加<style>标签，因为style.css已经加载
        // 我们通过修改:root的CSS变量来应用主题
        const theme = THEMES[themeName] || THEMES.现代深色;
        const font = FONT_OPTIONS[fontFamilyName] || FONT_OPTIONS.系统默认;
        const root = document.documentElement;

        for (const [key, value] of Object.entries(theme)) {
            root.style.setProperty(key, value);
        }
        root.style.setProperty('--infobar-font-family', font);
    }

    async function loadSettings() {
        // 阶段2：暂时继续使用localStorage
        // 阶段3：将替换为从服务器API获取
        const saved = localStorage.getItem(STORAGE_KEY_CURRENT_SETTINGS);
        const parsedSettings = saved ? JSON.parse(saved) : {};
        const newSettings = {};

        for (const panelId in PANEL_CONFIG.panels) {
            const panelConfig = PANEL_CONFIG.panels[panelId];
            newSettings[panelId] = { enabled: parsedSettings[panelId]?.enabled ?? panelConfig.defaultEnabled, items: {} };
            for (const item of panelConfig.items) {
                newSettings[panelId].items[item.id] = parsedSettings[panelId]?.items?.[item.id] ?? item.defaultValue;
            }
        }
        currentSettings = newSettings;

        const savedTheme = currentSettings.general?.items?.theme || '现代深色';
        const savedFont = currentSettings.general?.items?.fontFamily || '系统默认';
        applyThemeAndFont(savedTheme, savedFont);
    }

    async function initializeOrUpdateWorldInfoEntry() {
        // 阶段2：暂时保留此逻辑
        // 阶段3：可以考虑将此逻辑移到服务器端
        if (!context || !context.tavern) {
            console.warn(`[${extensionName}] Tavern API尚未就绪，无法同步世界书设置。`);
            return;
        }
        // ... 此处是与v10.0.9完全相同的initializeOrUpdateWorldInfoEntry函数体 ...
        // 使用 context.tavern.getLorebookEntries, context.tavern.createLorebookEntries 等
    }

    async function saveCurrentActiveSettings() {
        // 阶段2：暂时继续使用localStorage
        // 阶段3：将替换为向服务器API发送POST请求
        localStorage.setItem(STORAGE_KEY_CURRENT_SETTINGS, JSON.stringify(currentSettings));
        await initializeOrUpdateWorldInfoEntry();
    }

    function generateItemControl(item, panelId) { /* ... 与v10.0.9相同 ... */ }

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

            // 生成Tab按钮
            const iconHtml = panelConfig.icon ? `<i class="fa-solid ${panelConfig.icon}"></i>` : '';
            const tabButtonHtml = `<button class="infobar-tab-button ${firstPanel ? 'active' : ''}" data-tab="${panelConfig.id}">${iconHtml}<span class="infobar-tab-label">${escapeHtml(panelConfig.label)}</span></button>`;
            $tabContainer.append(tabButtonHtml);

            // 生成面板内容
            let itemsHtml = '';
            if (panelConfig.id === 'dataManagement') {
                // 数据管理面板的特殊HTML结构
                itemsHtml = `
                    <div class="infobar-items-title">当前数据状态</div>
                    <div class="infobar-item-row"><label class="infobar-item-label">当前聊天变量数据预览 (最新快照):</label><div class="data-preview" id="infobar-data-preview">(加载中...)</div></div>
                    <div class="infobar-item-row"><label class="infobar-item-label">当前记忆辅助摘要:</label><div class="data-preview" id="infobar-memory-assist-preview">(未启用或无数据)</div></div>
                    <div class="infobar-item-row"><button id="infobar-clear-chat-data" class="danger">清除当前聊天所有信息栏历史数据</button></div>
                    <hr style="margin: 20px 0; border-color: var(--infobar-border-color);">
                    <div class="infobar-items-title">配置管理 (存储于SillyTavern全局变量)</div>
                    <div class="infobar-item-row"><label class="infobar-item-label" for="infobar-config-name">新配置名称:</label><input type="text" id="infobar-config-name" class="infobar-select" style="flex-grow:1; margin-right:10px;" placeholder="例如：战斗场景配置"></div>
                    <div class="infobar-item-row" style="justify-content: flex-end;"><button id="infobar-save-named-config">保存当前设置为新配置</button></div>
                    <div class="infobar-item-row"><label class="infobar-item-label" for="infobar-load-config-select">已存配置:</label><select id="infobar-load-config-select" class="infobar-select" style="flex-grow:1; margin-right:10px;"></select></div>
                    <div class="infobar-item-row" style="justify-content: flex-end;"><button id="infobar-load-selected-config">加载选中</button><button id="infobar-delete-selected-config" class="danger" style="margin-left:5px;">删除选中</button></div>
                    <hr style="margin: 15px 0; border-color: var(--infobar-border-color);">
                    <div class="infobar-item-row"><button id="infobar-export-configs">导出所有命名配置</button></div>
                    <div class="infobar-item-row"><label class="infobar-item-label" for="infobar-import-file">导入配置 (JSON文件):</label><input type="file" id="infobar-import-file" accept=".json" style="flex-grow:1; margin-right:10px; display:none;"> <button id="infobar-trigger-import-file">选择文件...</button> </div>
                    <div class="infobar-item-row" style="justify-content: flex-end;"><button id="infobar-import-configs-btn" style="display:none;">确认导入</button> </div>
                `;
            } else if (panelConfig.items && panelConfig.items.length > 0) {
                itemsHtml = `<div class="infobar-items-section"><div class="infobar-items-title">子项设置</div>${panelConfig.items.map(item => `
                    <div class="infobar-item-row">
                        <label class="infobar-item-label">${escapeHtml(item.label)}${item.description ? `<small style="display:block;opacity:0.7;">${escapeHtml(item.description)}</small>` : ''}</label>
                        <div class="infobar-item-control">${generateItemControl(item, panelConfig.id)}</div>
                    </div>`).join('')}
                </div>`;
            }

            const panelContentHtml = `
                <div class="infobar-content-panel" id="infobar-panel-${panelConfig.id}" style="display: ${firstPanel ? 'block' : 'none'};">
                    <div class="infobar-panel-header">${iconHtml}${escapeHtml(panelConfig.label)}</div>
                    <div class="infobar-panel-description">${escapeHtml(panelConfig.description)}</div>
                    ${!(panelConfig.isUtilityPanel) ? `
                        <div class="infobar-item-row panel-toggle">
                            <label for="infobar-panel-${panelConfig.id}-toggle" class="infobar-item-label">启用此面板</label>
                            <div class="infobar-item-control">
                                <label class="infobar-switch"><input type="checkbox" id="infobar-panel-${panelConfig.id}-toggle" data-panel-id="${panelConfig.id}" ${currentSettings[panelId]?.enabled ? 'checked' : ''}><span class="infobar-slider"></span></label>
                            </div>
                        </div>` : ''}
                    ${itemsHtml}
                </div>`;
            $contentContainer.append(panelContentHtml);
            firstPanel = false;
        }
    }

    async function showSettingsPopup() {
        await loadSettings();
        populateSettingsUI(); // 使用新函数填充UI
        $('#advanced-infobar-settings-popup, #advanced-infobar-settings-popup-overlay').fadeIn(200);
    }

    function closeSettingsPopup() {
        $('#advanced-infobar-settings-popup, #advanced-infobar-settings-popup-overlay').fadeOut(200);
    }

    async function showDataTablePopup() {
        // ... 此处是与v10.0.9完全相同的showDataTablePopup函数体 ...
        // 只是显示和隐藏弹窗的方式改为:
        // $('#advanced-infobar-datatable-popup, #advanced-infobar-datatable-popup-overlay').fadeIn(200);
        // 和
        // $('#advanced-infobar-datatable-popup, #advanced-infobar-datatable-popup-overlay').fadeOut(200);
    }

    function bindSettingsEvents() {
        const $popup = $('#advanced-infobar-settings-popup');

        // 使用事件委托来处理所有交互
        $popup.on('click', '.infobar-close-button', closeSettingsPopup);
        $popup.on('click', '.infobar-tab-button', function () {
            const $this = $(this), tabId = $this.data('tab');
            $popup.find('.infobar-tab-button').removeClass('active');
            $this.addClass('active');
            $popup.find('.infobar-content-panel').hide();
            $popup.find(`#infobar-panel-${tabId}`).show();
            if (tabId === 'dataManagement') { updateDataManagementPanel(); }
        });

        $popup.on('change', 'input[type="checkbox"][data-panel-id]', async function () {
            // ... 此处是与v10.0.9完全相同的checkbox change事件处理逻辑 ...
        });

        $popup.on('change', 'select[data-panel-id]', async function () {
            // ... 此处是与v10.0.9完全相同的select change事件处理逻辑 ...
        });

        // 数据管理面板的事件绑定
        // ... 此处是与v10.0.9完全相同的数据管理面板所有按钮的事件处理逻辑 ...
    }

    // ... 此处是与v10.0.9完全相同的所有其他核心函数 ...
    // loadDataHistory, saveDataSnapshotToHistory, clearChatVarsData,
    // parseCompressedAIDataBlock, renderNpcDetails, renderTaskCard,
    // renderInternetPost, renderInfoBarHTML, generateFullDataContextSummary,
    // handleMessageRendering

    // ------------------- 扩展初始化 -------------------
    
    // 这个函数将在SillyTavern的UI完全加载后被调用
    jQuery(async () => {
        // 获取SillyTavern的上下文，包含各种API和状态
        context = SillyTavern.getContext();

        // 创建并注入菜单按钮
        const $extensionsMenu = $('#extensions_menu');
        if ($extensionsMenu.length > 0) {
            const buttonHtml = `<div class="list-group-item flex-container flexGap5" id="open_advanced_infobar_settings"><i class="fa-solid fa-address-card"></i><span>高级信息栏设置</span></div>`;
            $extensionsMenu.append(buttonHtml);
            $('#open_advanced_infobar_settings').on('click', () => {
                showSettingsPopup();
            });
        }

        // 绑定设置弹窗的事件
        bindSettingsEvents();
        $('#advanced-infobar-settings-popup-overlay').on('click', closeSettingsPopup);

        // 监听SillyTavern的核心事件
        context.eventSource.on(context.event_types.MESSAGE_RENDERED, (message) => {
            if (message && message.is_system !== true) {
                handleMessageRendering(String(message.id));
            }
        });
        context.eventSource.on(context.event_types.MESSAGE_EDITED, (messageId) => {
            const $messageNode = context.tavern.retrieveDisplayedMessage(String(messageId));
            if ($messageNode && $messageNode.length > 0 && $messageNode.attr('is_user') !== 'true') {
                setTimeout(() => handleMessageRendering(String(messageId)), 250);
            }
        });
        context.eventSource.on(context.event_types.MESSAGE_DELETED, async (deletedMessageId) => {
            // ... 此处是与v10.0.9完全相同的MESSAGE_DELETED事件处理逻辑 ...
        });
        context.eventSource.on(context.event_types.CHAT_LOADED, async () => {
            console.log(`[${extensionName}] CHAT_LOADED 事件触发，重新同步。`);
            // ... 此处是与v10.0.9完全相同的CHAT_LOADED事件处理逻辑 ...
        });

        // 执行首次加载逻辑
        console.log(`[${extensionName}] 客户端初始化完成。`);
        await loadSettings(); // 加载初始设置
        // ... 其他初始化逻辑 ...
    });

    // 为了让上面的省略部分更清晰，这里是需要完整复制的函数列表
    // 请将v10.0.9版本中以下函数的完整代码复制到上面的脚本中对应位置
    // THEMES, FONT_OPTIONS, PANEL_CONFIG
    // errorCatched, escapeHtml
    // initializeOrUpdateWorldInfoEntry
    // generateItemControl
    // showDataTablePopup (及其内部的closeDataTablePopup)
    // bindSettingsEvents内部的所有事件处理函数
    // loadDataHistory, saveDataSnapshotToHistory, clearChatVarsData
    // parseCompressedAIDataBlock
    // renderNpcDetails, renderTaskCard, renderInternetPost, renderInfoBarHTML
    // generateFullDataContextSummary
    // handleMessageRendering
    // MESSAGE_DELETED 和 CHAT_LOADED 的事件处理函数体
})();
