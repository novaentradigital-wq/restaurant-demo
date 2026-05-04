import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IoAdapter } from "@nestjs/platform-socket.io";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { AppModule } from "./app.module";
import { RedisIoAdapter } from "./modules/realtime/redis-io.adapter";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const config = app.get(ConfigService);
  const port = config.get<number>("API_PORT", 4000);

  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    origin: [
      config.get<string>("WEB_URL_CUSTOMER", "http://localhost:3000"),
      config.get<string>("WEB_URL_WAITER", "http://localhost:3001"),
      config.get<string>("WEB_URL_KITCHEN", "http://localhost:3002"),
      config.get<string>("WEB_URL_ADMIN", "http://localhost:3003"),
      config.get<string>("WEB_URL_SUPER_ADMIN", "http://localhost:3004"),
    ],
    credentials: true,
  });

  app.setGlobalPrefix("api/v1", { exclude: ["health"] });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  // Socket.IO + Redis adapter (multi-node yayın için)
  const ioAdapter = new RedisIoAdapter(app);
  await ioAdapter.connectToRedis(config.get<string>("REDIS_URL", "redis://localhost:6379"));
  app.useWebSocketAdapter(ioAdapter);

  await app.listen(port);
  Logger.log(`API listening on http://localhost:${port}`, "Bootstrap");
}

bootstrap().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
