# 面试模拟器

一款以电脑桌面为舞台的 30 天求职策略游戏。程序员职业可完整游玩：调查企业、打磨简历、投递预约、完成四类面试、协商薪资、选择 Offer，并生成求职复盘。

[打开 GitHub Pages 游戏](https://lep-ton.github.io/interview-simulator/) · [项目源码与部署](https://github.com/LeP-Ton/interview-simulator) · [原私有在线版](https://gamex-interview-simulator-261111.crud-boy.chatgpt.site)

源码与 Pages 现统一到同一个公开仓库，单仓库部署正在调整和验证中。推送应用变更到 main 后，由 GitHub Actions 自动测试、构建及发布。旧 Pages 路径与新路径同源，可沿用原有存档；从原私有站点迁移时可在游戏设置中导出 JSON，再到新地址导入。

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
