// env
declare module "process" {
  global {
    namespace NodeJS {
      interface ProcessEnv {
        LISTEN_PORT: string;
        DB_HOST: string;
        DB_PORT: string;
        DB_USER: string;
        DB_PASSWORD: string;
        DB_NAME: string;
        OPENAI_API_KEY: string;
        SESSION_SECRET: string;
      }
    }
  }
}

// session
import "express-session";
declare module "express-session" {
  interface SessionData {
    sessionUserName?: string;
    sessionUserLastAccessDatetime?: Date;
  }
}
