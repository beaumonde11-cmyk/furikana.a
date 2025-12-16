// 导入所需模块
const express = require('express');
const path = require('path');
const kuromoji = require('kuromoji'); // 用于日文分词和注音

// --- 移除所有翻译库的 require --- 
// const translate = require('...');
// const BaiduTranslate = require('...'); 
// ----------------------------------

const app = express();
const port = process.env.PORT || 3000; // 监听的端口

// 确保 Express 可以解析 JSON 格式的请求体
app.use(express.json());

// 静态文件服务：将 'public' 目录设置为静态资源目录
app.use(express.static(path.join(__dirname, 'public')));

// Kuromoji 构建器（只需要初始化一次）
let tokenizer = null;

kuromoji.builder({ dicPath: 'node_modules/kuromoji/dict' }).build((err, t) => {
    if (err) {
        console.error('Kuromoji Initialization Error:', err);
        return;
    }
    tokenizer = t;
    console.log('Kuromoji tokenizer initialized.');

    // Kuromoji 初始化成功后，启动 Express 服务器
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
});

// 根路由：返回 index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Furigana 注音转换 API 路由
app.post('/furigana', (req, res) => {
    if (!tokenizer) {
        return res.status(503).json({ error: 'Furigana service is not ready.' });
    }

    const japaneseText = req.body.text;
    if (!japaneseText) {
        return res.status(400).json({ error: 'Missing Japanese text for Furigana conversion.' });
    }

    try {
        const tokens = tokenizer.tokenize(japaneseText);
        let resultHtml = '';

        tokens.forEach(token => {
            const surface = token.surface_form;
            const reading = token.reading; // 片假名读音

            // 检查是否是汉字且有平假名读音
            if (token.pos === '名詞' || token.pos === '動詞' || token.pos === '形容詞' || token.pos === '副詞') {
                 if (reading && reading !== surface) {
                    // 将片假名转换为平假名 (Furigana)
                    const furigana = reading.replace(/[\u30a1-\u30f6]/g, function(match) {
                        const code = match.charCodeAt(0) - 0x60;
                        return String.fromCharCode(code);
                    });
                    
                    // 使用 <ruby> 标签格式化
                    resultHtml += `<ruby>${surface}<rt>${furigana}</rt></ruby>`;
                    return;
                }
            }
            // 否则，直接添加原始文本
            resultHtml += surface;
        });

        res.json({ html: resultHtml });

    } catch (error) {
        console.error('Furigana conversion error:', error);
        res.status(500).json({ error: 'Furigana conversion failed.' });
    }
});

// --- 移除 /translate 路由（由前端直接处理） ---
// app.post('/translate', async (req, res) => { ... });
// --------------------------------------------------

// 导出 app 实例（如果需要）
// module.exports = app;