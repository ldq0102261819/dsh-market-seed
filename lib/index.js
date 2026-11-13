/**
 * dsh-market-seed — 启动时把预设的插件市场索引源合并进 `pluginMarket`。
 *
 * 只做一件事：保证「插件 → 发现」页里有可用的索引，安装插件交给官方 Discover。
 * 因此不依赖 `pluginManager.installBundle`、不自己渲染 UI，也不覆盖用户已配置的索引。
 */

/**
 * 没有任何 config 时使用的索引：
 * 全量目录 + 中文社区目录 + 一份 GitHub 托管的自建索引（换成你自己的仓库地址即可）。
 */
const DEFAULT_INDEXES = [
  'https://fastly.jsdelivr.net/npm/dsh-plugin-catalog/index.json',
  'https://dshopen.org/index.json',
  'https://raw.githubusercontent.com/tacyzo/dsh-plugins/main/index.json',
]

export const name = 'market-seed'

/** 依赖官方市场服务；没装市场 bundle 时本插件不会 apply。 */
export const inject = ['pluginMarket']

/**
 * @param {import('@deepseek-ai/cordis').Context} ctx
 * @param {{ indexes?: unknown }} [config]
 */
export function apply(ctx, config = {}) {
  const wanted = normalizeIndexes(config?.indexes)
  if (wanted.length === 0) return

  const run = async () => {
    try {
      const market = ctx.pluginMarket
      if (market === undefined) return

      const listed = (await market.listIndexes()) ?? []
      const have = new Set(
        listed
          .map((index) => index?.url)
          .filter((url) => typeof url === 'string' && url.length > 0),
      )
      const missing = wanted.filter((url) => !have.has(url))
      if (missing.length === 0) return

      // setIndexes 是整表替换：把已有的一起带上，按“已有在前、新增在后”合并。
      await market.setIndexes([...have, ...missing])
      log(ctx, 'info', `已补充 ${missing.length} 个插件市场索引源`)
    } catch (error) {
      log(ctx, 'warn', `写入索引失败：${error?.message ?? error}`)
    }
  }

  if (typeof ctx.effect !== 'function') {
    void run()
    return
  }
  ctx.effect(() => {
    void run()
    return () => {}
  }, 'market-seed: seed index sources')
}

/**
 * 未配置时回落到默认索引；显式配置空数组表示“我只要默认行为之外的东西”。
 * @param {unknown} value
 * @returns {string[]}
 */
function normalizeIndexes(value) {
  if (value === undefined) return [...DEFAULT_INDEXES]
  if (!Array.isArray(value)) {
    log(undefined, 'warn', 'config.indexes 应为字符串数组，已忽略')
    return [...DEFAULT_INDEXES]
  }
  return [...new Set(value.filter((url) => typeof url === 'string' && /^https?:\/\//u.test(url)))]
}

/**
 * @param {any} ctx
 * @param {'info' | 'warn'} level
 * @param {string} message
 */
function log(ctx, level, message) {
  const line = `[market-seed] ${message}`
  const logger = ctx?.logger
  if (typeof logger?.[level] === 'function') {
    logger[level](line)
    return
  }
  if (typeof logger === 'function') {
    logger(name)[level](line)
    return
  }
  if (level === 'warn') console.warn(line)
  else console.info(line)
}
