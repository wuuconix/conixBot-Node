import WebSocket from 'ws'
import { baseURL, qq, verifyKey, xiongyue, acid, setu } from './config/config.js'
import { scheduleJob } from 'node-schedule'

const ws = new WebSocket(`ws://${baseURL}/message?verifyKey=${verifyKey}&qq=${qq}`);

scheduleJob('* 8 * * *', () => {
    sendGroupMessage({ target: xiongyue, messageChain:[{ type:"Plain", text: "起床啦兄弟们，来张涩图清醒清醒"}, { type: "Image", url: setu }] })
    console.log("bingo 每日起床铃发送成功")
})

scheduleJob('* 17 * * *', () => {
    sendGroupMessage({ target: xiongyue, messageChain:[{ type:"Plain", text: `兄弟们，准备做核酸啦\n${acid} 填写问卷`}] })
    console.log("bingo 每日核酸发送成功")
})

const sendGroupMessage = (content) => {
    ws.send(JSON.stringify({
        syncId: 614,
        command: "sendGroupMessage", // 命令字
        subCommand: null,
        content
    }))
}