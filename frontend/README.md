# 📡 Next.js Frontend — Stadium AI Co-Pilot

Welcome to the frontend application for the **Stadium AI Co-Pilot** command and wayfinding system. Built using **Next.js 16 (App Router)** and **TypeScript**, this application presents responsive, highly optimized, and accessible user portals for stadium operators, ground crew personnel, and fans.

---

## 📷 View Mappings

The frontend serves three primary role-based views dynamically synchronized with the backend:

1. **📡 Control Room (Command Center)** (`/command-center`):
   - Real-time SVG stadium crowd density overlay.
   - Live incident logs with dispatch triggers.
   - AI recommendation cards and PA announcement drafting consoles.
   - Event simulation console (Crowd Surge, Medical, Power Outage, VIP Arrival).
2. **🦺 Ground Crew Portal** (`/ground-crew`):
   - Mobile-first crew identification selector.
   - Dynamic checklist task board (completed/uncompleted sync).
   - Instant local incident reporter form.
3. **🎫 Fan Wayfinding Portal** (`/fan`):
   - Stand selector highlighting capacity status.
   - Wait-time and flow-rate status grid for all gates.
   - AI best-gate calculator with live queue and congestion updates.

---

## 🏗️ Folder Structure

The React workspace is organized as follows:

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx               # Home landing page with role navigation
│   │   ├── layout.tsx             # Global layout, fonts, and metadata
│   │   ├── command-center/        # Control room view page
│   │   ├── ground-crew/           # Ground crew portal view page
│   │   └── fan/                   # Fan wayfinding portal view page
│   ├── components/
│   │   ├── ui/                    # Reusable shadcn/Tailwind components (card, button, etc.)
│   │   └── ChatWidget.tsx         # Unified AI Co-Pilot chatbot widget
│   ├── lib/
│   │   └── api.ts                 # Type-safe fetch API wrapper client
│   └── __tests__/                 # Vitest component and wrapper unit tests
├── package.json                   # App configurations and dependencies
├── next.config.ts                 # Next.js optimization parameters
├── tailwind.config.ts             # Dark forest green theme styling tokens
└── tsconfig.json                  # Strict TypeScript compiler options
```

---

## ⚡ Key Frontend Optimizations & Efficiency Features

1. **Memoized Calculations (`useMemo`)**:
   - **Active Incidents**: CommandCenter memoizes filtered lists of active incidents. This prevents loops from running multiple times on every component render.
   - **Best Gate Selector**: The Fan Portal memoizes closest open gate sorting based on current wait times to avoid recalculations unless data changes.
2. **Visibility-Aware Polling**:
   - Component polling cycles suspends automatically when the browser tab loses focus (`document.visibilityState !== "visible"`). This conserves browser battery, CPU cycles, and network bandwidth on idle client devices.
3. **Static Page Prerendering**:
   - The application build compiles all main routes as static content, delivering lightning-fast Initial Page Load times.
4. **Accessible Design & Aria Live Regions**:
   - Live incident cards render screen-reader alerts using `aria-live="polite"` live regions.
   - Contrast settings exceed **WCAG AA** guidelines (using deep forest greens, amber warnings, and clean dark/light card variations).
   - Component interactive states support full keyboard tab indices.

---

## 🧪 Frontend Verification & Testing

This application contains a comprehensive unit test suite written in **Vitest** testing components, pages, states, and the fetch wrapper.

### Running Frontend Tests:
```bash
# Execute unit tests:
npm run test

# Run code style linter:
npm run lint

# Compile optimized production build:
npm run build
```

*Verification results: **16/16 tests pass successfully** with **0 ESLint warnings and 0 compilation errors**.*
