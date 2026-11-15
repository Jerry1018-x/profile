# 作品集维护说明

这个目录是个人网站下的独立作品集，最终地址：

`https://jerry1018-x.github.io/profile/works/`

## 页面结构

- `index.html`：作品索引 / 作品集首页
- `workbench.html`：案例 01「我的 AI 工作台」
- `workbench-demo/`：工作台的公开交互演示（真实前端代码 + `js/demo-data.js` 示例数据；只读，不连接真实数据库）
- `polaris.html`：案例 02「Polaris · 项目管理工作台」
- `polaris/`：Polaris 的静态可操作演示（原生 HTML/CSS/JS，localStorage 示例数据）
- `assets/works.css`：所有页面共用的视觉样式
- `assets/works.js`：滚动显现与案例截图查看器
- `assets/shots/`：从公开静态演示截取的示例界面（不含真实数据）
- `assets/polaris-star.jpg`：Polaris 案例标识

## 添加下一个作品

1. 把新案例的截图放进 `assets/shots/`，统一使用公开演示数据，不截真实个人数据。
2. 复制 `workbench.html`，改标题、描述、`case-meta`、正文和截图路径。
3. 在 `index.html` 的「Selected work」里复制一个作品条目，更新编号、标题、标签和链接。
4. 如果新作品不是 01，记得同步案例页顶部的 `Case 0X` 与页脚编号。
5. 在首页 `../index.html` 的顶部导航保留 `Works` 入口即可。

## 内容原则

- 每个案例讲清楚：为什么做、做了什么、怎么设计、怎么实现、结果和反思。
- 不写空泛的「赋能 / 闭环 / 生态」；用具体模块、截图和取舍说明。
- 公开页面只使用示例数据；真实工作台的数据、账号、API Key、客户信息一律不进入截图。
- 新案例完成后，先本地打开两个页面检查 1440px 和 390px 两个宽度，再上传。

## 发布

线上仓库：`https://github.com/Jerry1018-x/profile`（GitHub Pages，main 分支）。作品集已于 2026-11-15 发布，当前线上结构：

- `works/index.html`：作品索引
- `works/workbench.html`：案例 01
- `works/workbench.html` + `works/workbench-demo/`：案例 01 与真实前端交互演示
- `works/polaris.html` + `works/polaris/`：案例 02 与静态演示
- `works/assets/`：共用样式、脚本、截图与 Polaris 标识
- 根目录 `index.html`：首页导航 `Works`，工作台入口指向 `workbench-demo/`
- `workbench/index.html`：旧版静态示意页（保留，不再作为主入口）

后续更新时，用 GitHub 网页的 **Add file → Upload files** 上传对应目录；新增演示目录时先建好目录，再上传文件。发布后在无痕窗口打开 `https://jerry1018-x.github.io/profile/works/` 检查 CSS、图片、案例链接和静态演示。
