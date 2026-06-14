const { HttpError } = require("./errors");

function parseMultipartFile(buffer, contentType) {
  const match = /boundary=([^;]+)/i.exec(contentType || "");
  if (!match) throw new HttpError(400, "Missing multipart boundary");
  const boundary = `--${match[1]}`;
  const raw = buffer.toString("binary");
  const parts = raw.split(boundary).slice(1, -1);
  for (const part of parts) {
    const splitAt = part.indexOf("\r\n\r\n");
    if (splitAt === -1) continue;
    const headers = part.slice(0, splitAt);
    let body = part.slice(splitAt + 4);
    if (body.endsWith("\r\n")) body = body.slice(0, -2);
    if (/name="file"/.test(headers)) return Buffer.from(body, "binary");
  }
  throw new HttpError(400, "CSV file field is required");
}

function parseCsv(buffer) {
  const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const rows = [];
  let current = "";
  let row = [];
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(current);
      current = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current);
      if (row.some((cell) => cell.length)) rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }
  if (current || row.length) {
    row.push(current);
    rows.push(row);
  }
  const headers = (rows.shift() || []).map((cell) => cell.trim().toLowerCase());
  return rows.map((cells) => Object.fromEntries(headers.map((header, index) => [header, String(cells[index] || "").trim()])));
}

module.exports = { parseMultipartFile, parseCsv };
