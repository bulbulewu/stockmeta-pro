# StockMeta Pro Studio v3.5 — Complete User Manual (English & বাংলা)

Welcome to **StockMeta Pro Studio v3.5**, the high-performance desktop workstation designed specifically for stock contributors, vector illustrators, and digital asset creators.

---

# Part 1: English User Manual

## 🌟 What This Software Can Do

### 1. 100-File High-Speed Batch Queue (Anti-Freeze Architecture)
* **Zero UI Freezing**: Load up to 100 `.eps`, `.svg`, `.jpg`, `.png`, or `.ai` files simultaneously (~600 MB+ data) without freezing the browser or exhausting computer memory.
* **Lazy Disk I/O**: Slices only the initial 350 KB of EPS files to extract lightweight `<xmpGImg:image>` JPEG thumbnails (~4 KB) and text. Keeps active RAM usage under 100 MB.
* **Controlled Concurrency**: Worker pool processes 3 files in parallel with a 350ms pacing delay to respect AI rate limits.
* **Fault Isolation**: If 1 file encounters a network interruption, the other 99 continue smoothly. A single-click **"Retry Failed"** button re-runs only failed assets.

### 2. 100% Dynamic Vision AI Engine for ANY Topic
* **Zero Hardcoded Topic Lookup**: Works on any brand-new subject (e.g. Cybersecurity, Camping Gear, Renewable Energy, Healthcare) dynamically without preset dictionaries.
* **Commercial Title Formula (70–100 characters)**:
  `[Main Subject + 3 Niche Context Terms] + Line Icons Set Editable Stroke Vector Illustration` (strictly deduplicated, SEO optimized).
* **Clean Descriptions**:
  `"Vector illustration set featuring [clean_subject] line icons with editable stroke. Designed for commercial branding, user interfaces, mobile applications, and web graphics."` (Guaranteed no `"icon line icons"`).
* **Strict 45-Keyword Architecture**:
  * **30 dynamic niche terms**: AI visual analysis of the subject, sub-icons, and industry synonyms.
  * **15 standard style tags**: Essential stock commercial terms (`line icon, icon set, editable stroke, outline, thin line, linear, pictogram, symbol, collection, pack, ui, web icon, vector, illustration, isolated`).

### 3. Binary-Safe 4-Layer In-Place EPS Metadata Embedder
* Embeds metadata directly into original vector `.eps` files without converting or re-saving through Illustrator.
* Recalculates 30-byte DOS EPS binary header (`0xC5D0D3C6`) offset pointers with byte-perfect accuracy.
* Writes XMP metadata packets with 2 KB whitespace padding, DSC comments (`%%Title`, `%%Keywords`), Photoshop IPTC records (`%BeginPhotoshop`), and TIFF headers (`ImageDescription`).

### 4. Multi-Key Pool Rotation & Alternative Free AI Providers
* Supports multiple API keys separated by commas or newlines. Automatically switches to the next available key if an HTTP 429 quota limit is encountered.
* Supports **Google Gemini** (`gemini-2.5-flash`), **Groq Vision** (`llama-3.2-11b-vision-preview`), and **OpenRouter**.

### 5. 26+ Marketplace CSV & Export Compatibility
* Ready-made CSV generators for Adobe Stock, Shutterstock, Freepik, Getty/iStock, Vecteezy, Pond5, Depositphotos, Dreamstime, and more.

---

## 🚀 How to Use StockMeta Pro (Step-by-Step)

### Step 1: Set Up Free Vision AI Key
1. Go to the right sidebar and click the **"AI Engine & SEO"** tab.
2. Select your provider (**Gemini** is default and recommended).
3. Paste one or more API keys into the **API Key Pool** box. You can get free keys at [Google AI Studio](https://aistudio.google.com/app/apikey).
4. Click **"Test Pool"** to verify that your keys are active.

### Step 2: Drop Your Files
1. Drag and drop 1 to 100 files into the large dropzone in the center.
2. The app will quickly extract thumbnails and display them with initial `Queued` status badges.

### Step 3: Run Batch AI Generation
1. Click the purple **"Generate All with AI"** button.
2. Watch the live batch progress bar:
   * Displays percentage, completed count, and estimated time remaining.
   * Per-file status updates from `Queued` ➔ `Extracting Preview` ➔ `AI Generating` ➔ `Completed`.

### Step 4: Inspect & Customize
1. Click on any file card in the dropzone to inspect its generated Title, Description, and 45 Keywords in the right-hand panel.
2. You can freely edit text, delete or add keywords, and adjust commercial categories.

### Step 5: Save & Export
* **Option A (Embed directly into files)**: Click **"Embed Metadata"** on the bottom bar to write the metadata directly into the files on your disk.
* **Option B (Export CSV)**: Click **"Export CSV"** to generate ready-to-upload spreadsheets for Adobe Stock, Shutterstock, or Freepik.

---
---

# Part 2: বাংলা ব্যবহার নির্দেশিকা (Bengali User Manual)

## 🌟 এই সফটওয়্যারটি কী কী করতে পারে?

### ১. ১০০ ফাইল একসাথে সুপারফাস্ট প্রসেসিং
* **কম্পিউটার হ্যাং হবে না**: একসাথে ১০০টি পর্যন্ত ৬ মেগাবাইটের EPS ফাইল ড্রপ করলেও সফটওয়্যার মসৃণভাবে চলে এবং র‍্যাম মেমোরি ১০০ এমবির নিচে থাকে।
* **লেজি মেমোরি টেকনোলজি**: প্রতিটি ফাইলের পুরো কোড মেমোরিতে না রেখে মাত্র ৩৫০ কিলোবাইট থেকে প্রিভিউ বের করে রাখে।
* **৩টি ফাইল সমান্তরাল প্রসেসিং**: একসাথে ৩টি ফাইল এআই-তে পাঠায় যাতে ফ্রি কোটা শেষ না হয়।
* **ব্যর্থ ফাইল পুনরায় চেষ্টা (Retry Failed)**: কোনো ফাইলে নেটওয়ার্কের কারণে সমস্যা হলে বাকিগুলো স্বাভাবিকভাবে শেষ হয় এবং শেষে একক ক্লিকে শুধুমাত্র ব্যর্থ ফাইল পুনরায় চালানো যায়।

### ২. যেকোনো সম্পূর্ণ নতুন বিষয়ের জন্য ১০০% ডায়নামিক মেটাডাটা
* কোনো নির্দিষ্ট বা বাঁধাধরা তালিকা ছাড়াই ছবি ও ফাইলের নাম দেখে সাইবার সিকিউরিটি, ট্রাভেল, স্পোর্টস বা যেকোনো বিষয়ের নিখুঁত টাইটেল ও কি-ওয়ার্ড তৈরি করে।
* **টাইটেল ফর্মুলা**: ৭০ থেকে ১০০ অক্ষরের নিখুঁত বাণিজ্যিক টাইটেল।
* **ডেসক্রিপশন ফর্মুলা**: সাবলীল ইংরেজি বাক্য, যেখানে কখনো `"icon line icons"` ধরনের ডাবল শব্দ আসে না।
* **নিখুঁত ৪৫টি কি-ওয়ার্ড**: ৩০টি ছবি-ভিত্তিক বিশেষ কি-ওয়ার্ড + ১৫টি আন্তর্জাতিক স্টক এজেন্সির প্রয়োজনীয় সার্চ ট্যাগ।

### ৩. মূল EPS ফাইলের ভেতরে মেটাডাটা সেভ (৪-লেয়ার এম্বেডার)
* ইলাস্ট্রেটর ছাড়া সরাসরি EPS ফাইলের এক্সএমপি ও বাইনারি হেডারে মেটাডাটা রাইট করে।
* অ্যাডোবি স্টক বা শাটারস্টকে ফাইল আপলোড করলে টাইটেল ও কি-ওয়ার্ড নিজে থেকেই বসে যাবে।

### ৪. একাধিক API Key এবং অল্টারনেটিভ ফ্রি প্রভাইডার
* একাধিক জেমিনি কি একসাথে কমা দিয়ে ব্যবহার করা যায়। একটির লিমিট শেষ হলে সফটওয়্যার নিজে নিজেই পরেরটিতে সুইচ করে।
* গ্রক ভিশন (Groq Vision) এবং ওপেন-রাউটার (OpenRouter) ব্যবহারের সুযোগ রয়েছে।

---

## 🚀 ধাপে ধাপে সফটওয়্যার ব্যবহারের নিয়ম

### ধাপ ১: ফ্রি এআই কি সেট করুন
1. ডান পাশের প্যানেলে **"AI Engine & SEO"** ট্যাবে ক্লিক করুন।
2. আপনার জেমিনি API Key বক্সে পেস্ট করুন।
3. **"Test Pool"** বাটনে ক্লিক করে কি সক্রিয় কিনা দেখে নিন।

### ধাপ ২: ফাইল ড্রপ করুন
1. আপনার কম্পিউটার থেকে ফাইলগুলো টেনে এনে মাঝের ড্রপবক্সে ছেড়ে দিন।
2. প্রতিটি ফাইলের থাম্বনেইল তৎক্ষণাৎ দেখা যাবে।

### ধাপ ৩: এআই দিয়ে মেটাডাটা তৈরি করুন
1. **"Generate All with AI"** বাটনে ক্লিক করুন।
2. লাইভ প্রগ্রেস বারে শতকরা হিসাব ও বাকি সময় দেখতে পাবেন।

### ধাপ ৪: মেটাডাটা চেক ও এডিট করুন
1. যেকোনো ফাইলের ওপর ক্লিক করে ডান পাশের প্যানেলে টাইটেল ও কি-ওয়ার্ড দেখে নিতে পারেন।

### ধাপ ৫: সেভ করুন বা CSV ডাউনলোড করুন
* সরাসরি ফাইলে সেভ করতে **"Embed Metadata"** বাটনে ক্লিক করুন।
* মার্কেটপ্লেসে আপলোডের জন্য **"Export CSV"** বাটনে ক্লিক করে Adobe Stock বা Shutterstock CSV ডাউনলোড করুন।
