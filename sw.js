/* ============================================================
 * life-quest Service Worker
 * 策略:
 *   1. 预缓存静态壳(HTML + manifest + icons)——离线可启动
 *   2. config.json 是"打开时 fetch"的热更新数据,不预缓存旧版,
 *      由页面 JS 负责远程拉取 + localStorage 兜底(见 bootstrap)
 *   3. 更新策略:SW 文件版本号变化 → 浏览器安装新 SW → 主动接管
 * ============================================================ */

const VERSION = '20260820.132622.20260820.163533';  // deploy_pwa.py 部署时注入(xlsx mtime 时间戳,天然递增)
const CACHE_NAME = 'life-quest-' + VERSION;

// 预缓存清单(相对路径,与 start_url 同目录)
const PRECACHE = [
  './life-quest.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon-180.png'
];

/* ---- 安装:预缓存静态壳 ---- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

/* ---- 激活:清理旧版本缓存 ---- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('life-quest-') && k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* ---- 请求拦截 ----
 * 策略: 缓存优先,缓存没有则网络并回填缓存
 * config.json 特殊处理:走网络优先(cache-busting 由页面带 ?v=),
 *   失败时兜底返回缓存副本(若有),保证离线时配置可用
 * ---- */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // 仅处理同源 GET
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  const path = url.pathname;

  // config.json: 网络优先 → 缓存兜底
  if (path.endsWith('/config.json')) {
    event.respondWith(
      fetch(event.request)
        .then((resp) => {
          if (resp && resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((c) => c.put('./config.json', clone));
            return resp;
          }
          throw new Error('config fetch failed');
        })
        .catch(() =>
          caches.match('./config.json').then((cached) => cached || Response.error())
        )
    );
    return;
  }

  // 其他静态资源: 缓存优先 → 网络回填
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((resp) => {
        if (resp && resp.ok && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        }
        return resp;
      });
    })
  );
});
