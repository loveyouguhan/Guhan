/*
    高级信息栏 (Advanced InfoBar) 扩展服务器端脚本
    版本: 11.0.0
    阶段3: 实现服务器端API和持久化数据存储
*/
import { extension_settings } from '../../../../extensions.js';
import { getRequest, sendResponse } from '../../../../routes.js';
import { eventSource, event_types } from '../../../../events.js';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const extensionName = "高级信息栏 (Advanced InfoBar)";
const dataDir = path.join(new URL(import.meta.url).pathname, '..', 'data');
const settingsFilePath = path.join(dataDir, 'settings.json');
const chatDataFilePath = path.join(dataDir, 'chat_data.json');

// ------------------- 文件 I/O 辅助函数 -------------------

async function ensureDataDirExists() {
    try {
        await fs.mkdir(dataDir, { recursive: true });
    } catch (error) {
        console.error(`[${extensionName}] Failed to create data directory:`, error);
    }
}

async function readDataFile(filePath, defaultValue = {}) {
    try {
        await fs.access(filePath);
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // 文件不存在，返回默认值并尝试创建文件
            await writeDataFile(filePath, defaultValue);
            return defaultValue;
        }
        console.error(`[${extensionName}] Error reading file ${filePath}:`, error);
        return defaultValue;
    }
}

async function writeDataFile(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 4), 'utf-8');
    } catch (error) {
        console.error(`[${extensionName}] Error writing to file ${filePath}:`, error);
    }
}


// ------------------- SillyTavern 扩展入口 -------------------

(async function () {
    console.log(`[${extensionName}] 服务器端脚本 (index.js) 已加载。`);
    
    // 确保数据目录存在
    await ensureDataDirExists();

    // 获取SillyTavern的Express app实例
    const app = getRequest();

    // ------------------- API 端点定义 -------------------

    // 1. 获取全局设置
    app.get('/api/extensions/advanced-infobar/settings', async (req, res) => {
        console.log(`[${extensionName}] GET /settings - 正在读取全局设置...`);
        const settings = await readDataFile(settingsFilePath, {});
        res.json(settings);
    });

    // 2. 保存全局设置
    app.post('/api/extensions/advanced-infobar/settings', express.json(), async (req, res) => {
        const newSettings = req.body;
        console.log(`[${extensionName}] POST /settings - 正在保存全局设置...`);
        if (!newSettings || typeof newSettings !== 'object') {
            return res.status(400).json({ error: 'Invalid settings data' });
        }
        await writeDataFile(settingsFilePath, newSettings);
        res.json({ success: true, message: 'Settings saved successfully.' });
    });

    // 3. 获取指定聊天的信息栏数据
    app.get('/api/extensions/advanced-infobar/data', async (req, res) => {
        const { chatId } = req.query;
        if (!chatId) {
            return res.status(400).json({ error: 'chatId is required' });
        }
        console.log(`[${extensionName}] GET /data - 正在为聊天 ${chatId} 读取数据...`);
        const allChatData = await readDataFile(chatDataFilePath, {});
        const chatData = allChatData[chatId] || { npcs: {} }; // 如果没有该聊天的数据，返回初始对象
        res.json(chatData);
    });

    // 4. 保存指定聊天的信息栏数据
    app.post('/api/extensions/advanced-infobar/data', express.json(), async (req, res) => {
        const { chatId } = req.query;
        const newChatData = req.body;
        if (!chatId) {
            return res.status(400).json({ error: 'chatId is required' });
        }
        if (!newChatData || typeof newChatData !== 'object') {
            return res.status(400).json({ error: 'Invalid chat data' });
        }
        console.log(`[${extensionName}] POST /data - 正在为聊天 ${chatId} 保存数据...`);
        const allChatData = await readDataFile(chatDataFilePath, {});
        allChatData[chatId] = newChatData;
        await writeDataFile(chatDataFilePath, allChatData);
        res.json({ success: true, message: `Data for chat ${chatId} saved.` });
    });

    console.log(`[${extensionName}] API端点已成功注册。`);
})();
