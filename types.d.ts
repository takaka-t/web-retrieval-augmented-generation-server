// env
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly LISTEN_PORT: string;
      readonly DB_HOST: string;
      readonly DB_PORT: string;
      readonly DB_USER: string;
      readonly DB_PASSWORD: string;
      readonly DB_NAME: string;
      readonly OPENAI_API_KEY: string;
      readonly SESSION_SECRET: string;
      readonly PASSWORD_PEPPER: string;
    }
  }
}

// session
import "express-session";
declare module "express-session" {
  interface SessionData {
    sessionUserName?: string;
    sessionUserLastAccessDatetime?: Date;
    isAdminAuthenticated?: boolean;
  }
}
