const { default: mongoose } = require("mongoose");

const productSchema = mongoose.model(
  "scraping_datas",
  mongoose.Schema(
    {
      title: String,
      price: Number,
      url: { type: String, unique: true },
      image: String,
      product_info: Object,
    },
    { timestamps: true }
  )
);

const client = mongoose.connections;

const collection = client[0].collection("scraping_datas");

async function saveProduct(data) {
  const result = await collection.findOne({
    url: data?.url,
  });
  console.log(result);

  if (result) {
    try {
      const filter = { url: data?.url };
      const updateDoc = {
        $set: data,
      };
      await collection.updateOne(filter, updateDoc);
      console.log("data successfully updated");
    } catch (err) {
      console.log("Error updating document:" + err);
    }
  } else {
    try {
      const product = new productSchema(data);
      await product.save();
      console.log("data successfully created");
    } catch (err) {
      console.log("Error adding document:" + err);
    }
  }
}

module.exports = saveProduct;
