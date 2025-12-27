// -*- coding: utf-8 -*-
/**
 * 演示模式配置
 * 
 * 用于控制演示期间的 AI 分析范围
 * 演示结束后将 enabled 设置为 false 即可恢复正常模式
 */

export interface DemoConfig {
  /** 演示模式总开关 */
  enabled: boolean;
  
  /** 目标类目名称（用于显示提示） */
  targetCategory: string;
  
  /** 目标分组名称（用于数据过滤） */
  targetGroup: string;
  
  /** AI 模式下允许处理的分组白名单
   *  空数组 = 处理所有分组
   *  非空 = 只处理这些分组
   */
  allowedGroups: string[];
  
  /** 发布排期页面默认选中的分组 */
  defaultGroup: string;
  
  /** AI 模式下提示文案 */
  demoHint?: string;

  /** 测试模式：限制只分析前 N 个账号（0 = 不限制） */
  maxAccountsToAnalyze: number;
}

/**
 * 演示模式配置
 * 
 * ⚠️ 演示结束后请将 enabled 设置为 false 以恢复正常模式
 */
export const DEMO_CONFIG: DemoConfig = {
  // ===== 演示模式开关 =====
  // true: 仅分析 ai图书 分组
  // false: 分析所有分组（正常模式）
  enabled: true,
  
  // ===== 目标类目配置 =====
  targetCategory: 'ai图书',
  targetGroup: 'ai图书',
  
  // ===== AI 模式下的分组白名单 =====
  // 空数组 = 处理所有分组
  // ['ai图书'] = 只处理 ai图书 分组
  allowedGroups: ['ai图书'],
  
  // ===== 默认选中分组 =====
  // 在发布排期页面默认选中此分组
  defaultGroup: 'ai图书',
  
  // ===== 演示提示文案 =====
  demoHint: '演示模式：仅分析 ai图书 类目的数据',

  // ===== 测试模式配置 =====
  // 限制只分析前 N 个账号（用于测试，避免消耗过多 token）
  // 0 = 不限制，分析所有账号
  maxAccountsToAnalyze: 1,  // 🔴 测试阶段：只分析第一个账号
};

/**
 * 检查分组是否允许在 AI 模式下处理
 * 
 * @param groupName 分组名称
 * @returns 是否允许处理
 */
export function isGroupAllowedInAI(groupName: string | null | undefined): boolean {
  // 如果演示模式关闭，允许所有分组
  if (!DEMO_CONFIG.enabled) {
    return true;
  }
  
  // 如果没有配置白名单，允许所有分组
  if (DEMO_CONFIG.allowedGroups.length === 0) {
    return true;
  }
  
  // 检查是否在白名单中
  if (!groupName) {
    return false;
  }
  
  return DEMO_CONFIG.allowedGroups.includes(groupName);
}

/**
 * 获取 AI 模式下的演示提示文案
 * 
 * @returns 提示文案，非演示模式返回 null
 */
export function getDemoHint(): string | null {
  if (!DEMO_CONFIG.enabled) {
    return null;
  }
  
  return DEMO_CONFIG.demoHint || `演示模式：仅分析 ${DEMO_CONFIG.targetCategory} 类目`;
}

/**
 * 获取测试模式下允许分析的最大账号数
 * 
 * @returns 最大账号数（0 = 不限制）
 */
export function getMaxAccountsToAnalyze(): number {
  return DEMO_CONFIG.maxAccountsToAnalyze || 0;
}

/**
 * 检查是否为测试模式
 * 
 * @returns 是否为测试模式
 */
export function isTestMode(): boolean {
  return DEMO_CONFIG.maxAccountsToAnalyze > 0;
}
