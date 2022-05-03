import fetch from 'node-fetch'
import * as googleTTS from 'google-tts-api'
import { fileFromPath } from "formdata-node/file-from-path"
import { FormData } from "formdata-node"
import { createWriteStream } from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util'

class Bot {
    constructor () {
        this.baseUrl = "http://127.0.0.1:8080"
        this.qq = "1401840484"
        this.verifyKey = "wuuconix_yyds"
        this.sessionKey = "S8Ab6C1e"
    }

    async verify() { //认证 返回一个session
        let url = new URL(`${this.baseUrl}/verify`)
        let data = { verifyKey: this.verifyKey }
        let session = ""
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
            .then(res => res.json())
            .then(data => { session = data.session})
        return session
    }

    async bind(session) { //绑定 将session与qq绑定
        let url = new URL(`${this.baseUrl}/bind`)
        let data = { sessionKey: session, qq: this.qq }
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
            .then(res => res.json())
            .then(data => {
                if (data.msg == "success")
                    this.sessionKey = session
            })
    }

    async countMessage() {
        let url = new URL(`${this.baseUrl}/countMessage?sessionKey=${this.sessionKey}`)
        let count = 0
        await fetch(url)
            .then(res => res.json())
            .then(data => { count = data.data; console.log(data) })
        return count
    }

    async fetchMessage(count) { //拿到群消息和私法消息
        let url = new URL(`${this.baseUrl}/fetchMessage?sessionKey=${this.sessionKey}&count=${count}`)
        let messageChain = []
        await fetch(url)
            .then(res => res.json())
            .then(data => {
                messageChain = data.data
            })
        return messageChain.filter(x => ["GroupMessage", "FriendMessage"].includes(x.type))
    }

    async sendGroupMessage(target, messageChain) {
        let url = new URL(`${this.baseUrl}/sendGroupMessage`)
        let data = { sessionKey: this.sessionKey,
            target,
            messageChain
        }
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
    }

    async uploadGroupFile(target, fileUrl, fileName) {
        let url = new URL(`${this.baseUrl}/file/upload`)
        const form = new FormData()

        const streamPipeline = promisify(pipeline);
        const response = await fetch(fileUrl);
        if (!response.ok) { //无法fetch对应文件
            this.sendGroupMessage(target, { "type": "Plain", "text": `unexpected response ${response.statusText}`})
            return
        }
        await streamPipeline(response.body, createWriteStream(`/root/conixBot-Node/temp/${fileName}`)) //将响应生成为文件
        form.set("sessionKey", this.sessionKey)
        form.set("type", "group")
        form.set("target", target)
        form.set("path", "")
        form.set("file", await fileFromPath(`/root/conixBot-Node/temp/${fileName}`))
        fetch(url, { method: 'POST', body: form}) //向上传群文件接口发送请求
    }
}

let conixBot = new Bot()
// let session = await conixBot.verify()
// await conixBot.bind(session)
// console.log(session)
setInterval(async () => { //定时器需要设置为async函数
    let count = await conixBot.countMessage()
    if (count > 0) {
        let messages = await conixBot.fetchMessage(count)
        console.log(`接受到${messages.length}条消息`)
        for (let m of messages) {
            let sender = m.sender.group.id //群号
            let messageChain = m.messageChain //分析群友的消息
            let text = messageChain[1].type == "Plain" ? messageChain[1].text : ""
            console.log(`text: ${text}`)
            switch (true) {
                case text.slice(0, 3) == "#hi": {
                    const messageChain = [
                        { "type": "Plain", "text": "Hello World" },
                        { "type":"Image", "url":"https://conix.ml" }
                    ]
                    conixBot.sendGroupMessage(sender, messageChain)
                    console.log(`检测到命令，发送回应`)
                    break
                }
                case text.slice(0, 4) == "#say": {
                    const content = text.slice(5)
                    const url = googleTTS.getAudioUrl(content, {
                        lang: 'zh',
                        slow: false,
                        host: 'https://translate.google.com',
                    });
                    const messageChain = [{ "type": "Voice", url }]
                    conixBot.sendGroupMessage(sender, messageChain)
                    console.log(`检测到命令，发送回应`)
                    break
                }
                case text.slice(0, 4) == "#img": {
                    const url = text.slice(5)
                    const messageChain = [
                        { "type":"Image", url }
                    ]
                    conixBot.sendGroupMessage(sender, messageChain)
                    console.log(`检测到命令，发送回应`)
                    break
                }
                case text.slice(0, 7) == "#upload" && m.sender.id == 1521900139 : { //只能我自己上传
                    const fileUrl = text.split(" ")[1]
                    const fileName = text.split(" ")[2]
                    conixBot.uploadGroupFile(sender, fileUrl, fileName)
                    console.log(`检测到命令，发送回应`)
                    break
                }
                case text.slice(0, 9) == "#nslookup": {
                    let target = text.slice(10)
                    target = target.replace("https://", "")
                    target = target.replace("http://", "")
                    if (target.includes("/")) {
                        target = target.slice(0, target.indexOf("/"))
                    }
                    const url = `http://ip-api.com/json/${target}?lang=zh-CN`
                    let result = null
                    await fetch(url)
                        .then(res => res.json())
                        .then(data => {
                            result = data
                        })
                    console.log(result);
                    let response = ""
                    if (result.status == "fail") {
                        response = `IP: ${result['query']}\n获取地址失败: ${result['message']}`
                    } else {
                        response = `IP: ${result['query']}\n国家: ${result['country']}\n城市: ${result['regionName']}${result['city']}\nISP: ${result['isp']}\n组织: ${result['org']}`
                    }
                    const messageChain = [
                        { "type": "Plain", "text": response },
                    ]
                    conixBot.sendGroupMessage(sender, messageChain)
                    console.log(`检测到命令，发送回应`)
                    break
                }
                case text.slice(0, 5) == "#site": {
                    const site = encodeURIComponent(text.split(" ")[1]) //url-encode后的网址
                    const url = `https://shot.screenshotapi.net/screenshot?token=HCDX662-SPA47Q3-PFHGR99-AVXSFDC&url=${site}&width=1920&height=1080&fresh=true&output=image&file_type=png&wait_for_event=load`
                    console.log(url)
                    const messageChain = [
                        { "type":"Image", url }
                    ]
                    conixBot.sendGroupMessage(sender, messageChain)
                    console.log(`检测到命令，发送回应`)
                    break
                }
            }
        }
    }
    else {
        console.log(`无事发生`)
    }
}, 10000)
