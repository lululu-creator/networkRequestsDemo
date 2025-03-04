const AUTH_TOKEN = 'Bearer 请在此输入您的Token';
const BOT_ID = '请在此输入您的BotID';
const USER_ID = '请在此输入您的UserID';
const CONTENT_TYPE = 'application/json';

const v1=axios.create({
    baseURL:'https://api.coze.cn/v1',
    headers:{
        'Content-Type': 'application/json',
        'Authorization': AUTH_TOKEN
    }
})

const v3=axios.create({
    baseURL:'https://api.coze.cn/v3',
    headers:{
        'Content-Type': 'application/json',
        'Authorization': AUTH_TOKEN 
    }
})

// 第一步：创建会话,此处使用async/await
async function createConversation() {
    try {
        const response = await v1.post('/conversation/create');
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
        const response = await v3.post(`/chat?conversation_id=${conversation_id}`,{
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
        });
        console.log('创建对话成功:', response);
        return response;
    } catch (error) {
        console.error('创建对话失败:', error);
        throw error;
    }
}

async function polling(conversation_id, chat_id) {
    try {
        const response = await v3.get(`/chat/retrieve?conversation_id=${conversation_id}&chat_id=${chat_id}`);
        console.log('轮询成功:', response);
        return response;
    } catch (error) {
        console.error('轮询失败:', error);
        throw error;
    }
}

async function getMessageList(conversation_id, chat_id) {
    try {
        const response = await v3.get(`/chat/message/list?conversation_id=${conversation_id}&chat_id=${chat_id}`);
        console.log('获取消息列表成功:', response);
        return response;
    } catch (error) {
        console.error('获取消息列表失败:', error);
        throw error;
    }
}

async function main(){
    try {
        const response1 = await createConversation();
        const conversation_id = response1.data.data.id;
        console.log('conversation_id:', conversation_id);
        
        const response2 = await createChat(conversation_id);
        const chat_id = response2.data.data.id;
        console.log('chat_id:', chat_id);
        
        // 使用定时器ID，以便之后能停止轮询
        const intervalId = setInterval(async () => {
            try {
                const response = await polling(conversation_id, chat_id);
                console.log('轮询结果:', response);
                
                // 检查对话是否完成
                if (response.data && response.data.data && response.data.data.status === 'completed') {
                    clearInterval(intervalId);
                    console.log('对话已完成，获取消息列表');
                    
                    const messages = await getMessageList(conversation_id, chat_id);
                    console.log('消息列表:', messages);
                } else if (response.data && response.data.data && response.data.data.status === 'failed') {
                    clearInterval(intervalId);
                    console.error('对话失败:', response.data.data.last_error);
                }
            } catch (err) {
                console.error('轮询过程中出错:', err);
                clearInterval(intervalId);
            }
        }, 1000);
    } catch (error) {
        console.error('出错了:', error);
    }
}

main();