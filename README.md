# 个人网站

纯 HTML、CSS 和 JavaScript 网站，无需安装依赖或构建。

- `index.html`：个人主页
- `questionnaire.html`：资料问卷，登录、上传和保存依赖原 WorkBuddy 云服务
- `assets/`：图片及图标

## 部署

GitHub Pages 使用 `main` 分支根目录发布。更新文件并推送到 `main` 后自动部署。

网站地址：https://Jerry1018-x.github.io/profile/

问卷的云服务需允许该网站来源；GitHub Pages 仅提供静态文件托管。主页三处简历下载入口均指向仓库根目录的 `薛绍祎-简历2.pdf`；小红书笔记作为内容展示，不设置虚假外链。

## 视觉设计

参考 [Josh W. Comeau](https://www.joshwcomeau.com/) 的天空蓝、蓝紫交互色、清晰文字层级与轻量角色互动，适配本站履历、项目和摄影内容。白底 `#ffffff`、正文 `#20263f`、蓝紫 `#5146df`、浅天空蓝 `#edf5ff`。`design-preview.html` 是可直接打开的组件拆解与角色样板页。

样式和交互分别位于 `assets/site.css` 和 `assets/site.js`。字体优先使用本机 Inter / Noto Sans SC，缺失时回退到系统无衬线字体，无外部字体请求。已有照片和图标保持原来源。Lenis 1.3.27 固定版本在 `assets/vendor/`，保留 MIT 许可证；锚点使用 CSS scroll-padding，触摸保留原生滚动。

原创抽象黏土角色由用户提供的 `story.jpg` 经内置 image_gen 工具生成，包含默认和开心两种透明图片；不是实时三维模型。网页加载 WebP（两张合计约 229 KiB），同时保留 PNG 原稿；素材和完整生成提示词位于 `assets/mascot/`。`assets/mascot.css` 与 `assets/mascot-demo.js` 为共享组件，支持悬停轻微倾斜、移出弹簧回位、点击换表情、键盘和触摸。Canvas 2D 装饰与角色在静止、离屏及页面隐藏后停止重绘；减少动效时保留静态表情反馈。

手机端保留栏目导航；摄影支持暂停、拖动与键盘；微信二维码支持点击、外部点击和 Escape 关闭；遵循系统减少动效设置。
