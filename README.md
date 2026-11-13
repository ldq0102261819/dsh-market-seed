# dsh-market-seed

给 DeepSeek Harness（dsh）的**插件市场索引种子包**：装上它，`插件 → 发现` 里就有可用的索引源，直接搜索并安装社区插件。

它只做一件事——把预设的索引地址合并进官方的 `pluginMarket` 服务；搜索、安装确认、版本兼容、构建脚本审批、重启提示全部沿用官方 Discover，不重复实现。

## 它写入的索引

| 索引源 | 内容 |
| --- | --- |
| `https://fastly.jsdelivr.net/npm/dsh-plugin-catalog/index.json` | 全量目录（实测 5437 个插件，format 1） |
| `https://dshopen.org/index.json` | 中文社区索引（实测 1218 个插件，带推荐/点赞） |
| `https://raw.githubusercontent.com/tacyzo/dsh-plugins/main/index.json` | GitHub 托管的自建索引（示例；换成你自己的 owner/repo 即可） |

三条都在本机用官方校验器 `parseMarketIndex` 验证过。

## 安装

需要先启用官方插件市场：设置 → 插件 → 实验性插件 → **自定义插件市场**（提供 `pluginMarket` 服务）。本插件在该服务缺席时会安静地不生效。

任选一种：

```bash
# 1) 从 npm 安装（发布之后）
dsh plugin --profile desktop add dsh-market-seed

# 2) 从本地目录安装（开发/自用）
dsh plugin --profile desktop add file:D:\deepseekhz\chajian\dsh-market-seed
```

装完**重启 DSH** 生效。

## 使用

1. 重启后打开：侧栏 **插件** → **发现**
2. 左上角索引源下拉里应出现两个新来源，选一个 → 列表即为该索引里的全部插件
3. 搜到需要的插件 → **安装** → 若提示构建脚本，自行决定是否允许 → 重启
4. 想换索引或加自己的：直接在「发现 → 索引源」里增删，本插件不会与已配置的索引冲突（下一次启动只补齐缺失项）

## 配置

默认索引写在本包的 `cordis.patch.yml` 里。想改成本，覆盖 profile 中同名行的 `config.indexes`：

```yaml
# ~/.dsh/profiles/desktop/cordis.patch.yml
- id: market-seed
  name: dsh-market-seed
  config:
    indexes:
      - https://fastly.jsdelivr.net/npm/dsh-plugin-catalog/index.json
      - https://your-own-index.example.com/index.json
```

- `indexes` 缺省 → 使用内置两条
- `indexes: []` → 一条都不写（等于只保留你自己在界面上配过的）

## 卸载

插件页里对本包点卸载，重启即可。已写入的索引会留在 profile 的 `plugin-market.config.indexes` 里（那是官方市场服务的数据），需要的话在「发现 → 索引源」里手动删。

## 安全

索引内容只是索引方的声明，未签名；插件代码以你本机的权限运行，工具审批不会隔离插件代码。装之前点开仓库看一眼，别把带凭据的环境跑陌生插件。

## 许可

MIT
