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

app.get("/", (req, res) => {
  res.send("✅ FFmpeg API is running successfully on Vercel!");
});

app.post("/merge", async (req, res) => {
  try {
    const { input } = req.body;
    if (!input || input.length === 0) {
      return res.status(400).json({ error: "No input videos provided" });
    }

    const tempFolder = path.join("/tmp", "ffmpeg-temp");
    if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder);

    const downloadedFiles = await Promise.all(
      input.map(async (url, i) => {
        const filePath = path.join(tempFolder, `video${i}.mp4`);
        const response = await fetch(url);
        const buffer = Buffer.from(await response.arrayBuffer());
        fs.writeFileSync(filePath, buffer);
        return filePath;
      })
    );


    const listFilePath = path.join(tempFolder, "list.txt");
    fs.writeFileSync(
      listFilePath,
      downloadedFiles.map((f) => `file '${f}'`).join("\n")
    );

    const outputFile = path.join(tempFolder, "output.mp4");

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


export default app;
