const mongoose = require("mongoose");

const connectDB = () => {
  mongoose
    .connect(process.env.DB_URL)
    .then((data) => {
      console.log(`MongoDB is connected with server: ${data.connection.host}`);
    })
    .catch((err) => {
      console.log(`error while connecting to the mongodb ${err}`);
    });
};

module.exports = connectDB;
