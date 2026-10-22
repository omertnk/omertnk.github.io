// Lossless fast-start for the non-fragmented MP4 files used by this portfolio.
// Moves the final moov box before mdat and adjusts its stco/co64 chunk offsets.
// Usage: node scripts/faststart.mjs public/projects/endoflife
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

function boxes(buffer, start = 0, end = buffer.length) {
  const result = [];
  for (let offset = start; offset < end;) {
    if (offset + 8 > end) throw new Error("Truncated MP4 box");
    let size = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const header = size === 1 ? 16 : 8;
    if (size === 1) size = Number(buffer.readBigUInt64BE(offset + 8));
    if (size === 0) size = end - offset;
    if (!Number.isSafeInteger(size) || size < header || offset + size > end) {
      throw new Error(`Invalid ${type} box`);
    }
    result.push({ type, offset, size, header });
    offset += size;
  }
  return result;
}

export function faststart(buffer) {
  const top = boxes(buffer);
  const moov = top.find((box) => box.type === "moov");
  const media = top.find((box) => box.type === "mdat");
  if (!moov || !media || top.some((box) => box.type === "moof")) {
    throw new Error("Expected a non-fragmented MP4 with moov and mdat");
  }
  if (moov.offset < media.offset) return buffer;
  // Fail before writing for layouts this small tool does not support.
  if (top.at(-1) !== moov || top.filter((box) => box.type === "moov").length !== 1) {
    throw new Error("Only MP4 files with a single final moov box are supported");
  }
  const metadata = Buffer.from(buffer.subarray(moov.offset));
  const containers = new Set(["moov", "trak", "mdia", "minf", "stbl"]);
  let tables = 0;
  function adjust(start, end) {
    for (const box of boxes(metadata, start, end)) {
      const body = box.offset + box.header;
      if (containers.has(box.type)) {
        adjust(body, box.offset + box.size);
      } else if (box.type === "stco" || box.type === "co64") {
        const wide = box.type === "co64";
        const count = metadata.readUInt32BE(body + 4);
        const stride = wide ? 8 : 4;
        if (body + 8 + count * stride !== box.offset + box.size) throw new Error("Invalid chunk table");
        tables++;
        for (let i = 0; i < count; i++) {
          const p = body + 8 + i * stride;
          const old = wide ? metadata.readBigUInt64BE(p) : BigInt(metadata.readUInt32BE(p));
          if (old < BigInt(media.offset) || old >= BigInt(moov.offset)) throw new Error("Unsupported chunk offset");
          const next = old + BigInt(moov.size);
          if (wide) metadata.writeBigUInt64BE(next, p);
          else {
            if (next > 0xffffffffn) throw new Error("Chunk offset exceeds stco limit");
            metadata.writeUInt32BE(Number(next), p);
          }
        }
      }
    }
  }
  adjust(0, metadata.length);
  if (!tables) throw new Error("No chunk tables found");
  return Buffer.concat([
    buffer.subarray(0, media.offset), metadata,
    buffer.subarray(media.offset, moov.offset),
  ]);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const directory = process.argv[2];
  if (!directory) throw new Error("Usage: node scripts/faststart.mjs <directory>");
  for (const name of fs.readdirSync(directory).filter((name) => name.endsWith(".mp4"))) {
    const file = path.join(directory, name);
    const original = fs.readFileSync(file);
    const optimized = faststart(original);
    if (optimized === original) { console.log(`${name}: already fast-start`); continue; }
    const temporary = `${file}.faststart.tmp`;
    fs.writeFileSync(temporary, optimized, { flag: "wx" });
    fs.renameSync(temporary, file);
    console.log(`${name}: moov moved to the start, video/audio unchanged`);
  }
}
