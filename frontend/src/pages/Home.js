// src/pages/Home.js
import React, { useEffect, useMemo, useState, forwardRef, memo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import logo from "../logo.png";

/* --- small UI atoms (unchanged) --- */
const Input = memo(
  forwardRef(function Input(props, ref) {
    const handleKeyDown = (e) => {
      if (e.key === "Enter") e.preventDefault();
      if (props.onKeyDown) props.onKeyDown(e);
    };
    const extra = {};
    if (props.type === "number") {
      extra.inputMode = "numeric";
      if (!("step" in props)) extra.step = "any";
    }
    return (
      <input
        {...props}
        {...extra}
        ref={ref}
        onKeyDown={handleKeyDown}
        autoComplete={props.autoComplete ?? "off"}
        className={`w-full px-3 py-2 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 ${props.className || ""}`}
      />
    );
  })
);

const Select = memo((props) => (
  <select {...props} className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
));

const Check = memo(({ id, checked, onChange, label }) => (
  <div className="flex items-center gap-3">
    <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-blue-500" />
    <label htmlFor={id} className="text-gray-200 cursor-pointer select-none">{label}</label>
  </div>
));

const Label = memo(({ children }) => <label className="block text-sm text-gray-300">{children}</label>);

const Card = memo(({ title, children }) => (
  <div className="bg-gray-800/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-white w-full">
    <h3 className="text-xl font-semibold text-blue-300 mb-4">{title}</h3>
    <div className="space-y-3">{children}</div>
  </div>
));

/* --- helpers --- */
function getBMICategoryNumber(bmiVal) {
  const b = Number(bmiVal);
  if (!b || Number.isNaN(b)) return { key: "unknown", label: "Unknown" };
  if (b < 18.5) return { key: "underweight", label: "Underweight (BMI < 18.5)" };
  if (b < 25) return { key: "normal", label: "Normal (BMI 18.5–24.9)" };
  if (b < 30) return { key: "overweight", label: "Overweight (BMI 25–29.9)" };
  return { key: "obese", label: "Obese (BMI ≥ 30)" };
}

function bmiAdviceFor(key) {
  switch (key) {
    case "underweight":
      return {
        title: "Underweight — concerns & tips",
        bullets: [
          "Weaker immunity and higher risk of malnutrition.",
          "Possible bone density loss over time (osteoporosis).",
          "Tips: increase healthy calorie intake, strength training, see a nutritionist.",
        ],
      };
    case "normal":
      return {
        title: "Normal weight — good job!",
        bullets: [
          "Lowest risk of many chronic diseases — keep it up!",
          "Maintain balanced diet, regular activity, and adequate sleep.",
        ],
      };
    case "overweight":
      return {
        title: "Overweight — what to watch",
        bullets: [
          "Higher chance of high blood pressure and insulin resistance.",
          "Try sustainable dietary changes and increase daily activity.",
        ],
      };
    case "obese":
      return {
        title: "Obese — higher health risk",
        bullets: [
          "Higher risk of Type 2 diabetes, heart disease, some cancers, sleep apnea, joint issues.",
          "Seek structured weight management and medical advice.",
        ],
      };
    default:
      return { title: "BMI info", bullets: ["Enter height and weight to calculate BMI."] };
  }
}

function smokingAdvice(status) {
  if (status === "never") return "Great — never smoking is one of the best things for long-term health.";
  if (status === "former") return "Former smoker — your risk reduces over time after quitting; keep it up.";
  return "Current smoker — quitting reduces your risk of heart disease, cancer and lung disease; consider support.";
}
function alcoholAdvice(kind) {
  if (kind === "none") return "No alcohol — positive for long-term health (lower liver & cancer risk).";
  if (kind === "occasional") return "Occasional drinking — keep within safe limits and avoid binge drinking.";
  return "Regular alcohol use — consider reducing intake to lower long-term risks.";
}
function activityAdvice(level) {
  if (level === "active") return "Active — well done! Regular activity protects heart, metabolism and mood.";
  if (level === "moderate") return "Moderately active — good; aim for 150+ min moderate activity per week.";
  if (level === "light") return "Light activity — add brisk walks or short workouts to improve health.";
  return "Sedentary — introduce short activity breaks and small daily exercises to reduce risk.";
}
function sleepAdvice(hours) {
  const h = Number(hours);
  if (Number.isNaN(h)) return "Provide sleep hours to get personalized advice.";
  if (h < 6) return "Short sleep — <6 hrs/night increases metabolic and mood risks. Aim for 7–9 hrs.";
  if (h <= 9) return "Good sleep — 7–9 hours is healthy for most adults.";
  return "Long sleep — >9 hrs sometimes associates with health issues; consult if persistent.";
}

/* disease details: shown when condition = At Risk */
function diseaseDetailsHtml(conditionKey) {
  switch (conditionKey) {
    case "diabetes":
      return `<h4 style="color:#FFD166; margin-top:8px; margin-bottom:6px; font-size:1rem;">About Type 2 Diabetes</h4>
              <p style="margin:0 0 8px 0; line-height:1.4;">
                Type 2 diabetes occurs when the body can't properly use insulin. Risk increases with excess weight, inactivity, family history, and age.
              </p>
              <p style="margin:0 0 6px 0;"><strong>Common symptoms</strong>: increased thirst, frequent urination, unexplained weight loss, fatigue, blurred vision.</p>
              <p style="margin:0 0 8px 0;">If you have symptoms or strong risk factors, discuss screening (HbA1c/glucose) with your healthcare provider.</p>`;
    case "heartDisease":
      return `<h4 style="color:#FF6B6B; margin-top:8px; margin-bottom:6px; font-size:1rem;">About Heart Disease</h4>
              <p style="margin:0 0 8px 0; line-height:1.4;">
                Heart disease risk rises with high blood pressure, cholesterol, smoking, diabetes, and being overweight.
              </p>
              <p style="margin:0 0 6px 0;"><strong>Common symptoms</strong>: chest discomfort, shortness of breath, unusual fatigue, dizziness. Some people have no symptoms early on.</p>
              <p style="margin:0 0 8px 0;">A clinician can assess blood pressure, lipids and other tests to estimate cardiovascular risk.</p>`;
    case "cancer":
      return `<h4 style="color:#F72585; margin-top:8px; margin-bottom:6px; font-size:1rem;">About Cancer Risk</h4>
              <p style="margin:0 0 8px 0; line-height:1.4;">
                Certain cancers are linked to genetics, lifestyle, and metabolic health. Risk depends on type of cancer and family history.
              </p>
              <p style="margin:0 0 6px 0;"><strong>Warning signs</strong>: persistent lumps, unexplained weight loss, changes in bowel/bladder habits, unusual bleeding. Symptoms vary widely by cancer type.</p>
              <p style="margin:0 0 8px 0;">If family history or symptoms are concerning, discuss screening with a clinician (mammography, colonoscopy, etc.).</p>`;
    default:
      return "";
  }
}

/* helper to strip tags so typed preview is plain text (no partial tags visible) */
function stripHtmlTags(html) { 
  // Remove tags
  let text = html.replace(/<\/?[^>]+(>|$)/g, "");
  // Replace multiple spaces with one
  text = text.replace(/\s+/g, " ");
  // Trim leading/trailing whitespace
  return text.trim();
}


/* payload builder (unchanged) */
function buildPayload(state) {
  const safeNum = (v) => {
    if (v === undefined || v === null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  return {
    userNameForLink: state.username || "",
    fullName: state.fullName || "",
    age: safeNum(state.age) ?? 0,
    sex: state.sex || "male",
    heightFeet: safeNum(state.heightFeet),
    heightInches: safeNum(state.heightInches),
    heightCm: safeNum(state.heightCm) ?? 0,
    weightKg: safeNum(state.weightKg) ?? 0,
    bmi: safeNum(state.bmi),
    smokingStatus: state.smokingStatus || "never",
    alcoholUse: state.alcoholUse || "none",
    activityLevel: state.activityLevel || "sedentary",
    sleepHours: safeNum(state.sleepHours) ?? 0,
    hasDiabetes: !!state.hasDiabetes,
    hasHypertension: !!state.hasHypertension,
    hasHeartDisease: !!state.hasHeartDisease,
    hasAsthma: !!state.hasAsthma,
    hasKidneyDisease: !!state.hasKidneyDisease,
    hasObesity: !!state.hasObesity,
    familyDiabetes: !!state.familyDiabetes,
    familyHypertension: !!state.familyHypertension,
    familyHeartDisease: !!state.familyHeartDisease,
    familyCancer: !!state.familyCancer,
    diagDiabetes: !!state.hasDiabetes || !!state.familyDiabetes,
    diagHeartDisease: !!state.hasHeartDisease || !!state.familyHeartDisease,
    diagCancer: !!state.familyCancer,
    consentToUseData: true,
  };
}

/* --- Main Home component --- */
function Home() {
  const API = process.env.REACT_APP_API_URL || "https://geneticguardianai.onrender.com";

   const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [predictions, setPredictions] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // form states
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("male");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [smokingStatus, setSmokingStatus] = useState("never");
  const [alcoholUse, setAlcoholUse] = useState("none");
  const [activityLevel, setActivityLevel] = useState("sedentary");
  const [sleepHours, setSleepHours] = useState(7);
  const [hasDiabetes, setHasDiabetes] = useState(false);
  const [hasHypertension, setHasHypertension] = useState(false);
  const [hasHeartDisease, setHasHeartDisease] = useState(false);
  const [hasAsthma, setHasAsthma] = useState(false);
  const [hasKidneyDisease, setHasKidneyDisease] = useState(false);
  const [hasObesity, setHasObesity] = useState(false);
  const [familyDiabetes, setFamilyDiabetes] = useState(false);
  const [familyHypertension, setFamilyHypertension] = useState(false);
  const [familyHeartDisease, setFamilyHeartDisease] = useState(false);
  const [familyCancer, setFamilyCancer] = useState(false);

  const heightCm = useMemo(() => {
    const ft = parseFloat(heightFeet) || 0;
    const inch = parseFloat(heightInches) || 0;
    const totalInches = ft * 12 + inch;
    if (!totalInches) return "";
    return (totalInches * 2.54).toFixed(1);
  }, [heightFeet, heightInches]);

  const bmi = useMemo(() => {
    const hcm = parseFloat(heightCm);
    const w = parseFloat(weightKg);
    if (!hcm || !w) return "";
    const m = hcm / 100;
    const val = w / (m * m);
    return isFinite(val) ? val.toFixed(1) : "";
  }, [heightCm, weightKg]);

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) setUsername(storedUser);
  }, []);

  /* chat messages typed sequentially
     each message has:
       id, finalHtml, displayPlain (typed), displayHtml (final), done
  */
  const [chatMsgs, setChatMsgs] = useState([]);
  const timersRef = useRef([]);
  const clearTimers = () => {
    (timersRef.current || []).forEach((t) => {
      try { clearTimeout(t); clearInterval(t); } catch (e) {}
    });
    timersRef.current = [];
  };
  useEffect(() => () => clearTimers(), []);

  const TYPING_SPEED_MS = 14;
  const SECTION_DELAY_MS = 650;

  const handlePredictAndSave = async () => {
    clearTimers();
    setChatMsgs([]);
    setErrorMsg("");
    setPredictions(null);

    if (!age || !heightCm || !weightKg) {
      setErrorMsg("Please fill Age, Height and Weight.");
      return;
    }

    const payload = buildPayload({
      username, fullName, age, sex, heightFeet, heightInches, heightCm, weightKg, bmi,
      smokingStatus, alcoholUse, activityLevel, sleepHours,
      hasDiabetes, hasHypertension, hasHeartDisease, hasAsthma, hasKidneyDisease, hasObesity,
      familyDiabetes, familyHypertension, familyHeartDisease, familyCancer,
    });

    setLoading(true);
    try {
      const res = await fetch(`${API}/predict-and-save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = data?.detail ? ` — ${data.detail}` : "";
        setErrorMsg((data?.error || `Save failed (${res.status})`) + detail);
        setLoading(false);
        return;
      }

      const prediction = data.prediction ?? data;
      setPredictions(prediction);

      // Build final HTML blocks
      const bmiCategory = getBMICategoryNumber(bmi);
      const bmiInfo = bmiAdviceFor(bmiCategory.key);

      const bmiHtml = `
        <div style="font-size:1.06rem;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="height:10px;width:10px;border-radius:999px;background:#2DD4BF;display:inline-block"></span>
            <h3 style="margin:0;font-size:1.25rem;color:#2DD4BF;">BMI (Body Mass Index)</h3>
          </div>
          <p style="margin:6px 0 10px 0;line-height:1.45;">
            BMI measures <strong>weight & height</strong> to estimate body fat. It's a <em>screening</em> tool — not a diagnostic test.
          </p>
          <div style="margin:6px 0 10px 0;">
            <strong>Categories:</strong>
            <ul style="margin:6px 0 0 18px;line-height:1.4;">
              <li>Below 18.5 → Underweight</li>
              <li>18.5 – 24.9 → Normal (Healthy weight)</li>
              <li>25 – 29.9 → Overweight</li>
              <li>30 and above → Obese</li>
            </ul>
          </div>
          <p style="margin-top:8px;"><strong>👉 Your BMI:</strong> <strong>${bmi || "—"}</strong> — ${bmiCategory.label}.</p>
        </div>
      `;

      const guidanceHtml = `
        <div style="font-size:1.06rem;">
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
            <span style="height:10px;width:10px;border-radius:999px;background:#F59E0B;display:inline-block"></span>
            <h3 style="margin:0;font-size:1.25rem;color:#F59E0B;">Personalized Guidance</h3>
          </div>
          <div style="margin-top:8px;">
            <h4 style="margin:0 0 6px 0;font-size:1.02rem;">🏷️ BMI Guidance</h4>
            <p style="margin:0 0 8px 0;">${bmiInfo.title}</p>
            <ul style="margin:0 0 12px 18px;line-height:1.4;">
              ${bmiInfo.bullets.map((b) => `<li>${b}</li>`).join("")}
            </ul>
          </div>
          <div style="margin-top:6px;">
            <h4 style="margin:0 0 6px 0;font-size:1.02rem;">🚬 Smoking</h4>
            <p style="margin:0 0 10px 0;">${smokingAdvice(smokingStatus)}</p>
          </div>
          <div style="margin-top:6px;">
            <h4 style="margin:0 0 6px 0;font-size:1.02rem;">🍷 Alcohol Use</h4>
            <p style="margin:0 0 10px 0;">${alcoholAdvice(alcoholUse)}</p>
          </div>
          <div style="margin-top:6px;">
            <h4 style="margin:0 0 6px 0;font-size:1.02rem;">🏃 Activity Level</h4>
            <p style="margin:0 0 10px 0;">${activityAdvice(activityLevel)}</p>
          </div>
          <div style="margin-top:6px;">
            <h4 style="margin:0 0 6px 0;font-size:1.02rem;">😴 Sleep</h4>
            <p style="margin:0 0 10px 0;">${sleepAdvice(sleepHours)}</p>
          </div>
          <p style="margin-top:8px;font-style:italic;color:#cbd5e1;">
            Note: These are educational suggestions — not medical advice. For personalised diagnosis, consult a healthcare professional.
          </p>
        </div>
      `;

      const pct = (n) => (n === undefined || n === null ? "—" : `${Math.round(Number(n))}%`);
      const diabetesHtmlExtra = prediction.diabetes ? diseaseDetailsHtml("diabetes") : `<p style='margin:6px 0 0 0;'>If low risk: keep healthy habits (diet, activity, routine checkups).</p>`;
      const heartHtmlExtra = prediction.heartDisease ? diseaseDetailsHtml("heartDisease") : `<p style='margin:6px 0 0 0;'>If low risk: monitor blood pressure, stay active and avoid smoking.</p>`;
      const cancerHtmlExtra = prediction.cancer ? diseaseDetailsHtml("cancer") : `<p style='margin:6px 0 0 0;'>If low risk: follow age-appropriate screening guidance and avoid high-risk behaviours (smoking, heavy alcohol).</p>`;

      const predsHtml = `
        <div style="font-size:1.06rem;">
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
            <span style="height:10px;width:10px;border-radius:999px;background:#EF4444;display:inline-block"></span>
            <h3 style="margin:0;font-size:1.25rem;color:#EF4444;">Prediction Results</h3>
          </div>
          <div style="margin-top:6px;">
            <p style="margin:4px 0;"><strong>Diabetes:</strong> ${prediction.diabetes ? "⚠️ At Risk" : "✅ Low Risk"} <span style="color:#94a3b8;">(${pct(prediction.diabetes_proba)} confidence)</span></p>
            ${diabetesHtmlExtra}
          </div>
          <div style="margin-top:10px;">
            <p style="margin:4px 0;"><strong>Heart disease:</strong> ${prediction.heartDisease ? "⚠️ At Risk" : "✅ Low Risk"} <span style="color:#94a3b8;">(${pct(prediction.heartDisease_proba)} confidence)</span></p>
            ${heartHtmlExtra}
          </div>
          <div style="margin-top:10px;">
            <p style="margin:4px 0;"><strong>Cancer:</strong> ${prediction.cancer ? "⚠️ At Risk" : "✅ Low Risk"} <span style="color:#94a3b8;">(${pct(prediction.cancer_proba)} confidence)</span></p>
            ${cancerHtmlExtra}
          </div>
          <p style="margin-top:10px;font-style:italic;color:#cbd5e1;">
            These are AI predictions (probabilities) — not a clinical diagnosis.
          </p>
        </div>
      `;

      const blocks = [
        { id: "bmi", finalHtml: bmiHtml },
        { id: "guidance", finalHtml: guidanceHtml },
        { id: "preds", finalHtml: predsHtml },
      ];

      // initialize messages with empty typed preview and empty final HTML
      setChatMsgs(blocks.map((b) => ({ id: b.id, finalHtml: b.finalHtml, displayPlain: "", displayHtml: "", done: false })));

      // typing animation: update displayPlain (escaped) while typing,
      // then set displayHtml when completed (so innerHTML receives only complete HTML)
      let accumulatedDelay = 350;
      blocks.forEach((block) => {
        const startTimer = setTimeout(() => {
          const text = block.finalHtml;
          // strip tags for typed preview
          const plain = stripHtmlTags(text);
          let i = 0;
          const interval = setInterval(() => {
            i += 1;
            // update typed preview
            setChatMsgs((prev) =>
              prev.map((m) => (m.id === block.id ? { ...m, displayPlain: plain.slice(0, i) } : m))
            );
            if (i >= plain.length) {
              clearInterval(interval);
              // set full final HTML and mark done
              setChatMsgs((prev) =>
                prev.map((m) => (m.id === block.id ? { ...m, displayPlain: plain, displayHtml: text, done: true } : m))
              );
            }
          }, TYPING_SPEED_MS);
          timersRef.current.push(interval);
        }, accumulatedDelay);
        timersRef.current.push(startTimer);
        // next block starts after this block length (approx) + gap
        // estimate using plain length to keep timings smaller and avoid very long waits
        const approxDelay = Math.max(200, stripHtmlTags(block.finalHtml).length * TYPING_SPEED_MS);
        accumulatedDelay += approxDelay + SECTION_DELAY_MS;
      });

      setTimeout(() => {
        const el = document.getElementById("personalized-section");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    } catch (err) {
      console.error("Network error:", err);
      setErrorMsg("Network error while saving/predicting. Is the backend running and /predict-and-save implemented?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white flex flex-col items-center px-6 pb-16">
      {/* header */}
      <div className="w-full relative mt-6 max-w-8xl flex items-start">
        <img src={logo} alt="Genetic GuardianAI Logo" className="h-64 w-64 object-contain" />
        {/* Guardian button — top-right */}
<button
  onClick={() => navigate("/guardian-chat")}
  title="Open Guardian Chat"
  className="absolute right-12 top-10 z-50 px-6 py-3 rounded-full shadow-2xl bg-gradient-to-r from-blue-600 to-white text-blue-900 text-xl font-bold hover:scale-105 active:scale-95 transition-transform"
>
  Guardian
</button>


        <div className="absolute left-1/2 -translate-x-1/2 text-center top-6">
          <h1 className="text-4xl font-extrabold tracking-wide">
            Genetic <span className="text-blue-400">GuardianAI</span>
          </h1>
          <p className="mt-2 text-lg text-white-300 max-w-2xl mx-auto">AI platform that predicts hereditary disease risks and gives personalised guidance.</p>
        </div>
      </div>
      

      {/* welcome */}
      <h2 className="mt-6 text-2xl font-bold tracking-wide">
        <span style={{ fontFamily: "Times New Roman, serif" }}>Your health companion awaits,</span>{" "}
        <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-green-400 bg-clip-text text-transparent drop-shadow-md" style={{ fontFamily: "Times New Roman, serif" }}>
          {username || "User"}.
        </span>
      </h2>

      {/* form */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-6 w-full max-w-7xl">
        <Card title="Demographics">
          <div><Label>Full Name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder=" " /></div>
          <div><Label>Age</Label><Input type="number" min="1" max="120" value={age} onChange={(e) => setAge(e.target.value)} placeholder="22" /></div>
          <div><Label>Sex</Label><Select value={sex} onChange={(e) => setSex(e.target.value)}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></Select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Height (feet)</Label><Input type="number" min="1" max="8" step="1" value={heightFeet} onChange={(e) => setHeightFeet(e.target.value)} placeholder="5" /></div>
            <div><Label>Height (inches)</Label><Input type="number" min="0" max="11" step="1" value={heightInches} onChange={(e) => setHeightInches(e.target.value)} placeholder="11" /></div>
          </div>
          <div><Label>Weight (kg)</Label><Input type="number" step="any" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="72" /></div>
          <div><Label>BMI (auto)</Label><Input value={bmi} readOnly disabled className="cursor-not-allowed opacity-70" /></div>
        </Card>

        <Card title="Lifestyle">
          <div><Label>Smoking Status</Label><Select value={smokingStatus} onChange={(e) => setSmokingStatus(e.target.value)}><option value="never">Never</option><option value="former">Former</option><option value="current">Current</option></Select></div>
          <div><Label>Alcohol Use</Label><Select value={alcoholUse} onChange={(e) => setAlcoholUse(e.target.value)}><option value="none">None</option><option value="occasional">Occasional</option><option value="regular">Regular</option></Select></div>
          <div><Label>Activity Level</Label><Select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)}><option value="sedentary">Sedentary</option><option value="light">Light</option><option value="moderate">Moderate</option><option value="active">Active</option></Select></div>
          <div><Label>Sleep (hrs/night)</Label><Input type="number" min="0" max="14" value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} /></div>
        </Card>

        <Card title="Medical History">
          <div className="space-y-3">
            <Check id="mh-diabetes" checked={hasDiabetes} onChange={setHasDiabetes} label="Diabetes" />
            <Check id="mh-htn" checked={hasHypertension} onChange={setHasHypertension} label="Hypertension" />
            <Check id="mh-heart" checked={hasHeartDisease} onChange={setHasHeartDisease} label="Heart Disease" />
            <Check id="mh-asthma" checked={hasAsthma} onChange={setHasAsthma} label="Asthma / Lung Disease" />
            <Check id="mh-kidney" checked={hasKidneyDisease} onChange={setHasKidneyDisease} label="Kidney Disease" />
            <Check id="mh-obesity" checked={hasObesity} onChange={setHasObesity} label="Obesity" />
          </div>
        </Card>

        <Card title="Family History">
          <div className="space-y-3">
            <Check id="fh-diabetes" checked={familyDiabetes} onChange={setFamilyDiabetes} label="Diabetes (first-degree)" />
            <Check id="fh-htn" checked={familyHypertension} onChange={setFamilyHypertension} label="Hypertension (first-degree)" />
            <Check id="fh-heart" checked={familyHeartDisease} onChange={setFamilyHeartDisease} label="Heart Disease (first-degree)" />
            <Check id="fh-cancer" checked={familyCancer} onChange={setFamilyCancer} label="Cancer (first-degree)" />
          </div>
        </Card>
      </div>

      {/* actions */}
      <div className="max-w-7xl w-full mx-auto">
        <div className="mt-8 flex flex-col items-center gap-6">
          <button onClick={handlePredictAndSave} disabled={loading} className={`px-8 py-3 rounded-2xl shadow-lg text-lg font-semibold transition-all ${loading ? "bg-gray-500 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"}`}>
            {loading ? "Saving & Predicting..." : "Save & Predict"}
          </button>

          {errorMsg && (
            <div className="max-w-xl w-full bg-red-900/40 border border-red-700 p-3 rounded text-red-100">
              <strong>Error:</strong> {errorMsg}
            </div>
          )}
        </div>
      </div>

      {/* chat-like output */}
      <div id="personalized-section" className="max-w-3xl w-full mt-10">
        <div className="flex flex-col gap-6">
          {chatMsgs.length === 0 && !predictions && (
            <div className="text-gray-400 italic text-lg">Enter your details and click Save & Predict to see BMI guidance and predictions here.</div>
          )}

          {chatMsgs.map((m) => (
            <div key={m.id} className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-300 to-blue-400 flex items-center justify-center text-black font-semibold shadow">AI</div>
              </div>

              <div className="max-w-full">
                <div className="rounded-2xl p-4" style={{ background: "linear-gradient(180deg, rgba(34,197,94,0.04), rgba(59,130,246,0.03))", border: "1px solid rgba(59,130,246,0.08)" }}>
                  {/* - while typing: show SAFE plain text preview (no HTML injected)
                      - when done: render the final HTML */}
                  {!m.done ? (
                    <div className="text-gray-100 text-lg whitespace-pre-wrap">{m.displayPlain}</div>
                  ) : (
                    <div className="text-gray-100 text-lg" dangerouslySetInnerHTML={{ __html: m.displayHtml }} />
                  )}

                  {!m.done && <div className="mt-2 text-gray-300 animate-pulse">▌</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
