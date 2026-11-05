# 14亿分之1

按真实统计随机出生为一个中国人，从1950年到今天任选一年出生，过完TA的一生。

## 目录

```
14yi-site/            ← 直接上传这个文件夹就能发布
  index.html          整个网站（脚本、数据、字体全部内嵌，约2MB）
  favicon.svg         浏览器标签图标
  LICENSE-fonts-OFL.txt  字体许可

14yi-source/          ← 源码，要改内容时用
  src/
    template.html     页面结构和样式
    data.js           31省统计数据、数据来源
    era.js            历年统计序列 + 时代事件和流行文化
    pers.js           MBTI性格模型
    engine.js         人生模拟引擎
    choices.js        二选一抉择 + 随机事件
    ui.js             界面交互
  fonts/
    LongCang-Regular.ttf  龙藏体（手写字）
    OFL.txt
  build.py            打包脚本
  test/               模拟校验脚本（node）
```

## 发布

网站是一个纯静态的单文件，没有后端，也不请求任何外部资源（字体已经内嵌，国内可以正常打开）。把 `14yi-site` 文件夹里的东西上传到任意静态托管即可：

- **GitHub Pages**：新建仓库或用已有的 `xxx.github.io`，把 `index.html` 和 `favicon.svg` 放到根目录或子目录，在仓库 Settings → Pages 里开启。
- **国内访问更快**：腾讯云 COS / 阿里云 OSS 开启“静态网站托管”，上传文件即可；绑定自己的域名需要备案。
- **Vercel / Netlify / Cloudflare Pages**：把文件夹拖进去就能部署。

浏览器要求：Chrome 61+、Safari 11+、微信内置浏览器均可。

## 修改内容后重新打包

```bash
pip install fonttools
cd 14yi-source
python3 build.py        # 生成 ../14yi-site/index.html
```

标题用的思源宋体文件比较大（每个约25MB），没有放进包里。需要的话从 https://github.com/notofonts/noto-cjk 下载 `NotoSerifCJK-Black.ttc` 和 `NotoSerifCJK-SemiBold.ttc` 放到 `14yi-source/fonts/`；不放也能打包，标题会改用系统宋体。打包脚本会自动只截取页面里用到的字，所以改了文案要重新运行。

校验模拟分布（可选）：

```bash
node test/mc2.js 1990 1500   # 某个出生年份的寿命、学历、收入等分布
node test/mbti.js 2000       # 性格变化统计
node test/stall.js 2000      # 压力测试，检查有没有卡死或报错
node test/one.js 1975 42     # 打印一条完整人生
```

## 许可

- 龙藏体、思源宋体：SIL Open Font License 1.1，可免费商用、可嵌入网页。
- 统计数据来自国家统计局、第七次全国人口普查、教育部、国家卫健委等公开发布，出处写在页面底部。
