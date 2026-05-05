const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const app = express();
app.use(express.json());

const VIDEOS_DIR = '/tmp/videos';
if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

app.post('/render', async (req, res) => {
  try {
    const { images, audio_url, duration_per_image } = req.body;
    if (!images || !images.length) return res.status(400).json({ error: 'images required' });

    const id = Date.now();
    const dir = path.join(VIDEOS_DIR, String(id));
    fs.mkdirSync(dir);

    const imgFiles = [];
    for (let i = 0; i < images.length; i++) {
      const imgPath = path.join(dir, `img_${i}.png`);
      await download(images[i], imgPath);
      imgFiles.push(imgPath);
    }

    const listPath = path.join(dir, 'list.txt');
    fs.writeFileSync(listPath, imgFiles.map(f => `file '${f}'\nduration ${duration_per_image || 4}`).join('\n'));
    fs.appendFileSync(listPath, `\nfile '${imgFiles[imgFiles.length - 1]}'\n`);

    const dur = (duration_per_image || 4) * images.length;
    const output = path.join(VIDEOS_DIR, `${id}.mp4`);

    let cmd = `ffmpeg -y -f concat -safe 0 -i ${listPath} `;
    if (audio_url) {
      const audioPath = path.join(dir, 'audio.mp3');
      await download(audio_url, audioPath);
      cmd += `-i ${audioPath} -t ${dur} -shortest `;
    }
    cmd += `-c:v libx264 -pix_fmt yuv420p -preset fast -crf 23 -r 24 ${output} 2>&1`;

    console.log('FFmpeg:', cmd);
    execSync(cmd, { timeout: 120000 });

    res.json({ success: true, video_url: `/video/${id}.mp4`, duration: dur });

    setTimeout(() => {
      fs.rmSync(dir, { recursive: true, force: true });
    }, 600000);
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/video/:file', (req, res) => {
  const file = path.join(VIDEOS_DIR, req.params.file);
  if (!fs.existsSync(file)) return res.status(404).send('Not found');
  res.sendFile(file, { root: '/' });
});

app.get('/health', (req, res) => {
  try {
    const ver = execSync('ffmpeg -version').toString().split('\n')[0];
    res.json({ status: 'ok', ffmpeg: ver });
  } catch(e) {
    res.json({ status: 'ok', ffmpeg: 'not found' });
  }
});

app.listen(3000, () => console.log('FFmpeg API on port 3000'));
