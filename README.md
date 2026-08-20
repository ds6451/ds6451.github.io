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
# 1. 本地一键组装（改完 xlsx 后重跑）：
#    xlsx → config.json + 同步重编译 HTML 内嵌 CONFIG → 复制静态文件
python build/deploy_pwa.py

# 2. 推送 deploy/ 到 GitHub
cd deploy
git add .
git commit -m "deploy pwa"
git push

# 3. 等待 Pages 自动重建（~30s）
```

访问：`https://ds6451.github.io/`

## 配置热更新流程

1. 改 `build/life-quest.xlsx`
2. `python build/deploy_pwa.py` → 重新生成 config.json + 重编译 HTML（版本号 = xlsx 文件 mtime）
3. 推送 deploy/
4. 用户**联网打开 App** → 自动拉取新 config.json → 应用新配置 → 提示"配置已更新"

离线/失败兜底：先用上次缓存的远程配置，无缓存则用内嵌配置。

> **版本一致性保证**：`deploy_pwa.py` 生成 config.json 后会自动把同一份配置
> 重新注入 HTML 内嵌 CONFIG（`make_meta` 单一来源），因此内嵌与远程
> `_meta.version` 永远一致，不再出现占位符/假版本号。

## 手机安装

- **Android**：Chrome/Edge 打开页面 → 菜单"添加到主屏幕"（PWA 会直接弹安装提示）
- **iOS**：Safari 打开 → 分享 → "添加到主屏幕"
- 注意：微信/QQ 内置浏览器不支持 PWA 安装，需用系统浏览器

## 构建工具链

| 脚本 | 作用 |
|---|---|
| `build/deploy_pwa.py` | **一键部署**（xlsx → config.json + HTML 内嵌重编译 + 复制静态文件） |
| `build/export_config.py` | 仅生成远程 config.json（不碰 HTML） |
| `build/build.py` | 老入口（xlsx → JSON / --compile-html 注入 HTML） |
| `build/gen_icons.py` | 重新生成应用图标 |

## 开发测试

```bash
cd deploy && python3 -m http.server 8765
# 浏览器访问 http://localhost:8765/life-quest.html
# localhost 下 SW 可用（无需 HTTPS）
```

> 注意：Service Worker 仅在 HTTPS 或 localhost 下注册。`file://` 直接打开时
> 游戏可玩但不支持安装 PWA、不注册 SW（配置热更新会静默跳过远程拉取）。
