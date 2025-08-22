# Project Report: University Secondhand Marketplace Frontend Development  
---

## Project Overview
This report documents the development of the frontend for the University Secondhand Marketplace application, completed over four days. The frontend is built using Next.js, Tailwind CSS, and JavaScript, with the components folder located at `src/app/components`. The backend is managed separately using FastAPI, and this report focuses solely on the frontend progress from Day 1 to Day 4.

---

## Development Phases

### Day 1: Foundation & Design System  
**Objective:** Establish the foundational structure and design system for the application.  
- **Setup:** Initialized a Next.js project integrated with Tailwind CSS and shadcn/ui for reusable UI components.
- **Implementation:**
  - Designed a global layout in `src/app/layout.js` to ensure a consistent user interface.
  - Defined theme tokens, typography, colors, buttons, and inputs adhering to the project’s Style Guide.
  - Created primitive components for skeletons, spinners, and empty states (e.g., `EmptyState.js`, `Spinner.js`) in `src/app/components`.
- **Deliverables:**
  - A polished UI kit page showcasing all designed components.
  - A Storybook or shadcn preview environment to demonstrate the component library.

---

### Day 2: Auth & Verification UI  
**Objective:** Develop the authentication and verification user interface.  
- **Screens:** Built Launch, Onboarding, Sign Up/Log In, and Student Verification flows (including OTP and ID upload) with success and error states in directories like `src/app/auth` and `src/app/launch`.
- **Implementation:**
  - Implemented form validation using JavaScript for a seamless user experience.
  - Set up a mock API with MSW (Mock Service Worker) and frozen contracts for testing authentication flows.
- **Deliverables:**
  - A fully navigable auth and verification flow with integrated mock data.

---

### Day 3: Home Feed & Cards  
**Objective:** Create the home feed interface with listing cards and filtering options.  
- **Screens:** Developed the Home Feed page featuring a search bar, category tabs, and switchable grid/list views for listing cards with lazy-loaded images and skeletons.
- **Implementation:**
  - Added debounced search queries and local filters for enhanced interactivity.
  - Implemented client-side pagination scaffolding for a scalable feed.
  - Integrated with a mock server at `https://web-production-fa57c.up.railway.app/api/v1/search` for data fetching.
- **Deliverables:**
  - A functional Feed page with filters and loading states in `src/app/home/page.js`.
  - Reusable components such as `ListingCard.js`, `SkeletonCard.js`, `SearchBar.js`, and more in `src/app/components`.

---

### Day 4: User Profile & Settings UI  
**Objective:** Design the user profile and settings interface with a tabbed layout.  
- **Screens:** Constructed a Profile page with tabs for personal details, order history, and account settings.
- **Implementation:**
  - Developed `ProfileCard.js`, `OrderHistory.js`, and `SettingsForm.js` in `src/app/components` for modular design.
  - Created `src/app/profile/page.js` with tabbed navigation, utilizing mock user and order data (to be replaced with FastAPI integration later).
  - Applied Tailwind CSS for responsive styling and shadcn/ui components for consistency.
- **Deliverables:**
  - A complete Profile page with mock data, ready for future backend integration.

---

## Technical Stack
- **Framework:** Next.js
- **Styling:** Tailwind CSS
- **Language:** JavaScript
- **Components Path:** `src/app/components`
- **Backend:** FastAPI (handled separately)

---

## Challenges & Resolutions
- **Multiple Lockfiles Warning:** Identified duplicate `package-lock.json` files due to OneDrive sync; resolved by retaining the root file and deleting extras.
- **Cache Issues:** Encountered an `EINVAL` error with the `.next` cache; fixed by deleting the `.next` folder and restarting the server.
- **OneDrive Interference:** Mitigated file locking issues by moving the project to a local directory (e.g., `C:\Projects\uni-marketplace`).

