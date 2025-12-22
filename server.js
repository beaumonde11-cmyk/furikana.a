const express = require('express');
const path = require('path');
const kuromoji = require('kuromoji');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let tokenizer = null;
const dicPath = path.join(__dirname, 'node_modules', 'kuromoji', 'dict');
kuromoji.builder({ dicPath: dicPath }).build((err, t) => {
    if (err) console.error('初始化失败:', err);
    else tokenizer = t;
});

app.post('/furigana', (req, res) => {
    const text = req.body.text;
    if (!tokenizer) return res.status(500).json({ error: '分词器未就绪' });
    try {
        const tokens = tokenizer.tokenize(text || "");
        let html = '';
        tokens.forEach(token => {
            const surface = token.surface_form;
            const reading = token.reading;
            if (reading && reading !== surface && /[\u4e00-\u9fa5]/.test(surface)) {
                const furi = reading.replace(/[\u30a1-\u30f6]/g, m => String.fromCharCode(m.charCodeAt(0) - 0x60));
                html += `<ruby>${surface}<rt>${furi}</rt></ruby>`;
            } else html += surface;
        });
        res.json({ html });
    } catch (e) { res.status(500).send(e.message); }
});

app.get('/speak', async (req, res) => {
    const text = req.query.text;
    if (!text || text.length > 500) return res.status(400).send("Text too long");

    const endpoint = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4`;
    const ws = new WebSocket(endpoint);
    let audioData = Buffer.alloc(0);

    const timeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.CLOSED) ws.terminate();
    }, 30000);

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
            clearTimeout(timeout);
            res.set({ 'Content-Type': 'audio/mpeg' });
            res.send(audioData);
            ws.close();
        }
    });

    ws.on('error', () => {
        clearTimeout(timeout);
        if(!res.headersSent) res.status(502).send("Gateway Error");
    });
});

const server = app.listen(port, () => console.log(`Running: http://localhost:${port}`));
server.timeout = 120000;