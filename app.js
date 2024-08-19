import "dotenv/config";
import Fastify from "fastify";
import { connectDB } from "./src/config/connect.js";
import { PORT } from "./src/config/config.js";
import { admin, buildAdminRouter } from "./src/config/setup.js";
import { registerRoutes } from "./src/routes/index.js";
import fastifySocketIO from "fastify-socket.io";
const start = async () => {
  await connectDB(process.env.MONGO_URI);
  const app = Fastify();

  // socket.io
  app.register(fastifySocketIO, {
    cors: {
      origin: "*",
    },
    pingInterval: 10000,
    pingTimeout: 5000,
    transports: ["websocket"],
  });

  await registerRoutes(app);
  await buildAdminRouter(app);
  // host: "0.0.0.0"
  app.listen({ port: PORT }, (err, addr) => {
    if (err) {
      console.log(err);
    } else {
      console.log(
        `Blinkit Server started on http://localhost:${PORT}${admin.options.rootPath}`
      );
    }
  });

  app.ready().then(() => {
    app.io.on("connection", (socket) => {
      console.log("A User Connected");

      socket.on("joinRoom", (orderId) => {
        socket.join(orderId);
        console.log(`User Joined room ${orderId}`);
      });

      socket.on("disconnect", () => {
        console.log("User Disonnected");
      });
    });
  });
};

start();
