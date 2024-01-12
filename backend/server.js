const app = require("./app.js");
const connectDB = require("./config/db.js");

const cloudinary = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

connectDB();
app.listen(process.env.PORT, () => {
  console.log(`server is running at port no. ${process.env.PORT}`);
});
