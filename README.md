Got it. Here's a more **explicit and bulletproof** version of the README with the **tech stack spelled out clearly** — so there’s no ambiguity when used with tools like Cursor agents, AI devs, or teammates:

---

# 🏋️ AthleticAI MVP – Next.js SaaS Starter

This is the foundational template for building **AthleticAI**, an AI-powered sports video analyzer. Users upload short videos (e.g. a golf swing, tennis forehand, or soccer shot), and the app extracts video frames, analyzes each frame using AI, and generates a visual summary showing key moments in the motion.

---

## 🔧 Tech Stack (Explicit)

**Framework:**

* [`Next.js`](https://nextjs.org/) (v14+ App Router) — React framework with file-based routing and server functions

**Language:**

* Full-stack **TypeScript**

**Frontend:**

* React (via Next.js)
* Tailwind CSS (included via `shadcn/ui`)
* UI components: [`shadcn/ui`](https://ui.shadcn.com/) — built on Radix + Tailwind
* Client-side file upload: direct-to-cloud using [`@vercel/blob`](https://vercel.com/docs/storage/blob)

**Backend:**

* Node.js runtime (via Vercel Serverless Functions)
* API routes and server actions via Next.js App Router
* Video processing triggered from server functions (or delegated to external job runners)

**Authentication:**

* Email/password sign-in
* Auth implemented via server actions and JWT tokens stored in HTTP-only cookies
* Role-based access (Owner, Member)

**Database:**

* PostgreSQL (local via Docker, or hosted via Supabase)
* Type-safe DB access using [`Drizzle ORM`](https://orm.drizzle.team/)

**Payments:**

* Stripe (Checkout session and Customer Portal integration)
* Stripe Webhook handled via Next.js API route

**Storage:**

* [`Vercel Blob`](https://vercel.com/docs/storage/blob) for temporary video upload (direct from browser)
* Videos deleted automatically after processing

**AI/ML Processing (to be integrated):**

* Frames extracted with `FFmpeg`
* Frame-by-frame AI analysis using **cloud-hosted open-source vision models**, e.g.:

  * LLaVA / LLaMA 3.2 Vision (via [Together AI](https://www.together.ai/) or [Segmind](https://segmind.com/))
  * Optionally, lightweight pose estimation (e.g. MoveNet via TensorFlow\.js or inference API)

---

## 🧪 MVP Features

* Upload short videos directly to cloud blob storage from the browser
* Trigger server-side video processing workflow (e.g. via API route)
* Extract frames using FFmpeg at fixed frame rate or based on motion/keyframes
* Analyze frames using a vision-language model (e.g. generate pose labels or scene understanding)
* Select key frames and output visual + text summary
* Authenticated dashboard for users (gated by login and Stripe subscription)
* Stripe billing for usage-based access or paid tiers

---

App Architecture (Only read if you are confused)

graph TD
    FurniBoss["🏠 FurniBoss"]
    
    %% App Directory Structure
    FurniBoss --> App["📱 app/"]
    App --> Dashboard["📊 (dashboard)/"]
    App --> Login["🔐 (login)/"]
    App --> API["🔌 api/"]
    App --> AppFiles["📄 Files"]
    
    %% Dashboard Routes
    Dashboard --> DashLayout["📋 layout.tsx"]
    Dashboard --> DashPage["🏠 page.tsx"]
    Dashboard --> DashboardSub["📊 dashboard/"]
    Dashboard --> Pricing["💰 pricing/"]
    Dashboard --> Terminal["💻 terminal.tsx"]
    
    DashboardSub --> Activity["📈 activity/"]
    DashboardSub --> General["⚙️ general/"]
    DashboardSub --> Security["🔒 security/"]
    DashboardSub --> DashFiles["📄 layout.tsx<br/>page.tsx"]
    
    Activity --> ActFiles["📄 loading.tsx<br/>page.tsx"]
    General --> GenPage["📄 page.tsx"]
    Security --> SecPage["📄 page.tsx"]
    
    Pricing --> PriceFiles["📄 page.tsx<br/>submit-button.tsx"]
    
    %% Login Routes
    Login --> LoginFiles["📄 actions.ts<br/>login.tsx"]
    Login --> SignIn["✏️ sign-in/"]
    Login --> SignUp["📝 sign-up/"]
    
    SignIn --> SignInPage["📄 page.tsx"]
    SignUp --> SignUpPage["📄 page.tsx"]
    
    %% API Routes
    API --> Stripe["💳 stripe/"]
    API --> Team["👥 team/"]
    API --> User["👤 user/"]
    
    Stripe --> Checkout["🛒 checkout/"]
    Stripe --> Webhook["🔗 webhook/"]
    Checkout --> CheckoutRoute["📄 route.ts"]
    Webhook --> WebhookRoute["📄 route.ts"]
    Team --> TeamRoute["📄 route.ts"]
    User --> UserRoute["📄 route.ts"]
    
    %% App Files
    AppFiles --> AppCore["📄 layout.tsx<br/>not-found.tsx<br/>globals.css<br/>favicon.ico"]
    
    %% Components
    FurniBoss --> Components["🧩 components/"]
    Components --> UI["🎨 ui/"]
    UI --> UIFiles["📄 avatar.tsx<br/>button.tsx<br/>card.tsx<br/>dropdown-menu.tsx<br/>input.tsx<br/>label.tsx<br/>radio-group.tsx"]
    
    %% Lib Directory
    FurniBoss --> Lib["📚 lib/"]
    Lib --> Auth["🔐 auth/"]
    Lib --> DB["🗄️ db/"]
    Lib --> Payments["💳 payments/"]
    Lib --> Utils["🛠️ utils.ts"]
    
    Auth --> AuthFiles["📄 middleware.ts<br/>session.ts"]
    
    DB --> DBFiles["📄 drizzle.ts<br/>queries.ts<br/>schema.ts<br/>seed.ts<br/>setup.ts"]
    DB --> Migrations["📁 migrations/"]
    Migrations --> MigFiles["📄 0000_soft_the_anarchist.sql"]
    Migrations --> Meta["📁 meta/"]
    Meta --> MetaFiles["📄 _journal.json<br/>0000_snapshot.json"]
    
    Payments --> PayFiles["📄 actions.ts<br/>stripe.ts"]
    
    %% Root Files
    FurniBoss --> RootFiles["📄 package.json<br/>next.config.ts<br/>tsconfig.json<br/>middleware.ts<br/>drizzle.config.ts<br/>docker-compose.yml<br/>pnpm-lock.yaml<br/>postcss.config.mjs<br/>components.json<br/>next-env.d.ts<br/>README.md<br/>LICENSE"]
    
    %% Supabase
    FurniBoss --> Supabase["☁️ supabase/"]

    %% Styling
    classDef folder fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef file fill:#f3e5f5,stroke:#4a148c,stroke-width:1px
    classDef api fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef auth fill:#fff3e0,stroke:#e65100,stroke-width:2px
    
    class FurniBoss,App,Dashboard,Login,API,Components,Lib,Supabase folder
    class Auth,Payments auth
    class API,Stripe,Team,User,Checkout,Webhook api