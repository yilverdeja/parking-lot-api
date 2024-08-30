import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import parkingSessionRoute from "./routes/parkingSessions";
import parkingLotRoute from "./routes/parkingLots";
import { handleErrors } from "./middleware/handleErrors";

// Constants
const PORT = process.env.PORT || 5000;
const MONGODB_URL = process.env.DB_URL || "mongodb://localhost/parkingLot";

// Connect to DB
mongoose
  .connect(MONGODB_URL)
  .then(() => console.log("Connected to Database"))
  .catch((err) => console.log(err));

// Server
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use("/api/parkingSessions", parkingSessionRoute);
app.use("/api/parkingLots", parkingLotRoute);
app.use(handleErrors);

// Routes
app.get("/", async (req, res) => {
  res.send("Getting server");
});

// Connect Server
app.listen(PORT, () => {
  console.log("Listening to port: ", PORT);
});
