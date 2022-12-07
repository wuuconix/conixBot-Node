import WebSocket from 'ws'
import * as googleTTS from 'google-tts-api'
import fetch from 'node-fetch'
import { baseURL, qq, verifyKey, screenshotToken, testGroup, acgAPI, differentDimensionMeAPI, chatSessionToken } from './config/config.js'
import { ChatGPTAPI } from 'chatgpt'

const ws = new WebSocket(`ws://${baseURL}/all?verifyKey=${verifyKey}&qq=${qq}`)
ws.on('message', handleMessage)

function handleMessage(data) {
  const msg = JSON.parse(data.toString())
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
}

const aiMap = new Map()
const qrCodeMap = new Map()

/* 处理群消息 */
async function handleGroupMessage(msg) {
  const groupId = msg.data.sender.group.id //群号
  const senderId = msg.data.sender.id //发送者qq号
  const messageChain = msg.data.messageChain
  const chatMode = messageChain[1].type == "At" && messageChain[1].target == qq && messageChain[2] && messageChain[2].type == "Plain"
  let text = chatMode ? messageChain[2].text.trim() : messageChain[1].text //查看消息链的第一个消息的文本
  test(msg)
  if (chatMode) {
    const response = await chatGPT(text)
    log(response, groupId, senderId)
    return
  }
  if (/^#hi$/.test(text)) {
    sendGroupMessage({ target: groupId, messageChain:[{ type:"Plain", text: "我是conixBot😊 基于Mirai-api-http Websocket Adapter🎈\nGithub: https://github.com/wuuconix/conixBot-Node ⭐\n仓库README里有命令使用说明哦💎" }] })
  } else if (/^#repeat /.test(text)) {
    const content = text.slice(8)
    const otherMsgChain = messageChain.slice(2)
    sendGroupMessage({ target: groupId, messageChain:[{ type:"Plain", text: content }, ...otherMsgChain] })
  } else if (/^#img /.test(text)) {
    const urls = text.split(" ")
    for (let i = 1; i < urls.length; i++) {
      sendGroupMessage({ target: groupId, messageChain:[{ type:"Image", url: urls[i] }] })
    }
  } else if (/^#say /.test(text)) {
    const content = text.slice(5)
    const url = googleTTS.getAudioUrl(content, { lang: 'zh', slow: false, host: 'https://translate.google.com' })
    sendGroupMessage({ target: groupId, messageChain:[{ type:"Voice", url }] })
  } else if (/^#nslookup /.test(text)) {
    const target = text.split(" ")[1].replace("https://", "").replace("http://", "").split("/")[0]
    const url = `http://ip-api.com/json/${target}?lang=zh-CN`
    let res = await (await fetch(url)).json()
    let addrInfo
    if (res.status == "fail") {
      addrInfo = `IP: ${res['query']}\n获取地址失败: ${res['message']}`
    } else {
      addrInfo = `IP: ${res['query']}\n国家: ${res['country']}\n城市: ${res['regionName']}${res['city']}\nISP: ${res['isp']}\n组织: ${res['org']}`
    }
    sendGroupMessage({ target: groupId, messageChain:[{ type:"Plain", text: addrInfo }] })
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
    sendGroupMessage({ target: groupId, messageChain:[{ type:"Image", url }] })
  } else if (/^#music /.test(text)) {
    const songId = text.split(" ")[1]
    const url = `https://api.injahow.cn/meting/?type=song&id=${songId}`
    let res = await (await fetch(url)).json()
    if (res.error) {
      sendGroupMessage({ target: groupId, messageChain:[{ type:"Plain", text: res.error }] })
    } else {
      let [{ name, artist, url, pic }] = res
      res = await fetch(pic, { redirect: "manual" })
      pic = res.headers.get("location") //手动获得真实的url不然显示不出图片
      sendGroupMessage({ target: groupId, messageChain:[{ type: 'MusicShare', kind: 'NeteaseCloudMusic', title: name, summary: artist, jumpUrl: url, pictureUrl: pic, musicUrl: url, brief: `${name}` }]})
    }
  } else if (/^#b23 /.test(text)) {
    const bvid = text.split(" ")[1]
    const url = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`
    console.log(url)
    try {
      const res = await (await fetch(url)).json()
      if (res.code == 0) { //正常
        const {pic, title, owner: {name: up}} = res.data
        sendGroupMessage({ target: groupId, messageChain:[{ type: 'MusicShare', kind: 'NeteaseCloudMusic', title, summary: up, jumpUrl: `https://www.bilibili.com/video/${bvid}`, pictureUrl: pic, musicUrl: "https://api.injahow.cn/meting/?server=netease&type=url&id=591321", brief: `${title}` }]})
      } else {
        sendGroupMessage({ target: groupId, messageChain:[{ type:"Plain", text: "BV号错误" }] })
        log("BV号错误", groupId, senderId)
      }
    } catch(e) {
      log(e, groupId, senderId)
    }
  } else if (/^#setu/.test(text)) {
    const num = Number(new URLSearchParams(text.split(" ")[1] ?? "").get("num") ?? 1)
    try {
      for (let i = 0; i < num; i++) {
        sendGroupMessage({ target: groupId, messageChain:[{ type: "Image", url: (await (await fetch(acgAPI)).json()).imgurl }] })
      }
    } catch(e) {
      log(e, groupId, senderId)
    }
  } else if (/^#ai/.test(text)) {
    const url1 = text.split(" ")[1]
    const url2 = messageChain[2] && messageChain[2].url
    if (url1) {
      console.log(url1)
      ai(url1, groupId, senderId)
    } else if (url2) {
      console.log(url2)
      ai(url2, groupId, senderId)
    } else {
      const key = `${groupId}-${senderId}`
      aiMap.set(key, (aiMap.get(key) ?? 0) + 1)
      console.log(`aiMap ${key} 增加`)
    }
  } else if (/^#qrcode/.test(text)) {
    const url = messageChain[2] && messageChain[2].url
    if (url) {
      qrCode(url, groupId, senderId)
    } else {
      const key = `${groupId}-${senderId}`
      qrCodeMap.set(key, (qrCodeMap.get(key) ?? 0) + 1)
      console.log(`qrCodeMap ${key} 增加`)
    }
  }
  if (messageChain[1].type == "Image") {
    const key = `${groupId}-${senderId}`
    if (aiMap.has(key) && aiMap.get(key) > 0) {
      const url = messageChain[1].url
      ai(url, groupId, senderId)
      aiMap.set(key, aiMap.get(key) - 1)
      console.log(`aiMap ${key} 减少`)
    }
    if (qrCodeMap.has(key) && qrCodeMap.get(key) > 0) {
      const url = messageChain[1].url
      qrCode(url, groupId, senderId)
      qrCodeMap.set(key, qrCodeMap.get(key) - 1)
      console.log(`qrCodeMap ${key} 减少`)
    }
  }
}

function sendGroupMessage(content) {
  ws.send(JSON.stringify({
    syncId: 114514,
    command: "sendGroupMessage", // 命令字
    subCommand: null,
    content
  }))
}

function log(e, groupId, senderId) { //发生异常时的日志
  if (!senderId) {
    sendGroupMessage({ target: groupId, messageChain:[{ type: "Plain", text: e }] })
  } else {
    sendGroupMessage({ target: groupId, messageChain:[{ type: "At", target: senderId }, { type: "Plain", text: ` ${e}` }] })
  }
}

async function ai(url, groupId, senderId) {
  try {
    let res = await (await fetch(`${differentDimensionMeAPI}/?url=${encodeURIComponent(url)}`)).json()
    console.log(res)
    if (res.extra) {
      res = JSON.parse(res.extra)
      console.log(res)
      sendGroupMessage({ target: groupId, messageChain:[{ type: "Image", url: res["img_urls"][1] }] })
      log(JSON.stringify(res), testGroup)
    } else {
      log(JSON.stringify(res), groupId, senderId)
    }
  } catch(e) {
    log(e, groupId)
  }
}

async function qrCode(url, groupId, senderId) {
  const res = await (await fetch("https://sotool.net/qrcode-scanner", {
    method: "post",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "Sec-Ch-Ua-Mobile": "?0"
    },
    body: `path=${encodeURIComponent(url)}`
  })).json()
  console.log(res)
  if (res.code == 200) {
    log(`二维码扫描结果: ${res.result.data}`, groupId)
  } else {
    log(JSON.stringify(res), groupId, senderId)
  }
}

async function chatGPT(question) {
  console.log(`chatGPT问题: ${question}`)
  const api = new ChatGPTAPI({ sessionToken: chatSessionToken })
  let response
  try {
    await api.ensureAuth()
    response = await api.sendMessage(question)
    console.log(`chatGPT回答: ${response}`)
    response = response.replace(/我是 Assistant/g, "我是 conixBot")
  } catch(e) {
    log(e, testGroup)
  }
  return response
}

function test(msg) {
  const messageChain = msg.data.messageChain
  console.log(messageChain)
}