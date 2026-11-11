# 面试模拟器

一款以电脑桌面为舞台的 30 天求职策略游戏。程序员职业可完整游玩：调查企业、打磨简历、投递预约、完成四类面试、协商薪资、选择 Offer，并生成求职复盘。

[打开 GitHub Pages 游戏](https://lep-ton.github.io/interview-simulator-pages/) · [源码仓库（私有）](https://github.com/LeP-Ton/interview-simulator) · [原私有在线版](https://gamex-interview-simulator-261111.crud-boy.chatgpt.site)

GitHub Pages 已发布并通过线上验证。完整源文件与项目文档保持私有，公开 Pages 仓库只包含网页构建产物。旧地址的存档不会自动跨域迁移，可在游戏设置中导出 JSON，再到新地址导入。

## 开始运行

已验证环境：Node.js 20.20.2、npm 10.8.2。

```bash
cd interview-simulator
npm ci
npm run dev
```

浏览器打开终端显示的本地地址，默认 `http://127.0.0.1:5173/`。

```bash
npm test
npm run build
npm run preview
```

- [应用架构、规则与扩展说明](interview-simulator/README.md)
- [需求入口](.agentdocs/workflow/REQ-20261111112741-面试模拟器首版/README.md)
- [后续计划](interview-simulator/TODO.md)

存档保存在当前浏览器，可通过游戏内「设置与存档」导出、导入 JSON 备份。首版不需要后端、真实 AI 或外部 API 密钥。
