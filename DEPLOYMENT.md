# Production Deployment Guide: AI Campus Surveillance SaaS

This guide walks you through deploying the multi-tenant **AI Campus Surveillance SaaS** into production using **Supabase Cloud (PostgreSQL & Storage)**, **Vercel (Next.js 14 App Router Frontend)**, and **Render (FastAPI & YOLOv8 Remote Background Worker)**.

---

## 🏗️ System Architecture & Deployment Topology

```text
                               +---------------------------------------+
                               |              END USERS                |
                               | (Agency Admin / University Admin)     |
                               +-------------------+-------------------+
                                                   |
                                                   | HTTPS (TLS 1.3)
                                                   v
+--------------------------------------------------+--------------------------------------------------+
| VERCEL EDGE & SERVERLESS RUNTIME                                                                    |
|  * Next.js 14 App Router (SSR & Server Actions)                                                    |
|  * Role-Based Access Control (RBAC: agency_admin / university_admin)                                |
|  * Direct-to-Cloud Upload UI (Bypasses Vercel 4.5MB payload limits directly to Supabase Storage)    |
|  * AI Reports & Analytics Dashboard with Dynamic Excel Export (xlsx)                                |
+-------------------------+-----------------------------------------+---------------------------------+
                          |                                         |
         Supabase Auth    |                                         | Signed Storage URLs / XHR
         & PostgreSQL RLS |                                         | Direct Upload
                          v                                         v
+-------------------------+-----------------------------------------+---------------------------------+
| SUPABASE CLOUD (Hosted PostgreSQL & Private Object Storage)                                         |
|  * PostgreSQL Database (public.institutions, public.profiles, public.videos, public.processing_jobs)|
|  * Storage Bucket 'raw_videos': Private bucket holding uncompressed MP4 campus camera streams       |
|  * Storage Bucket 'processed_results': Private bucket storing annotated MP4s & keyframe snapshots   |
+--------------------------------------------------+--------------------------------------------------+
                                                   ^
                                                   | Polling & Atomic Claim ('queued' -> 'in_progress')
                                                   | Uploads annotated MP4 & keyframe snapshot
+--------------------------------------------------+--------------------------------------------------+
| RENDER CLUSTER (Python 3.11 Runtime - Blueprint render.yaml)                                        |
|  [Service 1: Web API]                                                                               |
|   - FastAPI Backend API (uvicorn app.main:app --host 0.0.0.0 --port $PORT)                         |
|   - Healthchecks (/health) & Diagnostic Endpoints                                                   |
|                                                                                                     |
|  [Service 2: Background Worker]                                                                     |
|   - Continuous Worker Loop (python -m app.workers.processor)                                        |
|   - Pipeline 1: YOLOv8 Classroom Headcount & Active Teaching Zone Analyzer                          |
|   - Pipeline 2: YOLOv8 + ByteTrack Vehicle Influx & De-duplicated Virtual Barrier Counter           |
+-----------------------------------------------------------------------------------------------------+
```

---

## 📋 Prerequisites Checklist

Before you begin, ensure you have:
- [x] A **GitHub** account and repository.
- [x] A **Supabase** project created on [supabase.com](https://supabase.com).
- [x] A **Vercel** account connected to GitHub on [vercel.com](https://vercel.com).
- [x] A **Render** account connected to GitHub on [render.com](https://render.com).
- [x] Node.js 18+ and Python 3.10+ installed locally for testing & seeding.

---

## Step 1: Configure Supabase Cloud (Database & Storage)

### 1.1 Run PostgreSQL Database Schema
Open the **SQL Editor** in your Supabase Dashboard and execute the following DDL script:

```sql
-- 1. Institutions Table (Universities / Multi-Tenant Clients)
CREATE TABLE IF NOT EXISTS public.institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Profiles Table (Users & RBAC Roles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT DEFAULT 'university_admin' CHECK (role IN ('agency_admin', 'university_admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Videos Table (Camera Footage Metadata)
CREATE TABLE IF NOT EXISTS public.videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    original_storage_path TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Processing Jobs Table (Render Background Worker Queue)
CREATE TABLE IF NOT EXISTS public.processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE UNIQUE,
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'in_progress', 'completed', 'failed')),
    worker_id TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    results_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;

-- Standard Policies: Allow users access according to institution_id
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can read their institution videos" 
ON public.videos FOR SELECT USING (
  institution_id IN (SELECT institution_id FROM public.profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'agency_admin')
);

CREATE POLICY "Users can insert videos for their institution" 
ON public.videos FOR INSERT WITH CHECK (
  institution_id IN (SELECT institution_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can read processing jobs for their videos" 
ON public.processing_jobs FOR SELECT USING (
  video_id IN (
    SELECT id FROM public.videos WHERE institution_id IN (
      SELECT institution_id FROM public.profiles WHERE id = auth.uid()
    )
  )
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'agency_admin')
);
```

### 1.2 Create Private Storage Buckets
In the Supabase Dashboard, navigate to **Storage**:
1. Create a bucket named **`raw_videos`**:
   - Set **Public bucket** to **OFF** (Private).
   - Allowed MIME types: `video/mp4`.
   - Max file size limit: `100MB`.
2. Create a bucket named **`processed_results`**:
   - Set **Public bucket** to **OFF** (Private).
   - Allowed MIME types: `video/mp4`, `image/jpeg`.

---

## Step 2: Push Source Code to GitHub

From your local project terminal:

```bash
# Initialize git if not already initialized
git init

# Stage all project files (safe: .env and node_modules are ignored)
git add .

# Create initial production release commit
git commit -m "feat: production release of AI Campus Surveillance SaaS"

# Set main branch and push to your remote repository
git branch -M main
git remote add origin https://github.com/YOUR_ORGANIZATION/campus-surveillance-saas.git
git push -u origin main
```

---

## Step 3: Provision the Initial Agency Master Admin

To create your initial master agency administrator account, run the included TypeScript seed utility:

```bash
# Run with default credentials (admin@agency.com / AgencyAdmin2026!)
npm run seed:admin

# Or customize credentials via CLI flags:
npx tsx scripts/create_agency_admin.ts --email=superadmin@agency.com --password=YourSecurePassword123! --name="Campus Security Director"
```

> [!TIP]
> This command uses `@supabase/supabase-js` with `SUPABASE_SERVICE_ROLE_KEY` to programmatically provision the user in Supabase Auth, confirm their email automatically, and set `role = 'agency_admin'` in `public.profiles`.

---

## Step 4: Deploy Frontend to Vercel

1. Log in to [Vercel](https://vercel.com) and click **"Add New..."** ➡️ **"Project"**.
2. Select your GitHub repository (`campus-surveillance-saas`).
3. Configure Project Settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
4. Add the **Environment Variables**:

| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | Supabase Anonymous Public Key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Supabase Service Role Secret Key |

5. Click **"Deploy"**. Vercel will automatically build the Next.js application, configure edge caching via `vercel.json`, and assign a production URL (e.g. `https://campus-surveillance-saas.vercel.app`).

---

## Step 5: Deploy Python Backend & AI Worker to Render

We have provided a Render Blueprint (`render.yaml`) that configures both the **FastAPI Web Service** and the **Remote AI Worker**.

1. Log in to [Render](https://render.com) and click **"New +"** ➡️ **"Blueprint"**.
2. Connect your GitHub repository (`campus-surveillance-saas`).
3. Render will read `render.yaml` and discover two services:
   - **`campus-surveillance-api`** (Web Service running FastAPI)
   - **`campus-surveillance-worker`** (Background Worker running YOLOv8 + ByteTrack)
4. Set the requested Environment Variables for both services:

| Variable Name | Recommended Value | Note |
| :--- | :--- | :--- |
| `PYTHON_VERSION` | `3.11.9` | Pre-configured in Blueprint |
| `SUPABASE_URL` | `https://xxxx.supabase.co` | Your Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Your Supabase Service Role Key |
| `RAW_BUCKET` | `raw_videos` | Pre-configured |
| `PROCESSED_BUCKET` | `processed_results` | Pre-configured |
| `WORKER_ID` | `render-ai-worker-01` | Pre-configured |
| `POLL_INTERVAL_SECONDS` | `5` | Polling frequency |
| `TEMP_DIR` | `./temp` | Temporary processing scratch space |

5. Click **"Apply"**. Render will:
   - Install dependencies (`ultralytics`, `lapx`, `opencv-python-headless`, `fastapi`, `supabase`).
   - Start the FastAPI API on `https://campus-surveillance-api.onrender.com`.
   - Launch the persistent AI background worker loop polling `processing_jobs`.

---

## Step 6: Post-Deployment Verification & Smoke Test

Follow this end-to-end verification checklist:

- [ ] **1. Agency Admin Sign-In:**
  - Visit `https://your-vercel-domain.vercel.app/login`.
  - Sign in with `admin@agency.com` / `AgencyAdmin2026!`.
  - Confirm automatic redirection to `/agency`.
- [ ] **2. Register University Client:**
  - In `/agency`, click **"Register New Client"**.
  - Input: *Institution: "Stanford University Security"*, *Admin Email: "admin@stanford.edu"*, *Password: "CampusSecure2026!"*.
  - Confirm the client appears in the table.
- [ ] **3. University Admin Sign-In & Upload:**
  - Sign out, and sign in as `admin@stanford.edu`.
  - Redirected to `/university`.
  - Navigate to **"Video Management"** (`/university/videos`).
  - Drag and drop a sample MP4 video (e.g. `classroom_lecture.mp4` or `gate_traffic.mp4`).
  - Verify direct-to-cloud upload progress bar reaches 100% and video status becomes `pending`.
- [ ] **4. AI Worker Processing Verification:**
  - Open Render Dashboard ➡️ `campus-surveillance-worker` logs.
  - Verify the worker logs:
    ```text
    🔎 [Poll] Polling Supabase for 'queued' jobs...
    ⚡ [Claim] Atomically claimed job <JOB_ID>
    📥 [Download] Downloading raw video from 'raw_videos'...
    🧠 [AI Pipeline] Executing ClassroomAnalyzer / VehicleAnalyzer...
    📤 [Storage] Uploading annotated video & snapshot to 'processed_results'...
    🎉 [Pipeline Success] Job COMPLETED!
    ```
- [ ] **5. Review Reports & Export Excel:**
  - Navigate to `/university/reports`.
  - Confirm the video thumbnail snapshot is displayed.
  - Click **"View Results"** to open `/university/reports/[videoId]`.
  - Confirm HTML5 video plays the annotated bounding boxes stream.
  - Check headcount or vehicle count metrics.
  - Click **"Download Excel Report"** and verify the `.xlsx` file contains accurate telemetry.

---

## 🛠️ Production Maintenance & Troubleshooting

### Worker Memory Optimization on Render
- For standard 1080p surveillance video feeds, the background worker uses frame-striding (processing every 3rd or 5th frame) to remain lightweight (~800MB–1.2GB RAM).
- For high-volume multi-camera universities, upgrade Render Worker plan to **Standard (2GB RAM)** or **Pro**.

### Private Bucket Signed URLs
- All videos and snapshots are served via **24-hour signed URLs** generated by `@supabase/ssr` server actions, ensuring unauthorized third parties cannot hotlink or access private campus surveillance data.

