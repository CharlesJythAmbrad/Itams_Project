# Architecture, Casing & Coding Standards Guide (JavaScript / JSX)

> **React (JSX) + Supabase Application Template**  
> Standards for Naming Conventions (PascalCase / camelCase), Layer Separation, Context-Based Auth, Redux State Management, and Hook-Prioritized Architecture in a **Pure JavaScript / JSX** environment.

---

## 📑 Table of Contents
1. [Core Principles](#1-core-principles)
2. [JavaScript & JSX File Extensions](#2-javascript--jsx-file-extensions)
3. [Naming & Casing Conventions](#3-naming--casing-conventions)
4. [Architectural Separation](#4-architectural-separation)
   - [4.1 Components Layer (`src/components/`, `src/pages/`, `src/layouts/`)](#41-components-layer)
   - [4.2 Authentication via React Context (`src/context/`)](#42-authentication-via-react-context)
   - [4.3 Global State via Redux Toolkit (`src/redux/`)](#43-global-state-via-redux-toolkit)
   - [4.4 Priority Hooks Layer (`src/hooks/`)](#44-priority-hooks-layer)
   - [4.5 Services & Supabase Client (`src/services/`, `src/lib/`)](#45-services--supabase-client)
5. [Project Directory Structure](#5-project-directory-structure)
6. [Pure JSX / JavaScript Code Blueprints](#6-pure-jsx--javascript-code-blueprints)
7. [Quick Reference Matrix](#7-quick-reference-matrix)

---

## 1. Core Principles

1. **Pure JavaScript / JSX**: This project is built entirely with standard modern JavaScript (ESNext) and JSX. No TypeScript compiler or `.ts`/`.tsx` files are used. Path aliases are managed via [`jsconfig.json`](file:///d:/react-supabase-template/jsconfig.json).
2. **PascalCase for Visual Units & Contexts**: Any entity that renders JSX or provides a React Context must use **PascalCase** with the `.jsx` file extension (`Button.jsx`, `AuthContext.jsx`).
3. **Strict Layer Separation**:
   - **Auth**: Handled exclusively through **React Context** (`AuthContext.jsx`) because Supabase user sessions are app-wide and event-driven.
   - **Global Client State**: Handled through **Redux Toolkit** (`src/redux/`) for complex, multi-component client state (e.g., UI modals, drawers, filters, carts).
   - **Components**: Presentational and declarative only. No direct Supabase queries or network calls in JSX.
4. **Hook-First Priority**: Encapsulate all stateful logic, Supabase database queries, API communications, and reusable side-effects in **Custom Hooks** (`src/hooks/`). Components simply call hooks and render UI.
5. **Deterministic Package Management (pnpm)**: All dependency management and build scripts MUST use **`pnpm`** (`pnpm install`, `pnpm dev`, `pnpm build`, `pnpm preview`). Standard `npm` or `yarn` should not be used to prevent lockfile divergence.

---

## 2. JavaScript & JSX File Extensions

| File Type | Extension | Purpose | Example |
| :--- | :--- | :--- | :--- |
| **React Components** | `.jsx` | Contains JSX markup | `Button.jsx`, `Navbar.jsx` |
| **Pages & Layouts** | `.jsx` | Contains JSX routes/layouts | `HomePage.jsx`, `MainLayout.jsx` |
| **Context & Providers** | `.jsx` | Renders `<Context.Provider>` | `AuthContext.jsx`, `ThemeContext.jsx` |
| **Custom Hooks** | `.js` | Hook logic & state (no JSX) | `useAuth.js`, `useProfile.js` |
| **Redux Slices & Store** | `.js` | Slices, reducers, store config | `store.js`, `uiSlice.js` |
| **Services & API** | `.js` | Supabase / fetch helpers | `authService.js`, `supabaseClient.js` |
| **Utilities** | `.js` | Pure helper functions | `utils.js`, `formatDate.js` |

---

## 3. Naming & Casing Conventions

| Target | Convention | Case | File Extension | Example Files |
| :--- | :--- | :--- | :--- | :--- |
| **React Components** | Descriptive noun/phrase | `PascalCase` | `.jsx` | `Button.jsx`, `Navbar.jsx`, `UserProfileCard.jsx` |
| **Pages / Views** | Suffix with `Page` | `PascalCase` | `.jsx` | `HomePage.jsx`, `DashboardPage.jsx`, `LoginPage.jsx` |
| **Layouts** | Suffix with `Layout` | `PascalCase` | `.jsx` | `MainLayout.jsx`, `AuthLayout.jsx`, `DashboardLayout.jsx` |
| **Context & Providers** | Suffix with `Context` / `Provider` | `PascalCase` | `.jsx` | `AuthContext.jsx`, `ThemeContext.jsx` |
| **Custom Hooks** | Prefix with `use` | `camelCase` | `.js` | `useAuth.js`, `useSupabaseQuery.js`, `useDebounce.js` |
| **Redux Slices & Store** | Suffix with `Slice` / `store` | `camelCase` | `.js` | `store.js`, `userSlice.js`, `uiSlice.js` |
| **Services & API Helpers** | Suffix with `Service` / `client` | `camelCase` | `.js` | `authService.js`, `supabaseClient.js` |
| **Utility Functions** | Descriptive verb/noun | `camelCase` | `.js` | `utils.js`, `formatDate.js`, `validateEmail.js` |
| **Constants & Enums** | Uppercase words with `_` | `CONSTANT_CASE` | `.js` | `AUTH_ROLES`, `STORAGE_KEYS`, `API_ENDPOINTS` |

---

## 4. Architectural Separation

```
┌────────────────────────────────────────────────────────┐
│             Pages & Layouts (PascalCase.jsx)           │
└───────────┬────────────────────────────────┬───────────┘
            │                                │
            ▼                                ▼
┌─────────────────────────────┐  ┌─────────────────────────────┐
│  Components (PascalCase.jsx)│  │ Custom Hooks (use...js)     │ ◄── PRIMARY LOGIC ENGINE
└─────────────────────────────┘  └───────────┬─────────────────┘
                                             │
               ┌─────────────────────────────┼─────────────────────────────┐
               ▼                             ▼                             ▼
   ┌───────────────────────┐    ┌─────────────────────────┐   ┌─────────────────────────┐
   │ Auth Context (React)  │    │ Redux Store & Slices    │   │ Services & Supabase     │
   │ (AuthContext.jsx)     │    │ (src/redux/*.js)        │   │ (src/services/, lib/)   │
   └───────────────────────┘    └─────────────────────────┘   └─────────────────────────┘
```

### 4.1 Components Layer
- **Location**: `src/components/`, `src/pages/`, `src/layouts/`
- **File Format**: `PascalCase.jsx`
- **Subdirectories**:
  - `src/components/ui/` — Base UI & Shadcn primitives (`Button.jsx`, `Input.jsx`, `Dialog.jsx`).
  - `src/components/common/` — Shared UI elements (`Navbar.jsx`, `Footer.jsx`, `Sidebar.jsx`).
  - `src/components/features/` — Domain widgets (`LoginForm.jsx`, `ProfileCard.jsx`).
  - `src/pages/` — Route pages (`HomePage.jsx`, `DashboardPage.jsx`).
  - `src/layouts/` — Shell wrappers (`MainLayout.jsx`, `AuthLayout.jsx`).
- **Rule**:
  - Components are **declarative UI only**.
  - **No inline Supabase queries** (`supabase.from(...)`) in JSX files.
  - Components consume data through **Custom Hooks** or **Redux Hooks** (`useSelector`, `useDispatch`).

### 4.2 Authentication via React Context
- **Location**: `src/context/`
- **File Format**: `PascalCase.jsx` (`AuthContext.jsx`)
- **Responsibility**:
  - Manages Supabase authentication session (`session`, `user`, `loading`).
  - Listens to Supabase `onAuthStateChange`.
  - Exposes `signIn`, `signUp`, `signOut`, `resetPassword`.
- **Consumption**:
  - Components consume auth via the `useAuth()` hook (`src/hooks/useAuth.js`), never by importing `AuthContext` directly.

### 4.3 Global State via Redux Toolkit
- **Location**: `src/redux/`
- **File Format**: `camelCase.js` (`store.js`, `slices/uiSlice.js`, `slices/cartSlice.js`)
- **Responsibility**:
  - Manages global interactive application state (UI drawers, modal queue, user preferences, client-side filters).
- **Rule**:
  - Do **not** duplicate Auth user tokens in Redux. Keep Auth in Context and app state in Redux.

### 4.4 Priority Hooks Layer (The Logic Engine)
- **Location**: `src/hooks/`
- **File Format**: `camelCase.js` prefixed with `use` (`useAuth.js`, `useProfile.js`, `useDebounce.js`)
- **Philosophy**: **Logic lives in Hooks, Presentation lives in JSX Components**.
- **What belongs in a Hook**:
  - Supabase database queries, mutations, and realtime subscriptions.
  - Form validation & handling.
  - LocalStorage / SessionStorage sync.
  - Reusable async loading/error states.

### 4.5 Services & Supabase Client
- **Location**: `src/services/` and `src/lib/`
- **File Format**: `camelCase.js` (`src/lib/supabaseClient.js`, `src/services/profileService.js`)
- **Responsibility**:
  - Initializing the Supabase client instance.
  - Direct database helper functions called by hooks.

---

## 5. Project Directory Structure

```text
src/
├── assets/                  # Static assets
│   └── react.svg
│
├── components/              # PascalCase.jsx Components
│   ├── common/              # Navbar.jsx, Footer.jsx, Sidebar.jsx
│   ├── features/            # Feature modules
│   │   ├── auth/            # LoginForm.jsx, RegisterForm.jsx
│   │   └── profile/         # ProfileAvatar.jsx, ProfileCard.jsx
│   └── ui/                  # Shadcn UI primitives (Button.jsx, Card.jsx)
│
├── context/                 # PascalCase.jsx React Contexts
│   └── AuthContext.jsx      # Authentication Provider & Context
│
├── hooks/                   # camelCase.js Custom Hooks (PRIORITIZED)
│   ├── useAuth.js           # Auth consumption hook
│   ├── useDebounce.js       # Utility debounce hook
│   ├── useLocalStorage.js   # Local storage sync hook
│   └── useProfile.js        # Supabase database query hook
│
├── layouts/                 # PascalCase.jsx Layout wrappers
│   ├── AuthLayout.jsx
│   └── MainLayout.jsx
│
├── lib/                     # Libraries & configurations
│   ├── supabaseClient.js    # Supabase client initialization
│   └── utils.js             # Utility functions (cn helper, etc.)
│
├── pages/                   # PascalCase.jsx Route Pages
│   ├── DashboardPage.jsx
│   ├── HomePage.jsx
│   ├── LoginPage.jsx
│   └── NotFoundPage.jsx
│
├── redux/                   # Redux Toolkit configuration
│   ├── slices/              # camelCase.js slices (uiSlice.js, cartSlice.js)
│   └── store.js             # Redux Store setup
│
├── services/                # camelCase.js API & Supabase services
│   ├── authService.js
│   └── profileService.js
│
├── App.css
├── App.jsx                  # Root Component
├── index.css                # Tailwind CSS v4 entry
└── main.jsx                 # Vite Entrypoint
```

---

## 6. Pure JSX / JavaScript Code Blueprints

### 6.1 Supabase Client (`src/lib/supabaseClient.js`)

```javascript
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

### 6.2 Auth Context Provider (`src/context/AuthContext.jsx`)

```jsx
import { createContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 2. Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const signUp = (email, password) =>
    supabase.auth.signUp({ email, password })

  const signOut = () => supabase.auth.signOut()

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: Boolean(user),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
```

---

### 6.3 Priority Auth Hook (`src/hooks/useAuth.js`)

```javascript
import { useContext } from "react"
import { AuthContext } from "@/context/AuthContext"

/**
 * Custom hook to access authentication state and methods.
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
```

---

### 6.4 Priority Data-Fetching Hook (`src/hooks/useProfile.js`)

```javascript
import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/hooks/useAuth"

/**
 * Custom hook for fetching and updating user profile data from Supabase.
 */
export const useProfile = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const { data, error: dbError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (dbError) throw dbError
      setProfile(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return { profile, loading, error, refetch: fetchProfile }
}
```

---

### 6.5 Redux UI Slice (`src/redux/slices/uiSlice.js`)

```javascript
import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  isSidebarOpen: true,
  activeModal: null,
  theme: "system",
}

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen
    },
    openModal: (state, action) => {
      state.activeModal = action.payload
    },
    closeModal: (state) => {
      state.activeModal = null
    },
    setTheme: (state, action) => {
      state.theme = action.payload
    },
  },
})

export const { toggleSidebar, openModal, closeModal, setTheme } = uiSlice.actions

export const selectSidebarOpen = (state) => state.ui.isSidebarOpen
export const selectActiveModal = (state) => state.ui.activeModal

export default uiSlice.reducer
```

---

### 6.6 Redux Store (`src/redux/store.js`)

```javascript
import { configureStore } from "@reduxjs/toolkit"
import uiReducer from "./slices/uiSlice"

export const store = configureStore({
  reducer: {
    ui: uiReducer,
  },
})
```

---

### 6.7 JSX Component Consuming State & Hooks (`src/components/features/profile/ProfileCard.jsx`)

```jsx
import { useProfile } from "@/hooks/useProfile"
import { useAuth } from "@/hooks/useAuth"
import { useDispatch, useSelector } from "react-redux"
import { toggleSidebar, selectSidebarOpen } from "@/redux/slices/uiSlice"
import { Button } from "@/components/ui/Button"

export const ProfileCard = () => {
  const { user, signOut } = useAuth()
  const { profile, loading, error } = useProfile()
  const dispatch = useDispatch()
  const isSidebarOpen = useSelector(selectSidebarOpen)

  if (loading) return <div className="p-4 animate-pulse">Loading profile...</div>
  if (error) return <div className="text-red-500">Error: {error}</div>

  return (
    <div className="rounded-xl border p-6 shadow-sm bg-card text-card-foreground">
      <h2 className="text-xl font-bold">{profile?.full_name || user?.email}</h2>
      <p className="text-muted-foreground text-sm">{user?.email}</p>
      
      <div className="mt-4 flex gap-2">
        <Button onClick={() => dispatch(toggleSidebar())}>
          {isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        </Button>
        <Button variant="outline" onClick={signOut}>
          Sign Out
        </Button>
      </div>
    </div>
  )
}
```

---

### 6.8 Root Entry Provider Setup (`src/main.jsx`)

```jsx
import React from "react"
import ReactDOM from "react-dom/client"
import { Provider as ReduxProvider } from "react-redux"
import { store } from "@/redux/store"
import { AuthProvider } from "@/context/AuthContext"
import App from "./App"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ReduxProvider store={store}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ReduxProvider>
  </React.StrictMode>
)
```

---

## 7. Quick Reference Matrix

| Feature | Where it Belongs | File Extension | Casing | Access Method |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication State** | `src/context/AuthContext.jsx` | `.jsx` | `PascalCase` | Via `useAuth()` hook |
| **Supabase Client** | `src/lib/supabaseClient.js` | `.js` | `camelCase` | Imported in hooks/services |
| **Database Queries** | `src/hooks/` & `src/services/` | `.js` | `camelCase` | Via custom hooks (`useProfile`, etc.) |
| **Global UI / Client State** | `src/redux/` | `.js` | `camelCase` | Via `useDispatch()` & `useSelector()` |
| **Visual Components** | `src/components/` | `.jsx` | `PascalCase` | Imported into pages/components |
| **Route Pages** | `src/pages/` | `.jsx` | `PascalCase` | Router components |
| **Layouts** | `src/layouts/` | `.jsx` | `PascalCase` | Wrapper components |
| **Path Alias** | `@/*` &rarr; `./src/*` | Config | `jsconfig.json` | Configured in `jsconfig.json` & `vite.config.js` |
