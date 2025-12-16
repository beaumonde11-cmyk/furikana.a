document.addEventListener('DOMContentLoaded', () => {
    const inputField = document.getElementById('japanese-input');
    const annotateButton = document.getElementById('annotate-button');
    const resultBox = document.getElementById('result-box');
    const translateButton = document.getElementById('translate-button'); // 假设您的翻译按钮ID是这个

    const fetchAnnotation = async () => {
        const text = inputField.value.trim();
        if (!text) {
            resultBox.innerHTML = "请输入日文文本。";
            return;
        }

        resultBox.innerHTML = "正在处理中...";
        annotateButton.disabled = true;

        try {
            // 修正后的路由：必须与 server.js 中的 app.post('/furigana') 匹配
            const response = await fetch('/furigana', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: text })
            });

            if (!response.ok) {
                throw new Error(`HTTP 错误！状态码: ${response.status}`);
            }

            const data = await response.json();
            
            resultBox.innerHTML = data.html; 

        } catch (error) {
            console.error('标注请求失败:', error);
            resultBox.innerHTML = `处理失败。请检查后端服务器是否正在运行。错误信息: ${error.message}`;
        } finally {
            annotateButton.disabled = false;
        }
    };

    annotateButton.addEventListener('click', fetchAnnotation);

    inputField.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            fetchAnnotation();
        }
    });

    // 绑定翻译按钮事件
    if (translateButton) {
        translateButton.addEventListener('click', translateJapanese);
    }
});

async function translateJapanese() {
    const text = document.getElementById('japanese-input-translate').value;
    const outputDiv = document.getElementById('chinese-output');
    
    if (!text.trim()) {
        outputDiv.innerHTML = '请输入文本！';
        return;
    }

    outputDiv.innerHTML = '正在调用翻译服务...';

    // 使用 Google Translate API 的公共接口进行翻译 (纯前端实现)
    const sourceLang = 'ja'; // 源语言：日语
    const targetLang = 'zh-CN'; // 目标语言：简体中文
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
             throw new Error(`Google API 错误！状态码: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Google API 返回的数据结构是嵌套数组
        // 翻译结果在 data[0][0][0]
        const translatedText = data[0].map(segment => segment[0]).join('');

        outputDiv.innerHTML = `**中文翻译:**<br>${translatedText}`;

    } catch (error) {
        outputDiv.innerHTML = '翻译失败。请检查网络连接。';
        console.error('Fetch error:', error);
    }
}