🏥 MediAI — Intelligent Medical AI Assistant
An AI-powered healthcare web application that predicts potential medical conditions based on user symptoms using Machine Learning.

OVERVIEW OF THE PROJECT:
<img width="1440" height="810" alt="Screenshot 2026-04-28 at 2 42 49 PM" src="https://github.com/user-attachments/assets/1f59fb83-5629-401f-a72d-0c93130101ff" />
<img width="1440" height="806" alt="Screenshot 2026-04-28 at 2 43 48 PM" src="https://github.com/user-attachments/assets/37209055-f285-43a1-a3ff-957f6da47e0c" />
<img width="1440" height="805" alt="Screenshot 2026-04-28 at 2 43 41 PM" src="https://github.com/user-attachments/assets/25a440b1-a7f2-4470-9ec2-ba1a53ace225" />
<img width="1440" height="811" alt="Screenshot 2026-04-28 at 2 43 33 PM" src="https://github.com/user-attachments/assets/3f675ed6-3344-431d-8f22-613b8acc5ee7" />
<img width="1440" height="810" alt="Screenshot 2026-04-28 at 2 43 23 PM" src="https://github.com/user-attachments/assets/718f27f4-ee88-4ded-a14f-30247f4ceb44" />
<img width="1440" height="812" alt="Screenshot 2026-04-28 at 2 43 16 PM" src="https://github.com/user-attachments/assets/104b0be6-3bde-4fb5-a315-76cc6926d595" />
<img width="1440" height="810" alt="Screenshot 2026-04-28 at 2 43 07 PM" src="https://github.com/user-attachments/assets/8bb17608-6d74-4b5a-90c4-7bce65cca0ba" />



📌 Overview
MediAI is a full-stack intelligent healthcare application that leverages the power of Artificial Intelligence and Machine Learning to assist users in identifying potential medical conditions. The platform is designed to make preliminary medical guidance fast, affordable, and accessible to everyone — especially in areas with limited healthcare infrastructure.
The system takes user-provided symptoms as input, processes them through trained Machine Learning models, and returns meaningful health predictions in real time. It is not a replacement for professional medical advice but serves as a smart first step in understanding one's health condition.

🎯 Problem Statement
Millions of people around the world face challenges in accessing timely and affordable medical guidance. Key problems include:

🏥 Long waiting times at hospitals and clinics
💰 High cost of medical consultations
🌍 Limited healthcare access in rural and remote areas
❓ Lack of awareness about symptoms and potential conditions
⏰ Delayed diagnosis leading to worsening health conditions

MediAI addresses these challenges by providing an intelligent web-based platform that offers instant, AI-driven preliminary health assessments.

🚀 Features
Core Features

🔐 User Authentication — Secure registration and login system
🤖 AI Disease Prediction — ML-powered analysis of user symptoms
📊 Real-time Results — Instant predictions with confidence scores
💻 Responsive UI — Works seamlessly on desktop and mobile
🔗 RESTful API — Clean and well-structured Flask API endpoints

Security Features

🛡️ Secure password handling
🔒 Session-based authentication
📁 Protected user data storage
🚫 Input validation and sanitization

ML Features

🧠 Multiple trained ML models
📈 High accuracy disease prediction
🔄 Real-time model inference
📉 Data preprocessing pipeline


🛠️ Tech Stack
LayerTechnologyPurposeFrontendHTML5, CSS3, JavaScriptUser InterfaceBackendPython 3.10+, FlaskServer & APIML FrameworkScikit-learn / TensorFlowModel Training & InferenceAuthenticationFlask Sessions, JSONUser ManagementData StorageJSONUser DatabaseVersion ControlGit & GitHubCode Management

<img width="420" height="526" alt="image" src="https://github.com/user-attachments/assets/3022bc62-dd2d-45e6-87cb-a82bf4483f43" />


⚙️ Installation & Setup
Prerequisites
Make sure you have the following installed:

Python 3.10 or higher
pip (Python package manager)
Git

Step 1: Clone the Repository
bashgit clone https://github.com/RANVEER12082005/medical-AI.git
cd medical-AI
Step 2: Create a Virtual Environment
bash# Create virtual environment
python3 -m venv venv

DATASET LINKS:
DIABETES: https://www.kaggle.com/datasets/uciml/pima-indians-diabetes-database
HEART DISEASE: https://www.kaggle.com/datasets/johnsmith88/heart-disease-dataset
KIDNEY DISEASE: https://www.kaggle.com/datasets/mansoordaku/ckdisease
LIVER DISEASE: https://www.kaggle.com/datasets/uciml/indian-liver-patient-records
BREAST CANCER: https://www.kaggle.com/datasets/uciml/breast-cancer-wisconsin-data
PNEUMONIA: https://www.kaggle.com/datasets/paultimothymooney/chest-xray-pneumonia
BRAIN TUMMOR: https://www.kaggle.com/datasets/sartajbhuvaji/brain-tumor-classification-mri
SKIN DISEASE: https://www.kaggle.com/datasets/nodoubttome/skin-cancer9-classesisic
COVID-19 XRAY : https://www.kaggle.com/datasets/tawsifurrahman/covid19-radiography-database

# Activate on Mac/Linux
source venv/bin/activate

# Activate on Windows
venv\Scripts\activate
Step 3: Install Dependencies
bashpip install -r requirements.txt
Step 4: Set Up Environment Variables
Create a .env file in the root directory:
envSECRET_KEY=your_secret_key_here
DEBUG=True
PORT=5000
Step 5: Train the ML Models (Optional)
bashcd ml
python train_models.py
Step 6: Run the Application
bashcd backend
python app.py
Step 7: Open in Browser
http://localhost:5000

🤖 Machine Learning Pipeline
The ML pipeline consists of the following stages:
Raw Medical Data
      │
      ▼
Data Preprocessing
(Cleaning, Normalization, Encoding)
      │
      ▼
Feature Engineering
(Symptom extraction, Feature selection)
      │
      ▼
Model Training
(Supervised Learning Algorithms)
      │
      ▼
Model Evaluation
(Accuracy, Precision, Recall, F1-Score)
      │
      ▼
Model Serialization
(Saved as .pkl / .h5 files)
      │
      ▼
Flask API Integration
(Real-time Predictions)
Models Used

Random Forest Classifier — For multi-disease prediction
Logistic Regression — For binary health risk assessment
Decision Tree — For symptom-based classification
Neural Network — For complex pattern recognition

Evaluation Metrics
MetricDescriptionAccuracyOverall correctness of predictionsPrecisionRatio of correct positive predictionsRecallAbility to find all positive casesF1-ScoreBalance between precision and recall

🔗 API Endpoints
MethodEndpointDescriptionPOST/api/auth/registerRegister a new userPOST/api/auth/loginLogin existing userPOST/api/auth/logoutLogout current userPOST/api/predictGet disease predictionGET/api/user/profileGet user profileGET/api/healthAPI health check

📦 Dependencies
txtFlask==2.3.0
scikit-learn==1.3.0
numpy==1.24.0
pandas==2.0.0
flask-cors==4.0.0
python-dotenv==1.0.0
joblib==1.3.0
Install all at once:
bashpip install -r requirements.txt

🔮 Future Scope

 🤖 AI Medical Chatbot for real-time symptom discussion
 📱 Mobile application (iOS & Android)
 🌐 Multi-language support for global accessibility
 🏥 Integration with hospital EHR systems
 📈 More disease prediction models (Cancer, Diabetes, Heart Disease)
 📊 Patient health history dashboard
 🔔 Health reminder and notification system
 🩺 Video consultation feature with doctors


🤝 Contributing
Contributions are welcome! Here's how you can help:

Fork the repository
Create a new branch (git checkout -b feature/your-feature)
Make your changes
Commit your changes (git commit -m 'Add some feature')
Push to the branch (git push origin feature/your-feature)
Open a Pull Request


⚠️ Disclaimer

MediAI is designed for educational and informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical concerns.


👨‍💻 Author
Ranveer Singh

🐙 GitHub: @RANVEER12082005


📄 License
This project is licensed under the MIT License — see the LICENSE file for details.
⭐ If you found this project helpful, please give it a star! ⭐
