import { useCallback, useEffect, useState } from "react";
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
  const [initialRoute, setInitialRoute] = useState("/");

  const checkSession = useCallback(async () => {
    setLoading(true);

    try {
      const session = await fetchAuthSession();

      if (session.tokens?.accessToken) {
        const idToken = session.tokens.idToken?.toString();

        if (idToken) {
          const payload = JSON.parse(atob(idToken.split(".")[1]));
          const groups = payload["cognito:groups"] || [];

          if (groups.includes("Admin")) {
            setInitialRoute("/admin");
          } else {
            setInitialRoute("/");
          }
        }

        setIsLoggedIn(true);
        return;
      }
    } catch (err) {
      console.log("No existing session");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return isLoggedIn ? (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <BrowserRouter>
            <AppRoutes initialRoute={initialRoute} />
          </BrowserRouter>
        </AppProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  ) : (
    <LoginPage onLogin={checkSession} />
  );
}

export default App;
