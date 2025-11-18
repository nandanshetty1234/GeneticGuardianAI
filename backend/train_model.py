# train_model.py

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
import joblib

# 1. Load dataset
df = pd.read_csv("user_data.csv")
# 2. Features (X) and Targets (y)
X = df.drop(columns=["diagDiabetes", "diagHeartDisease", "diagCancer"])
y_diabetes = df["diagDiabetes"]
y_heart = df["diagHeartDisease"]
y_cancer = df["diagCancer"]

# 3. Encode categorical features
label_cols = ["sex", "smokingStatus", "alcoholUse", "activityLevel"]
encoders = {}

for col in label_cols:
    le = LabelEncoder()
    X[col] = le.fit_transform(X[col])
    encoders[col] = le

# 4. Train-test split
X_train, X_test, y_train_d, y_test_d = train_test_split(X, y_diabetes, test_size=0.2, random_state=42)
_, _, y_train_h, y_test_h = train_test_split(X, y_heart, test_size=0.2, random_state=42)
_, _, y_train_c, y_test_c = train_test_split(X, y_cancer, test_size=0.2, random_state=42)

# 5. Train models
models = {}
for label, y_train, y_test in [
    ("diabetes", y_train_d, y_test_d),
    ("heart", y_train_h, y_test_h),
    ("cancer", y_train_c, y_test_c),
]:
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    print(f"\n===== {label.upper()} PREDICTION REPORT =====")
    print(classification_report(y_test, y_pred))
    models[label] = model

# 6. Save models & encoders
joblib.dump(models["diabetes"], "model_diabetes.pkl")
joblib.dump(models["heart"], "model_heart.pkl")
joblib.dump(models["cancer"], "model_cancer.pkl")
joblib.dump(encoders, "encoders.pkl")

print("\n✅ Models and encoders saved successfully!")
