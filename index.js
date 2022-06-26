import WebSocket from 'ws'
import * as googleTTS from 'google-tts-api'
import fetch from 'node-fetch'
import { baseURL, qq, verifyKey, screenshotToken, xiongyue, acid, setu, smileURI, banImgURI, setuAPI, testGroup } from './config/config.js'
import { scheduleJob } from 'node-schedule'

const ws = new WebSocket(`ws://${baseURL}/all?verifyKey=${verifyKey}&qq=${qq}`)

ws.on('message', (data) => {
    let msg = JSON.parse(data.toString())
    console.log(msg)
    if (msg.syncId == '-1' && msg.data) { //syncId -1 系统消息/事件
        if (msg.data.type == "GroupMessage" && msg.data.messageChain.length >= 2) {
            handleGroupMessage(msg)
        } else if (msg.data.type == "MemberCardChangeEvent") {
            const { origin, current, member: {id: memberId, group: {id: groupId}} } = msg.data
            sendGroupMessage({ target: groupId, messageChain:[{ type: "At", target: memberId }, { type:"Plain", text: `\n检测到昵称变化\n${origin} -->  ${current}` }] })
        }
    } else if (msg.syncId == '114514') { //syncId 114514 机器人发送的消息
        if (msg.data.code != 0) {
            sendGroupMessage({ target: testGroup, messageChain:[{ type:"Plain", text: msg.data.msg }] })
        } else if (msg.data.messageId == -1) { //messageId 可能表示被腾讯服务器屏蔽了
            sendGroupMessage({ target: testGroup, messageChain:[{ type: "Plain", text: "被腾讯ban了" }] })
        }
    }
})

/* 处理群消息 */
const handleGroupMessage = async (msg) => {
    let groupID = msg.data.sender.group.id //群号
    let text = msg.data.messageChain[1].text //查看消息链的第一个消息的文本
    console.log(msg.data.messageChain)
    if (/^#hi$/.test(text)) {
        sendGroupMessage({ target: groupID, messageChain:[{ type:"Plain", text: "我是conixBot😊 基于Mirai-api-http Websocket Adapter🎈\nGithub: https://github.com/wuuconix/conixBot-Node ⭐\n仓库README里有命令使用说明哦💎" }] })
    } else if (/^#repeat /.test(text)) {
        const content = text.slice(8)
        const otherMsgChain = msg.data.messageChain.slice(2)
        sendGroupMessage({ target: groupID, messageChain:[{ type:"Plain", text: content }, ...otherMsgChain] })
    } else if (/^#img /.test(text)) {
        const urls = text.split(" ")
        for (let i = 1; i < urls.length; i++) {
            sendGroupMessage({ target: groupID, messageChain:[{ type:"Image", url: urls[i] }] })
        }
    } else if (/^#say /.test(text)) {
        const content = text.slice(5)
        if (content == "笑") {
            sendGroupMessage({ target: groupID, messageChain:[{ type:"Voice", url: smileURI }] })
        } else {
            const url = googleTTS.getAudioUrl(content, { lang: 'zh', slow: false, host: 'https://translate.google.com' })
            sendGroupMessage({ target: groupID, messageChain:[{ type:"Voice", url }] })
        }
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
    } else if (/^#setu/.test(text)) {
        const search = text.split(" ")[1] ?? ""
        const apiURI = new URL(setuAPI)
        apiURI.search = new URLSearchParams(search).toString()
        console.log(apiURI)
        try {
            let res = await fetch(apiURI)
            res = await res.json()
            for (const {urls: { original: url}} of res.data) {
                sendGroupMessage({ target: groupID, messageChain:[{ type: "Image", url }] })
            }
        } catch(e) {
            sendGroupMessage({ target: testGroup, messageChain:[{ type:"Plain", text: e }] })
        }
    }
}

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
    sendGroupMessage({ target: xiongyue, messageChain:[{ type:"Plain", text: "起床啦兄弟们，来张涩图清醒清醒"}] })
    sendGroupMessage({ target: xiongyue, messageChain:[{ type: "Image", url: setu }] })
    console.log("bingo 每日起床铃发送成功")
})

scheduleJob('0 17 * * *', () => {
    const day = new Date().getDate()
    if (day % 2 == 0) { //偶数天做核算
        sendGroupMessage({ target: xiongyue, messageChain:[{ type:"Plain", text: `兄弟们，准备做核酸啦\n${acid} 填写问卷`}] })
        console.log("bingo 每日核酸发送成功")
    } else {
        sendGroupMessage({ target: xiongyue, messageChain:[{ type:"Plain", text: `兄弟们，今天没有核酸!`}] })
        sendGroupMessage({ target: xiongyue, messageChain:[{ type: "Image", url: setu }] })
        console.log("bingo 没有核酸发送成功")
    }
})