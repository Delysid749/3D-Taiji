# 太极 · 生息 ｜ Taiji · Breath of Life

> 一动一静，万象自平衡
> *In stillness and motion, all things find balance.*

---

## 中文说明

### 简介

「太极 · 生息」是一个基于 Three.js 的沉浸式 3D 可视化艺术网页。画面中央展示一个缓缓旋转的太极图，周围环绕飘动的粒子，配合呼吸缩放、星空背景、辉光后处理等效果，营造禅意十足的冥想氛围。

### 功能特性

- 🎨 **经典太极图** — Canvas 2D 动态绘制 S 曲线分割、黑白鱼眼对称的太极纹理
- ✨ **粒子系统** — 800+ 圆形光点环绕漂移，叠加混合发光
- 🌌 **3D 星空** — 2000 颗星点球形分布，缓慢旋转
- 💫 **Bloom 辉光** — UnrealBloomPass 后处理，ACES 电影色调映射
- 🌗 **双主题切换** — 「玄夜」暗色 / 「云宣」亮色，平滑颜色过渡
- 🖱️ **鼠标视差** — 移动鼠标时太极微倾跟随
- ⏸️ **平滑暂停** — 暂停/恢复有缓冲过渡动画
- 🫧 **呼吸缩放** — 太极图有微弱的正弦呼吸效果
- 💡 **动态光源** — 暖色点光源环绕轨道运动

### 键盘操控

| 按键 | 功能 |
|------|------|
| `空格` | 暂停 / 恢复 |
| `1` | 缓速 |
| `2` | 常速 |
| `3` | 快速 |
| `T` | 切换主题（玄夜 ↔ 云宣） |

### 技术栈

| 技术 | 用途 |
|------|------|
| [Three.js](https://threejs.org/) v0.173 | 3D 渲染引擎 |
| [Vite](https://vitejs.dev/) v6.1 | 构建工具 / 开发服务器 |
| 原生 JavaScript (ES Modules) | 应用逻辑 |
| Canvas 2D API | 太极纹理生成 |

### 项目结构

```
src/
├── main.js                 # 入口，组装场景与交互
├── config.js               # 全局配置（主题/速度/文案/参数）
├── animation/
│   └── timeline.js         # requestAnimationFrame 主循环
├── scene/
│   ├── createScene.js      # Three.js 场景/相机/灯光/星空/后处理
│   ├── createTaiji.js      # 太极 3D 模型与材质
│   └── createParticles.js  # 粒子系统
├── state/
│   └── store.js            # 发布-订阅状态管理
├── styles/
│   └── global.css          # 全局样式与主题变量
├── ui/
│   └── overlay.js          # UI 面板/控制按钮/引述
└── utils/
    ├── taijiVisual.js      # 太极 Canvas 2D 绘制算法
    ├── themeTransition.js   # 颜色插值
    ├── sceneTransitionState.js # 场景过渡状态机
    ├── intro.js            # 开场动画缓动
    ├── device.js           # 设备检测
    └── messages.js         # 引述轮播
```

### 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建产物
npm run preview

# 运行测试
npm test
```

> ⚠️ **注意**：不能直接双击打开 `index.html`，项目使用 ES Modules + npm 依赖，必须通过 Vite 开发服务器运行。

## License

MIT
