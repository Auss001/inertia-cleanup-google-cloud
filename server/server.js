const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { spawn, spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const publicDir = path.join(root, "public");
const dataDir = path.join(root, "data");
const uploadDir = path.join(dataDir, "uploads");
const exportDir = path.join(dataDir, "exports");
const port = Number(process.env.PORT || 4173);
const maxUploadBytes = Number(process.env.MAX_UPLOAD_MB || 2048) * 1024 * 1024;
const ffmpegBin = resolveFfmpeg();
const ffprobeBin = resolveFfprobe();

for (const dir of [dataDir, uploadDir, exportDir]) fs.mkdirSync(dir, { recursive: true });

const jobs = new Map();
const logFile = path.join(dataDir, "server.log");
process.on("uncaughtException", (error) => {
  logLine(`uncaughtException: ${error.stack || error.message}`);
});
process.on("unhandledRejection", (error) => {
  logLine(`unhandledRejection: ${error.stack || error}`);
});
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime"
};

if (process.argv.includes("--check")) {
  const probe = spawnSync(ffmpegBin, ["-version"], { encoding: "utf8" });
  if (probe.status === 0) {
    console.log("OK: FFmpeg found.");
    process.exit(0);
  }
  console.error("FFmpeg was not found. Install FFmpeg or set FFMPEG_PATH to ffmpeg.exe.");
  process.exit(1);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === "GET" && url.pathname === "/api/health") return json(res, 200, health());
    if (req.method === "GET" && url.pathname.startsWith("/api/jobs/")) return getJob(req, res, url);
    if (req.method === "POST" && url.pathname === "/api/jobs") return createJob(req, res);
    if (req.method === "GET" && url.pathname.startsWith("/download/")) return downloadExport(req, res, url);
    if (req.method === "GET") return serveStatic(res, url.pathname);
    json(res, 405, { error: "Method not allowed" });
  } catch (error) {
    json(res, 500, { error: error.message });
  }
});

server.listen(port, () => {
  logLine(`server listening on http://localhost:${port}`);
  console.log(`Inertia Cleanup running at http://localhost:${port}`);
});

function health() {
  const probe = spawnSync(ffmpegBin, ["-version"], { encoding: "utf8" });
  return {
    ok: true,
    ffmpeg: probe.status === 0,
    ffmpegPath: ffmpegBin,
    ffprobePath: ffprobeBin,
    maxUploadMb: Math.round(maxUploadBytes / 1024 / 1024),
    platform: os.platform()
  };
}

function resolveFfmpeg() {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  const vendorDir = path.join(root, "vendor", "ffmpeg");
  const direct = path.join(vendorDir, "bin", process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
  if (fs.existsSync(direct)) return direct;
  if (fs.existsSync(vendorDir)) {
    const found = findFile(vendorDir, process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
    if (found) return found;
  }
  return "ffmpeg";
}

function resolveFfprobe() {
  if (process.env.FFPROBE_PATH) return process.env.FFPROBE_PATH;
  if (ffmpegBin !== "ffmpeg") {
    const sibling = path.join(path.dirname(ffmpegBin), process.platform === "win32" ? "ffprobe.exe" : "ffprobe");
    if (fs.existsSync(sibling)) return sibling;
  }
  const vendorDir = path.join(root, "vendor", "ffmpeg");
  const direct = path.join(vendorDir, "bin", process.platform === "win32" ? "ffprobe.exe" : "ffprobe");
  if (fs.existsSync(direct)) return direct;
  if (fs.existsSync(vendorDir)) {
    const found = findFile(vendorDir, process.platform === "win32" ? "ffprobe.exe" : "ffprobe");
    if (found) return found;
  }
  return "ffprobe";
}

function findFile(dir, name) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isFile() && entry.name.toLowerCase() === name.toLowerCase()) return fullPath;
    if (entry.isDirectory()) {
      const found = findFile(fullPath, name);
      if (found) return found;
    }
  }
  return null;
}

async function createJob(req, res) {
  const contentType = req.headers["content-type"] || "";
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!match) return json(res, 400, { error: "Expected multipart/form-data upload." });

  const body = await readRequest(req);
  const parts = parseMultipart(body, match[1] || match[2]);
  const filePart = parts.find((part) => part.filename);
  if (!filePart) return json(res, 400, { error: "Upload a media file." });

  const jobId = crypto.randomUUID();
  const fields = Object.fromEntries(parts.filter((part) => !part.filename).map((part) => [part.name, part.data.toString("utf8")]));
  const ext = allowedExt(path.extname(filePart.filename).toLowerCase());
  if (!ext) return json(res, 400, { error: "Unsupported file type. Use mp4, mov, webm, png, jpg, jpeg, or webp." });
  const region = safeJson(fields.region, null);
  if (!isValidRegion(region)) return json(res, 400, { error: "Select a cleanup region before processing." });

  const inputPath = path.join(uploadDir, `${jobId}${ext}`);
  fs.writeFileSync(inputPath, filePart.data);

  const isVideo = [".mp4", ".mov", ".webm"].includes(ext);
  const outputExt = isVideo ? ".mp4" : ".png";
  const outputPath = path.join(exportDir, `${jobId}${outputExt}`);
  const job = {
    id: jobId,
    status: "queued",
    stage: "analyzing",
    progress: 20,
    filename: filePart.filename,
    outputName: `inertia-cleanup-${path.parse(filePart.filename).name}${outputExt}`,
    isVideo,
    createdAt: new Date().toISOString()
  };
  jobs.set(jobId, job);
  if (process.env.INLINE_JOBS === "true") {
    await processJob(job, inputPath, outputPath, fields, region);
    return json(res, job.status === "complete" ? 200 : 500, job);
  }
  json(res, 202, job);
  processJob(job, inputPath, outputPath, fields, region).catch((error) => {
    job.status = "failed";
    job.stage = "failed";
    job.error = error.message;
    logLine(`job ${job.id} failed unexpectedly: ${error.stack || error.message}`);
  });
}

function processJob(job, inputPath, outputPath, fields, region) {
  return new Promise((resolve) => {
    const options = safeJson(fields.options, {});
    job.stage = "analyzing";
    job.progress = Math.max(job.progress, 24);
    const mediaInfo = probeMedia(inputPath);
    job.progress = Math.max(job.progress, 30);
    const safeRegion = clampRegion(region, mediaInfo, options);
    const filter = buildFilter(safeRegion, options);
    const args = ["-hide_banner", "-y", "-i", inputPath];

    if (job.isVideo) {
      args.push("-map", "0:v:0", "-map", "0:a?", "-vf", filter);
      args.push("-c:v", "libx264", "-preset", options.preset || "slow", "-crf", String(clamp(Number(options.crf || 16), 10, 28)));
      args.push("-pix_fmt", "yuv420p", "-movflags", "+faststart", "-c:a", "copy", outputPath);
    } else {
      args.push("-vf", filter, "-compression_level", "3", outputPath);
    }

    job.status = "processing";
    job.stage = "processing";
    job.progress = Math.max(job.progress, 34);
    job.command = `ffmpeg ${args.map((arg) => (arg.includes(" ") ? `"${arg}"` : arg)).join(" ")}`;
    const child = spawn(ffmpegBin, args, { windowsHide: true });
    let settled = false;
    const finish = () => {
      if (!settled) {
        settled = true;
        resolve(job);
      }
    };
    child.stderr.setEncoding("utf8");
    let stderrTail = "";
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderrTail = `${stderrTail}${text}`.slice(-2400);
      logLine(`job ${job.id}: ${text.trim().slice(-1200)}`);
      const time = text.match(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/);
      if (time) {
        const processedSeconds = Number(time[1]) * 3600 + Number(time[2]) * 60 + Number(time[3]);
        if (mediaInfo.duration > 0) {
          const ratio = Math.min(1, processedSeconds / mediaInfo.duration);
          job.progress = Math.max(job.progress, Math.round(34 + ratio * 58));
        } else {
          job.progress = Math.max(job.progress, Math.min(92, job.progress + 2));
        }
      }
      if (/error|invalid|failed/i.test(text)) job.lastLog = text.slice(-1200);
    });
    child.on("error", (error) => {
      job.status = "failed";
      job.stage = "failed";
      job.error = error.code === "ENOENT" ? "FFmpeg was not found. Install FFmpeg or set FFMPEG_PATH." : error.message;
      logLine(`job ${job.id} failed to start: ${job.error}`);
      finish();
    });
    child.on("close", (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        job.stage = "finalizing";
        job.progress = 98;
        job.status = "complete";
        job.stage = "complete";
        job.progress = 100;
        job.downloadUrl = `/download/${job.id}`;
        job.completedAt = new Date().toISOString();
      } else if (job.status !== "failed") {
        job.status = "failed";
        job.stage = "failed";
        job.error = summarizeFfmpegError(stderrTail, code);
        job.lastLog = stderrTail.slice(-1200);
        logLine(`job ${job.id} failed: ${job.error}`);
      }
      finish();
    });
  });
}

function probeMedia(inputPath) {
  const probe = spawnSync(ffprobeBin, [
    "-v", "error",
    "-select_streams", "v:0",
    "-show_entries", "stream=width,height:format=duration",
    "-of", "json",
    inputPath
  ], { encoding: "utf8" });
  if (probe.status !== 0) return {};
  const parsed = safeJson(probe.stdout, {});
  const stream = parsed.streams?.[0] || {};
  return {
    width: Number(stream.width) || 0,
    height: Number(stream.height) || 0,
    duration: Number(parsed.format?.duration) || 0
  };
}

function clampRegion(region, mediaInfo, options) {
  const mediaWidth = Number(mediaInfo.width || region.mediaWidth || 0);
  const mediaHeight = Number(mediaInfo.height || region.mediaHeight || 0);
  const mode = options.mode || "delogo";
  const margin = mode === "delogo" ? 4 : 0;
  const rawWidth = Math.max(8, Math.round(Number(region.width || 8)));
  const rawHeight = Math.max(8, Math.round(Number(region.height || 8)));
  const width = mediaWidth ? Math.min(rawWidth, Math.max(8, mediaWidth - margin * 2)) : rawWidth;
  const height = mediaHeight ? Math.min(rawHeight, Math.max(8, mediaHeight - margin * 2)) : rawHeight;
  const maxX = mediaWidth ? Math.max(margin, mediaWidth - margin - width) : Math.round(Number(region.x || 0));
  const maxY = mediaHeight ? Math.max(margin, mediaHeight - margin - height) : Math.round(Number(region.y || 0));
  const x = clamp(Math.round(Number(region.x || 0)), margin, maxX);
  const y = clamp(Math.round(Number(region.y || 0)), margin, maxY);
  return { ...region, x, y, width, height };
}

function summarizeFfmpegError(stderr, code) {
  const clean = stderr
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => /error|invalid|failed|outside|cannot|unable/i.test(line))
    .slice(-3)
    .join(" ");
  return clean || `FFmpeg exited with code ${code}. Try a smaller region, or use Cover/Ultra Cover for edge watermarks.`;
}

function buildFilter(region, options) {
  const w = Math.max(2, Math.round(Number(region.width || 2)));
  const h = Math.max(2, Math.round(Number(region.height || 2)));
  const x = Math.max(0, Math.round(Number(region.x || 0)));
  const y = Math.max(0, Math.round(Number(region.y || 0)));
  const mode = options.mode || "delogo";
  if (mode === "cover") {
    const color = String(options.color || "#101820").replace("#", "0x");
    const opacity = clamp(Number(options.opacity || 0.88), 0.1, 1);
    return `drawbox=x=${x}:y=${y}:w=${w}:h=${h}:color=${color}@${opacity}:t=fill`;
  }
  if (mode === "ultra-cover") {
    const color = String(options.color || "#101820").replace("#", "0x");
    const maxStrength = Math.max(2, Math.floor(Math.min(w, h) / 4));
    const strength = clamp(Number(options.strength || 24), 2, maxStrength);
    return `split[main][tmp];[tmp]crop=${w}:${h}:${x}:${y},boxblur=${strength}:2[blur];[main][blur]overlay=${x}:${y},drawbox=x=${x}:y=${y}:w=${w}:h=${h}:color=${color}@0.92:t=fill`;
  }
  if (mode === "blur") {
    const maxStrength = Math.max(2, Math.floor(Math.min(w, h) / 4));
    const strength = clamp(Number(options.strength || 14), 2, maxStrength);
    return `split[main][tmp];[tmp]crop=${w}:${h}:${x}:${y},boxblur=${strength}:1[blur];[main][blur]overlay=${x}:${y}`;
  }
  return `delogo=x=${x}:y=${y}:w=${w}:h=${h}:show=0`;
}

function getJob(req, res, url) {
  const id = url.pathname.split("/").pop();
  const job = jobs.get(id);
  if (!job) return json(res, 404, { error: "Job not found" });
  json(res, 200, job);
}

function downloadExport(req, res, url) {
  const id = path.basename(url.pathname);
  const job = jobs.get(id);
  if (!job || job.status !== "complete") return json(res, 404, { error: "Export not ready" });
  const file = path.join(exportDir, `${id}${job.isVideo ? ".mp4" : ".png"}`);
  res.writeHead(200, {
    "Content-Type": job.isVideo ? "video/mp4" : "image/png",
    "Content-Disposition": `attachment; filename="${job.outputName.replace(/"/g, "")}"`
  });
  fs.createReadStream(file).pipe(res);
}

function serveStatic(res, pathname) {
  const cleanPath = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
  const filePath = path.resolve(publicDir, `.${cleanPath}`);
  if (!filePath.startsWith(publicDir)) return json(res, 403, { error: "Forbidden" });
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return json(res, 404, { error: "Not found" });
  res.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
}

function parseMultipart(buffer, boundary) {
  const delimiter = Buffer.from(`--${boundary}`);
  const parts = [];
  let start = buffer.indexOf(delimiter) + delimiter.length + 2;
  while (start > delimiter.length) {
    const end = buffer.indexOf(delimiter, start);
    if (end < 0) break;
    const part = buffer.slice(start, end - 2);
    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd > -1) {
      const headers = part.slice(0, headerEnd).toString("utf8");
      const data = part.slice(headerEnd + 4);
      const disposition = parseDisposition(headers);
      if (disposition?.name) parts.push({ name: disposition.name, filename: disposition.filename, data });
    }
    start = end + delimiter.length + 2;
  }
  return parts;
}

function parseDisposition(headers) {
  const line = headers.split(/\r?\n/).find((header) => header.toLowerCase().startsWith("content-disposition:"));
  if (!line) return null;
  const params = {};
  for (const piece of line.split(";").slice(1)) {
    const [rawKey, ...rawValue] = piece.split("=");
    const key = rawKey?.trim().toLowerCase();
    const value = rawValue.join("=").trim().replace(/^"|"$/g, "");
    if (key) params[key] = value;
  }
  return params;
}

function readRequest(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > maxUploadBytes) {
        reject(new Error("Upload is too large."));
        req.destroy();
      } else {
        chunks.push(chunk);
      }
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function safeJson(value, fallback) {
  try {
    return JSON.parse(value || "");
  } catch {
    return fallback;
  }
}

function allowedExt(ext) {
  return [".mp4", ".mov", ".webm", ".png", ".jpg", ".jpeg", ".webp"].includes(ext) ? ext : null;
}

function isValidRegion(region) {
  return Boolean(
    region &&
    Number(region.x) >= 0 &&
    Number(region.y) >= 0 &&
    Number(region.width) >= 8 &&
    Number(region.height) >= 8
  );
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function logLine(message) {
  try {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${message}\n`);
  } catch {
    // Logging must never break request handling.
  }
}
