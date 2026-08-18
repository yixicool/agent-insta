/**
 * 用户自己上传的玩法。这是本地数据，不是编者整理的官方玩法：
 * 没有 evidence 来源支撑，UI 上必须标为「本地数据」，不进入 src/data/plays.ts。
 */

export interface UserPlayInput {
  /** 素材场景，例如「城市夜骑」，用户自由填写 */
  readonly sceneLabel: string;
  /** 玩法名称，用户自由填写 */
  readonly name: string;
  /** 怎么拍，用户自由填写 */
  readonly summary: string;
  /** 可选配图，base64 data URL；不上传时为 null */
  readonly imageDataUrl: string | null;
}

export interface UserPlay extends UserPlayInput {
  readonly id: string;
  readonly createdAt: string;
}
