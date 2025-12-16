// public/script.js

document.addEventListener('DOMContentLoaded', () => {
    const inputField = document.getElementById('japanese-input');
    const annotateButton = document.getElementById('annotate-button');
    const resultBox = document.getElementById('result-box');

    // 核心函数：发送请求到后端
    const fetchAnnotation = async () => {
        const text = inputField.value.trim();
        if (!text) {
            resultBox.innerHTML = "请输入日文文本。";
            return;
        }

        resultBox.innerHTML = "正在处理中...";
        annotateButton.disabled = true;

        try {
            // 向后端定义的 /api/annotate 路由发送 POST 请求
            const response = await fetch('/api/annotate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: text })
            });

            if (!response.ok) {
                // 如果 HTTP 状态码不是 200 范围，抛出错误
                throw new Error(`HTTP 错误！状态码: ${response.status}`);
            }

            const data = await response.json();
            
            // 将后端返回的 HTML 字符串（包含 <ruby> 标签）插入到结果区域
            resultBox.innerHTML = data.html; 

        } catch (error) {
            console.error('标注请求失败:', error);
            resultBox.innerHTML = `处理失败。请检查后端服务器是否正在运行。错误信息: ${error.message}`;
        } finally {
            annotateButton.disabled = false;
        }
    };

    // 事件监听 1: 点击按钮
    annotateButton.addEventListener('click', fetchAnnotation);

    // 事件监听 2: 监听 Enter 键
    inputField.addEventListener('keydown', (event) => {
        // 检查是否是 Enter 键，并且不是 Shift + Enter（通常用于换行）
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // 阻止默认的换行行为
            fetchAnnotation();
        }
    });
});
async function translateJapanese() {
    const text = document.getElementById('japanese-input-translate').value;
    const outputDiv = document.getElementById('chinese-output');
    outputDiv.innerHTML = '正在翻译...';

    try {
        const response = await fetch('/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });

        const data = await response.json();

        if (data.error) {
            outputDiv.innerHTML = `翻译错误: ${data.error}`;
        } else {
            outputDiv.innerHTML = `中文翻译: ${data.translation}`;
        }

    } catch (error) {
        outputDiv.innerHTML = '网络请求失败。';
    }
}
async function translateJapanese() {
    const text = document.getElementById('japanese-input-translate').value;
    const outputDiv = document.getElementById('chinese-output');
    
    if (!text.trim()) {
        outputDiv.innerHTML = '请输入文本！';
        return;
    }

    outputDiv.innerHTML = '正在调用翻译服务...';

    try {
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