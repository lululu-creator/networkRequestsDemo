// 使用fetchAPI调用cozeAPI

const AUTH_TOKEN = 'Bearer 请在此输入您的Token';
const BOT_ID = '请在此输入您的BotID';
const USER_ID = '请在此输入您的UserID';
const CONTENT_TYPE = 'application/json';

// 定义fetchAPI的请求头
const headers = {
    'Content-Type': 'application/json',
    'Authorization': AUTH_TOKEN
}; 

// 第一步：创建会话
async function createConversation() {
    try {
        const response = await fetch('https://api.coze.cn/v1/conversation/create', {
            method: 'POST',
            headers: headers
        });
        console.log('创建会话成功:', response);
        return response;
    } catch (error) {
        console.error('创建会话失败:', error);
        throw error;
    }
}

// 第二步：创建对话
async function createChat(conversation_id) {
    try {
        const response = await fetch(`https://api.coze.cn/v3/chat?conversation_id=${conversation_id}`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                "bot_id": BOT_ID,
                "user_id": USER_ID,
                "stream": false,
                "auto_save_history": true,
                "additional_messages": [
                    {
                        "role": "user",
                        "content": "今天杭州天气如何",
                        "content_type": "text"
                    }
                ]
            })
        });
        console.log('创建对话成功:', response);
        return response;
    } catch (error) {
        console.error('创建对话失败:', error);
        throw error;
    }
}

// 第三步：轮询检查是否返回信息
async function polling(conversation_id, chat_id) {
    try {
        const response = await fetch(`https://api.coze.cn/v3/chat/retrieve?conversation_id=${conversation_id}&chat_id=${chat_id}`, {
            method: 'GET',
            headers: headers
        });
        console.log('轮询成功:', response);
        return response;
    } catch (error) {
        console.error('轮询失败:', error);
        throw error;
    }
}

// 第四步：获取消息列表 
async function getMessageList(conversation_id, chat_id) {
    try {
        const response = await fetch(`https://api.coze.cn/v3/chat/message/list?conversation_id=${conversation_id}&chat_id=${chat_id}`, {
            method: 'GET',
            headers: headers
        });
        console.log('获取消息列表成功:', response);
        return response;
    } catch (error) {
        console.error('获取消息列表失败:', error);
        throw error;
    }
}

// 声明外部变量，在整个Promise链中共享
let conversation_id;
let chat_id;

// 使用正确的轮询实现
async function pollUntilComplete(conv_id, ch_id, maxAttempts = 10) {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        attempts++;
        console.log(`轮询次数: ${attempts}`);
        
        const response = await polling(conv_id, ch_id);
        const data = await response.json();
        
        if (data.data.status === 'completed') {
            console.log('对话已完成');
            return data;
        } else if (data.data.status === 'failed') {
            console.error('对话失败:', data.data.last_error || '未知错误');
            throw new Error('对话失败');
        }
        
        // 等待2秒再次轮询
        console.log('对话进行中，等待2秒后再次轮询...');
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('轮询超过最大尝试次数');
}

// 主函数 - 使用 async/await 风格
async function main() {
    try {
        // 第一步：创建会话
        const convResponse = await createConversation();
        const convData = await convResponse.json();
        conversation_id = convData.data.id;
        console.log('获取到conversation_id:', conversation_id);
        
        // 第二步：创建对话
        const chatResponse = await createChat(conversation_id);
        const chatData = await chatResponse.json();
        chat_id = chatData.data.id;
        console.log('获取到chat_id:', chat_id);
        
        // 第三步：轮询直到完成
        await pollUntilComplete(conversation_id, chat_id);
        
        // 第四步：获取消息列表
        const msgResponse = await getMessageList(conversation_id, chat_id);
        const msgData = await msgResponse.json();
        console.log('消息列表:', msgData);
        
        // 可以在这里处理最终的消息数据
    } catch (error) {
        console.error('出错了:', error);
    }
}

// 调用主函数
main();
