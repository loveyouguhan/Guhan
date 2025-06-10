/*
    高级信息栏 (Advanced InfoBar) 扩展服务器端脚本
    版本: 11.0.0
*/
import { extension_settings, loadExtensionSettings } from '../../../../extensions.js';
import { eventSource, event_types } from '../../../../events.js';

// 扩展的名称，必须与config.json中的name字段匹配
const extensionName = "高级信息栏 (Advanced InfoBar)";

// 扩展的默认设置
const defaultSettings = {
    // 第三阶段：
    // 在这里定义全局设置的默认值
    // 例如: defaultTheme: '现代深色'
};

// 加载扩展设置
async function loadSettings() {
    // 这会从SillyTavern的config/extensions_settings.json中加载本扩展的设置
    // 如果没有设置，则使用上面的defaultSettings
    Object.assign(extension_settings[extensionName], {
        ...defaultSettings,
        ...(extension_settings[extensionName] || {}),
    });
}

// SillyTavern启动时执行的入口函数
(async function () {
    console.log(`[高级信息栏] 服务器端脚本 (index.js) 已加载。`);
    
    // 加载设置
    await loadSettings();

    // 第三阶段：
    // 1. 定义API端点 (使用SillyTavern的Express app实例)
    //    - GET /api/extensions/advanced-infobar/settings
    //    - POST /api/extensions/advanced-infobar/settings
    //    - GET /api/extensions/advanced-infobar/data
    //    - POST /api/extensions/advanced-infobar/data
    // 2. 实现数据的持久化读写逻辑 (例如，读写一个JSON文件)
    // 3. 监听SillyTavern的服务器端事件
})();
