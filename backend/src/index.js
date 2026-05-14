require("dotenv").config();
process.env.TZ = "Asia/Ho_Chi_Minh";
//start server
const express = require("express");
const cors = require("cors");

const apiRoutes = require("./routes/api");

const app = express();

//middleware
app.use(cors());
app.use(express.json());

app.use("/api", apiRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});