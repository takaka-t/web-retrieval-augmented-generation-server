declare module "process" {
  global {
    namespace NodeJS {
      interface ProcessEnv {
        PORT: string;
      }
    }
  }
}
