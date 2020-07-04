/* eslint-disable no-undef */
(function () {
  const vscode = acquireVsCodeApi();

  async function loadImageFromData(context) {
    const blob = new Blob([context], { type: "image/png" });
    const url = URL.createObjectURL(blob);
    try {
      const img = document.createElement("img");
      img.crossOrigin = "anonymous";
      img.src = url;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  class ReadOnlyImageEditor {
    constructor(parent, spinner) {
      this.parent = parent;
      this.spinner = spinner;

      this.canvas = document.createElement("canvas");
      this.context = this.canvas.getContext("2d");
      this.parent.append(this.canvas);
    }

    showLoading() {
      this.spinner.style.removeProperty("display");
    }

    hideLoading() {
      this.spinner.style.display = "none";
    }

    async reset(data) {
      this.showLoading();

      const image = await loadImageFromData(data);
      const objects = await this.detect(image);

      this.drawImage(image);
      this.drawPredictions(objects);

      this.hideLoading();
    }

    async detect(image) {
      const cocoModel = await cocoSsd.load(); // it should be loaded once
      return await cocoModel.detect(image);
    }

    drawImage(image) {
      this.canvas.width = this.canvas.width = image.naturalWidth;
      this.canvas.height = this.canvas.height = image.naturalHeight;
      this.context.drawImage(image, 0, 0);
    }

    drawPredictions(objects) {
      objects.forEach((obj) => {
        const color =
          "rgb(" +
          Math.floor(Math.random() * 256) +
          "," +
          Math.floor(Math.random() * 256) +
          "," +
          Math.floor(Math.random() * 256) +
          ")";
        this.context.beginPath();
        this.context.rect(...obj.bbox);
        this.context.lineWidth = 1;
        this.context.font = "10px Arial";
        this.context.strokeStyle = color;
        this.context.fillStyle = color;
        this.context.stroke();
        this.context.fillText(
          obj.score.toFixed(3) + " " + obj.class,
          obj.bbox[0],
          obj.bbox[1] > 10 ? obj.bbox[1] - 5 : 10
        );
      });
    }
  }

  const editor = new ReadOnlyImageEditor(
    document.querySelector(".canvas"),
    document.querySelector(".spinner")
  );

  window.addEventListener("message", async (e) => {
    const { type, body } = e.data;
    if (type === "init") {
      await editor.reset(new Uint8Array(body.value.data));
    }
  });

  vscode.postMessage({ type: "ready" });
})();
