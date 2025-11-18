#!/usr/bin/env python
# predict.py - final: column alignment + confidence % + diagnostics
# Reads JSON from stdin and prints JSON result to stdout.

import sys
import json
import joblib
import pandas as pd
import numpy as np
from pathlib import Path

FEATURE_COLS = [
    "age","sex","heightCm","weightKg","bmi",
    "smokingStatus","alcoholUse","activityLevel","sleepHours",
    "hasDiabetes","hasHypertension","hasHeartDisease","hasAsthma","hasKidneyDisease","hasObesity",
    "familyDiabetes","familyHypertension","familyHeartDisease","familyCancer"
]

CATEGORICAL_LABELS = ["sex", "smokingStatus", "alcoholUse", "activityLevel"]
NUMERIC_COLS = ["age","heightCm","weightKg","bmi","sleepHours"]

BASE_DIR = Path(__file__).resolve().parent

def clean_name(s):
    if s is None:
        return s
    return str(s).strip().strip('"').strip("'").strip()

def get_positive_proba(model, X):
    """
    Return probability for the positive class (0..1) for the first row of X.
    Try predict_proba, then decision_function (sigmoid), then fallback to predict.
    """
    try:
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(X)
            if proba.ndim == 2 and proba.shape[1] == 2:
                return float(proba[0, 1])
            # fallback: return max probability (not ideal for binary but safer than nothing)
            return float(np.max(proba[0]))
    except Exception:
        pass

    try:
        if hasattr(model, "decision_function"):
            score = model.decision_function(X)
            val = float(np.asarray(score).reshape(-1)[0])
            # sigmoid
            return float(1.0 / (1.0 + np.exp(-val)))
    except Exception:
        pass

    try:
        p = model.predict(X)
        return float(bool(p[0]))
    except Exception:
        return 0.0

def respond_error(code=500, **payload):
    out = {"error": True}
    out.update(payload)
    print(json.dumps(out))
    sys.exit(code)

def main():
    raw = sys.stdin.read()
    if not raw:
        respond_error(detail="no input provided")

    try:
        payload = json.loads(raw)
    except Exception as e:
        respond_error(detail=f"invalid json: {e}")

    # Build row using canonical FEATURE_COLS (allow missing keys)
    row = {}
    for col in FEATURE_COLS:
        v = payload.get(col, None)
        if col.startswith("has") or col.startswith("family"):
            row[col] = bool(v) if v is not None else False
        else:
            row[col] = v

    # coerce numeric types
    for c in NUMERIC_COLS:
        try:
            if row.get(c) is None or row.get(c) == "":
                row[c] = np.nan
            else:
                row[c] = float(row[c])
        except Exception:
            row[c] = np.nan

    df = pd.DataFrame([row])

    # Load encoders & models
    try:
        encoders = joblib.load(BASE_DIR / "encoders.pkl")
    except Exception as e:
        respond_error(detail=f"could not load encoders: {e}")

    try:
        model_diabetes = joblib.load(BASE_DIR / "model_diabetes.pkl")
        model_heart = joblib.load(BASE_DIR / "model_heart.pkl")
        model_cancer = joblib.load(BASE_DIR / "model_cancer.pkl")
    except Exception as e:
        respond_error(detail=f"could not load models: {e}")

    # Determine expected feature order from model (if available)
    expected = None
    try:
        expected = list(model_diabetes.feature_names_in_)
    except Exception:
        # model may not have feature_names_in_; we'll try to align using FEATURE_COLS
        expected = None

    if expected:
        # Attempt to map input columns to expected by cleaned names
        current_cols = list(df.columns)
        cleaned_to_current = { clean_name(c): c for c in current_cols }

        rename_map = {}
        missing_expected = []
        for exp in expected:
            exp_clean = clean_name(exp)
            if exp in current_cols:
                continue
            if exp_clean in cleaned_to_current:
                current_name = cleaned_to_current[exp_clean]
                if current_name != exp:
                    rename_map[current_name] = exp
            else:
                missing_expected.append(exp)

        if rename_map:
            df = df.rename(columns=rename_map)

        # after rename, check coverage: keep only expected columns present
        present = [c for c in df.columns if c in expected]
        missing_after = [e for e in expected if e not in df.columns]
        extra_after = [c for c in df.columns if c not in expected]

        if missing_after:
            # helpful diagnostic and abort
            diag = {
                "error_type": "feature_name_mismatch",
                "note": "Model expects a different set of feature names. Check CSV headers/models.",
                "expected_count": len(expected),
                "expected_example": expected[:6],
                "missing_after_rename": missing_after,
                "extra_input_columns": extra_after,
                "rename_map_attempted": rename_map
            }
            print(json.dumps(diag))
            return

        # reorder to expected
        df = df[expected]
    else:
        # If we couldn't get expected, ensure we at least include the canonical FEATURE_COLS if present
        # rename any cleaned matches from FEATURE_COLS
        curr = list(df.columns)
        cleaned = { clean_name(c): c for c in curr }
        rename_map = {}
        for target in FEATURE_COLS:
            tclean = clean_name(target)
            if target in curr:
                continue
            if tclean in cleaned:
                rename_map[cleaned[tclean]] = target
        if rename_map:
            df = df.rename(columns=rename_map)

        # keep only canonical features that exist
        keep = [c for c in FEATURE_COLS if c in df.columns]
        if not keep:
            respond_error(detail="no known feature columns found in input")
        # reorder to canonical where possible
        df = df[keep]

        # for missing numeric/bool columns, add defaults so models won't crash
        for c in FEATURE_COLS:
            if c not in df.columns:
                if c in NUMERIC_COLS:
                    df[c] = 0.0
                elif c.startswith("has") or c.startswith("family"):
                    df[c] = False
                else:
                    df[c] = ""  # categorical fallback

        # ensure final order matches canonical FEATURE_COLS (this matches training assumption best-effort)
        df = df[FEATURE_COLS]

    # Apply encoders for categorical columns (safe transform; unseen -> -1)
    for col in CATEGORICAL_LABELS:
        le = encoders.get(col)
        if col not in df.columns:
            # if missing, add default empty
            df[col] = ""
        if le is None:
            df[col] = df[col].astype(str).fillna("")
        else:
            try:
                df[col] = le.transform(df[col].astype(str))
            except Exception:
                classes = list(le.classes_)
                mapping = {c: i for i, c in enumerate(classes)}
                df[col] = df[col].astype(str).map(lambda v: mapping.get(v, -1)).astype(int)

    # booleans -> ensure dtype
    for c in df.columns:
        if c.startswith("has") or c.startswith("family"):
            df[c] = df[c].fillna(False).astype(bool)

    # numeric NaNs -> safe defaults (0.0)
    for c in NUMERIC_COLS:
        if c in df.columns:
            if pd.isna(df.loc[0, c]):
                df.loc[0, c] = 0.0

    # Final safety: ensure column order matches training model if available
    try:
        if expected:
            df = df[expected]
    except Exception:
        pass

    # Run predictions
    try:
        pred_d = model_diabetes.predict(df)[0]
        pred_h = model_heart.predict(df)[0]
        pred_c = model_cancer.predict(df)[0]
    except Exception as e:
        respond_error(detail=f"prediction failed: {e}")

    # Probabilities / confidence
    try:
        p_d = get_positive_proba(model_diabetes, df)
        p_h = get_positive_proba(model_heart, df)
        p_c = get_positive_proba(model_cancer, df)
    except Exception:
        p_d = p_h = p_c = 0.0

    # Build output (booleans + percentage confidences)
    out = {
        "diabetes": bool(pred_d),
        "diabetes_proba": round(float(p_d) * 100.0, 1),
        "heartDisease": bool(pred_h),
        "heartDisease_proba": round(float(p_h) * 100.0, 1),
        "cancer": bool(pred_c),
        "cancer_proba": round(float(p_c) * 100.0, 1),
    }

    print(json.dumps(out))

if __name__ == "__main__":
    main()
