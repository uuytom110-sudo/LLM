# 部署到自己的域名（不需要服务器）

格物复习站是纯静态网页（HTML + CSS + JS），用 **GitHub Pages** 免费托管就行，不用买服务器。
仓库里已经有自动部署的工作流 `.github/workflows/pages.yml`：每次推送代码，GitHub 会先运行 `scripts/check_data.js` 检查题库，再打包发布。

下面把 `study.example.com` 换成你自己的域名。

## 第一步：打开 GitHub Pages（只做一次）

1. 打开仓库的 Pages 设置：<https://github.com/uuytom110-sudo/LLM/settings/pages>
2. **Build and deployment → Source** 选 **GitHub Actions**。
3. 打开 <https://github.com/uuytom110-sudo/LLM/actions>，左侧点 **Deploy to GitHub Pages**，右侧点 **Run workflow** 重新运行一次。
4. 运行成功（绿色对勾）后，网站先出现在 <https://uuytom110-sudo.github.io/LLM/>，确认能打开。

> 第一次推送时工作流失败、日志里写着 `Create Pages site failed ... Resource not accessible by integration`，就是因为还没做第 2 步。做完之后重新运行即可。

## 第二步：在域名服务商那里加 DNS 记录

登录你买域名的网站（阿里云、腾讯云 DNSPod、Cloudflare、GoDaddy、Namecheap 等），找到“域名解析 / DNS 记录”。

**推荐用子域名**（例如 `study.example.com`），只要加一条记录：

| 记录类型 | 主机记录（Host / Name） | 记录值（Value / Target） |
| --- | --- | --- |
| CNAME | `study` | `uuytom110-sudo.github.io` |

**如果想直接用根域名**（`example.com`），加 4 条 A 记录，再给 `www` 加一条 CNAME：

| 记录类型 | 主机记录 | 记录值 |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `uuytom110-sudo.github.io` |

可选：支持 IPv6 的话再加 4 条 AAAA 记录（主机记录 `@`）：`2606:50c0:8000::153`、`2606:50c0:8001::153`、`2606:50c0:8002::153`、`2606:50c0:8003::153`。

> 用 Cloudflare 管理 DNS 的话，这几条记录先设成 **DNS only（灰色云朵）**，等 GitHub 签发好 HTTPS 证书后再决定要不要打开代理。

## 第三步：在 GitHub 填写自定义域名

1. 回到 <https://github.com/uuytom110-sudo/LLM/settings/pages>，在 **Custom domain** 填 `study.example.com`，点 **Save**。
2. 等待 **DNS check** 变成成功（DNS 生效一般几分钟，最长可能要一两天）。
3. 勾选 **Enforce HTTPS**（证书签发后才能勾，通常再等十几分钟）。

完成后，网站地址就是 `https://study.example.com`。以后推送代码，网站会自动更新，域名设置不会丢。

### 建议：验证域名

为了防止别人把你的域名接到他们的仓库上，可以在 GitHub 个人设置里验证域名：
<https://github.com/settings/pages> → **Add a domain** → 按提示在 DNS 里加一条 `TXT` 记录（主机记录形如 `_github-pages-challenge-uuytom110-sudo`）。

## 常见问题

- **打开是 404**：检查第一步的 Source 是不是 GitHub Actions，以及 Actions 里最近一次运行是否成功。
- **DNS check 一直不成功**：用 <https://dnschecker.org> 查一下 `study.example.com` 的 CNAME 是否已经指向 `uuytom110-sudo.github.io`；不要同时存在另一条同名的 A 或 CNAME 记录。
- **国内访问速度**：GitHub Pages 的服务器在境外，在中国大陆有时会慢或不稳定。备选方案是 **Cloudflare Pages**（同样免费、不需要服务器）：Cloudflare 后台 → Workers & Pages → Create → Pages → 连接 GitHub 仓库 `LLM`，构建命令留空、输出目录填 `/`，部署后在 **Custom domains** 里添加你的域名。
- **备案**：网站托管在境外服务器上（GitHub Pages、Cloudflare Pages），一般不需要做 ICP 备案；备案是针对放在中国大陆服务器上的网站。具体以你的域名服务商说明为准。
- **离线使用**：本地运行 `python3 scripts/build_single.py`，会生成 `dist/gewu-offline.html`，一个文件包含全部内容，可以拷到手机或电脑上直接打开。
