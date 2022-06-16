import WebSocket from 'ws'
import * as googleTTS from 'google-tts-api'
import fetch from 'node-fetch'
import { baseURL, qq, verifyKey, screenshotToken, xiongyue, acid, setu } from './config/config.js'
import { scheduleJob } from 'node-schedule'

const ws = new WebSocket(`ws://${baseURL}/message?verifyKey=${verifyKey}&qq=${qq}`);

ws.on('message', (data) => {
    let msg = JSON.parse(data.toString())
    // console.log(JSON.stringify(msg, null, 2))
    if (msg.data && msg.data.type == "GroupMessage") {
        let groupID = msg.data.sender.group.id //群号
        // let senderID = msg.data.sender.id //发送者QQ号
        let text = msg.data.messageChain[1].text //
        console.log(msg.data.messageChain)
        if (/^#hi$/.test(text)) {
            sendGroupMessage({ target: groupID, messageChain:[{ type:"Plain", text: "我是conixBot😊 基于Mirai-api-http Websocket Adapter🎈\nGithub: https://github.com/wuuconix/conixBot-Node ⭐\n仓库README里有命令使用说明哦💎" }] })
        } else if (/^#repeat /.test(text)) {
            const content = text.slice(8)
            const otherMsgChain = msg.data.messageChain.slice(2)
            sendGroupMessage({ target: groupID, messageChain:[{ type:"Plain", text: content }, ...otherMsgChain] })
        } else if (/^#img /.test(text)) {
            const url = text.split(" ")[1]
            sendGroupMessage({ target: groupID, messageChain:[{ type:"Image", url }] })
        } else if (/^#say /.test(text)) {
            const content = text.slice(5)
            const url = googleTTS.getAudioUrl(content, { lang: 'zh', slow: false, host: 'https://translate.google.com' })
            sendGroupMessage({ target: groupID, messageChain:[{ type:"Voice", url }] })
        } else if (/^#nslookup /.test(text)) {
            const target = text.split(" ")[1].replace("https://", "").replace("http://", "").split("/")[0]
            const url = `http://ip-api.com/json/${target}?lang=zh-CN`
            fetch(url).then(res => res.json()).then(result => {
                let response = ""
                if (result.status == "fail") {
                    response = `IP: ${result['query']}\n获取地址失败: ${result['message']}`
                } else {
                    response = `IP: ${result['query']}\n国家: ${result['country']}\n城市: ${result['regionName']}${result['city']}\nISP: ${result['isp']}\n组织: ${result['org']}`
                }
                sendGroupMessage({ target: groupID, messageChain:[{ type:"Plain", text:response }] })
            })
        } else if (/^#site /.test(text)) {
            const site = encodeURIComponent(text.split(" ")[1]) //url-encode后的网址
            const full = text.split(" ")[2] == "full" ? "&full_page=true" : ""
            let token
            if (/conix/.test(site)) { //自己的网址使用自己的token
                token = screenshotToken[0]
            } else { //其他的用白嫖的token
                token = screenshotToken[Math.floor(Math.random() * (screenshotToken.length - 1)) + 1] //从众多token中选择一个token
            }
            console.log(`使用token: ${token}`)
            const url = `https://shot.screenshotapi.net/screenshot?token=${token}&url=${site}&width=1920&height=1080&fresh=true&output=image&file_type=png&wait_for_event=load${full}`
            console.log(url)
            sendGroupMessage({ target: groupID, messageChain:[{ type:"Image", url }] })
        } else if (/^#music /.test(text)) {
            const songId = text.split(" ")[1]
            const url = `https://api.injahow.cn/meting/?type=song&id=${songId}`
            fetch(url).then(res => res.json()).then(res => {
                console.log(res)
                if (res.error) {
                    sendGroupMessage({ target: groupID, messageChain:[{ type:"Plain", text: res.error }] })
                } else {
                    let [{name, artist, url, pic}] = res
                    fetch(pic, { redirect: "manual" }).then(res => {
                        pic = res.headers.get("location") //手动获得真实的url不然显示不出图片
                        sendGroupMessage({ target: groupID, messageChain:[{
                            type: 'MusicShare', kind: 'NeteaseCloudMusic',
                            title: name, summary: artist,
                            jumpUrl: url, pictureUrl: pic,
                            musicUrl: url, brief: `${name}`}]
                        })
                    })
    
                }
            })
        } else if (/^#b23 /.test(text)) {
            const bvid = text.split(" ")[1]
            const url = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`
            console.log(url)
            fetch(url).then(res => res.json()).then(res => {
                console.log(res)
                if (res.code == 0) { //正常
                    const {pic, title, owner: {name: up}} = res.data
                    sendGroupMessage({ target: groupID, messageChain:[{
                        type: 'MusicShare', kind: 'NeteaseCloudMusic',
                        title, summary: up,
                        jumpUrl: `https://www.bilibili.com/video/${bvid}`, pictureUrl: pic,
                        musicUrl: "https://api.injahow.cn/meting/?server=netease&type=url&id=591321", brief: `${title}`}]
                    })
                } else {
                    sendGroupMessage({ target: groupID, messageChain:[{ type:"Plain", text: "BV号错误" }] })
                }
            }).catch(e => {
                sendGroupMessage({ target: groupID, messageChain:[{ type:"Plain", text: e }] })
            })
        }
    }
})

const sendGroupMessage = (content) => {
    ws.send(JSON.stringify({
        syncId: 114514,
        command: "sendGroupMessage", // 命令字
        subCommand: null,
        content
    }))
}

//每天定时任务
scheduleJob('0 8 * * *', () => {
    sendGroupMessage({ target: xiongyue, messageChain:[{ type:"Plain", text: "起床啦兄弟们，来张涩图清醒清醒"}, { type: "Image", url: setu }] })
    console.log("bingo 每日起床铃发送成功")
})

scheduleJob('0 17 * * *', () => {
    sendGroupMessage({ target: xiongyue, messageChain:[{ type:"Plain", text: `兄弟们，准备做核酸啦\n${acid} 填写问卷`}] })
    console.log("bingo 每日核酸发送成功")
})