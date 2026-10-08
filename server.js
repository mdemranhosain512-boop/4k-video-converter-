const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;

ffmpeg.setFfmpegPath(ffmpegPath);

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

app.post('/convert', upload.single('video'), (req, res) => {
    if (!req.file) return res.status(400).send('No video file uploaded.');

    const inputPath = req.file.path;
    const outputPath = path.join(__dirname, 'uploads', `converted_${Date.now()}.mp4`);

    ffmpeg(inputPath)
        .outputOptions([
            '-vf scale=2160:3840:force_original_aspect_ratio=increase,crop=2160:3840',
            '-r 120',
            '-c:v libx264',
            '-crf 14',
            '-preset slow',
            '-c:a aac',
            '-b:a 320k'
        ])
        .output(outputPath)
        .on('end', () => {
            res.download(outputPath, '4k_120fps_video.mp4', () => {
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            });
        })
        .on('error', (err) => {
            console.error('Error:', err);
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            res.status(500).send('Video conversion failed.');
        })
        .run();
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
