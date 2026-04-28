from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import joblib
import os
from PIL import Image
import io
import base64
from auth import register_user, login_user, get_all_users, delete_user, update_user, init_default_admin
app = Flask(__name__)
CORS(app)

# ── DISEASE INFO DATABASE ─────────────────────────────────────────────────────
DISEASE_INFO = {
    "Fungal infection":     {"specialty": "Dermatology",  "urgency": "Low"},
    "Allergy":              {"specialty": "Immunology",   "urgency": "Low"},
    "GERD":                 {"specialty": "Gastroenterology", "urgency": "Medium"},
    "Chronic cholestasis":  {"specialty": "Gastroenterology", "urgency": "Medium"},
    "Drug Reaction":        {"specialty": "Dermatology",  "urgency": "High"},
    "Peptic ulcer disease": {"specialty": "Gastroenterology", "urgency": "Medium"},
    "AIDS":                 {"specialty": "Infectious Disease", "urgency": "High"},
    "Diabetes":             {"specialty": "Endocrinology", "urgency": "High"},
    "Gastroenteritis":      {"specialty": "Gastroenterology", "urgency": "Medium"},
    "Bronchial Asthma":     {"specialty": "Pulmonology",  "urgency": "High"},
    "Hypertension":         {"specialty": "Cardiology",   "urgency": "High"},
    "Migraine":             {"specialty": "Neurology",    "urgency": "Medium"},
    "Cervical spondylosis": {"specialty": "Orthopedics",  "urgency": "Medium"},
    "Paralysis":            {"specialty": "Neurology",    "urgency": "High"},
    "Jaundice":             {"specialty": "Hepatology",   "urgency": "High"},
    "Malaria":              {"specialty": "Infectious Disease", "urgency": "High"},
    "Chicken pox":          {"specialty": "Dermatology",  "urgency": "Medium"},
    "Dengue":               {"specialty": "Infectious Disease", "urgency": "High"},
    "Typhoid":              {"specialty": "Infectious Disease", "urgency": "High"},
    "hepatitis A":          {"specialty": "Hepatology",   "urgency": "High"},
    "Hepatitis B":          {"specialty": "Hepatology",   "urgency": "High"},
    "Hepatitis C":          {"specialty": "Hepatology",   "urgency": "High"},
    "Hepatitis D":          {"specialty": "Hepatology",   "urgency": "High"},
    "Hepatitis E":          {"specialty": "Hepatology",   "urgency": "High"},
    "Alcoholic hepatitis":  {"specialty": "Hepatology",   "urgency": "High"},
    "Tuberculosis":         {"specialty": "Pulmonology",  "urgency": "High"},
    "Common Cold":          {"specialty": "General Practice", "urgency": "Low"},
    "Pneumonia":            {"specialty": "Pulmonology",  "urgency": "High"},
    "Dimorphic hemorrhoids":{"specialty": "Proctology",   "urgency": "Medium"},
    "Heart attack":         {"specialty": "Cardiology",   "urgency": "Critical"},
    "Varicose veins":       {"specialty": "Vascular Surgery", "urgency": "Low"},
    "Hypothyroidism":       {"specialty": "Endocrinology", "urgency": "Medium"},
    "Hyperthyroidism":      {"specialty": "Endocrinology", "urgency": "Medium"},
    "Hypoglycemia":         {"specialty": "Endocrinology", "urgency": "High"},
    "Osteoarthritis":       {"specialty": "Orthopedics",  "urgency": "Medium"},
    "Arthritis":            {"specialty": "Rheumatology", "urgency": "Medium"},
    "Vertigo":              {"specialty": "Neurology",    "urgency": "Medium"},
    "Acne":                 {"specialty": "Dermatology",  "urgency": "Low"},
    "Urinary tract infection": {"specialty": "Urology",   "urgency": "Medium"},
    "Psoriasis":            {"specialty": "Dermatology",  "urgency": "Low"},
    "Impetigo":             {"specialty": "Dermatology",  "urgency": "Low"},
}

# ── LOAD MODELS ───────────────────────────────────────────────────────────────
symptom_model = None
symptoms_list = None

def load_models():
    global symptom_model, symptoms_list
    model_path = os.path.join('..', 'ml', 'trained_models', 'symptom_model.pkl')
    symptoms_path = os.path.join('..', 'ml', 'trained_models', 'symptoms_list.pkl')

    if os.path.exists(model_path):
        symptom_model = joblib.load(model_path)
        symptoms_list = joblib.load(symptoms_path)
        print("✅ Symptom model loaded!")
    else:
        print("⚠️  No trained model found. Train it first using ml/train_models.py")

load_models()
init_default_admin()

# ── ROUTES ────────────────────────────────────────────────────────────────────

@app.route('/')
def home():
    return jsonify({
        "message": "MediAI API Running ✅",
        "version": "1.0",
        "endpoints": ["/predict/symptoms", "/predict/csv", "/predict/image", "/symptoms/list", "/diseases"]
    })


@app.route('/diseases', methods=['GET'])
def get_diseases():
    return jsonify({"diseases": list(DISEASE_INFO.keys()), "total": len(DISEASE_INFO)})


@app.route('/symptoms/list', methods=['GET'])
def get_symptoms():
    if symptoms_list is None:
        return jsonify({"error": "Model not trained yet"}), 404
    return jsonify({"symptoms": sorted(symptoms_list), "total": len(symptoms_list)})


@app.route('/predict/symptoms', methods=['POST'])
def predict_symptoms():
    if symptom_model is None:
        return jsonify({"error": "Model not trained yet. Run ml/train_models.py first"}), 503

    data = request.get_json()
    symptoms_input = data.get('symptoms', [])

    if not symptoms_input:
        return jsonify({"error": "No symptoms provided"}), 400

    # Build feature vector
    feature_vector = [1 if s in symptoms_input else 0 for s in symptoms_list]
    feature_vector = np.array(feature_vector).reshape(1, -1)

    # Predict
    probabilities = symptom_model.predict_proba(feature_vector)[0]
    classes = symptom_model.classes_

    # Top 5 predictions
    top5_idx = np.argsort(probabilities)[-5:][::-1]
    top5 = [
        {
            "disease": classes[i],
            "confidence": round(float(probabilities[i]) * 100, 1),
            "specialty": DISEASE_INFO.get(classes[i], {}).get("specialty", "General Practice"),
            "urgency":   DISEASE_INFO.get(classes[i], {}).get("urgency", "Medium")
        }
        for i in top5_idx
    ]

    primary = top5[0]

    return jsonify({
        "primary_diagnosis": primary["disease"],
        "confidence": primary["confidence"],
        "specialty": primary["specialty"],
        "urgency": primary["urgency"],
        "differential_diagnosis": top5,
        "symptoms_analyzed": len(symptoms_input),
        "disclaimer": "For informational purposes only. Always consult a qualified doctor."
    })




    # Load the correct model
    model_path = os.path.join('..', 'ml', 'trained_models', f'{disease_type}_model.h5')
    if not os.path.exists(model_path):
        return jsonify({"error": f"No trained model found for {disease_type}"}), 404

    try:
        import tensorflow as tf
        model = tf.keras.models.load_model(model_path)
        prediction = model.predict(img_array)[0]
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

    label_maps = {
        "pneumonia":             ["Normal", "Pneumonia"],
        "brain_tumor":           ["Glioma", "Meningioma", "No Tumor", "Pituitary"],
        "skin_cancer":           ["Benign", "Malignant"],
        "diabetic_retinopathy":  ["No DR", "Mild", "Moderate", "Severe", "Proliferative DR"],
        "covid19":               ["COVID-19", "Normal", "Viral Pneumonia"],
        "kidney_disease":        ["Cyst", "Normal", "Stone", "Tumor"],
    }

    labels = label_maps.get(disease_type, [f"Class {i}" for i in range(len(prediction))])
    class_idx = int(np.argmax(prediction))
    result = labels[class_idx] if class_idx < len(labels) else "Unknown"

    return jsonify({
        "result": result,
        "confidence": round(float(prediction[class_idx]) * 100, 1),
        "disease_type": disease_type,
        "all_probabilities": {
            labels[i]: round(float(prediction[i]) * 100, 1)
            for i in range(min(len(prediction), len(labels)))
        },
        "disclaimer": "For informational purposes only. Always consult a qualified doctor."
    })



@app.route('/predict/csv', methods=['POST'])
def predict_csv():
    data = request.get_json()
    disease_type = data.get('disease_type')
    features = data.get('features', [])

    model_map = {
        'diabetes':     ('diabetes_model.pkl',      'diabetes_scaler.pkl'),
        'heart':        ('heart_model.pkl',          'heart_scaler.pkl'),
        'kidney':       ('kidney_model.pkl',         'kidney_scaler.pkl'),
        'liver':        ('liver_model.pkl',          'liver_scaler.pkl'),
        'breast_cancer':('breast_cancer_model.pkl',  'breast_cancer_scaler.pkl'),
    }

    label_map = {
        'diabetes':     {0: 'No Diabetes', 1: 'Diabetes Detected'},
        'heart':        {0: 'No Heart Disease', 1: 'Heart Disease Detected'},
        'kidney':       {0: 'No CKD', 1: 'Chronic Kidney Disease'},
        'liver':        {1: 'Liver Disease', 2: 'No Liver Disease'},
        'breast_cancer':{0: 'Benign (Non-cancerous)', 1: 'Malignant (Cancerous)'},
    }

    if disease_type not in model_map:
        return jsonify({"error": "Unknown disease type"}), 400

    model_file, scaler_file = model_map[disease_type]
    model_path  = os.path.join('..', 'ml', 'trained_models', model_file)
    scaler_path = os.path.join('..', 'ml', 'trained_models', scaler_file)

    if not os.path.exists(model_path):
        return jsonify({"error": f"Model not found for {disease_type}"}), 404

    model  = joblib.load(model_path)
    scaler = joblib.load(scaler_path)

    X = np.array(features).reshape(1, -1)
    X_scaled = scaler.transform(X)

    prediction = model.predict(X_scaled)[0]
    proba = model.predict_proba(X_scaled)[0]
    confidence = round(float(max(proba)) * 100, 1)

    labels = label_map.get(disease_type, {})
    result_label = labels.get(int(prediction), str(prediction))

    return jsonify({
        "result": int(prediction),
        "result_label": result_label,
        "confidence": confidence,
        "disease_type": disease_type
    })


@app.route('/predict/image', methods=['POST'])
def predict_image():
    
    from PIL import Image
    import io, base64

    data = request.get_json()
    disease_type = data.get('disease_type', '')
    image_b64    = data.get('image', '')

    if not image_b64:
        return jsonify({"error": "No image provided"}), 400

    # ── Label maps for each disease ──
    label_maps = {
        "pneumonia":   {0: "Normal", 1: "Pneumonia"},
        "brain_tumor": {0: "Glioma", 1: "Meningioma", 2: "No Tumor", 3: "Pituitary"},
        "skin_cancer": {0: "Benign", 1: "Malignant"},
        "covid19":     {0: "COVID-19", 1: "Normal", 2: "Viral Pneumonia"},
        "kidney":      {0: "Cyst", 1: "Normal", 2: "Stone", 3: "Tumor"},
        "eye":         {0: "No DR", 1: "Mild DR", 2: "Moderate DR", 3: "Severe DR", 4: "Proliferative DR"},
    }

    descriptions = {
        "pneumonia":   "Chest X-Ray analyzed for pneumonia infection",
        "brain_tumor": "Brain MRI analyzed for tumor classification",
        "skin_cancer": "Skin dermoscopy analyzed for malignancy",
        "covid19":     "Chest X-Ray analyzed for COVID-19",
        "kidney":      "Kidney CT scan analyzed for abnormalities",
        "eye":         "Retinal fundus image analyzed for diabetic retinopathy",
    }

    recommendations = {
        "Normal":        "No significant findings. Continue regular checkups.",
        "Pneumonia":     "Pneumonia detected. Consult a pulmonologist immediately.",
        "Glioma":        "Glioma detected. Urgent neurology consultation required.",
        "Meningioma":    "Meningioma detected. Neurosurgery evaluation needed.",
        "No Tumor":      "No tumor detected. Continue regular monitoring.",
        "Pituitary":     "Pituitary tumor detected. Endocrinology consultation needed.",
        "Benign":        "Benign lesion detected. Monitor for changes.",
        "Malignant":     "Malignant lesion detected. Urgent oncology referral.",
        "COVID-19":      "COVID-19 pattern detected. Isolate and seek medical care.",
        "Viral Pneumonia":"Viral pneumonia detected. Pulmonology consultation needed.",
        "Cyst":          "Kidney cyst detected. Monitor with follow-up imaging.",
        "Stone":         "Kidney stone detected. Urology consultation recommended.",
        "Tumor":         "Kidney tumor detected. Urgent urology referral required.",
        "No DR":         "No diabetic retinopathy. Annual eye exams recommended.",
        "Mild DR":       "Mild diabetic retinopathy. Ophthalmology follow-up needed.",
        "Moderate DR":   "Moderate DR. Ophthalmologist consultation recommended.",
        "Severe DR":     "Severe DR. Urgent ophthalmology referral required.",
        "Proliferative DR": "Proliferative DR. Immediate treatment required.",
    }

    # ── Load model ──
    model_path = os.path.join('..', 'ml', 'trained_models', f'{disease_type}_image_model.h5')

    if not os.path.exists(model_path):
        # ── Demo mode: return a simulated result if model not trained yet ──
        import random
        labels = label_maps.get(disease_type, {0: "Unknown"})
        idx    = random.randint(0, len(labels) - 1)
        result = labels[idx]
        conf   = round(random.uniform(72, 96), 1)

        all_probs = {}
        remaining = 100 - conf
        for i, label in labels.items():
            if i == idx:
                all_probs[label] = conf
            else:
                share = round(remaining / (len(labels) - 1), 1)
                all_probs[label] = share

        return jsonify({
            "result":          result,
            "confidence":      conf,
            "disease_type":    disease_type,
            "description":     descriptions.get(disease_type, ""),
            "recommendation":  recommendations.get(result, "Consult a doctor."),
            "all_probabilities": all_probs,
            "demo_mode":       True,
            "disclaimer":      "DEMO MODE — Train image models for real predictions."
        })

    # ── Real model prediction ──
    try:
        image_data = base64.b64decode(image_b64)
        image      = Image.open(io.BytesIO(image_data)).convert('RGB')
        image      = image.resize((224, 224))
        img_array  = np.array(image) / 255.0
        img_array  = np.expand_dims(img_array, axis=0)

        model      = tf.keras.models.load_model(model_path)
        prediction = model.predict(img_array)[0]
        class_idx  = int(np.argmax(prediction))
        confidence = round(float(prediction[class_idx]) * 100, 1)

        labels     = label_maps.get(disease_type, {})
        result     = labels.get(class_idx, f"Class {class_idx}")

        all_probs  = {
            labels.get(i, f"Class {i}"): round(float(prediction[i]) * 100, 1)
            for i in range(len(prediction))
        }

        return jsonify({
            "result":          result,
            "confidence":      confidence,
            "disease_type":    disease_type,
            "description":     descriptions.get(disease_type, ""),
            "recommendation":  recommendations.get(result, "Consult a doctor."),
            "all_probabilities": all_probs,
            "demo_mode":       False,
            "disclaimer":      "For informational purposes only. Always consult a doctor."
        })

    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

# ── AUTH ROUTES ───────────────────────────────────────────────

@app.route('/auth/login', methods=['POST'])
def auth_login():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({"success": False, "error": "Username and password required"}), 400

    success, result = login_user(username, password)

    if not success:
        return jsonify({"success": False, "error": result}), 401

    return jsonify({
        "success":   True,
        "username":  result['username'],
        "full_name": result['full_name'],
        "role":      result['role'],
        "token":     f"mediai_{username}_{result['created_at'][:10]}"
    })


@app.route('/auth/register', methods=['POST'])
def auth_register():
    data = request.get_json()
    username  = data.get('username', '').strip()
    password  = data.get('password', '').strip()
    full_name = data.get('full_name', '').strip()
    role      = data.get('role', 'Doctor')

    if not username or not password or not full_name:
        return jsonify({"success": False, "error": "All fields are required"}), 400

    if len(password) < 6:
        return jsonify({"success": False, "error": "Password must be at least 6 characters"}), 400

    success, message = register_user(username, password, full_name, role)

    if not success:
        return jsonify({"success": False, "error": message}), 409

    return jsonify({"success": True, "message": message})


@app.route('/auth/users', methods=['GET'])
def auth_get_users():
    return jsonify({"users": get_all_users()})


@app.route('/auth/users/<username>', methods=['DELETE'])
def auth_delete_user(username):
    if username == 'admin':
        return jsonify({"success": False, "error": "Cannot delete admin"}), 403
    success = delete_user(username)
    return jsonify({"success": success})


@app.route('/auth/users/<username>', methods=['PUT'])
def auth_update_user(username):
    data = request.get_json()
    success = update_user(
        username,
        full_name=data.get('full_name'),
        role=data.get('role'),
        password=data.get('password')
    )
    return jsonify({"success": success})
@app.route('/chat', methods=['POST'])
def chat():
    import anthropic

    data = request.get_json()
    messages = data.get('messages', [])
    
    if not messages:
        return jsonify({"error": "No messages provided"}), 400

    SYSTEM_PROMPT = """You are MediAI Assistant, an expert medical information chatbot. You help users with:
- Symptoms and what they might indicate
- Diseases, their causes, treatments and prevention
- Medical procedures and tests (X-rays, MRI, blood tests, etc.)
- Medications and their general uses
- General health, wellness and nutrition advice
- Finding the right type of doctor/specialist for their condition
- Hospital and clinic information (general guidance)
- Emergency guidance — always tell users to call emergency services for serious symptoms
- Mental health awareness and resources

Guidelines:
- Be warm, clear, and professional
- Use simple language
- Format responses with bullet points when listing multiple items
- Always recommend consulting a qualified doctor for personal medical decisions
- For emergencies (chest pain, difficulty breathing, stroke signs) always say to call emergency services immediately
- Never diagnose — provide general information only
- If asked about nearby hospitals or doctors, ask for their city/location first then provide general guidance on what type of facility to look for"""

    try:
        client = anthropic.Anthropic()
        response = client.messages.create(
            model="claude-opus-4-5",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=messages
        )
        reply = response.content[0].text
        return jsonify({"reply": reply, "success": True})

    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500
    
if __name__ == '__main__':
    app.run(debug=True, port=5001, host='0.0.0.0')
