# 🌱 KrishiMitra  --- Desh Ke Kisano Ka Digital Mitra

> An AI-powered digital ecosystem designed to empower farmers with real-time data, artificial intelligence, and a collaborative community network.

[![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)

---

## 📖 Table of Contents
1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Solution](#3-solution)
4. [Key Features](#4-key-features)
5. [Technology Stack](#5-technology-stack)
6. [System Architecture](#6-system-architecture)
7. [Installation & Setup Guide](#7-installation-and-setup-guide)
8. [Environment Variables](#8-environment-variables)
9. [Admin Dashboard Overview](#9-admin-dashboard-overview)
10. [API Endpoints Overview](#10-api-endpoints-overview)
11. [Folder Structure](#11-folder-structure)
12. [Deployment Guide](#12-deployment-guide)
13. [Future Improvements](#13-future-improvements)
14. [Contribution Guidelines](#14-contribution-guidelines)
15. [Gallery / Web Photos](#16-web-photos)

---

## 1. Project Overview
**KrishiMitra** is a comprehensive, AI-driven digital platform built to revolutionize modern farming. It bridges the gap between traditional agriculture and modern technology by providing farmers with real-time market data, predictive AI tools, and a robust community platform to maximize yield and profitability.

## 2. Problem Statement
Farmers today face numerous critical challenges that impact their livelihood:
* 📉 **Market Blindness:** Lack of real-time mandi price updates leads to selling at a loss.
* 🌦️ **Weather Uncertainty:** Absence of reliable, hyper-local weather forecasting.
* 🏦 **Information Gap:** Limited awareness regarding beneficial government agricultural schemes.
* 🚜 **Resource Scarcity:** Difficulty in accessing or affording heavy farming equipment.
* 🍂 **Crop Loss:** Late detection of crop diseases.
* 🤝 **Exploitation:** Middlemen forcing lower prices, especially for small-quantity farmers.
* 🚛 **Logistics Costs:** High transportation costs to mandis for small-scale farmers.
* 🗣️ **Isolation:** Lack of a dedicated community platform to share knowledge and seek help.

## 3. Solution
KrishiMitra provides a smart digital ecosystem where farmers can access AI-powered guidance, real-time data, and a collaborative farming network. By democratizing access to technology, we enable farmers to make data-driven decisions, reduce operational costs, and secure fairer market prices.

## 4. Key Features
* 🧠 **AI Crop Guidance System:** Step-by-step cultivation guides (soil prep, irrigation, fertilizers, harvesting).
* 📊 **Live Mandi Price Dashboard:** Real-time commodity prices aggregated via government APIs.
* 📈 **AI Crop Price Prediction:** Machine learning models forecasting the optimal time to sell crops.
* 🔍 **AI Crop Disease Detection:** Image-based diagnosis and treatment recommendations.
* 🚜 **Equipment Rental Marketplace:** Peer-to-peer leasing of tractors, harvesters, and tools.
* 🌤️ **Smart Weather Forecast:** Hyper-local updates for planning irrigation and pesticide application.
* 🏛️ **Government Schemes Portal:** Curated list of active subsidies and agricultural programs.
* 📱 **SMS Mandi Rate System:** Offline access to market rates via SMS for digital inclusion.
* 🌐 **Multi-Language Support:** Full localized support for **Hindi, English, and Punjabi** (powered by Next-Intl/i18n).
* 🤝 **Farmer Collective Selling:** Pooling small harvest quantities together to negotiate better bulk prices and split transport costs.
* 💬 **Community Discussion Forum:** A dedicated social space for Q&A, problem-solving, and knowledge sharing.
* 🛡️ **Comprehensive Admin Dashboard:** Total platform moderation, user management, and analytics.

## 5. Technology Stack
* **Frontend:** Next.js (App Router), Tailwind CSS
* **Backend:** Node.js, Next.js API Routes (`/src/app/api`)
* **Database:** MongoDB (Mongoose models in `/src/models`)
* **AI Integration:** Custom ML APIs for Crop Guidance, Disease Detection, and Price Prediction.
* **External APIs:** * Government Mandi Price API
  * Weather API (e.g., OpenWeatherMap)
  * SMS API (e.g., Twilio/Fast2SMS)

## 6. System Architecture
KrishiMitra uses a modern, serverless architecture powered by **Next.js App Router**. 
* **Client Side:** React components with Tailwind styling deliver a responsive UI. State and localization are managed via custom hooks and the `i18n` directory.
* **Server Side:** Next.js API routes act as the backend logic layer, interfacing securely with the MongoDB database using Mongoose models.
* **AI/External Layer:** The API routes securely communicate with external government databases, weather services, and specialized AI microservices to deliver predictive insights back to the client.

## 7. Installation and Setup Guide

**Prerequisites:** Node.js (v18+), MongoDB, Git.

```bash
# 1. Clone the repository
git clone [https://github.com/sharmaShivam23/krishimitra.git]

# 2. Navigate to the project directory
cd krishimitra

# 3. Install dependencies
npm install

# 4. Set up Environment Variables (See section 8)
cp .env.example .env

# 5. Run the development server
npm run dev
```

 ```bash
Create a .env file in the root directory and add the following keys:

#MongoDB
MONGODB_URI=your_mongodb_connection_string

#Authentication & Security
JWT_SECRET=your_jwt_secret_key
adminSecret=your_admin_panel_secret
CRON_SECRET=your_cron_job_passphrase

#Cloudinary (Media Management)
CLOUDINARY_URL=your_cloudinary_url
CLOUD_NAME=your_cloudinary_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_public_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset

#Twilio (SMS & Communications)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_PHONE_NUMBER=your_twilio_phone_number
TWILIO_AUTH_TOKEN=your_twilio_auth_token

#AI & Machine Learning
HF_API_KEY=your_huggingface_api_token
GEMINI_API_KEY=your_google_gemini_api_key
ML_API_URL_MANDI=your_mandi_ml_model_endpoint
ML_API_KEY_MANDI=your_mandi_ml_api_key

#External APIs & Data
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key
DATA_GOV_API_KEY=your_data_gov_india_api_key
BASE_URL=your_application_base_url
```
## 9. Admin Dashboard Overview
Located at `/admin`, the secure dashboard allows platform administrators to:
* Manage registered farmers and platform users.
* Moderate community forum posts to ensure quality.
* Oversee and approve equipment rental listings.
* Monitor collective selling groups to prevent fraud.
* Review AI disease report analytics.
* Keep the Government Schemes database updated.

## 10. API Endpoints Overview
Internal API routes are located in `src/app/api/`:
* `GET /api/mandi-prices` - Fetches aggregated market rates.
* `POST /api/disease-detect` - Accepts image uploads, returns AI diagnosis.
* `GET /api/weather` - Retrieves hyper-local weather data.
* `POST /api/community/post` - Creates a new discussion thread.
* `POST /api/collective-sell/join` - Adds a farmer's quantity to a collective pool.

## 11. Folder Structure
<img width="651" height="544" alt="Screenshot 2026-03-08 011313" src="https://github.com/user-attachments/assets/e9e0d267-df36-4fdc-983a-8906a94f30eb" />

## 12. Deployment Guide
KrishiMitra is optimized for deployment on **Vercel**.
1. Push your code to a GitHub repository.
2. Log into [Vercel](https://vercel.com/) and click "Add New Project".
3. Import your `krishimitra` repository.
4. Add your `.env` variables in the Vercel dashboard.
5. Click **Deploy**. Vercel will automatically detect the Next.js setup via `vercel.json` and build the application.

## 13. Future Improvements
* 📱 **Mobile Application:** Launching native Android/iOS apps using React Native.
* 🛰️ **Drone Integration:** Linking crop health data directly from agricultural drones.
* 💳 **In-App Payments:** Secure escrow payments for equipment rentals and collective selling.
* 🌍 **Expanded Languages:** Adding support for Marathi, Gujarati, and Tamil.

## 14. Contribution Guidelines
We welcome contributions to make KrishiMitra better!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 15. Gallery / Web Photos

### 1. Splash Screen
<img width="1918" height="876" alt="Screenshot 2026-03-08 011635" src="https://github.com/user-attachments/assets/70f2e0fe-ed1a-4338-86b7-34bf7e8d376e" />

### 2. Landing Page
<img width="1894" height="861" alt="Screenshot 2026-03-08 011648" src="https://github.com/user-attachments/assets/0100edbd-f5c1-40c9-9428-1e57ddcc1894" />
<br/>
<img width="1894" height="864" alt="Screenshot 2026-03-08 012254" src="https://github.com/user-attachments/assets/80429f8b-a3d7-4079-bdf4-9b52c586d76d" />

### 3. Dashboard
<img width="1898" height="877" alt="Screenshot 2026-03-08 011745" src="https://github.com/user-attachments/assets/2077d512-aaff-4da3-a788-67d247e718ca" />

### 4. Krishi AI
<img width="1904" height="866" alt="Screenshot 2026-03-08 011820" src="https://github.com/user-attachments/assets/c6ec4078-2d88-43b0-84c8-793a9d71ef9b" />

### 5. Weather
<img width="1891" height="866" alt="Screenshot 2026-03-08 011851" src="https://github.com/user-attachments/assets/83110753-51a2-4204-bd19-b47bf271fdf1" />

### 6. Services
<img width="1895" height="875" alt="Screenshot 2026-03-08 011905" src="https://github.com/user-attachments/assets/4b993930-31a6-42e0-9499-2109737cf97c" />

