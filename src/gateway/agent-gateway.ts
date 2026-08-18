import type { AudienceScenario } from '../types/audience';
import type { CompetitorSnapshot } from '../types/competitor';
import type { PlayStyle } from '../types/play';
import type { TrendRadar } from '../types/tech-radar';
import type { Result } from '../types/result';

/**
 * 数据接口边界。视图层只依赖这个接口，不直接 import 数据文件，
 * 未来接入真实检索或模型服务时无需改动 UI。
 *
 * 浏览器内不放任何凭证；当前实现在构建期内联本地已核实数据，
 * 运行时不向第三方站点发起请求。
 */
export interface AgentGateway {
  /** 竞品矩阵、行业动向与传闻分区 */
  fetchCompetitorSnapshot(): Promise<Result<CompetitorSnapshot>>;
  /** 技术雷达 */
  fetchTrendRadar(): Promise<Result<TrendRadar>>;
  /** 人群场景与真实痛点 */
  fetchAudienceScenarios(): Promise<Result<readonly AudienceScenario[]>>;
  /** 玩法库：素材场景与具体拍法 */
  fetchPlayStyles(): Promise<Result<readonly PlayStyle[]>>;
}
