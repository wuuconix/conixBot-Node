# conixBot-Node

conixBot Node.js 版本

## 目前实现的功能

+ **#hi** conixBot的自我介绍

    ![#hi](https://tva1.sinaimg.cn/large/007YVyKcly1h2ipi9lz1mj30h704xq48.jpg)

    用法: `#hi` 

    > 不接收任何参数

+ **#repeat** 没错，就是重复你说的话

    ![#repeat](https://tva3.sinaimg.cn/large/007YVyKcly1h2ipk4avb8j30hh059gm5.jpg)

    用法: `#repeat something` 

    > 该命令唯一的作用可能就是用自己的机器人调用室友的机器人了吧2333

+ **#say** 利用Google TTS 把语音转化为 语音发送到qq群里。

    ![#say](https://tva2.sinaimg.cn/large/007YVyKcly1h2iq9jowdnj30hb037dg4.jpg)

    用法: `#say something`

    > 空格后面的所有内容都会被作为文本进行语音转化

+ **#img** 输入一张图片的url 机器人自动把它发送到群里

    ![#img](https://tva2.sinaimg.cn/large/007YVyKcly1h2ip1hkbzrj30hb09mtae.jpg)

    用法: `#img url`

    > 接受一个图片的url为参数

+ **#nslookup** 利用 ip-api.com 解析 域名/ip/url 的物理地址

    ![#nslookup](https://tvax4.sinaimg.cn/large/007YVyKcly1h2ip3fdy39j30hh0i5jvj.jpg)

    用法: `#nslookup url/domain/ip`

    > 接受一个 完整的url / 域名 / ip作为参数。

+ **#site** 利用 www.screenshotapi.net 实现的网站截图生成

    ![#site](https://tva1.sinaimg.cn/large/007YVyKcly1h2iqauqc5bj30hb0cj42e.jpg)

    用法: `#site url [full]`

    > 第一个参数为一个网站的url
    >
    > 可选第二个参数用来控制截图是否需要截到网站底部，即是否为full_page