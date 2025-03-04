//使用原生AJAX调用cozeAPI

// 定义常量，类似于C语言的宏定义
const AUTH_TOKEN = 'Bearer 请在此输入您的Token';
const BOT_ID = '请在此输入您的BotID';
const USER_ID = '请在此输入您的UserID';
const CONTENT_TYPE = 'application/json';

// 通用的请求状态处理函数
function handleReadyStateChange(xhr, callback) {
    return function() {
        if (xhr.readyState === 0) {
            console.log('请求未初始化');
        } else if (xhr.readyState === 1) {
            console.log('服务器连接已建立');
        } else if (xhr.readyState === 2) {
            console.log('请求已接收');
        } else if (xhr.readyState === 3) {
            console.log('正在处理请求');
        } else if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                //把json字符串转换为对象格式
                const response = JSON.parse(xhr.responseText);
                callback(null, response); // 回调函数返回结果
            } else {
                console.error('Error:', xhr.status, xhr.responseText);
                callback(new Error(`请求失败: ${xhr.status}`));
            }
        }
    };
}

// 第一步：创建会话
function createConversation(callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://api.coze.cn/v1/conversation/create');
    xhr.setRequestHeader('Content-Type', CONTENT_TYPE);
    xhr.setRequestHeader('Authorization', AUTH_TOKEN);

    xhr.onreadystatechange = handleReadyStateChange(xhr, function(err, response) {
        if (!err) {
            console.log('创建会话成功:', response);
        }
        callback(err, response);
    });
    
    // 如果API需要请求体，则添加，但是在我的测试阶段不需要
    const requestBody = {
        // API所需参数
    };
    xhr.send(JSON.stringify(requestBody));
}

// 第二步：创建对话
function createChat(conversation_id, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.coze.cn/v3/chat?conversation_id=${conversation_id}`);
    //设置请求头
    xhr.setRequestHeader('Content-Type', CONTENT_TYPE);
    xhr.setRequestHeader('Authorization', AUTH_TOKEN);

    const requestBody = {
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
    };

    xhr.onreadystatechange = handleReadyStateChange(xhr, function(err, response) {
        if (!err) {
            console.log('对话创建成功:', response);
        }
        callback(err, response);
    });
    xhr.send(JSON.stringify(requestBody));
}

// 第四步：轮询检查是否返回信息
function polling(conversation_id, chat_id, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `https://api.coze.cn/v3/chat/retrieve?chat_id=${chat_id}&conversation_id=${conversation_id}`);
   
    xhr.setRequestHeader('Authorization', AUTH_TOKEN);
    xhr.setRequestHeader('Content-Type', CONTENT_TYPE);

    xhr.onreadystatechange = handleReadyStateChange(xhr, function(err, response) {
        if (!err) {
            console.log('轮询结果:', response);
        }
        callback(err, response);
    });
    xhr.send();
}

// 查询消息列表
function getMessageList(conversation_id, chat_id, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `https://api.coze.cn/v3/chat/message/list?chat_id=${chat_id}&conversation_id=${conversation_id}`);
    xhr.setRequestHeader('Content-Type', CONTENT_TYPE);
    xhr.setRequestHeader('Authorization', AUTH_TOKEN);
    
    xhr.onreadystatechange = handleReadyStateChange(xhr, function(err, response) {
        if (!err) {
            console.log('消息列表:', response);
        }
        callback(err, response);
    });
    xhr.send();
}

// 第五步：测试轮询
createConversation(function(err, response) {
    if (err) {
        console.error('创建会话失败:', err);
        return;
    }
    
    const conversation_id = response.data.id;
    console.log('使用conversationID:', conversation_id);
    createChat(conversation_id, function(err, chatResponse) {
        if (err) {
            console.error('创建对话失败:', err);
            return;
        }
        
        const chat_id = chatResponse.data.id;
        console.log('使用chatID:', chat_id);
        
        let timer = setInterval(function() {
            polling(conversation_id, chat_id, function(err, pollingResponse) {
                if (err) {
                    console.error('轮询失败:', err);
                    return;
                }
                
                console.log('轮询状态:', pollingResponse.data.status);
                // 如果状态是"completed"，则对话已完成
                if (pollingResponse.data.status === 'completed') {
                    console.log('对话已完成，结果:', pollingResponse.data);
                    clearInterval(timer); // 停止轮询
                    
                    // 获取消息列表
                    getMessageList(conversation_id, chat_id, function(err, messagesResponse) {
                        if (err) {
                            console.error('获取消息列表失败:', err);
                            return;
                        }
                        console.log('回复内容:', messagesResponse);
                    });
                } else if (pollingResponse.data.status === 'failed') {
                    console.log('对话失败:', pollingResponse.data.last_error);
                    clearInterval(timer); // 失败也停止轮询
                }
            });
        }, 1000); // 每秒轮询一次
    });
});

