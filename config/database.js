const { default: mongoose } = require("mongoose");

class Connection {
  constructor() {
    const url = process.env.MONGO_URL;

    this.connect(url)
      .then(() => {
        console.log("✔ Database Connected");
      })
      .catch((err) => {
        console.error("✘ MONGODB ERROR: ", err.message);
      });
  }

  async connect(url) {
    try {
      await mongoose.connect(url);
    } catch (e) {
      throw e;
    }
  }
}

module.exports = new Connection();
