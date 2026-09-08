
import { BrowserRouter } from "react-router-dom"
import { AnimatePresence } from "framer-motion"
import { AuthProvider } from "@/context/AuthContext"
import { useAuth } from "@/hooks/useAuth"
import { AppRoutes } from "@/routes"
import { AuthLoadingScreen } from "@/components/common/AuthLoadingScreen"

function AppContent() {
  const { isAuthenticating } = useAuth()

  return (
    <>
      <AnimatePresence>
        {isAuthenticating && (
          <AuthLoadingScreen
            message="Entering ITAMS Portal..."
            submessage="Establishing secure session & loading workspace..."
          />
        )}
      </AnimatePresence>
      <AppRoutes />
    </>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
