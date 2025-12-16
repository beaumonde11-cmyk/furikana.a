document.addEventListener('DOMContentLoaded', () => {
    // 统一使用主输入框
    const inputField = document.getElementById('japanese-input');
    
    // 注音按钮和结果框
    const annotateButton = document.getElementById('annotate-button');
    const resultBox = document.getElementById('result-box'); 
    
    // 翻译按钮和结果框 (假设您的翻译输出框 ID 仍为 chinese-output)
    const translateButton = document.getElementById('translate-button');
    const outputDiv = document.getElementById('chinese-output'); 

    // --- 1. 注音功能 ---
    const fetchAnnotation = async () => {
        const text = inputField.value.trim();
        if (!text) {
            resultBox.innerHTML = "请输入日文文本。";
            return;
        }

        resultBox.innerHTML = "正在处理注音...";
        annotateButton.disabled = true;

        try {
            // 向后端定义的 /furigana 路由发送 POST 请求
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
            
            // 显示注音结果
            resultBox.innerHTML = data.html; 

        } catch (error) {
            console.error('注音请求失败:', error);
            resultBox.innerHTML = `注音处理失败。错误信息: ${error.message}`;
        } finally {
            annotateButton.disabled = false;
        }
    };

    // --- 2. 翻译功能 ---
    const translateJapanese = async () => {
        // 从主输入框获取文本
        const text = inputField.value.trim(); 
        
        if (!text) {
            outputDiv.innerHTML = '请输入文本！';
            return;
        }

        outputDiv.innerHTML = '正在调用翻译服务...';
        translateButton.disabled = true;

        // 使用 Google Translate API 的公共接口进行翻译
        const sourceLang = 'ja'; 
        const targetLang = 'zh-CN'; 
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                 throw new Error(`Google API 错误！状态码: ${response.status}`);
            }
            
            const data = await response.json();
            
            // 解析翻译结果
            const translatedText = data[0].map(segment => segment[0]).join('');

            // 显示翻译结果
            outputDiv.innerHTML = `**中文翻译:**<br>${translatedText}`;

        } catch (error) {
            outputDiv.innerHTML = '翻译失败。请检查网络连接。';
            console.error('Fetch error:', error);
        } finally {
            translateButton.disabled = false;
        }
    };

    // 绑定事件
    annotateButton.addEventListener('click', fetchAnnotation);
    if (translateButton) {
        translateButton.addEventListener('click', translateJapanese);
    }
    
    // 可选：允许在主输入框按 Enter 键时执行注音
    inputField.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); 
            fetchAnnotation();
        }
    });
});