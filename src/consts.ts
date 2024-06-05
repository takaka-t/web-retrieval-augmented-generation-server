export namespace Consts {
  /** アプリケーション設定の各値のキー */
  export const ApplicationConfigKey = {
    FrontAppVersion: "FrontAppVersion",
    AdminPasswordHash: "AdminPasswordHash",
    AdminPasswordSalt: "AdminPasswordSalt",
  } as const;
  export type ApplicationConfigKey = (typeof ApplicationConfigKey)[keyof typeof ApplicationConfigKey];
}
