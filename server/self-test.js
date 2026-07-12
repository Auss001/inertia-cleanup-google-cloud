const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const root = path.resolve(__dirname, "..");
const port = 4181;
const baseUrl = `http://localhost:${port}`;
const selfTestDir = path.join(root, "data", "self-test");
const inputPath = path.join(selfTestDir, "test-input.mp4");
const outputPath = path.join(selfTestDir, "test-output.mp4");
const edgeOutputPath = path.join(selfTestDir, "test-edge-delogo-output.mp4");

fs.mkdirSync(selfTestDir, { recursive: true });

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

async function main() {
  const server = spawn(process.execPath, ["server/server.js"], {
    cwd: root,
    env: { ...process.env, PORT: String(port) },
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"]
  });

  let serverLog = "";
  server.stdout.on("data", (chunk) => { serverLog += chunk.toString(); });
  server.stderr.on("data", (chunk) => { serverLog += chunk.toString(); });

  try {
    const health = await waitForHealth();
    if (!health.ffmpeg) throw new Error("FFmpeg is not available. Run download-ffmpeg.cmd first.");

    const ffmpeg = health.ffmpegPath;
    const ffprobe = path.join(path.dirname(ffmpeg), process.platform === "win32" ? "ffprobe.exe" : "ffprobe");
    await run(ffmpeg, [
      "-hide_banner", "-loglevel", "error", "-y",
      "-f", "lavfi", "-i", "testsrc=size=320x180:rate=24:duration=2",
      "-f", "lavfi", "-i", "sine=frequency=880:duration=2",
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", inputPath
    ]);

    await runCleanupJob({
      region: { x: 20, y: 20, width: 80, height: 40 },
      options: { mode: "ultra-cover", crf: 23, strength: 24, color: "#101820" },
      outputPath
    });

    await runCleanupJob({
      region: { x: 300, y: 140, width: 60, height: 30 },
      options: { mode: "delogo", crf: 23, strength: 14, color: "#101820" },
      outputPath: edgeOutputPath
    });

    const probe = JSON.parse(await run(ffprobe, [
      "-v", "error",
      "-show_entries", "stream=index,codec_type,codec_name",
      "-of", "json",
      outputPath
    ]));
    const hasVideo = probe.streams?.some((stream) => stream.codec_type === "video");
    const hasAudio = probe.streams?.some((stream) => stream.codec_type === "audio");
    if (!hasVideo || !hasAudio) throw new Error("Output did not contain both video and audio streams.");

    console.log(JSON.stringify({
      ok: true,
      ffmpeg,
      outputPath,
      outputBytes: fs.statSync(outputPath).size,
      edgeOutputPath,
      edgeOutputBytes: fs.statSync(edgeOutputPath).size,
      streams: probe.streams
    }, null, 2));
  } finally {
    server.kill();
    if (serverLog.trim()) fs.writeFileSync(path.join(selfTestDir, "server-self-test.log"), serverLog);
  }
}

async function runCleanupJob({ region, options, outputPath }) {
  const form = new FormData();
  form.append("file", new Blob([fs.readFileSync(inputPath)], { type: "video/mp4" }), "test-input.mp4");
  form.append("region", JSON.stringify(region));
  form.append("options", JSON.stringify(options));

  const start = await fetch(`${baseUrl}/api/jobs`, { method: "POST", body: form });
  const startBody = await start.json();
  if (!start.ok) throw new Error(`Upload failed: ${JSON.stringify(startBody)}`);

  const job = await pollJob(startBody.id);
  if (job.status !== "complete") throw new Error(`Job failed: ${JSON.stringify(job)}`);

  const download = await fetch(`${baseUrl}${job.downloadUrl}`);
  if (!download.ok) throw new Error(`Download failed with HTTP ${download.status}`);
  fs.writeFileSync(outputPath, Buffer.from(await download.arrayBuffer()));
}

async function waitForHealth() {
  for (let i = 0; i < 30; i++) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return response.json();
    } catch {
      await sleep(300);
    }
  }
  throw new Error("Self-test server did not start.");
}

async function pollJob(id) {
  for (let i = 0; i < 80; i++) {
    await sleep(500);
    const response = await fetch(`${baseUrl}/api/jobs/${id}`);
    if (!response.ok) throw new Error(`Job poll failed with HTTP ${response.status}`);
    const job = await response.json();
    if (job.status === "complete" || job.status === "failed") return job;
  }
  throw new Error("Timed out waiting for job.");
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`${path.basename(command)} exited with ${code}: ${stderr}`));
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
