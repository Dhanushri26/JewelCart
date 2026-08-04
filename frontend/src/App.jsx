import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";

import AppRoutes from "./routes/AppRoutes";
import { AppProvider } from "./context/AppContext";
import { ErrorBoundary } from "./components/ui/error-boundary";
import LoginPage from "./pages/LoginPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function App() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const session = await fetchAuthSession();

        if (session.tokens?.accessToken) {
          setIsLoggedIn(true);
        }
      } catch (err) {
        console.log("No existing session");
      } finally {
        setLoading(false);
      }
    }

    checkSession();
  }, []);

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return isLoggedIn ? (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AppProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  ) : (
    <LoginPage onLogin={() => setIsLoggedIn(true)} />
  );
}

export default App;