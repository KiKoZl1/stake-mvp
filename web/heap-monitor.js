import fs from "fs";
import v8 from "v8"; // ✅ Import necessário no Node 18+

const logFile = "./heap-log.txt";
if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

let peak = 0;

setInterval(() => {
  const mem = process.memoryUsage();
  const rss = (mem.rss / 1024 / 1024).toFixed(1);
  const heapUsed = (mem.heapUsed / 1024 / 1024).toFixed(1);
  const heapTotal = (mem.heapTotal / 1024 / 1024).toFixed(1);
  const heapLimit = (v8.getHeapStatistics().heap_size_limit / 1024 / 1024).toFixed(1);
  const line = `[${new Date().toLocaleTimeString()}] RSS: ${rss} MB | Heap: ${heapUsed}/${heapTotal} MB (limit ${heapLimit})`;

  fs.appendFileSync(logFile, line + "\n");
  if (mem.heapUsed > peak) peak = mem.heapUsed;
  console.log(line);
}, 5000);

process.on("exit", () => {
  const peakMB = (peak / 1024 / 1024).toFixed(1);
  console.log(`\n💾 Pico de uso de heap: ${peakMB} MB`);
  fs.appendFileSync(logFile, `\n💾 Pico de uso de heap: ${peakMB} MB\n`);
});
