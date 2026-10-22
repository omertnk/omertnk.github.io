import assert from "node:assert/strict";
import { test } from "node:test";
import { faststart } from "./faststart.mjs";

function box(type, ...parts) {
  const data = Buffer.concat(parts);
  const header = Buffer.alloc(8);
  header.writeUInt32BE(data.length + 8);
  header.write(type, 4);
  return Buffer.concat([header, data]);
}

function fixture(wide) {
  const header = box("ftyp", Buffer.from("isom0000"));
  const media = box("mdat", Buffer.from("sample video data"));
  const table = Buffer.alloc(wide ? 16 : 12);
  table.writeUInt32BE(1, 4);
  const chunk = header.length + 8;
  if (wide) table.writeBigUInt64BE(BigInt(chunk), 8);
  else table.writeUInt32BE(chunk, 8);
  const metadata = box("moov", box("trak", box("mdia", box("minf", box("stbl", box(wide ? "co64" : "stco", table))))));
  return { input: Buffer.concat([header, media, metadata]), header, media, metadata, chunk };
}

for (const wide of [false, true]) {
  test(`relocates ${wide ? "64" : "32"}-bit chunk offsets without changing media`, () => {
    const { input, header, media, metadata, chunk } = fixture(wide);
    const copy = Buffer.from(input);
    const result = faststart(input);
    assert.equal(result.length, input.length);
    assert.deepEqual(input, copy, "input is not mutated");
    assert.equal(result.toString("ascii", header.length + 4, header.length + 8), "moov");
    assert.deepEqual(result.subarray(header.length + metadata.length), media);
    const tableOffset = result.indexOf(wide ? "co64" : "stco") + 12;
    const relocated = wide ? Number(result.readBigUInt64BE(tableOffset)) : result.readUInt32BE(tableOffset);
    assert.equal(relocated, chunk + metadata.length);
    assert.equal(faststart(result), result, "already optimized files are unchanged");
  });
}

test("rejects fragmented and truncated MP4s before writing", () => {
  assert.throws(() => faststart(box("moof")), /non-fragmented/);
  assert.throws(() => faststart(Buffer.from([0, 0, 0])), /Truncated/);
});
