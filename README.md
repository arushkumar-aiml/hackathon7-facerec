<div align="center">

# 🔐 hackathon7-facerec

### Offline Face Recognition & Liveness Detection
#### Datalake 3.0 · Hackathon 7.0 · AKTU

![Expo](https://img.shields.io/badge/Expo-50.0-000020?style=for-the-badge&logo=expo)
![React Native](https://img.shields.io/badge/React_Native-0.73-61DAFB?style=for-the-badge&logo=react)
![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-green?style=for-the-badge)
![Offline](https://img.shields.io/badge/Works-100%25%20Offline-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-Apache%202.0-lightgrey?style=for-the-badge)

</div>

---

## 👥 Team

| Name | Role | GitHub |
|------|------|--------|
| **Arush Kumar** *(Team Leader)* | AI/ML & Architecture | [@arushkumar-aiml](https://github.com/arushkumar-aiml) |
| **Adeel Ahmad** | Backend & AWS Sync | [@adeelad726](https://github.com/adeelad726) |
| **Ayushi Shukla** | React Native UI/UX | [@AyushishuklaME](https://github.com/AyushishuklaME) |
| **Aniket Gautam** | Model Integration & Testing | [@aniketgit-hub101](https://github.com/aniketgit-hub101) |
| **Abhay Shukla** | Liveness Detection & Security | [@abhyashukla16](https://github.com/abhyashukla16) |

---

## 📌 Problem Statement

> *"How can we accurately and securely authenticate field personnel using facial recognition and liveness detection on standard mid-range mobile devices without any active internet connection?"*

| Problem | Our Solution |
|---------|-------------|
| No internet = No attendance | ✅ 100% offline with SQLite |
| Photo/screen spoofing | ✅ Blink + Smile + Head Turn liveness |
| Heavy AI models | ✅ Lightweight geometric matching |
| Poor outdoor accuracy | ✅ Landmark-based, lighting independent |

---

## ✨ Features

- 📷 **Real-time face detection** using expo-face-detector
- 🛡️ **3-challenge liveness detection** — Blink, Smile, Head Turn
- 🤖 **Offline face matching** — geometric landmark feature vectors
- 🗄️ **Local SQLite storage** — attendance logs stored on device
- ☁️ **AWS Sync ready** — upload when network restores
- 📱 **Cross-platform** — Android & iOS via Expo Go

---

## 🏗️ Project Structure

```
hackathon7-facerec/
├── App.js                          # Navigation root
├── app.json                        # Expo config
├── package.json                    # Dependencies
└── src/
    ├── screens/
    │   ├── DashboardScreen.js      # Home — stats & navigation
    │   ├── AttendanceScreen.js     # Camera + liveness + recognition
    │   └── EnrollmentScreen.js     # Face enrollment (5 samples)
    └── services/
        ├── DatabaseService.js      # SQLite offline storage
        ├── FaceMatcher.js          # Geometric face matching engine
        └── LivenessDetector.js     # Anti-spoofing challenges
```

---

## 🚀 How to Run

### Prerequisites
- Android/iOS phone
- **Expo Go** app ([Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) / [App Store](https://apps.apple.com/app/expo-go/id982107779))
- Node.js 18+ on your machine or Termux

### Step 1 — Clone
```bash
git clone https://github.com/arushkumar-aiml/hackathon7-facerec.git
cd hackathon7-facerec
```

### Step 2 — Install
```bash
npm install --legacy-peer-deps
```

### Step 3 — Start
```bash
npx expo start
```

### Step 4 — Scan QR
- Open **Expo Go** on your phone
- Scan the QR code shown in terminal
- App opens directly on your phone ✅

> **No Android Studio, no PC, no USB cable needed!**

---

## 📱 How to Use

### Enroll a New Person
1. Open app → tap **Enroll New Personnel**
2. Fill Employee ID, Name, Department
3. Capture **5 face samples** (different angles as guided)
4. Tap **Enroll User** ✅

### Mark Attendance
1. Tap **Mark Attendance**
2. Position face in the oval
3. Complete liveness challenges:
   - 👁️ Blink your eyes
   - 😊 Smile
   - ↔️ Turn head slightly
4. App auto-matches and logs attendance ✅

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Expo 50 + React Native 0.73 |
| Camera | expo-camera |
| Face Detection | expo-face-detector |
| Database | expo-sqlite |
| Navigation | React Navigation v6 |
| Storage | expo-file-system |
| Network | expo-network |

> ✅ 100% Open Source — No paid licenses required

---

## 📊 Performance

| Metric | Value | Target |
|--------|-------|--------|
| Face Detection | Real-time 10 FPS | ✅ |
| Liveness Challenges | 2 of 3 random | ✅ Anti-spoofing |
| Offline Storage | SQLite on device | ✅ Zero network |
| Min Android | 8.0+ | ✅ |
| Min iOS | 12+ | ✅ |

---

## 🏆 Hackathon 7.0 — Evaluation Mapping

| Criteria | Marks | Our Approach |
|----------|-------|-------------|
| Innovation Level | 30 | Geometric landmark matching + randomized liveness challenges |
| Feasibility | 30 | Expo Go — runs on any phone, no setup needed |
| Scalability & Sustainability | 20 | SQLite offline + AWS sync on network restore |
| Documentation | 20 | Full README + JSDoc comments + architecture |

---

## 📄 License

Apache 2.0 — Free to use, modify, and distribute.

---

<div align="center">

Made with ❤️ by Team Hackathon 7.0 · AKTU · 2026

</div>
