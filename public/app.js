const els = {
  file: document.querySelector("#fileInput"),
  canvas: document.querySelector("#canvas"),
  video: document.querySelector("#video"),
  image: document.querySelector("#image"),
  empty: document.querySelector("#empty"),
  fileName: document.querySelector("#fileName"),
  process: document.querySelector("#processButton"),
  server: document.querySelector("#serverStatus"),
  badge: document.querySelector("#jobBadge"),
  badgeText: document.querySelector("#jobBadgeText"),
  progress: document.querySelector("#progress"),
  progressBar: document.querySelector(".progress"),
  progressStage: document.querySelector("#progressStage"),
  progressPercent: document.querySelector("#progressPercent"),
  processSteps: document.querySelector("#processSteps"),
  helper: document.querySelector("#helper"),
  download: document.querySelector("#download"),
  crf: document.querySelector("#crf"),
  strength: document.querySelector("#strength"),
  color: document.querySelector("#color")
};

const ctx = els.canvas.getContext("2d");
let file = null;
let mediaType = null;
let objectUrl = null;
let region = null;
let draft = null;
let drawing = false;
let frameId = null;

if (window.location.protocol === "file:") {
  document.querySelector("#fileWarning").hidden = false;
}

checkServer();
setInterval(checkServer, 10000);

document.querySelectorAll("input[name='mode']").forEach((input) => {
  input.addEventListener("change", draw);
});

[els.strength, els.color].forEach((input) => {
  input.addEventListener("input", draw);
});

els.file.addEventListener("change", () => {
  const selected = els.file.files?.[0];
  if (selected) loadMedia(selected);
});

els.process.addEventListener("click", submitJob);

els.canvas.addEventListener("pointerdown", (event) => {
  if (!file) return;
  drawing = true;
  const point = canvasPoint(event);
  draft = { x: point.x, y: point.y, width: 0, height: 0 };
  els.canvas.setPointerCapture(event.pointerId);
});

els.canvas.addEventListener("pointermove", (event) => {
  if (!drawing || !draft) return;
  const point = canvasPoint(event);
  draft.width = point.x - draft.x;
  draft.height = point.y - draft.y;
  draw();
});

els.canvas.addEventListener("pointerup", (event) => {
  if (!drawing || !draft) return;
  drawing = false;
  els.canvas.releasePointerCapture(event.pointerId);
  region = normalize(draft);
  draft = null;
  els.helper.textContent = region.width > 8 && region.height > 8
    ? "Region selected. The backend will render the full file and retain source audio for videos."
    : "Drag a larger area before processing.";
  draw();
  updateProcessState();
});

function loadMedia(selected) {
  file = selected;
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = URL.createObjectURL(file);
  region = null;
  draft = null;
  els.download.hidden = true;
  setProgress(0, "Ready", null, false);
  setBadge("Ready", "ready");
  els.empty.hidden = true;
  els.fileName.textContent = file.name;

  if (file.type.startsWith("video/")) {
    mediaType = "video";
    els.image.hidden = true;
    els.video.hidden = false;
    els.video.src = objectUrl;
    els.video.onloadedmetadata = () => {
      sizeCanvas(els.video.videoWidth, els.video.videoHeight);
      drawLoop();
      els.helper.textContent = "Drag over the area to clean.";
      updateProcessState();
    };
  } else {
    mediaType = "image";
    cancelAnimationFrame(frameId);
    els.video.pause();
    els.video.hidden = true;
    els.image.src = objectUrl;
    els.image.onload = () => {
      sizeCanvas(els.image.naturalWidth, els.image.naturalHeight);
      draw();
      els.helper.textContent = "Drag over the area to clean.";
      updateProcessState();
    };
  }
}

function drawLoop() {
  cancelAnimationFrame(frameId);
  const tick = () => {
    draw();
    frameId = requestAnimationFrame(tick);
  };
  tick();
}

function draw() {
  ctx.clearRect(0, 0, els.canvas.width, els.canvas.height);
  if (mediaType === "video" && els.video.readyState >= 2) ctx.drawImage(els.video, 0, 0, els.canvas.width, els.canvas.height);
  if (mediaType === "image" && els.image.complete) ctx.drawImage(els.image, 0, 0, els.canvas.width, els.canvas.height);
  if (region) {
    previewCleanup(region);
    drawBox(region, "rgba(15, 118, 110, 0.08)", "#18a99c");
  }
  if (draft) drawBox(normalize(draft), "rgba(201, 136, 46, 0.16)", "#e3a441");
}

function previewCleanup(box) {
  const mode = document.querySelector("input[name='mode']:checked")?.value || "delogo";
  if (mode === "cover" || mode === "ultra-cover") {
    ctx.save();
    ctx.fillStyle = hexToRgba(els.color.value, mode === "ultra-cover" ? 0.92 : 0.88);
    ctx.fillRect(box.x, box.y, box.width, box.height);
    if (mode === "ultra-cover") {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.62)";
      ctx.lineWidth = Math.max(2, els.canvas.width / 640);
      ctx.strokeRect(box.x + 3, box.y + 3, Math.max(0, box.width - 6), Math.max(0, box.height - 6));
    }
    ctx.restore();
    return;
  }

  const strength = Math.max(2, Math.min(Number(els.strength.value || 14), Math.floor(Math.min(box.width, box.height) / 4) || 2));
  const temp = document.createElement("canvas");
  temp.width = box.width;
  temp.height = box.height;
  const tempCtx = temp.getContext("2d");
  tempCtx.filter = `blur(${strength}px)`;
  tempCtx.drawImage(els.canvas, box.x, box.y, box.width, box.height, 0, 0, box.width, box.height);
  ctx.drawImage(temp, box.x, box.y);

  if (mode === "delogo") {
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.fillRect(box.x, box.y, box.width, box.height);
    ctx.restore();
  }
}

function drawBox(box, fill, stroke) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = Math.max(2, els.canvas.width / 520);
  ctx.setLineDash([12, 8]);
  ctx.fillRect(box.x, box.y, box.width, box.height);
  ctx.strokeRect(box.x, box.y, box.width, box.height);
  ctx.restore();
}

async function submitJob() {
  if (!file || !region) return;
  els.process.disabled = true;
  els.download.hidden = true;
  setBadge("Uploading", "uploading");
  setProgress(0, "Uploading file", "uploading", true);
  els.helper.textContent = "Uploading your media to the server...";

  const mode = document.querySelector("input[name='mode']:checked").value;
  const form = new FormData();
  form.append("file", file);
  form.append("region", JSON.stringify({ ...region, mediaWidth: els.canvas.width, mediaHeight: els.canvas.height }));
  form.append("options", JSON.stringify({
    mode,
    crf: Number(els.crf.value),
    strength: Number(els.strength.value),
    color: els.color.value,
    opacity: 0.88
  }));

  try {
    const job = await uploadJob(form);
    setProgress(Math.max(20, job.progress || 20), "Analyzing media", "analyzing", true);
    setBadge("Analyzing", "analyzing");
    pollJob(job.id);
  } catch (error) {
    setBadge("Error", "error");
    setProgress(0, "Upload failed", null, false);
    els.helper.textContent = error.message;
    updateProcessState();
  }
}

function uploadJob(form) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/jobs");
    xhr.responseType = "json";
    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return;
      const uploadPercent = Math.round((event.loaded / event.total) * 20);
      setProgress(uploadPercent, "Uploading file", "uploading", true);
      els.helper.textContent = `Uploading... ${Math.round((event.loaded / event.total) * 100)}%`;
    });
    xhr.addEventListener("load", () => {
      const job = xhr.response || safeParse(xhr.responseText);
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(job?.error || "Job failed to start."));
        return;
      }
      resolve(job);
    });
    xhr.addEventListener("error", () => reject(new Error("Upload failed. Check that the backend is running.")));
    xhr.send(form);
  });
}

async function pollJob(id) {
  try {
    const response = await fetch(`/api/jobs/${id}`);
    const job = await response.json();
    if (!response.ok) throw new Error(job.error || "Job not found.");

    const status = String(job.status || "processing").toLowerCase();
    const stage = String(job.stage || status).toLowerCase();
    const progress = Number(job.progress || 0);

    if (status === "complete") {
      setBadge("Complete", "complete");
      setProgress(100, "Export complete", "complete", true);
      els.helper.textContent = "Finished. Your export is ready to download; source audio is retained when present.";
      els.download.href = job.downloadUrl;
      els.download.download = job.outputName;
      els.download.hidden = false;
      updateProcessState();
      return;
    }

    if (status === "failed") {
      setBadge("Error", "error");
      setProgress(progress, "Processing failed", stage, true);
      els.helper.textContent = job.error || job.lastLog || "Processing failed.";
      updateProcessState();
      return;
    }

    const label = stageLabel(stage);
    setBadge(label, stage);
    setProgress(progress, label, stage, true);
    els.helper.textContent = progress > 0 ? `${label}... ${Math.round(progress)}%` : `${label}...`;
    setTimeout(() => pollJob(id), 900);
  } catch (error) {
    setBadge("Error", "error");
    els.helper.textContent = error.message;
    updateProcessState();
  }
}

function setBadge(text, state = "ready") {
  els.badgeText.textContent = text;
  els.badge.className = `badge badge-${state}`;
}

function setProgress(value, label, stage = null, showSteps = false) {
  const percent = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  els.progress.style.width = `${percent}%`;
  els.progressBar.setAttribute("aria-valuenow", String(percent));
  els.progressStage.textContent = label;
  els.progressPercent.textContent = `${percent}%`;
  els.processSteps.hidden = !showSteps;
  updateSteps(stage);
}

function updateSteps(stage) {
  const order = ["uploading", "analyzing", "processing", "finalizing"];
  const normalized = stage === "complete" ? "finalizing" : stage;
  const current = order.indexOf(normalized);
  els.processSteps.querySelectorAll("[data-step]").forEach((item, index) => {
    item.classList.toggle("is-done", stage === "complete" || (current > -1 && index < current));
    item.classList.toggle("is-active", stage !== "complete" && index === current);
  });
}

function stageLabel(stage) {
  return ({
    queued: "Queued",
    uploading: "Uploading",
    analyzing: "Analyzing",
    processing: "Processing",
    finalizing: "Finalizing"
  })[stage] || "Processing";
}

function safeParse(value) {
  try { return JSON.parse(value || "{}"); } catch { return {}; }
}

async function checkServer() {
  try {
    const response = await fetch("/api/health");
    const health = await response.json();
    if (health.ffmpeg) {
      els.server.textContent = `Server online · FFmpeg ready · ${health.maxUploadMb} MB limit`;
      if (!file) setBadge("Ready", "ready");
    } else {
      els.server.textContent = "Server online · FFmpeg unavailable";
      setBadge("Setup needed", "error");
    }
  } catch {
    els.server.textContent = "Server offline · Start it with npm start";
    setBadge("Offline", "offline");
  }
  updateProcessState();
}

function updateProcessState() {
  const disabled = !file || !region || els.server.textContent.includes("missing") || els.server.textContent.includes("not running");
  els.process.disabled = disabled;
}

function sizeCanvas(width, height) {
  els.canvas.width = Math.max(1, width);
  els.canvas.height = Math.max(1, height);
}

function normalize(raw) {
  const x = Math.max(0, Math.min(raw.x, raw.x + raw.width));
  const y = Math.max(0, Math.min(raw.y, raw.y + raw.height));
  const width = Math.min(els.canvas.width - x, Math.abs(raw.width));
  const height = Math.min(els.canvas.height - y, Math.abs(raw.height));
  return {
    x,
    y,
    width,
    height
  };
}

function canvasPoint(event) {
  const rect = els.canvas.getBoundingClientRect();
  const renderedRatio = rect.width / rect.height;
  const canvasRatio = els.canvas.width / els.canvas.height;
  let drawWidth = rect.width;
  let drawHeight = rect.height;
  let offsetX = 0;
  let offsetY = 0;
  if (renderedRatio > canvasRatio) {
    drawWidth = rect.height * canvasRatio;
    offsetX = (rect.width - drawWidth) / 2;
  } else {
    drawHeight = rect.width / canvasRatio;
    offsetY = (rect.height - drawHeight) / 2;
  }
  return {
    x: Math.max(0, Math.min(els.canvas.width, ((event.clientX - rect.left - offsetX) / drawWidth) * els.canvas.width)),
    y: Math.max(0, Math.min(els.canvas.height, ((event.clientY - rect.top - offsetY) / drawHeight) * els.canvas.height))
  };
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  const value = parseInt(clean.length === 3 ? clean.split("").map((char) => char + char).join("") : clean, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
