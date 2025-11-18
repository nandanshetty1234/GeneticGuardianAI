// backend/server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { Parser } = require("json2csv");
const { spawn } = require("child_process");

const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

// ---------------------- OpenAI client ----------------------
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

let openaiClient = null;
if (OPENAI_API_KEY) {
  openaiClient = new OpenAI({ apiKey: OPENAI_API_KEY });
  console.log("✅ OpenAI client initialized");
} else {
  console.warn("⚠️ OPENAI_API_KEY not set — /api/guardian/chat will fail until provided.");
}

// ---------------------- MongoDB ----------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ---------------------- Schemas ----------------------
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
});
const User = mongoose.model("User", userSchema);

const HealthFormSchema = new mongoose.Schema(
  {
    userNameForLink: String,
    fullName: String,
    age: Number,
    sex: { type: String, enum: ["male", "female", "other"], default: "male" },
    heightFeet: Number,
    heightInches: Number,
    heightCm: Number,
    weightKg: Number,
    bmi: Number,
    smokingStatus: { type: String, enum: ["never", "former", "current"], default: "never" },
    alcoholUse: { type: String, enum: ["none", "occasional", "regular"], default: "none" },
    activityLevel: { type: String, enum: ["sedentary", "light", "moderate", "active"], default: "sedentary" },
    sleepHours: Number,
    hasDiabetes: Boolean,
    hasHypertension: Boolean,
    hasHeartDisease: Boolean,
    hasAsthma: Boolean,
    hasKidneyDisease: Boolean,
    hasObesity: Boolean,
    familyDiabetes: Boolean,
    familyHypertension: Boolean,
    familyHeartDisease: Boolean,
    familyCancer: Boolean,
    diagDiabetes: { type: Boolean, default: false },
    diagHeartDisease: { type: Boolean, default: false },
    diagCancer: { type: Boolean, default: false },
    consentToUseData: { type: Boolean, default: false },
  },
  { timestamps: true }
);
const HealthForm = mongoose.model("HealthForm", HealthFormSchema);

// ---------------------- CSV ----------------------
const CSV_PATH = path.join(__dirname, "user_data.csv");
const CSV_FIELDS = [
  "age","sex","heightCm","weightKg","bmi",
  "smokingStatus","alcoholUse","activityLevel","sleepHours",
  "hasDiabetes","hasHypertension","hasHeartDisease","hasAsthma","hasKidneyDisease","hasObesity",
  "familyDiabetes","familyHypertension","familyHeartDisease","familyCancer",
  "diagDiabetes","diagHeartDisease","diagCancer"
];

function appendToCSV(payload) {
  const row = {};
  CSV_FIELDS.forEach((f) => {
    row[f] = payload[f] === undefined ? "" : payload[f];
  });
  const headerNeeded = !fs.existsSync(CSV_PATH);
  const parser = new Parser({ fields: CSV_FIELDS, header: headerNeeded });
  const csv = parser.parse([row]);
  fs.appendFileSync(CSV_PATH, csv + "\n", "utf8");
}

// ---------------------- Helpers (python predictor) ----------------------
function choosePython() {
  if (process.env.PYTHON_PATH) return process.env.PYTHON_PATH;

  const venvWin = path.join(__dirname, "venv", "Scripts", "python.exe");
  const venvUnix = path.join(__dirname, "venv", "bin", "python");
  if (fs.existsSync(venvWin)) return venvWin;
  if (fs.existsSync(venvUnix)) return venvUnix;

  return process.platform === "win32" ? "python" : "python3";
}

function runPredictor(payload, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const predictPy = path.join(__dirname, "predict.py");
    if (!fs.existsSync(predictPy)) {
      return reject(new Error("predict.py not found on server"));
    }

    const pythonExec = choosePython();
    const spawnOpts = {
      cwd: __dirname,
      env: { ...process.env },
      stdio: ["pipe", "pipe", "pipe"],
    };

    let stdout = "";
    let stderr = "";
    const MAX_CAPTURE = 200 * 1024; // 200KB

    const py = spawn(pythonExec, [predictPy], spawnOpts);

    const killTimer = setTimeout(() => {
      try { py.kill("SIGKILL"); } catch (e) {}
    }, timeoutMs);

    py.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
      if (stdout.length > MAX_CAPTURE) stdout = stdout.slice(0, MAX_CAPTURE);
    });
    py.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      if (stderr.length > MAX_CAPTURE) stderr = stderr.slice(0, MAX_CAPTURE);
    });

    py.on("error", (err) => {
      clearTimeout(killTimer);
      reject(new Error(`Failed to spawn python: ${String(err)}`));
    });

    py.on("close", (code) => {
      clearTimeout(killTimer);
      if (code !== 0) {
        const e = new Error(`predict.py exited with code ${code}`);
        e.stderr = stderr;
        return reject(e);
      }
      try {
        const parsed = JSON.parse(stdout);
        if (parsed && parsed.error) return reject(new Error(parsed.error || "predict error"));
        return resolve(parsed);
      } catch (e) {
        const err = new Error("Invalid JSON returned by predictor");
        err.stdout = stdout;
        err.stderr = stderr;
        return reject(err);
      }
    });

    // write payload
    try {
      py.stdin.write(JSON.stringify(payload));
      py.stdin.end();
    } catch (e) {
      clearTimeout(killTimer);
      py.kill();
      return reject(new Error("Failed to write to predictor stdin"));
    }
  });
}

// ---------------------- Existing Routes ----------------------
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const newUser = new User({ username, email, password });
    await newUser.save();
    res.json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Error registering user" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (user) return res.json({ message: "Login successful" });
    return res.status(400).json({ error: "Invalid credentials" });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Error logging in" });
  }
});

app.post("/healthform/save", async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.age || !payload.heightCm || !payload.weightKg) {
      return res.status(400).json({ error: "age, heightCm and weightKg are required" });
    }

    payload.diagDiabetes = (payload.diagDiabetes === undefined) ? !!payload.hasDiabetes : !!payload.diagDiabetes;
    payload.diagHeartDisease = (payload.diagHeartDisease === undefined) ? !!payload.hasHeartDisease : !!payload.diagHeartDisease;
    payload.diagCancer = (payload.diagCancer === undefined) ? !!payload.familyCancer : !!payload.diagCancer;

    const form = new HealthForm(payload);
    await form.save();

    try {
      appendToCSV(payload);
      console.log("✅ Appended submission to CSV");
    } catch (csvErr) {
      console.error("❌ CSV write error:", csvErr);
    }

    res.json({ message: "Health form saved", id: form._id });
  } catch (err) {
    console.error("Save error:", err);
    res.status(500).json({ error: "Could not save health form" });
  }
});

app.get("/healthform/list/:username", async (req, res) => {
  try {
    const docs = await HealthForm.find({ userNameForLink: req.params.username }).sort({ createdAt: -1 }).lean();
    res.json(docs);
  } catch (err) {
    console.error("List error:", err);
    res.status(500).json({ error: "Could not fetch records" });
  }
});

app.get("/download/user_data.csv", (req, res) => {
  if (!fs.existsSync(CSV_PATH)) return res.status(404).json({ error: "CSV not found yet" });
  res.download(CSV_PATH, "user_data.csv");
});

// ---------------------- /predict route ----------------------
app.post("/predict", async (req, res) => {
  try {
    const payload = req.body || {};
    const prediction = await runPredictor(payload, 15_000);
    return res.json(prediction);
  } catch (err) {
    console.error("Predict error:", err);
    const resp = { error: "Prediction failed", detail: err.message || String(err) };
    if (err.stderr) resp.stderr = err.stderr;
    if (err.stdout) resp.stdout = err.stdout;
    return res.status(500).json(resp);
  }
});

// ---------------------- /predict-and-save route ----------------------
app.post("/predict-and-save", async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.age || !payload.heightCm || !payload.weightKg) {
      return res.status(400).json({ error: "age, heightCm and weightKg are required" });
    }

    payload.diagDiabetes = (payload.diagDiabetes === undefined) ? !!payload.hasDiabetes : !!payload.diagDiabetes;
    payload.diagHeartDisease = (payload.diagHeartDisease === undefined) ? !!payload.hasHeartDisease : !!payload.diagHeartDisease;
    payload.diagCancer = (payload.diagCancer === undefined) ? !!payload.familyCancer : !!payload.diagCancer;

    const form = new HealthForm(payload);
    await form.save();
    try { appendToCSV(payload); } catch (csvErr) { console.error("CSV write error:", csvErr); }

    let prediction;
    try {
      prediction = await runPredictor(payload, 15_000);
    } catch (predErr) {
      console.error("Prediction after save failed:", predErr);
      return res.status(500).json({ error: "Prediction failed after save", detail: predErr.message || String(predErr), id: form._id });
    }

    return res.json({ message: "Saved and predicted", id: form._id, prediction });
  } catch (err) {
    console.error("predict-and-save error:", err);
    return res.status(500).json({ error: "Could not save and predict", detail: String(err) });
  }
});

// ---------------------- Health intent helper ----------------------
function isHealthRelatedText(text) {
  if (!text || typeof text !== "string") return false;
  const s = text.toLowerCase();

  const healthKeywords = [
    "fever","cough","throat","pain","headache","dizzy","nausea","vomit",
    "bleed","breath","shortness of breath","breathing","rash","infection",
    "diarrhea","constipation","abdominal","chest pain","heart","blood pressure","bp",
    "diabetes","insulin","cholesterol","allergy","allergic","asthma","symptom","symptoms",
    "treatment","prescribe","diagnosis","sore throat","flu","cold","covid","vaccine",
    "pregnant","pregnancy","mental health","depression","anxiety","sleep","insomnia",
    "weight","bmi","obesity","exercise","nutrition","diet","clinic","doctor","physician",
    "emergency","urgent","tumor","cancer","kidney","lung","liver","skin","stomach","antibiotic"
  ];

  const nonHealthIndicators = [
    "school","college","university","restaurant","movie","song","lyrics","weather",
    "directions","map","how to go","code","programming","javascript","react","history",
    "definition of","meaning of","who is","where is","price of","buy","shop","salary",
    "which school","best school","famous school"
  ];

  // if message contains a strong non-health indicator and no health keywords -> not health
  for (const ph of nonHealthIndicators) {
    if (s.includes(ph)) {
      for (const hk of healthKeywords) {
        if (s.includes(hk)) return true;
      }
      return false;
    }
  }

  // if any health keyword present -> health
  for (const hk of healthKeywords) {
    if (s.includes(hk)) return true;
  }

  // tiny non-specific messages are not health
  if (s.length < 20) return false;

  // fallback conservative: treat as non-health by default
  return false;
}

// ---------------------- NEW: Guardian Chat endpoint ----------------------
/**
 * POST /api/guardian/chat
 * Body: { messages: [{ role: 'user'|'assistant'|'system', text: '...' }, ...] }
 * Returns: { reply: "assistant text" }
 */
app.post("/api/guardian/chat", async (req, res) => {
  try {
    console.log("=== /api/guardian/chat received ===");
    console.log("Body preview:", JSON.stringify(req.body).slice(0, 1000));

    if (!openaiClient) {
      console.error("OpenAI client not configured (OPENAI_API_KEY missing).");
      return res.status(500).json({ error: "OpenAI client not configured. Set OPENAI_API_KEY in environment." });
    }

    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      console.log("Bad request: messages array required");
      return res.status(400).json({ error: "messages array required" });
    }

    // Build user's combined text for intent check
    const userOnlyText = messages
      .filter((m) => m.role === "user")
      .map((m) => m.text)
      .join("\n")
      .trim();

    // Run local intent check first — if not health-related, respond with one-line refusal
    if (!isHealthRelatedText(userOnlyText)) {
      console.log("Intent check: non-health question detected. Aborting OpenAI call.");
      return res.json({
        reply: "I only provide general health information — please ask a health-related question.",
      });
    }

    // Build small combined text for moderation
    const combined = messages.map((m) => `${m.role}: ${m.text}`).join("\n").slice(0, 3000);

    // Moderation (best-effort)
    let mod = null;
    try {
      mod = await openaiClient.moderations.create({
        model: "omni-moderation-latest",
        input: combined,
      });
    } catch (merr) {
      console.warn("Moderation call failed:", merr?.message || merr);
      mod = null;
    }

    if (mod?.results?.[0]?.flagged) {
      return res.status(400).json({ error: "Content flagged by moderation" });
    }

    // Health-focused system prompt (keeps assistant informational and safe)
    const systemPrompt = `
You are a concise, careful, evidence-informed medical-information assistant called "Guardian".
- Only answer QUESTIONS DIRECTLY RELATED TO HEALTH, SYMPTOMS, PREVENTION, OR NEXT STEPS.
- If the user asks anything NOT ABOUT HEALTH, refuse in one short sentence: "I only provide general health information — please ask a health-related question."
- Do NOT provide definitive diagnoses or prescribe medications.
- For urgent or red-flag symptoms (difficulty breathing, chest pain, fainting, severe bleeding), clearly advise to seek immediate emergency care.
- Keep replies concise and end with: "This is educational information only."
`.trim();

    // Convert frontend messages to API format
    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role === "user" ? "user" : m.role, content: m.text })),
    ];

    // Call OpenAI Chat Completion
    const completion = await openaiClient.chat.completions.create({
      model: OPENAI_MODEL,
      messages: chatMessages,
      max_tokens: 700,
      temperature: 0.2,
    });

    const reply = completion?.choices?.[0]?.message?.content ?? null;
    if (!reply) {
      console.error("OpenAI returned no reply:", completion);
      return res.status(500).json({ error: "No reply from AI" });
    }

    // Optionally: save conversation to DB here for audit/history

    return res.json({ reply });
  } catch (err) {
    console.error("Guardian chat error:", err);
    if (err?.response) {
      try { console.error("OpenAI response data:", JSON.stringify(err.response, null, 2)); } catch(_) {}
    }
    return res.status(500).json({ error: err?.message || "Server error" });
  }
});

// ---------------------- root ----------------------
app.get("/", (req, res) => res.send("GeneticGuardianAI backend is up"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
