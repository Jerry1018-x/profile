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

采用 [视觉风格库 R11 · CHEN · 珊瑚履历](https://www.figma.com/design/4DIxwqVL8mX0M9iJfj0j80?node-id=141-132) 的视觉语言，适配本站真实内容，而非复刻参考人物或封面。白底 `#ffffff`、深灰 `#191919`、珊瑚色带 `#f37274`、行动色 `#a23a42`、次级文字 `#6d5859`、分隔线 `#e0d6d7`。

样式和交互分别位于 `assets/site.css` 和 `assets/site.js`。字体优先使用本机 Inter / Noto Sans SC，缺失时回退到系统无衬线字体，无外部字体请求。`assets/design/r11-editorial-line.svg` 来源于该风格库的 `141:148` 细线装饰。已有照片和图标保持原来源。

手机端保留栏目导航；摄影支持暂停、拖动与键盘；微信二维码支持点击、外部点击和 Escape 关闭；遵循系统减少动效设置。
