import WebSocket from 'ws'
import * as googleTTS from 'google-tts-api'
import fetch from 'node-fetch'
import express from 'express'
import { baseURL, qq, verifyKey, screenshotToken, testGroup, acgAPI, differentDimensionMeAPI } from './config/config.js'

const ws = new WebSocket(`ws://${baseURL}/all?verifyKey=${verifyKey}&qq=${qq}`)
ws.on('message', handleMessage)

async function handleMessage(data) {
  const msg = JSON.parse(data.toString())
  console.log(msg)
  if (msg.syncId == '-1' && msg.data) {         // syncId -1 系统消息/事件
    if (msg.data.type == "GroupMessage" && msg.data.messageChain.length >= 2) {
      const groupId = msg.data.sender.group.id  // 群号
      const senderId = msg.data.sender.id       // 发送者qq号
      try {
        await handleGroupMessage(msg)
      } catch(e) {
        log(e, groupId, senderId)
      }
    } else if (msg.data.type == "MemberCardChangeEvent") {
      const { origin, current, member: {id: memberId, group: {id: groupId}} } = msg.data
      log(`\n检测到昵称变化\n${origin} -->  ${current}`, groupId, memberId)
    }
  } else if (msg.syncId == '114514') {          // syncId 114514 机器人发送的消息
    if (msg.data.code != 0) {
      sendGroupMessage({ target: testGroup, messageChain:[{ type:"Plain", text: msg.data.msg }] })
      log(msg.data.msg, testGroup)
    } else if (msg.data.messageId == -1) {      // messageId 可能表示被腾讯服务器屏蔽了
      log("被腾讯ban了", testGroup)
    }
  }
}

const aiMap = new Map()
const qrCodeMap = new Map()

/* 处理群消息 */
async function handleGroupMessage(msg) {
  const groupId = msg.data.sender.group.id            // 群号
  const senderId = msg.data.sender.id                 // 发送者qq号
  const messageChain = msg.data.messageChain
  let text = messageChain[1].text                     //查看消息链的第一个消息的文本
  test(msg)
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
    const site = encodeURIComponent(text.split(" ")[1])                                     // url-encode后的网址
    const full = text.split(" ")[2] == "full" ? "&full_page=true" : ""
    let token
    if (/conix/.test(site)) {                                                               // 自己的网址使用自己的token
      token = screenshotToken[0]
    } else {                                                                                // 其他的用白嫖的token
      token = screenshotToken[Math.floor(Math.random() * (screenshotToken.length - 1)) + 1] // 从众多token中选择一个token
    }
    console.log(`使用token: ${token}`)
    const url = `https://shot.screenshotapi.net/screenshot?token=${token}&url=${site}&width=1920&height=1080&fresh=true&output=image&file_type=png&wait_for_event=load${full}`
    console.log(url)
    sendGroupMessage({ target: groupId, messageChain:[{ type:"Image", url }] })
  } else if (/^#music /.test(text)) {
    const input = text.split(" ")[1]
    let songId = ""
    if (/^(\d+)$/.test(input)) {          // 直接传入歌曲id
      songId = input
    } else if (/id=(\d+)/.test(input)) {  // 传入类似 https://music.163.com/song?id=528423473 的链接
      songId = input.match(/id=(\d+)/)[1] // match数组的0号元素是整个字符串 1号元素才是捕获的括号
    } else {
      throw `格式错误 没有检测到歌曲id`
    }
    const url = `https://api.injahow.cn/meting/?type=song&id=${songId}`
    let res = await (await fetch(url)).json()
    if (res.error) {
      throw JSON.stringify(res)
    } else {
      let [{ name, artist, url, pic }] = res
      res = await fetch(pic, { redirect: "manual" })
      pic = res.headers.get("location") //手动获得真实的url不然显示不出图片
      sendGroupMessage({ target: groupId, messageChain:[{ type: 'MusicShare', kind: 'NeteaseCloudMusic', title: name, summary: artist, jumpUrl: url, pictureUrl: pic, musicUrl: url, brief: `${name}` }]})
    }
  } else if (/^#b23 /.test(text)) {
    if (!/BV[\da-zA-Z]{10}/.test(text)) {
      throw "格式错误 没有检测到BV号"
    }
    const bvid = text.match(/BV[\da-zA-Z]{10}/)[0]  //这里没有括号，0号元素就是符合正则的那个字符串
    console.log(bvid)
    const url = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`
    console.log(url)
    const res = await (await fetch(url)).json()
    if (res.code == 0) {
      const { pic, title, owner: { name: up } } = res.data
      console.log(pic)
      sendGroupMessage({ target: groupId, messageChain:[{ type: 'MusicShare', kind: 'NeteaseCloudMusic', title, summary: up, jumpUrl: `https://www.bilibili.com/video/${bvid}`, pictureUrl: pic, musicUrl: "https://api.injahow.cn/meting/?server=netease&type=url&id=591321", brief: `${title}` }]})
    } else {
      throw JSON.stringify(res)
    }
  } else if (/^#setu/.test(text)) {
    const num = Number(new URLSearchParams(text.split(" ")[1] ?? "").get("num") ?? 1)
    for (let i = 0; i < num; i++) {
      sendGroupMessage({ target: groupId, messageChain:[{ type: "Image", url: (await (await fetch(acgAPI)).json()).imgurl }] })
    }
  } else if (/^#ai/.test(text)) {
    const url1 = text.split(" ")[1]
    const url2 = messageChain[2] && messageChain[2].url
    if (url1) {
      console.log(url1)
      await ai(url1, groupId)
    } else if (url2) {
      console.log(url2)
      await ai(url2, groupId)
    } else {
      const key = `${groupId}-${senderId}`
      aiMap.set(key, (aiMap.get(key) ?? 0) + 1)
      console.log(`aiMap ${key} 增加`)
    }
  } else if (/^#qrcode/.test(text)) {
    const url = messageChain[2] && messageChain[2].url
    if (url) {
      await qrCode(url, groupId, senderId)
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
      aiMap.set(key, aiMap.get(key) - 1)
      console.log(`aiMap ${key} 减少`)
      await ai(url, groupId)
    }
    if (qrCodeMap.has(key) && qrCodeMap.get(key) > 0) {
      const url = messageChain[1].url
      qrCodeMap.set(key, qrCodeMap.get(key) - 1)
      console.log(`qrCodeMap ${key} 减少`)
      await qrCode(url, groupId, senderId)
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

async function ai(url, groupId) {
  let res = await (await fetch(`${differentDimensionMeAPI}/?url=${encodeURIComponent(url)}`)).json()
  console.log(res)
  if (res.extra) {
    res = JSON.parse(res.extra)
    console.log(res)
    sendGroupMessage({ target: groupId, messageChain:[{ type: "Image", url: res["img_urls"][1] }] })
    log(JSON.stringify(res), testGroup)
  } else {
    throw JSON.stringify(res)
  }
}

async function qrCode(url, groupId) {
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
    throw JSON.stringify(res)
  }
}

function log(e, groupId, senderId) { //发生异常时的日志
  if (!senderId) {
    sendGroupMessage({ target: groupId, messageChain:[{ type: "Plain", text: e }] })
  } else {
    sendGroupMessage({ target: groupId, messageChain:[{ type: "At", target: senderId }, { type: "Plain", text: ` ${e}` }] })
  }
}

function test(msg) {
  const messageChain = msg.data.messageChain
  console.log(messageChain)
}

const app = express()
app.get('/log', (req, res) => {
  if (req.query.msg) {
    log(req.query.msg, testGroup)
    res.send("sent")
  } else {
    res.send("error")
  }
})
app.listen(3000, "0.0.0.0", () => {
  console.log("express started in port 3000")
})