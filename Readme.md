# Minecraft 轻量级自动挂机机器人 (AFK Bot)

这是一个基于 [Mineflayer](https://github.com/PrismarineJS/mineflayer) 精简改造的 Node.js 挂机机器人，专为免费游戏服务器（如 FreeGameHost、Aternos 等）设计，用于防止服务器因长时间无玩家在线而自动休眠。

针对 **Silly Development (512 MiB 磁盘)**、**ACLClouds (715 MiB 磁盘)** 等低配免费托管容器进行了极致精简，移除了网页后台与寻路模块，仅保留核心连接、自动重连与基础防踢功能。

---

## ✨ 核心特性

- **极简依赖**：仅保留 `mineflayer` 核心库，大幅降低内存与磁盘占用。
- **断线自动重连**：内置指数退避重连机制（默认 5 秒起，最高 60 秒封顶，附带随机抖动），支持自动唤醒休眠中的服务器。
- **轻量防踢 (Anti-AFK)**：每 25 秒自动执行随机转头与挥手动作，不易触发服务器反作弊插件。
- **自动适配版本**：支持留空版本号自动识别目标 Minecraft 服务器版本。
- **可选自动登录**：支持在配置中开启 `/login` 自动验证（适用于安装了 AuthMe 等登录插件的服务器）。

---

## 📁 项目文件结构

部署时只需保留以下核心文件即可：

```text
.
├── index.js        # 机器人主程序（连接、防踢、自动重连）
├── package.json    # 项目依赖声明（仅 mineflayer）
├── settings.json   # 服务器地址、端口与机器人账号配置
└── .npmrc          # 将 npm 缓存导向 /tmp，防止撑爆免费容器磁盘
```

---

## ⚙️ 快速配置

### 1. 修改 `settings.json`

根据你的服务器信息修改 `settings.json`：

```json
{
  "bot-account": {
    "username": "SoloCloudHosting",
    "password": "",
    "type": "offline"
  },
  "server": {
    "ip": "eu3.freegamehost.xyz",
    "port": 25937,
    "version": ""
  },
  "utils": {
    "auto-auth": {
      "enabled": false,
      "password": "YourPassword"
    },
    "auto-reconnect-delay": 5000,
    "max-reconnect-delay": 60000
  }
}
```

**配置项说明：**
- `bot-account.username`：机器人在游戏内显示的 ID。
- `server.ip` 与 `server.port`：**强烈建议直接填写解析后的节点地址与真实端口**（例如 `eu3.freegamehost.xyz` 和 `25937`）。因为 Mineflayer 传入端口号时会跳过 SRV DNS 解析，直接填无端口子域名可能导致无法连接。
- `server.version`：留空 `""` 即可自动匹配服务器版本；如遇特殊核心可手动指定（如 `"1.20.1"`）。
- `utils.auto-auth.enabled`：若服务器装有登录插件则改为 `true` 并填写密码，否则保持 `false`。

### 2. FreeGameHost / MC 服务端设置

为了让离线模式机器人顺利进服且不被踢出，请在游戏服务器面板中完成以下设置并**重启服务器**：

1. **开启离线模式（允许非正版玩家）**：
   - 在面板 `Minecraft -> Properties` 中开启 **Allow cracked / non-premium players**；
   - 或在 `server.properties` 中修改为 `online-mode=false`。
2. **关闭挂机踢出**：
   - 将 **AFK kick (minutes)** 设置为 `0`。
3. **安全建议**：关闭正版验证后，建议开启白名单（Whitelist）并将机器人 ID 加入白名单，或安装登录插件保护存档安全。

---

## 🚀 免费低配容器防爆盘指南

在 **Silly Development (512 MiB)** 等磁盘配额较小的容器中，首次执行 `npm install` 时容易因为缓存和全版本协议数据触发磁盘超限（`ENOSPC` / `Out of disk space`）。请按以下步骤优化：

1. **添加 `.npmrc` 转移缓存**  
   在项目根目录新建 `.npmrc` 文件，写入以下内容，避免每次重启都在根目录生成 `.npm` 缓存目录：
   ```ini
   cache=/tmp/.npm
   audit=false
   fund=false
   ```
   *(若使用 ACLClouds，还可在 Startup 环境变量中添加 `npm_config_cache=/tmp/.npm` 与 `npm_config_omit=optional`。)*

2. **清理根目录残留缓存**  
   安装完成后，若根目录存在 `.npm` 文件夹，直接将其删除即可释放约 50 MB 空间。

3. **裁剪无用的基岩版数据（可释放 100+ MB）**  
   如果仅连接 Java 版服务器，可进入以下目录：
   ```text
   node_modules/minecraft-data/minecraft-data/data/bedrock/
   ```
   删除里面带版本号的文件夹（如 `1.20.x`、`1.21.x` 等）。  
   > ⚠️ **注意**：务必保留该目录下的 `common` 文件夹，否则程序启动会报错。

---

## 🔧 常见问题排查

| 报错信息 | 原因 | 解决方法 |
| :--- | :--- | :--- |
| `Failed to verify username!` / `unverified_username` | MC 服务器开启了正版验证，拒绝了离线机器人 | 在服务端开启 `Allow cracked players`（`online-mode=false`）并重启服务器 |
| `ENOSPC: no space left on device` / `out of disk space` | 容器磁盘配额已满 | 删除 `.npm` 缓存、添加 `.npmrc`，并删除 `minecraft-data` 中的基岩版版本文件夹 |
| `Error: connect ETIMEDOUT` | 目标地址/端口填错，或机房跨区防火墙丢包 | 核对节点 IP 与端口；确保服务器已开启或域名可正常触发唤醒 |
| `Kicked: Server start command issued. Please wait...` | 机器人成功触发了 FreeGameHost 自动唤醒 | 正常现象，等待 1 分钟左右机器人会自动重连并进服 |

---

## 📄 开源协议

本项目基于 [MIT License](https://opensource.org/licenses/MIT) 开源。
