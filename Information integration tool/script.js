/*
    高级信息栏 (Advanced InfoBar) 扩展客户端脚本
    版本: 11.0.0
    阶段3: 重构为使用服务器端API进行数据持久化
*/
(function () {
    // ------------------- 扩展上下文和API -------------------
    let context;
    const extensionName = "高级信息栏 (Advanced InfoBar)";
    const SCRIPT_VERSION_TAG = 'v11_0_0_ext';

    // ------------------- 核心常量 (大部分与之前相同) -------------------
    const RENDERED_INFO_BAR_CLASS = `infobar-cot-rendered-container-${SCRIPT_VERSION_TAG}`;
    const AI_DATA_BLOCK_REGEX = /<infobar_data>([\s\S]*?)<\/infobar_data>/si;
    // ... 其他常量 ...

    // ------------------- 状态变量 -------------------
    let currentSettings = {};
    let currentInfoBarData = { npcs: {} };
    // ... 其他状态变量 ...

    // ------------------- 配置数据 (省略，与之前相同) -------------------
    const THEMES = { /* ... */ };
    const FONT_OPTIONS = { /* ... */ };
    const PANEL_CONFIG = { /* ... */ };

    // ------------------- 辅助函数 -------------------
    function notifyUser(message, type = 'info', duration = 3000) { /* ... 与阶段2相同 ... */ }
    function escapeHtml(unsafe) { /* ... 与阶段2相同 ... */ }

    // ------------------- API 通信层 (全新) -------------------

    async function apiGet(endpoint) {
        try {
            const response = await fetch(endpoint);
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
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
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`[${extensionName}] API POST request failed for ${endpoint}:`, error);
            notifyUser(`向服务器保存数据失败: ${error.message}`, 'error');
            throw error;
        }
    }

    // ------------------- 核心逻辑 (重构为使用API) -------------------

    async function loadSettings() {
        // 阶段3: 从服务器API获取设置
        console.log(`[${extensionName}] 正在从API加载全局设置...`);
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
        // 阶段3: 向服务器API发送POST请求保存设置
        console.log(`[${extensionName}] 正在通过API保存全局设置...`);
        await apiPost('/api/extensions/advanced-infobar/settings', currentSettings);
        // 暂时保留世界书同步逻辑，未来可优化
        await initializeOrUpdateWorldInfoEntry();
    }

    async function loadDataForCurrentChat() {
        // 阶段3: 为当前聊天从API加载数据
        const chatId = context.getContext().chatId;
        if (!chatId) {
            console.warn(`[${extensionName}] 无法获取当前chatId，跳过数据加载。`);
            currentInfoBarData = { npcs: {} }; // 重置为默认
            return;
        }
        console.log(`[${extensionName}] 正在为聊天 ${chatId} 从API加载数据...`);
        currentInfoBarData = await apiGet(`/api/extensions/advanced-infobar/data?chatId=${chatId}`);
        console.log(`[${extensionName}] 聊天 ${chatId} 的数据已加载。`, currentInfoBarData);
    }

    async function saveDataForCurrentChat() {
        // 阶段3: 为当前聊天通过API保存数据
        const chatId = context.getContext().chatId;
        if (!chatId) {
            console.warn(`[${extensionName}] 无法获取当前chatId，跳过数据保存。`);
            return;
        }
        console.log(`[${extensionName}] 正在为聊天 ${chatId} 通过API保存数据...`);
        await apiPost(`/api/extensions/advanced-infobar/data?chatId=${chatId}`, currentInfoBarData);
    }

    async function handleMessageRendering(message_id_str) {
        // ... 函数体与之前基本相同，但在解析并更新currentInfoBarData后，
        // 需要调用saveDataForCurrentChat()来持久化数据。

        // 在函数内部找到这一行:
        // await saveDataSnapshotToHistory(`msg_${message_id_str}`, currentInfoBarData);
        // 将其替换为:
        await saveDataForCurrentChat();
    }

    // ... 其他所有UI渲染和逻辑函数 (如populateSettingsUI, showSettingsPopup, renderInfoBarHTML等) 保持不变 ...
    // 它们现在操作的是由API填充的currentSettings和currentInfoBarData，所以无需修改。

    // ------------------- 扩展初始化 (重构事件处理) -------------------
    
    jQuery(async () => {
        context = SillyTavern.getContext();

        // ... 创建菜单按钮和绑定设置弹窗事件的代码与阶段2相同 ...

        // 监听SillyTavern的核心事件
        context.eventSource.on(context.event_types.MESSAGE_RENDERED, async (message) => {
            if (message && message.is_system !== true && !message.is_user) {
                // 找到原handleMessageRendering函数，并确保在更新数据后调用saveDataForCurrentChat
                // 为了清晰，我们直接在这里重写逻辑
                const $messageNode = context.tavern.retrieveDisplayedMessage(String(message.id));
                if (!$messageNode || $messageNode.length === 0) return;

                const originalMessageText = message.mes;
                const dataBlockMatch = originalMessageText.match(AI_DATA_BLOCK_REGEX);
                
                // 清理消息文本
                let mainContent = originalMessageText.replace(AI_DATA_BLOCK_REGEX, '').replace(AI_THINK_PROCESS_REGEX, '').trim();
                $messageNode.find('.mes_text').first().html(mainContent);

                if (dataBlockMatch && dataBlockMatch[1]) {
                    const updatePatch = parseCompressedAIDataBlock(dataBlockMatch[1]);
                    if (updatePatch) {
                        // 合并补丁到当前数据
                        for (const key in updatePatch) {
                            if (key === 'npcs') {
                                if (!currentInfoBarData.npcs) currentInfoBarData.npcs = {};
                                for (const npcId in updatePatch.npcs) {
                                    if (!currentInfoBarData.npcs[npcId]) currentInfoBarData.npcs[npcId] = {};
                                    Object.assign(currentInfoBarData.npcs[npcId], updatePatch.npcs[npcId]);
                                }
                            } else {
                                currentInfoBarData[key] = updatePatch[key];
                            }
                        }
                        // **核心变化：保存到服务器**
                        await saveDataForCurrentChat();
                    }
                }
                
                // 使用更新后的数据渲染UI
                const infoBarHtml = renderInfoBarHTML(currentInfoBarData, String(message.id));
                // ... 渲染和绑定事件的逻辑与之前相同 ...
            }
        });

        context.eventSource.on(context.event_types.CHAT_LOADED, async () => {
            console.log(`[${extensionName}] CHAT_LOADED 事件触发，从服务器加载新聊天数据。`);
            await loadDataForCurrentChat();
            // 可以在这里触发一次最后一条消息的渲染，以显示新加载的数据
            const lastMessage = context.getChat().slice(-1)[0];
            if (lastMessage && !lastMessage.is_user) {
                 const infoBarHtml = renderInfoBarHTML(currentInfoBarData, String(lastMessage.id));
                 // ... 渲染逻辑 ...
            }
        });

        // ... 其他事件监听器 (MESSAGE_EDITED, MESSAGE_DELETED) 也需要类似地重构 ...
        // 它们不再需要处理复杂的数据回溯，因为服务器总是有最新的状态。
        // 删除消息时，我们甚至可以考虑在服务器端也标记该数据点，但目前可以简化处理。

        // 执行首次加载逻辑
        console.log(`[${extensionName}] 客户端初始化完成。`);
        await loadSettings();
        await loadDataForCurrentChat();
    });

    // 再次提醒：请将阶段2中省略的函数和常量完整地复制到此脚本中。
    // 特别是 THEMES, FONT_OPTIONS, PANEL_CONFIG, 和所有 render* 函数。
})();
