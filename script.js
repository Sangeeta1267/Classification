// Model files must sit in the SAME folder as this file:
// model.json, weights.bin, metadata.json
const MODEL_URL = "./model.json";
const METADATA_URL = "./metadata.json";

const fileInput = document.getElementById("file-input");
const dropzone = document.getElementById("dropzone");
const preview = document.getElementById("preview");
const dropText = document.getElementById("drop-text");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");

let model = null;

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.classList.toggle("error", isError);
}

async function loadModel() {
  try {
    model = await tmImage.load(MODEL_URL, METADATA_URL);
    setStatus("Model ready. Choose an image.");
  } catch (err) {
    console.error(err);
    const hint = location.protocol === "file:"
      ? "You opened the page by double-clicking. Run a local server instead (see instructions)."
      : "Check that model.json, weights.bin and metadata.json are in the same folder as index.html.";
    setStatus("Could not load the model: " + (err && err.message ? err.message : err) + " — " + hint, true);
  }
}

async function handleFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    setStatus("Please choose an image file.", true);
    return;
  }
  if (!model) {
    setStatus("The model is not loaded yet.", true);
    return;
  }

  const url = URL.createObjectURL(file);
  preview.src = url;
  preview.hidden = false;
  dropText.textContent = "Click or drop to choose a different photo";

  try {
    await preview.decode();
    setStatus("Analyzing…");
    const predictions = await model.predict(preview);
    showResults(predictions);
    setStatus("");
  } catch (err) {
    console.error(err);
    setStatus("Could not analyze that image: " + (err && err.message ? err.message : err), true);
  }
}

function showResults(predictions) {
  predictions.sort((a, b) => b.probability - a.probability);
  const top = predictions[0];

  resultsEl.hidden = false;
  resultsEl.innerHTML = `<p class="verdict">It looks like a ${top.className} (${(top.probability * 100).toFixed(1)}%)</p>`;

  predictions.forEach((p) => {
    const pct = (p.probability * 100).toFixed(1);
    const row = document.createElement("div");
    row.innerHTML = `
      <div class="row-top"><span>${p.className}</span><span>${pct}%</span></div>
      <div class="bar ${p.className.toLowerCase()}"><span></span></div>`;
    resultsEl.appendChild(row);
    requestAnimationFrame(() => {
      row.querySelector(".bar > span").style.width = pct + "%";
    });
  });
}

fileInput.addEventListener("change", (e) => handleFile(e.target.files[0]));

["dragenter", "dragover"].forEach((ev) =>
  dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add("drag"); })
);
["dragleave", "drop"].forEach((ev) =>
  dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.remove("drag"); })
);
dropzone.addEventListener("drop", (e) => handleFile(e.dataTransfer.files[0]));

loadModel();
