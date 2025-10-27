import express from "express";
import { exec } from "child_process";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Merge videos using FFmpeg
app.post("/merge", async (req, res) => {
  try {
    const { input } = req.body; // Array of video URLs
    if (!input || input.length === 0) {
      return res.status(400).json({ error: "No input videos provided" });
    }

    const tempFolder = path.join(__dirname, "temp");
    if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder);

    // Download each video
    const downloadedFiles = await Promise.all(
      input.map(async (url, i) => {
        const filePath = path.join(tempFolder, `video${i}.mp4`);
        await fetch(url).then(res => {
          const dest = fs.createWriteStream(filePath);
          return new Promise((resolve, reject) => {
            res.body.pipe(dest);
            res.body.on("error", reject);
            dest.on("finish", resolve);
          });
        });
        return filePath;
      })
    );

    // Create file list for FFmpeg
    const listFilePath = path.join(tempFolder, "list.txt");
    fs.writeFileSync(
      listFilePath,
      downloadedFiles.map(file => `file '${file}'`).join("\n")
    );

    const outputFile = path.join(tempFolder, "output.mp4");

    // Run FFmpeg command
    exec(
      `ffmpeg -f concat -safe 0 -i "${listFilePath}" -c copy "${outputFile}"`,
      (error) => {
        if (error) {
          console.error(error);
          return res.status(500).json({ error: "FFmpeg failed" });
        }
        res.download(outputFile, "merged.mp4", () => {
          fs.rmSync(tempFolder, { recursive: true, force: true });
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🎥 FFmpeg API running on port ${PORT}`));
