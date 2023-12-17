import WebSocket from 'ws'
import * as googleTTS from 'google-tts-api'
import fetch from 'node-fetch'
import randomEmoji from '@sefinek/random-emoji'

import { baseURL, token, testGroup, setuAPI, differentDimensionMeAPI, alertAPI, commonAPI } from './config/config.js'

let ws = new WebSocket(null)
let lastMsgTimeStamp = 0

function initWebSocket() {
  ws = new WebSocket(`ws://${baseURL}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  ws.on('open', () => {
    console.log("ws connection starts!")
  })

  ws.on('error', () => {
    console.log('ws connection failed!')
    ws.terminate()
    initWebSocket()
  })

  ws.on('message', (data) => {
    lastMsgTimeStamp = Date.now() / 1000
    handleEvent(data)
  })
}

initWebSocket()

/* 定时检测心跳，无心跳则重启ws链接 */
setInterval(() => {
  if (Date.now() / 1000 - lastMsgTimeStamp > 30) {
    console.log(`lastMsgTimeStamp: ${lastMsgTimeStamp}`)
    console.log(`nowTimeStamp: ${Date.now() / 1000}`)
    console.log("restart!")
    ws.terminate()
    initWebSocket()
  }
}, 1000 * 30)

async function handleEvent(data) {
  const event = JSON.parse(data.toString())

  console.log(event)

  if (event.post_type == 'message' && event.message_type == 'group' && event.message[0].type == 'text') {
    try {
      await handleGroupMessage(event)
    } catch(e) {
      console.log(JSON.stringify(e))
      log(JSON.stringify(e), testGroup)
    }
  }
}

/* 处理群消息 */
async function handleGroupMessage(event) {
  const groupId = event.group_id
  const senderId = event.user_id
  const messageSegment = event.message
  let text = messageSegment[0].data.text    //查看消息链的第一个消息的文本

  /* 打招呼 */
  if (/^#hi$/.test(text)) {
    return sendGroupMessage(groupId, genTextMessage("我是conixBot😊 基于OpenShamrock🎈\nGithub: https://github.com/wuuconix/conixBot-Node ⭐\n仓库README里有命令使用说明哦💎"))
  }

  /* 复读机 */
  if (/^#repeat /.test(text)) {
    const content = text.slice(8)
    const otherMsgSegment = messageSegment.slice(1)
    return sendGroupMessage(groupId, [genTextMessage(content), ...otherMsgSegment])
  }

  /* 发送指定url的网络图片 */
  if (/^#img /.test(text)) {
    const url = getURL(messageSegment)
    console.log(url)
    return sendGroupMessage(groupId, genImageMessage(url))
  }

  /* 涩图 */
  if (/^#setu/.test(text)) {
    const apiURL = new URL(setuAPI)

    if (text.split(" ").length >= 2) {
      apiURL.search = new URLSearchParams(text.split(" ")[1])
    }

    const data = (await (await fetch(apiURL.href)).json())?.data

    for (let item of data) {
      sendGroupMessage(groupId, genImageMessage(item.urls[apiURL.searchParams.get("size") ?? 'regular']))
    }

    return
  }

  if (/^#common/.test(text)) {
    const commonURL = new URL(commonAPI)

    if (text.split(" ").length >= 2) {
      console.log(text.split(" ")[1])
  
      if (text.split(" ")[1] == "list") {
        commonURL.search = new URLSearchParams(`list=1`)
      } else {
        commonURL.search = new URLSearchParams(`category=${text.split(" ")[1]}`)
      }
    }

    const res = (await (await fetch(commonURL.href)).json())
    if (res.err) {
      return log(JSON.stringify(res), groupId)
    }

    const { commonSense, category } = res

    if (commonSense) {
      return sendGroupMessage(groupId, genTextMessage(commonSense))
    }

    return sendGroupMessage(groupId, genTextMessage(`conixBot常识目前涵盖以下领域💕\n${customEmojiJoin(category)}`))
  }

  /* 发送语音 */
  if (/^#say /.test(text)) {
    const content = text.slice(5)
    console.log(content)
    const url = googleTTS.getAudioUrl(content, { lang: 'zh', slow: false, host: 'https://translate.google.com' })
    console.log(url)
    return sendGroupMessage(groupId, genRecordMessage(url))
  }

  /* 查询网站信息 */
  if (/^#nslookup /.test(text)) {
    let target = getURL(messageSegment)
    target = target.replace("https://", "").replace("http://", "").split("/")[0]
    const url = `http://ip-api.com/json/${target}?lang=zh-CN`
    let res = await (await fetch(url)).json()
    let addrInfo
    if (res.status == "fail") {
      addrInfo = `IP: ${res['query']}\n获取地址失败: ${res['message']}`
    } else {
      addrInfo = `IP: ${res['query']}\n国家: ${res['country']}\n城市: ${res['regionName']}${res['city']}\nISP: ${res['isp']}\n组织: ${res['org']}`
    }
    return sendGroupMessage(groupId, genTextMessage(addrInfo))
  }

  /* AI绘图 */
  if (/^#ai/.test(text)) {
    const url1 = getURL(messageSegment)
    const url2 = messageSegment?.[1].type == 'image' && messageSegment?.[1].data.url
    if (url1) {
      console.log(url1)
      await ai(url1, groupId)
    } else if (url2) {
      console.log(url2)
      await ai(url2, groupId)
    }
  }

  /* 获取网站截图 */
  // if (/^#site /.test(text)) {
  //   let target = ""
  //   if (text.split(" ")[1] != '') {
  //     target = text.split(" ")[1]
  //   } else if (messageSegment?.[1].type == 'text') {
  //     target = messageSegment[1].data.text
  //   } else {
  //     return
  //   }

  //   const site = encodeURIComponent(target)
  //   const url = `${screenshotAPI}?url=${site}`
  //   console.log(url)
  //   return sendGroupMessage(groupId, genImageMessage(url))
  // }

  // if (/^#music /.test(text)) {
  //   const input = text.split(" ")[1]
  //   let songId = ""
  //   if (/^(\d+)$/.test(input)) {          // 直接传入歌曲id
  //     songId = input
  //   } else if (/id=(\d+)/.test(input)) {  // 传入类似 https://music.163.com/song?id=528423473 的链接
  //     songId = input.match(/id=(\d+)/)[1] // match数组的0号元素是整个字符串 1号元素才是捕获的括号
  //   } else {
  //     throw `格式错误 没有检测到歌曲id`
  //   }
  //   const url = `https://api.injahow.cn/meting/?type=song&id=${songId}`
  //   let res = await (await fetch(url)).json()
  //   if (res.error) {
  //     throw JSON.stringify(res)
  //   } else {
  //     let [{ name, artist, url, pic }] = res
  //     res = await fetch(pic, { redirect: "manual" })
  //     pic = res.headers.get("location") //手动获得真实的url不然显示不出图片
  //     return sendGroupMessage({ target: groupId, messageChain:[{ type: 'MusicShare', kind: 'NeteaseCloudMusic', title: name, summary: artist, jumpUrl: url, pictureUrl: pic, musicUrl: url, brief: `${name}` }]})
  //   }
  // }

  // if (/^#b23 /.test(text)) {
  //   if (!/BV[\da-zA-Z]{10}/.test(text)) {
  //     throw "格式错误 没有检测到BV号"
  //   }
  //   const bvid = text.match(/BV[\da-zA-Z]{10}/)[0]  //这里没有括号，0号元素就是符合正则的那个字符串
  //   console.log(bvid)
  //   const url = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`
  //   console.log(url)
  //   const res = await (await fetch(url)).json()
  //   if (res.code == 0) {
  //     const { pic, title, owner: { name: up } } = res.data
  //     console.log(pic)
  //     return sendGroupMessage({ target: groupId, messageChain:[{ type: 'MusicShare', kind: 'NeteaseCloudMusic', title, summary: up, jumpUrl: `https://www.bilibili.com/video/${bvid}`, pictureUrl: pic, musicUrl: "https://api.injahow.cn/meting/?server=netease&type=url&id=591321", brief: `${title}` }]})
  //   } else {
  //     throw JSON.stringify(res)
  //   }
  // }
}

function getURL(messageSegment) {
  if (messageSegment[0].type != 'text') {
    return ''
  }

  let url = messageSegment[0].data.text.split(' ')?.[1]
  if (url) {
    return url
  }

  if (messageSegment?.[1].type == 'text') {
    return messageSegment?.[1].data.text
  }

  return ''
}

function genTextMessage(text) {
  return {
    type: 'text',
    data: { text }
  }
}

function genImageMessage(url) {
  return {
    type: 'image',
    data: {
      file: url
    }
  }
}

function genRecordMessage(url) {
  return {
    type: 'record',
    data: {
      file: url
    }
  }
}

function genAtMessage(target) {
  return {
    type: 'at',
    data: {
      qq: target
    }
  }
}

function customEmojiJoin(list) {
  let res = ""
  for (let i = 0; i < list.length; i++) {
    res += (`${randomEmoji.foods().content}${list[i]}` + ((i < list.length - 1) ? '\n' : ''))
  }
  return res
}

function sendGroupMessage(groupId, messageSegment) {
  ws.send(JSON.stringify({
    action: "send_group_msg",
    params: {
      group_id: groupId,
      message: messageSegment,
    }
  }))
}

async function ai(url, groupId) {
  let res = await (await fetch(`${differentDimensionMeAPI}/?url=${encodeURIComponent(url)}`)).json()
  console.log(res)
  if (res.extra) {
    res = JSON.parse(res.extra)
    console.log(res)
    sendGroupMessage(groupId, genImageMessage(res["img_urls"][1]))
    log(JSON.stringify(res), testGroup)
  } else {
    throw JSON.stringify(res)
  }
}

function log(e, groupId, senderId) { //发生异常时的日志
  if (!senderId) {
    sendGroupMessage(groupId, genTextMessage(e))
  } else {
    sendGroupMessage(groupId, [genAtMessage(senderId), genTextMessage(` ${e}`)])
  }
}

async function alert(content) {
  const res = await (await fetch(`${alertAPI}?content=${content}`)).json()
  return res
}