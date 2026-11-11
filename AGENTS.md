# 面试模拟器项目规范

- 所有用户界面、文档和新增代码注释使用中文。
- 应用位于 `interview-simulator/`，技术栈为 React、TypeScript、Vite；测试使用 Vitest。
- `src/core` 是职业无关的纯函数规则引擎，禁止导入 `src/careers`；职业通过 `CareerModule` 协议注册。
- `src/careers/programmer` 管理程序员题库、独立挑战交互和专业评价；`src/app` 负责注册和桌面界面。
- 游戏随机性只使用存入状态的 Seed 随机数生成器；时间、资源、招聘状态统一经过状态转换。
- 在应用目录运行 `npm run dev`、`npm test`、`npm run build`。构建执行 TypeScript 严格检查。
- GitHub Pages 自动部署入口为根目录 `.github/workflows/pages.yml`，main 分支触发，应用使用公共 npm 和相对资源基路径。
- 需求入口为 `.agentdocs/index.md`；需求文档使用 Asia/Shanghai 时区。
- 存档含版本、随机种子和职业命名空间；修改格式时同时维护兼容检查。
