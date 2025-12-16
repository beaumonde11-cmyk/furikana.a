document.addEventListener('DOMContentLoaded', () => {
    const inputField = document.getElementById('japanese-input');
    const annotateButton = document.getElementById('annotate-button');
    const resultBox = document.getElementById('result-box');

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
});

async function translateJapanese() {
    const text = document.getElementById('japanese-input-translate').value;
    const outputDiv = document.getElementById('chinese-output');
    
    if (!text.trim()) {
        outputDiv.innerHTML = '请输入文本！';
        return;
    }

    outputDiv.innerHTML = '正在调用翻译服务...';

    try {
        // 由于后端已移除 /translate 路由，此请求将失败，但我们保持代码结构
        const response = await fetch('/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });

        const data = await response.json();

        if (response.ok) {
            outputDiv.innerHTML = `**中文翻译:**<br>${data.translation}`;
        } else {
            outputDiv.innerHTML = `翻译失败: ${data.error || '未知错误'}`;
        }

    } catch (error) {
        outputDiv.innerHTML = '网络请求失败或服务器无响应。';
        console.error('Fetch error:', error);
    }
}