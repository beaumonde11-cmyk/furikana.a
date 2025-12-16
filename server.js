// server.js

const express = require('express');
const kuromoji = require('kuromoji');
const path = require('path');

const app = express();
const port = 3000;

// 中间件：允许 Express 解析 JSON 请求体
app.use(express.json()); 

// 中间件：服务静态文件（让用户可以访问 public 文件夹里的 index.html 和 script.js）
app.use(express.static(path.join(__dirname, 'public')));

let tokenizer = null; // 用于存储 Kuromoji 分词器实例

// --- 1. 初始化 Kuromoji 分词器 ---
// Kuromoji 需要加载词典，这是一个异步操作，只应执行一次
kuromoji.builder({ dicPath: "node_modules/kuromoji/dict" }).build(function (err, _tokenizer) {
    if (err) {
        console.error("Kuromoji 初始化失败:", err);
        return;
    }
    tokenizer = _tokenizer;
    console.log("Kuromoji 分词器加载成功。");
    // 日文到中文翻译 API
app.post('/translate', async (req, res) => {
    // 假设客户端发送的 JSON 格式是 { "text": "日文文本" }
    const japaneseText = req.body.text; 

    if (!japaneseText) {
        return res.status(400).json({ error: 'Missing Japanese text for translation.' });
    }

    try {
        // 调用新的翻译库：从 'ja' (日文) 翻译到 'zh-cn' (简体中文)
        // 注意：这个库的调用返回格式，我们直接解构 { text }
        const { text } = await translate(japaneseText, { from: 'ja', to: 'zh-cn' });
        
        // 成功返回翻译结果
        res.json({ translation: text });

    } catch (error) {
        console.error('Translation API error:', error);
        res.status(500).json({ error: 'Failed to perform translation via third-party API. Check server logs.' });
    }
});

// ... (其他路由和 app.listen 语句)

    // 词典加载完成后，才启动服务器
    app.listen(port, () => {
        console.log(`服务器启动在 http://localhost:${port}`);
    });
});

// --- 2. 假名标注 API 路由 ---
app.post('/api/annotate', (req, res) => {
    if (!tokenizer) {
        return res.status(503).json({ error: "分词器尚未加载完成。" });
    }

    const { text } = req.body;

    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: "请求体中需要包含 'text' 字段。" });
    }

    // 使用 Kuromoji 进行分词
    const tokens = tokenizer.tokenize(text);

    let annotatedHtml = '';

    // 遍历分词结果，构建带 <ruby> 标签的 HTML
    for (const token of tokens) {
        const surface = token.surface_form; // 原始文本 (汉字或假名)
        const reading = token.reading;      // 读音 (全大写片假名)
        const partOfSpeech = token.pos;     // 词性

        // 符号、助词、助动词、接尾词等通常不需要标注，直接保留原始文本
        if (partOfSpeech === '記号' || partOfSpeech === '助詞' || partOfSpeech === '助動詞' || partOfSpeech === '接尾辞') {
            annotatedHtml += surface;
        } else if (reading && reading !== '*') {
            // 将片假名读音转换为平假名，用于标注
            const hiraganaReading = katakanaToHiragana(reading);

            // 构建 <ruby> 标签：<ruby>主词<rt>注音</rt></ruby>
            annotatedHtml += `<ruby>${surface}<rt>${hiraganaReading}</rt></ruby>`;
        } else {
            // 其他情况（如英文、特殊名词等），直接添加原始文本
            annotatedHtml += surface;
        }
    }

    // 返回带 <ruby> 标签的 HTML
    res.json({ html: annotatedHtml });
});


// 辅助函数：将片假名转换为平假名
function katakanaToHiragana(katakana) {
    return katakana.replace(/[\u30a1-\u30f6]/g, function(match) {
        // 片假名的 Unicode 编码减去 0x60 即可得到对应的平假名编码
        const charCode = match.charCodeAt(0) - 0x60;
        return String.fromCharCode(charCode);
    });
}
app.post('/translate', async (req, res) => {
    const japaneseText = req.body.text;

    if (!japaneseText) {
        return res.status(400).json({ error: 'Missing Japanese text' });
    }

    try {
        // **这里是调用实际翻译 API 的代码**
        // 假设我们使用一个名为 translateText 的函数
        const translatedText = await translateText(japaneseText, 'zh'); // 目标语言设为中文 'zh'

        res.json({ translation: translatedText });

    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({ error: 'Failed to perform translation' });
    }
})
const translate = require('@vitalets/google-translate-api');
// ... 其他 require 语句（如 express, path 等）