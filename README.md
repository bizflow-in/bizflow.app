# BizFlow 🟢

**Smart Business OS for Indian MSMEs** — A WhatsApp-integrated, multi-language SaaS platform for 63 million Indian small businesses.

## 🌟 Features

| Feature | Description |
|---|---|
| 📦 **Order Management** | Create, track & confirm orders. Auto WhatsApp notifications |
| 📦 **Inventory Tracker** | Real-time stock levels with low-stock alerts |
| 💳 **Payment Tracking** | Track receivables & payables with WhatsApp reminders |
| 🏭 **Supplier Ledger** | Manage vendors, outstanding balances, and direct WhatsApp |
| 🌐 **Community** | Niche-based network — connect with traders across India |
| 🏛️ **Gov Registration** | Step-by-step guide: Udyam, GST, PAN, Trade License |
| 📍 **Google Maps** | Add business location & list on Google Business Profile |

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS (Zero build step, instant deploy)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **PDF**: jsPDF (client-side GST invoice generation)
- **WhatsApp**: WhatsApp Web API integration
- **Maps**: Google Maps Embed API
- **Auth**: Email/Password + Google OAuth

## 🚀 Setup

### 1. Supabase Setup
1. Go to your Supabase project dashboard
2. Open **SQL Editor**
3. Copy contents of `supabase_schema.sql` and run it
4. In **Authentication → Providers**, enable Google and add your OAuth credentials
5. In **Authentication → URL Configuration**, set redirect URL to your domain

### 2. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add redirect URI: `https://cumwoqyorkgikwfqnhdd.supabase.co/auth/v1/callback`
4. Add to Supabase Authentication → Google provider

### 3. Deploy
The app is a single `index.html` file. Deploy anywhere:
- **Netlify**: Drag and drop the folder
- **Vercel**: `vercel --prod`
- **GitHub Pages**: Push and enable Pages
- **Firebase Hosting**: `firebase deploy`

## 📱 Languages Supported (22)
English, Hindi, Gujarati, Marathi, Bengali, Tamil, Telugu, Kannada, Malayalam, Punjabi, Urdu, Odia, Assamese, Maithili, Santali, Kashmiri, Nepali, Sindhi, Dogri, Korean, Chinese, Arabic

## 🏢 Business Types (Niches)
🧵 Textile | 💊 Pharma | ⚙️ Steel | 🔌 Electrical | 🌾 Agri | 🏗️ Construction | 🚗 Auto Parts | 🛒 General Retail

## 📄 License
MIT — Free to use and modify
