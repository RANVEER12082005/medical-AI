import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib
import os

# ── PATHS ─────────────────────────────────────────────────────
BASE   = os.path.dirname(os.path.abspath(__file__))
DATA   = os.path.join(BASE, 'data')
MODELS = os.path.join(BASE, 'trained_models')
os.makedirs(MODELS, exist_ok=True)

# ── HELPER: clean any dataframe automatically ─────────────────
def clean_dataframe(df):
    """Convert all text columns to numbers and fill missing values."""
    df = df.replace('?', np.nan)
    for col in df.columns:
        if df[col].dtype == 'object':
            df[col] = df[col].astype(str).str.strip()
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col])
        else:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    df = df.fillna(df.median(numeric_only=True))
    return df

# ── HELPER: find csv file in a folder ────────────────────────
def find_csv(folder):
    """Automatically find the first CSV file in a folder."""
    folder_path = os.path.join(DATA, folder)
    if not os.path.exists(folder_path):
        return None
    for f in os.listdir(folder_path):
        if f.endswith('.csv'):
            return os.path.join(folder_path, f)
    return None

print("=" * 60)
print("   MediAI — Training All Models")
print("=" * 60)

# ── 1. SYMPTOM MODEL ──────────────────────────────────────────
def train_symptom_model():
    print("\n[1/6] Training Symptom Disease Model...")
    path = os.path.join(DATA, 'dataset.csv')

    if not os.path.exists(path):
        print("❌ dataset.csv not found, skipping.")
        return

    df = pd.read_csv(path)
    symptom_cols = [c for c in df.columns if c != 'Disease']

    all_symptoms = set()
    for col in symptom_cols:
        for val in df[col].dropna().unique():
            cleaned = str(val).strip()
            if cleaned and cleaned != 'nan':
                all_symptoms.add(cleaned)
    all_symptoms = sorted(list(all_symptoms))

    X = pd.DataFrame(0, index=df.index, columns=all_symptoms)
    for col in symptom_cols:
        for idx, symptom in df[col].items():
            cleaned = str(symptom).strip()
            if cleaned in all_symptoms:
                X.at[idx, cleaned] = 1

    y = df['Disease']
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y)

    model = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    acc = accuracy_score(y_test, model.predict(X_test))
    print(f"   ✅ Accuracy: {acc*100:.2f}%")

    joblib.dump(model,        os.path.join(MODELS, 'symptom_model.pkl'))
    joblib.dump(all_symptoms, os.path.join(MODELS, 'symptoms_list.pkl'))
    print("   ✅ Symptom model saved!")


# ── 2. DIABETES MODEL ─────────────────────────────────────────
def train_diabetes_model():
    print("\n[2/6] Training Diabetes Model...")
    path = find_csv('diabetes')

    if not path:
        print("❌ No CSV found in ml/data/diabetes/, skipping.")
        return

    df = pd.read_csv(path)
    df = clean_dataframe(df)

    # Target is last column or 'Outcome'
    target = 'Outcome' if 'Outcome' in df.columns else df.columns[-1]
    X = df.drop(columns=[target])
    y = df[target]

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42)

    model = LogisticRegression(max_iter=1000, random_state=42)
    model.fit(X_train, y_train)
    acc = accuracy_score(y_test, model.predict(X_test))
    print(f"   ✅ Accuracy: {acc*100:.2f}%")

    joblib.dump(model,          os.path.join(MODELS, 'diabetes_model.pkl'))
    joblib.dump(scaler,         os.path.join(MODELS, 'diabetes_scaler.pkl'))
    joblib.dump(list(X.columns),os.path.join(MODELS, 'diabetes_features.pkl'))
    print("   ✅ Diabetes model saved!")


# ── 3. HEART DISEASE MODEL ────────────────────────────────────
def train_heart_model():
    print("\n[3/6] Training Heart Disease Model...")
    path = find_csv('heart_disease')

    if not path:
        print("❌ No CSV found in ml/data/heart_disease/, skipping.")
        return

    df = pd.read_csv(path)
    df = clean_dataframe(df)

    target = 'target' if 'target' in df.columns else \
             'DEATH_EVENT' if 'DEATH_EVENT' in df.columns else df.columns[-1]
    X = df.drop(columns=[target])
    y = df[target]

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42)

    model = GradientBoostingClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    acc = accuracy_score(y_test, model.predict(X_test))
    print(f"   ✅ Accuracy: {acc*100:.2f}%")

    joblib.dump(model,          os.path.join(MODELS, 'heart_model.pkl'))
    joblib.dump(scaler,         os.path.join(MODELS, 'heart_scaler.pkl'))
    joblib.dump(list(X.columns),os.path.join(MODELS, 'heart_features.pkl'))
    print("   ✅ Heart disease model saved!")


# ── 4. KIDNEY DISEASE MODEL ───────────────────────────────────
def train_kidney_model():
    print("\n[4/6] Training Kidney Disease Model...")
    path = find_csv('kidney_disease')

    if not path:
        print("❌ No CSV found in ml/data/kidney_disease/, skipping.")
        return

    df = pd.read_csv(path)

    # Drop id column if exists
    if 'id' in df.columns:
        df = df.drop(columns=['id'])

    target = 'classification' if 'classification' in df.columns else df.columns[-1]

    # Clean target column separately
    df[target] = df[target].astype(str).str.strip()

    X = df.drop(columns=[target])
    y = LabelEncoder().fit_transform(df[target])

    X = clean_dataframe(X)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42)

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    acc = accuracy_score(y_test, model.predict(X_test))
    print(f"   ✅ Accuracy: {acc*100:.2f}%")

    joblib.dump(model,          os.path.join(MODELS, 'kidney_model.pkl'))
    joblib.dump(scaler,         os.path.join(MODELS, 'kidney_scaler.pkl'))
    joblib.dump(list(X.columns),os.path.join(MODELS, 'kidney_features.pkl'))
    print("   ✅ Kidney model saved!")


# ── 5. LIVER DISEASE MODEL ────────────────────────────────────
def train_liver_model():
    print("\n[5/6] Training Liver Disease Model...")
    path = find_csv('liver_disease')

    if not path:
        print("❌ No CSV found in ml/data/liver_disease/, skipping.")
        return

    df = pd.read_csv(path)

    target = 'Dataset' if 'Dataset' in df.columns else df.columns[-1]

    # Clean target separately
    y = df[target].copy()
    X = df.drop(columns=[target])

    # Clean all feature columns
    X = clean_dataframe(X)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42)

    model = DecisionTreeClassifier(random_state=42)
    model.fit(X_train, y_train)
    acc = accuracy_score(y_test, model.predict(X_test))
    print(f"   ✅ Accuracy: {acc*100:.2f}%")

    joblib.dump(model,          os.path.join(MODELS, 'liver_model.pkl'))
    joblib.dump(scaler,         os.path.join(MODELS, 'liver_scaler.pkl'))
    joblib.dump(list(X.columns),os.path.join(MODELS, 'liver_features.pkl'))
    print("   ✅ Liver model saved!")


# ── 6. BREAST CANCER MODEL ────────────────────────────────────
def train_breast_cancer_model():
    print("\n[6/6] Training Breast Cancer Model...")
    path = find_csv('breast_cancer')

    if not path:
        print("❌ No CSV found in ml/data/breast_cancer/, skipping.")
        return

    df = pd.read_csv(path)

    # Drop useless columns
    for col in ['id', 'Unnamed: 32']:
        if col in df.columns:
            df = df.drop(columns=[col])

    target = 'diagnosis' if 'diagnosis' in df.columns else df.columns[-1]
    y = LabelEncoder().fit_transform(df[target].astype(str))
    X = df.drop(columns=[target])
    X = clean_dataframe(X)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42)

    model = SVC(kernel='rbf', probability=True, random_state=42)
    model.fit(X_train, y_train)
    acc = accuracy_score(y_test, model.predict(X_test))
    print(f"   ✅ Accuracy: {acc*100:.2f}%")

    joblib.dump(model,          os.path.join(MODELS, 'breast_cancer_model.pkl'))
    joblib.dump(scaler,         os.path.join(MODELS, 'breast_cancer_scaler.pkl'))
    joblib.dump(list(X.columns),os.path.join(MODELS, 'breast_cancer_features.pkl'))
    print("   ✅ Breast cancer model saved!")


# ── RUN ALL ───────────────────────────────────────────────────
if __name__ == '__main__':
    train_symptom_model()
    train_diabetes_model()
    train_heart_model()
    train_kidney_model()
    train_liver_model()
    train_breast_cancer_model()

    print("\n" + "="*60)
    print("   🎉 All models trained and saved!")
    print("   📁 Check ml/trained_models/ folder")
    print("="*60)
