const express = require('express');
const path = require('path');
const kuromoji = require('kuromoji');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();
// 适配 Render 动态端口
const port = process.env.PORT || 3000;

app.use(express.json());

// 1. 核心修复：显式指向静态目录并处理首页路由
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 2. 初始化分词器
let tokenizer = null;
const dicPath = path.join(__dirname, 'node_modules', 'kuromoji', 'dict');
kuromoji.builder({ dicPath: dicPath }).build((err, t) => {
    if (err) console.error('Kuromoji 初始化失败:', err);
    else {
        tokenizer = t;
        console.log('分词器初始化成功，可以处理请求');
    }
});

// 3. 注音接口
app.post('/furigana', (req, res) => {
    const text = req.body.text;
    if (!tokenizer) return res.status(500).json({ error: '分词器未就绪' });
    try {
        const tokens = tokenizer.tokenize(text || "");
        let html = '';
        tokens.forEach(token => {
            const surface = token.surface_form;
            const reading = token.reading;
            // 仅对包含汉字的词进行注音并转换为平假名
            if (reading && reading !== surface && /[\u4e00-\u9fa5]/.test(surface)) {
                const furi = reading.replace(/[\u30a1-\u30f6]/g, m => String.fromCharCode(m.charCodeAt(0) - 0x60));
                html += `<ruby>${surface}<rt>${furi}</rt></ruby>`;
            } else {
                html += surface;
            }
        });
        res.json({ html });
    } catch (e) {
        res.status(500).send(e.message);
    }
});

// 4. 发音接口：增加连接管理防止 502 错误
app.get('/speak', async (req, res) => {
    const text = req.query.text;
    // 严格限制 500 字，防止恶意高载
    if (!text || text.length > 500) return res.status(400).send("文本过长或为空");

    const endpoint = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4`;
    const ws = new WebSocket(endpoint);
    let audioData = Buffer.alloc(0);

    // 设置连接超时保护
    const timeoutTimer = setTimeout(() => {
        if (ws.readyState !== WebSocket.CLOSED) {
            ws.terminate();
            res.status(504).send("语音合成超时");
        }
    }, 60000); // 60秒强制切断

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
            const index = data.indexOf(Buffer.from([0x50, 0x61, 0x74, 0x68