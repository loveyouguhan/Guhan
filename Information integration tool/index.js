/*
    高级信息栏 (Advanced InfoBar) 扩展服务器端脚本
    版本: 11.0.0 (Production)
    职责: 提供API端点，处理持久化数据存储。
*/
import { getRequest } from '../../../../routes.js';
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
        console.error(`[${extensionName}] FATAL: Failed to create data directory at ${dataDir}.`, error);
        throw error; // Throw to prevent the extension from running without storage
    }
}

async function readDataFile(filePath, defaultValue = {}) {
    try {
        await fs.access(filePath);
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`[${extensionName}] File not found: ${filePath}. Creating with default value.`);
            await writeDataFile(filePath, defaultValue);
            return defaultValue;
        }
        console.error(`[${extensionName}] ERROR: Could not read file ${filePath}.`, error);
        return defaultValue;
    }
}

async function writeDataFile(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 4), 'utf-8');
    } catch (error) {
        console.error(`[${extensionName}] ERROR: Could not write to file ${filePath}.`, error);
    }
}


// ------------------- SillyTavern 扩展入口 -------------------

(async function () {
    console.log(`[${extensionName}] Initializing server-side component...`);
    
    await ensureDataDirExists();
    const app = getRequest();

    // ------------------- API 端点定义 -------------------
    const router = express.Router();

    // GET /settings - 获取全局设置
    router.get('/settings', async (req, res) => {
        const settings = await readDataFile(settingsFilePath, {});
        res.json(settings);
    });

    // POST /settings - 保存全局设置
    router.post('/settings', express.json(), async (req, res) => {
        const newSettings = req.body;
        if (!newSettings || typeof newSettings !== 'object') {
            return res.status(400).json({ error: 'Invalid settings data provided.' });
        }
        await writeDataFile(settingsFilePath, newSettings);
        res.json({ success: true, message: 'Settings saved successfully.' });
    });

    // GET /data - 获取指定聊天的信息栏数据
    router.get('/data', async (req, res) => {
        const { chatId } = req.query;
        if (!chatId) {
            return res.status(400).json({ error: 'chatId query parameter is required.' });
        }
        const allChatData = await readDataFile(chatDataFilePath, {});
        const chatData = allChatData[chatId] || { npcs: {} };
        res.json(chatData);
    });

    // POST /data - 保存指定聊天的信息栏数据
    router.post('/data', express.json(), async (req, res) => {
        const { chatId } = req.query;
        const newChatData = req.body;
        if (!chatId) {
            return res.status(400).json({ error: 'chatId query parameter is required.' });
        }
        if (!newChatData || typeof newChatData !== 'object') {
            return res.status(400).json({ error: 'Invalid chat data provided.' });
        }
        const allChatData = await readDataFile(chatDataFilePath, {});
        allChatData[chatId] = newChatData;
        await writeDataFile(chatDataFilePath, allChatData);
        res.json({ success: true, message: `Data for chat ${chatId} saved.` });
    });

    // 将路由挂载到SillyTavern的Express app上
    app.use('/api/extensions/advanced-infobar', router);

    console.log(`[${extensionName}] Server-side component initialized successfully. API endpoints are live.`);
})();
