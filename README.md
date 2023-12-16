# conixBot-Node

conixBot Node.js 版本

## 目前实现的功能

+ **#hi** conixBot的自我介绍

    ![#hi](https://sina-vercel.wuuconix.link/api/sina?filename=007YVyKcly1h2ipi9lz1mj30h704xq48.jpg)

    用法: `#hi` 

+ **#repeat** 没错，就是重复你说的话

    ![#repeat](https://sina-vercel.wuuconix.link/api/sina?filename=007YVyKcly1h2iqhh8j7cj30hb04xt9b.jpg)

    用法: `#repeat <anything>` 

+ **#say** 利用Google TTS 把语音转化为 语音发送到qq群里。

    ![#say](https://sina-vercel.wuuconix.link/api/sina?filename=007YVyKcly1h2iq9jowdnj30hb037dg4.jpg)

    用法: `#say <text>`

+ **#img** 输入一张图片的url 机器人自动把它发送到群里

    ![#img](https://sina-vercel.wuuconix.link/api/sina?filename=007YVyKcly1h2ip1hkbzrj30hb09mtae.jpg)

    用法: `#img <img-url>`

+ **#nslookup** 利用 ip-api.com 解析 域名/ip/url 的物理地址

    ![#nslookup](https://sina-vercel.wuuconix.link/api/sina?filename=007YVyKcly1h2ip3fdy39j30hh0i5jvj.jpg)

    用法: `#nslookup [ <url> | <domain> | <ip> ]`

+ **#site** 利用 www.screenshotapi.net 实现的网站截图生成

    ![#site](https://sina-vercel.wuuconix.link/api/sina?filename=007YVyKcly1h2iqauqc5bj30hb0cj42e.jpg)

    用法: `#site <url> [full]`

    > 第一个参数为一个网站的url
    >
    > 可选第二个参数用来控制截图是否需要截到网站底部，即是否为full_page

+ **#music** 利用 api.injahow.cn/meting/ 实现的快速网易云音乐分享

    ![#music](https://sina-vercel.wuuconix.link/api/sina?filename=007YVyKcly1h2it3lrj4sj30ha05imxt.jpg)

    用法: `#music [ <music-id> | <music-url> ]`

+ **#b23** 利用 api.bilibili.com 实现的快速哔哩哔哩视频分享

    ![#music](https://sina-vercel.wuuconix.link/api/sina?filename=007YVyKcly1h2jmt5py6mj30fg05jq3u.jpg)

    用法: `#b23 [ <video-bvid> | <video-url> ]`

+ **#ai** 利用腾讯 "异次元的我" 实现图片AI绘制

    <img src="https://sina-vercel.wuuconix.link/api/sina?filename=007YVyKcly1h8ojeaxdhaj30u00z4af3.jpg" alt="用法1" width="45%">

    <img src="https://sina-vercel.wuuconix.link/api/sina?filename=007YVyKcly1h8ojjuq1owj30u017vtez.jpg" alt="用法2" width="45%">

    ![用法3](https://sina-vercel.wuuconix.link/api/sina?filename=007YVyKcly1h8ojeo22hzj30n40aijv4.jpg)


    用法1: `#ai <image>`

    用法2:
    + 发送`#ai`
    + 发送一张图片

    用法3: `#ai <image-url>`
