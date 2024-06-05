import crypto from "crypto";

// ハッシュアルゴリズムの設定
const iterations = 10000;
const keylen = 64;
const digest = "sha256";
const passwordPepper = process.env.PASSWORD_PEPPER;

/**
 * パスワード入力値をハッシュ化する
 */
export const createPasswordHashWithSalt = (argument: { inputedPassword: string }): { passwordSalt: string; passwordHash: string } => {
  // ランダムなソルトを生成
  const passwordSalt = crypto.randomBytes(16).toString("hex");
  // ハッシュ作成
  const passwordHash = crypto.pbkdf2Sync(argument.inputedPassword, passwordSalt + passwordPepper, iterations, keylen, digest).toString("hex");
  // 返却
  return { passwordSalt, passwordHash };
};

/**
 * パスワード入力値を検証する
 */
export const verifyPassword = (argument: { inputedPassword: string; passwordSalt: string; passwordHash: string }) => {
  // 同期的にハッシュ化
  const inputedPasswordHash = crypto.pbkdf2Sync(argument.inputedPassword, argument.passwordSalt + passwordPepper, iterations, keylen, digest).toString("hex");
  // 比較
  return inputedPasswordHash === argument.passwordHash;
};
