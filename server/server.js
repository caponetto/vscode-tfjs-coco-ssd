const fs = require("fs");
const express = require("express");
const cors = require("cors");
const cocoSsd = require("@tensorflow-models/coco-ssd");
const tf = require("@tensorflow/tfjs-node");
const endpoint_path = "/detect";

let model = undefined;

const app = express();
app.use(cors());

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

app.get(endpoint_path, async (req, res) => {
  if (!model) {
    model = await cocoSsd.load();
  }

  const filePath = req.query.filePath;
  if (fs.existsSync(filePath)) {
    const imageBuffer = fs.readFileSync(filePath);
    const imageTensor = tf.node.decodeImage(imageBuffer);
    return res.json(await model.detect(imageTensor));
  }
  return res.status(400).send({ message: "Invalid file" });
});
