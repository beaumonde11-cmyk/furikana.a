const express = require('express');
const path = require('path');
const kuromoji = require('kuromoji');
const WebSocket = require('ws'); 
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- 模块 1: Kuromoji 初始化 (保留绝对路径修复) ---
let tokenizer = null;
const dicPath = path.join(__dirname, 'node_modules', 'kuromoji', 'dict'); 
kuromoji.builder({ dicPath: dicPath }).build((err, t) => {
    if (err) console.error('Kuromoji 初始化失败:', err);
    else {
        tokenizer = t;
        console.log('Kuromoji 字典加载成功');
    }
});

// --- 模块 2: 注音路由 ---
app.post('/furigana', (req, res) => {
    const japaneseText = req.body.text;
    if (!tokenizer) return res.status(500).json({ error: '分词器未就绪' });
    if (!japaneseText) return res.json({ html: '' });

    try {
        const tokens = tokenizer.tokenize(japaneseText);
        let resultHtml = '';
        tokens.forEach(token => {
            const surface = token.surface_form;
            const reading = token.reading;
            if (reading && reading !== surface && /[\u4e00-\u9fa5]/.test(surface)) {
                const furigana = reading.replace(/[\u30a1-\u30f6]/g, m => String.fromCharCode(m.charCodeAt(0) - 0x60));
                resultHtml += `<ruby>${surface}<rt>${furigana}</rt></ruby>`;
            } else {
                resultHtml += surface;
            }
        });
        res.json({ html: resultHtml });
    } catch (e) { res.status(500).send(e.message); }
});

// --- 模块 3: 发音路由 (带 500 字上限拦截) ---
app.get('/speak', async (req, res) => {
    const text = req.query.text;
    if (!text) return res.status(400).send("No text");
    
    // 安全屏障：禁止超过 500 字
    if (text.length > 500) {
        return res.status(400).send("文本过长，限500字以内");
    }

    const endpoint = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4`;
    const ws = new WebSocket(endpoint);
    let audioData = Buffer.alloc(0);

    ws.on('open', () => {
        const requestId = uuidv4().replace(/-/g, '');
        let lang = /[\u3040-\u309F\u30A0-\u30FF]/.test(text) ? 'ja-JP' : 'zh-CN';
        let voice = lang === 'ja-JP' ? 'ja-JP-NanamiNeural' : 'zh-CN-XiaoxiaoNeural';

        ws.send(`X-Timestamp:${Date.now()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`);
        const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${lang}'><voice name='${voice}'>${text}</voice></speak>`;
        ws.send(`X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${Date.now()}\r\nPath:ssml\r\n\r\n${ssml}`);
    });

    ws.on('message', (data, isBinary) => {
        if (isBinary) {
            const index = data.indexOf(Buffer.from([0x50, 0x61, 0x74, 0x68, 0x3a, 0x61, 0x75, 0x64, 0x69, 0x6f, 0x0d, 0x0a]));
            if (index !== -1) audioData = Buffer.concat([audioData, data.slice(index + 12)]);
        } else if (data.toString().includes('turn.end')) {
            res.set({ 'Content-Type': 'audio/mpeg' });
            res.send(audioData);
            ws.close();
        }
    });

    ws.on('error', () => { if(!res.headersSent) res.status(500).send("TTS Error"); });
});

app.listen(port, () => console.log(`全功能助手启动: http://localhost:${port}`));