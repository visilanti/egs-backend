const express = require("express");
const cors = require("cors");
require("dotenv").config();
const scheduleRoutes = require("./src/routes/scheduleRoutes");

const app = express();
app.use(cors());
app.use(express.json());

//Routes
app.use('/api/schedules', scheduleRoutes);

//vercel serverless config
module.exports = app;

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  })
}