# 作品集维护说明

这个目录是个人网站下的独立作品集，最终地址：

`https://jerry1018-x.github.io/profile/works/`

## 页面结构

- `index.html`：作品索引 / 作品集首页
- `workbench.html`：案例 01「我的 AI 工作台」
- `assets/works.css`：两个页面共用的视觉样式
- `assets/works.js`：滚动显现与案例截图查看器
- `assets/shots/`：从公开静态工作台截取的示例界面（不含真实数据）

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

线上仓库：`https://github.com/Jerry1018-x/profile`（GitHub Pages，main 分支）。

本次需要同步的三处：

- 新增整个 `works/` 目录
- 修改根目录 `index.html`（顶部导航增加 Works）
- 修改 `workbench/index.html`（「返回作品集」指向 `../works/workbench.html`）

不要只上传 `works/` 而漏掉后两个文件，否则首页导航和演示页返回链接不会更新。发布后在无痕窗口打开 `https://jerry1018-x.github.io/profile/works/` 检查 CSS、图片和案例链接。
