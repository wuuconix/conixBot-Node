import fetch from 'node-fetch'

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

    async sendGroupMessage(target) {
        let url = new URL(`${this.baseUrl}/sendGroupMessage`)
        let data = { sessionKey: this.sessionKey,
            target: target,
            messageChain: [
                { "type": "Plain", "text": "Hello World" },
                { "type":"Image", "url":"https://conix.ml" }
            ]
        }
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
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
            let sender = m.sender.group.id
            let messageChain = m.messageChain
            let text = messageChain[1].type == "Plain" ? messageChain[1].text : ""
            if (text == "#hi") {
                conixBot.sendGroupMessage(sender)
                console.log(`检测到命令，发送回应`)
            }
        }
    }
    else {
        console.log(`无事发生`)
    }
}, 10000)
