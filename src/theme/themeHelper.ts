/**
 * 将 HEX 颜色转换为 RGB 对象
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 0, g: 0, b: 0 }
}

/**
 * 将 RGB 对象转换为 HEX 颜色
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * 根据权重混合颜色
 * @param color 基础颜色
 * @param weight 混合权重，正数变浅（混白色），负数变深（混黑色）
 */
export function mixColor(color: string, weight: number): string {
  const rgb = hexToRgb(color)

  if (weight > 0) {
    // 混合白色变浅
    const r = rgb.r + (255 - rgb.r) * weight
    const g = rgb.g + (255 - rgb.g) * weight
    const b = rgb.b + (255 - rgb.b) * weight
    return rgbToHex(r, g, b)
  } else {
    // 混合黑色变深
    const r = rgb.r * (1 + weight)
    const g = rgb.g * (1 + weight)
    const b = rgb.b * (1 + weight)
    return rgbToHex(r, g, b)
  }
}

/**
 * 生成 Element Plus 颜色的所有变体（通用函数）
 * @param colorType 颜色类型：primary, success, warning, danger, error, info
 * @param colorHex 颜色的 HEX 值
 */
export function generateElementColorVariants(
  colorType: 'primary' | 'success' | 'warning' | 'danger' | 'error' | 'info',
  colorHex: string
): Record<string, string> {
  // 确保颜色格式正确
  const color = colorHex.startsWith('#') ? colorHex : `#${colorHex}`

  return {
    // 基础色
    [`el-color-${colorType}`]: color,

    // 浅色变体 (light-3 到 light-9，数字越大越浅)
    [`el-color-${colorType}-light-3`]: mixColor(color, 0.2),
    [`el-color-${colorType}-light-5`]: mixColor(color, 0.4),
    [`el-color-${colorType}-light-7`]: mixColor(color, 0.6),
    [`el-color-${colorType}-light-8`]: mixColor(color, 0.7),
    [`el-color-${colorType}-light-9`]: mixColor(color, 0.8),

    // 深色变体 (dark-2，数字越大越深)
    [`el-color-${colorType}-dark-2`]: mixColor(color, -0.1)
  }
}

/**
 * 生成 Element Plus 主题色的所有变体
 * @param primaryColor 主题色 HEX 值
 * @deprecated 使用 generateElementColorVariants('primary', primaryColor) 代替
 */
export function generateElementThemeColors(primaryColor: string) {
  return generateElementColorVariants('primary', primaryColor)
}

/**
 * 生成 success 颜色的所有变体
 * @param successColor 成功色 HEX 值
 */
export function generateSuccessColors(successColor: string) {
  return generateElementColorVariants('success', successColor)
}

/**
 * 生成 warning 颜色的所有变体
 * @param warningColor 警告色 HEX 值
 */
export function generateWarningColors(warningColor: string) {
  return generateElementColorVariants('warning', warningColor)
}

/**
 * 生成 danger 颜色的所有变体
 * @param dangerColor 危险色 HEX 值
 */
export function generateDangerColors(dangerColor: string) {
  return generateElementColorVariants('danger', dangerColor)
}

/**
 * 生成 error 颜色的所有变体
 * @param errorColor 错误色 HEX 值
 */
export function generateErrorColors(errorColor: string) {
  return generateElementColorVariants('error', errorColor)
}

/**
 * 生成 info 颜色的所有变体
 * @param infoColor 信息色 HEX 值
 */
export function generateInfoColors(infoColor: string) {
  return generateElementColorVariants('info', infoColor)
}

/**
 * 生成所有 Element Plus 颜色的变体
 * @param colors 颜色配置对象
 */
export function generateAllElementColors(colors: {
  primary?: string
  success?: string
  warning?: string
  danger?: string
  error?: string
  info?: string
}): Record<string, string> {
  const result: Record<string, string> = {}

  if (colors.primary) {
    Object.assign(result, generateElementColorVariants('primary', colors.primary))
  }

  if (colors.success) {
    Object.assign(result, generateElementColorVariants('success', colors.success))
  }

  if (colors.warning) {
    Object.assign(result, generateElementColorVariants('warning', colors.warning))
  }

  if (colors.danger) {
    Object.assign(result, generateElementColorVariants('danger', colors.danger))
  }

  if (colors.error) {
    Object.assign(result, generateElementColorVariants('error', colors.error))
  }

  if (colors.info) {
    Object.assign(result, generateElementColorVariants('info', colors.info))
  }

  return result
}

/**
 * 设置主题色
 * @param color 主题色 HEX 值，例如 '#3370FF' 或 '#3370ff'
 * @param options 可选配置
 */
export function setThemeColor(
  color: string,
  options: {
    /** 是否包含 Element Plus 组件主题，默认 true */
    includeElementPlus?: boolean
    /** 自定义主题变量名，默认使用 --el-topic-primary */
    customPrimaryVar?: string
  } = {}
) {
  const { includeElementPlus = true, customPrimaryVar = '--el-topic-primary' } = options

  // 确保颜色格式正确
  if (!color.startsWith('#')) {
    color = '#' + color
  }

  const root = document.documentElement

  // 1. 设置自定义主题变量
  root.style.setProperty(customPrimaryVar, color)

  // 2. 如果需要，设置 Element Plus 的主题色变量
  if (includeElementPlus) {
    const elementColors = generateElementColorVariants('primary', color)

    Object.entries(elementColors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value)
    })
  }
}

/**
 * 批量设置多个主题色（结合 applyThemeVars）
 * @param colors 颜色配置对象
 * @returns 返回主题变量对象，可用于 applyThemeVars
 */
export function generateThemeVars(colors: {
  primary?: string
  success?: string
  warning?: string
  danger?: string
  error?: string
  info?: string
}): Record<string, string> {
  const themeVars: Record<string, string> = {}

  // 生成 Element Plus 颜色变量
  const elementColors = generateAllElementColors(colors)

  // 转换为 applyThemeVars 需要的格式
  Object.entries(elementColors).forEach(([key, value]) => {
    // el-color-primary -> elColorPrimary
    const varName = key.replace(/^el-/, '').replace(/-/g, '')
    themeVars[varName] = value
  })

  return themeVars
}

/**
 * 批量设置主题色（直接应用）
 * @param colors 颜色配置对象
 * @param customVars 自定义的其他主题变量
 */
export function setThemeColors(
  colors: {
    primary?: string
    success?: string
    warning?: string
    danger?: string
    error?: string
    info?: string
  },
  customVars?: Record<string, string>
) {
  const root = document.documentElement

  // 1. 生成并设置 Element Plus 颜色
  const elementColors = generateAllElementColors(colors)
  Object.entries(elementColors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value)
  })

  // 2. 设置自定义主题变量（用于 style.css 中的变量）
  if (colors.primary) {
    root.style.setProperty('--theme-color', colors.primary)
  }

  // 3. 设置自定义变量
  if (customVars) {
    Object.entries(customVars).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value)
    })
  }
}

/**
 * 获取当前主题色
 */
export function getThemeColor(): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--el-color-primary').trim()
}

/**
 * 获取当前所有主题色
 */
export function getAllThemeColors(): {
  primary: string
  success: string
  warning: string
  danger: string
  error: string
  info: string
} {
  const root = document.documentElement
  const style = getComputedStyle(root)

  return {
    primary: style.getPropertyValue('--el-color-primary').trim(),
    success: style.getPropertyValue('--el-color-success').trim(),
    warning: style.getPropertyValue('--el-color-warning').trim(),
    danger: style.getPropertyValue('--el-color-danger').trim(),
    error: style.getPropertyValue('--el-color-error').trim(),
    info: style.getPropertyValue('--el-color-info').trim()
  }
}
