import express from "express";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { resolve  } from "path";

const app = express();

app.use(express.static(resolve(__dirname, "./research")));

app.listen(7001);

console.log("listening at 7001");
