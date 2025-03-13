import express from "express";
import { spawn, exec } from "child_process";
import { promisify } from "util";
import { homedir } from "os";
import cors from 'cors';
import path from "path";
import fs from "fs/promises";

const app = express();
const port = process.env.PORT || 8000;

app.post("/read_file", async (req, res) => {
  const { path } = req.body;
  try {
    const content = await fs.readFile(path, "utf-8");
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/write_file", async (req, res) => {
  const { path, content } = req.body;
  console.log("GOT REQ", { path, content });
  try {
    await fs.writeFile(path, content, "utf-8");
    res.json({ message: `Successfully wrote to file ${path}` });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error.message });
  }
});

app.post("/edit_file", async (req, res) => {
  const { path, edits, dryRun = false } = req.body;
  try {
    const content = await fs.readFile(path, "utf-8");
    let modifiedContent = content;

    edits.forEach(({ oldText, newText }) => {
      modifiedContent = modifiedContent.split(oldText).join(newText);
    });

    if (!dryRun) {
      await fs.writeFile(path, modifiedContent, "utf-8");
    }

    res.json({
      message: dryRun ? "Diff preview generated." : "File edited successfully.",
      content: modifiedContent,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/get_file_info", async (req, res) => {
  const { path } = req.body;
  try {
    const stats = await fs.stat(path);
    res.json({
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      permissions: stats.mode,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/list_allowed_directories", (req, res) => {
  res.json({ allowedDirectories: [homedir()] });
});

app.post("/run_command", async (req, res) => {
  const { command } = req.body;
  try {
    console.log(`Executing command: ${command}`);
    const { stdout, stderr } = await promisify(exec)(command);

    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }
    res.json({
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: `Execution failed: ${JSON.stringify(error)}` });
  }
});

app.post("/run_command_stream", (req, res) => {
  const { command } = req.body;
  const childProcess = spawn(command, { shell: true });
  let output = "";

  childProcess.stdout.on("data", (data) => {
    output += data.toString();
  });

  childProcess.stderr.on("data", (data) => {
    output += data.toString();
  });

  childProcess.on("close", (code) => {
    res.json({ message: `Exit code ${code}:\n${output}` });
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});