import WebSocket from 'ws'
import { baseURL, qq, verifyKey, xiongyue } from './config/config.js'
import { scheduleJob } from 'node-schedule'

const ws = new WebSocket(`ws://${baseURL}/message?verifyKey=${verifyKey}&qq=${qq}`);

scheduleJob('* * * * *', () => {
    sendGroupMessage({ target: xiongyue, messageChain:[{ type:"Plain", text: "定时图片发送测试 1/min" }, { type: "Image", url: "https://conix.ml" }] })
})

const sendGroupMessage = (content) => {
    ws.send(JSON.stringify({
        syncId: 614,
        command: "sendGroupMessage", // 命令字
        subCommand: null,
        content
    }))
}