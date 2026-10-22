// Reads a narration script aloud with Kokoro and writes a mono 16-bit WAV.
// Usage: node speak.mjs narration.txt about.wav [voice]
import { KokoroTTS } from 'kokoro-js';
import { readFileSync, writeFileSync } from 'node:fs';

const [input, output, voice = 'af_heart'] = process.argv.slice(2);
const sentencePause = 0.25;
const paragraphPause = 0.5;

const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'cpu' });
const paragraphs = readFileSync(input, 'utf8').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
const chunks = [];
let rate = 24000;
const silence = (seconds) => new Float32Array(Math.round(rate * seconds));

for (const [index, paragraph] of paragraphs.entries()) {
  // Short requests keep Kokoro's pacing even; long paragraphs are split at sentence ends.
  for (const sentence of paragraph.split(/(?<=[a-z0-9)”’][.!?])\s+/)) {
    const audio = await tts.generate(sentence.trim(), { voice });
    rate = audio.sampling_rate;
    chunks.push(audio.audio, silence(sentencePause));
  }
  chunks.push(silence(paragraphPause));
  console.log(`paragraph ${index + 1}/${paragraphs.length}`);
}

const samples = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
const pcm = new Int16Array(samples);
let offset = 0;
for (const chunk of chunks) for (const value of chunk) pcm[offset++] = Math.max(-1, Math.min(1, value)) * 32767;

const data = Buffer.from(pcm.buffer);
const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + data.length, 4);
header.write('WAVEfmt ', 8);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22);
header.writeUInt32LE(rate, 24);
header.writeUInt32LE(rate * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(data.length, 40);
writeFileSync(output, Buffer.concat([header, data]));
console.log(`wrote ${output}, ${(samples / rate / 60).toFixed(1)} minutes`);
