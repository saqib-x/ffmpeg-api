import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { tmpdir } from "os";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "100mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST method allowed" });
  }

  const { videos } = req.body;
  if (!videos || !Array.isArray(videos) || videos.length < 2) {
    return res.status(400).json({ error: "Send at least 2 video URLs" });
  }

  try {
    const inputListPath = path.join(tmpdir(), "input.txt");
    fs.writeFileSync(
      inputListPath,
      videos.map((url) => `file '${url}'`).join("\n")
    );

    const outputPath = path.join(tmpdir(), "merged.mp4");

    await new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        inputListPath,
        "-c",
        "copy",
        outputPath,
      ]);

      ffmpeg.stderr.on("data", (data) => console.log(data.toString()));
      ffmpeg.on("close", (code) => (code === 0 ? resolve() : reject(code)));
    });

    const mergedFile = fs.readFileSync(outputPath);
    res.setHeader("Content-Type", "video/mp4");
    res.status(200).send(mergedFile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Merge failed", details: err.message });
  }
}
