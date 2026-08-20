# Life Quest PWA 部署说明

## 目录内容

| 文件 | 说明 |
|---|---|
| `life-quest.html` | 游戏本体（单文件，含内嵌配置 + PWA bootstrap） |
| `manifest.webmanifest` | PWA 清单（名称/图标/独立模式/主题色） |
| `sw.js` | Service Worker（离线缓存静态壳） |
| `config.json` | 远程配置（版本化，客户端联网热更新用） |
| `icons/` | 应用图标（192/512/180） |

## 推送到 GitHub Pages

```bash
# 1. 本地组装（改完 xlsx 后重跑）
python build/deploy_pwa.py

# 2. 推送 deploy/ 到 GitHub Pages 分支
cd deploy
git init
git add .
git commit -m "deploy pwa"
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main

# 3. GitHub 仓库 Settings → Pages → 部署分支选 main（或 gh-pages）
```

访问：`https://<user>.github.io/<repo>/life-quest.html`

## 配置热更新流程

1. 改 `build/life-quest.xlsx`
2. `python build/deploy_pwa.py` → 重新生成 config.json（版本号=文件 mtime）
3. 推送 deploy/
4. 用户**联网打开 App** → 自动拉取新 config.json → 应用新配置 → 提示"配置已更新"

离线/失败兜底：先用上次缓存的远程配置，无缓存则用内嵌配置。

## 手机安装

- **Android**：Chrome/Edge 打开页面 → 菜单"添加到主屏幕"（PWA 会直接弹安装提示）
- **iOS**：Safari 打开 → 分享 → "添加到主屏幕"
- 注意：微信/QQ 内置浏览器不支持 PWA 安装，需用系统浏览器

## 构建工具链

| 脚本 | 作用 |
|---|---|
| `build/deploy_pwa.py` | 组装部署目录（xlsx → config.json + 复制静态文件） |
| `build/export_config.py` | 仅生成远程 config.json |
| `build/gen_icons.py` | 重新生成应用图标 |

## 开发测试

```bash
cd deploy && python3 -m http.server 8765
# 浏览器访问 http://localhost:8765/life-quest.html
# localhost 下 SW 可用（无需 HTTPS）
```

> 注意：Service Worker 仅在 HTTPS 或 localhost 下注册。`file://` 直接打开时
> 游戏可玩但不支持安装 PWA、不注册 SW（配置热更新会静默跳过远程拉取）。
