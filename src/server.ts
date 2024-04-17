// dotenv
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

// express
import express from "express";
const app = express();

// settings
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// helmet
import helmet from "helmet";
app.use(helmet());

// logger
app.use((request, response, next) => {
  console.log(`${request.method} ${request.originalUrl}`);
  console.log(request);
  next();
});

// router
import router from "./router";
app.use(router);

// error handler
// なぜか型予測してくれないので明記
app.use((error: Error, request: express.Request, response: express.Response, next: express.NextFunction) => {
  console.error(error.message);
  console.error(error.stack);
  response.status(500).json({ error: error.message });
});

try {
  // listen
  app.listen(process.env.PORT, () => {
    console.log(`Start on port ${process.env.PORT}.`);
  });
} catch (e) {
  console.error(e);
}
