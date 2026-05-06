import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthContext, useAuthProvider } from "./lib/auth";
import { LangProvider } from "./lib/i18n";
import { ThemeProvider } from "./lib/theme";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clinics from "./pages/Clinics";
import ClinicDetail from "./pages/ClinicDetail";
import ClinicInventory from "./pages/ClinicInventory";
import ItemsOverview from "./pages/ItemsOverview";
import RestockRequests from "./pages/RestockRequests";
import Analytics from "./pages/Analytics";
import OverallAnalytics from "./pages/OverallAnalytics";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("admin_token");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const auth = useAuthProvider();

  if (auth.loading) return <div className="loading">Loading...</div>;

  return (
    <ThemeProvider>
      <LangProvider>
        <AuthContext.Provider value={auth}>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/clinics" element={<Clinics />} />
                        <Route path="/clinics/:id" element={<ClinicDetail />} />
                        <Route
                          path="/clinics/:id/inventory"
                          element={<ClinicInventory />}
                        />
                        <Route path="/items" element={<ItemsOverview />} />
                        <Route path="/restock" element={<RestockRequests />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route
                          path="/analytics/overall"
                          element={<OverallAnalytics />}
                        />
                        <Route
                          path="*"
                          element={<Navigate to="/dashboard" replace />}
                        />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthContext.Provider>
      </LangProvider>
    </ThemeProvider>
  );
}
