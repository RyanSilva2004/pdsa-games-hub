require("dotenv").config();
import gameRoutes from "./routes/gameRoutes";
const { API_PORT, FRONTEND_PORT } = require("./config");
const express = require("express");
const cors = require("cors");

const app = express();

app.use(
  cors({
    origin: `http://localhost:${process.env.API_PORT}`,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.get("/api", gameRoutes);

app.listen(process.env.API_PORT, () => {
  console.log(`testing -  http://localhost:${process.env.API_PORT}`);
});
