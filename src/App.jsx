import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Deals from "./pages/Deals";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import Upgrade from "./pages/Upgrade";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Analytics from "./pages/Analytics";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Features from "./pages/Features";
import Faq from "./pages/Faq";
import Payment from "./pages/Payment";
import Portfolio from "./pages/Portfolio";
import Contracts from "./pages/Contracts";
import Intelligence from "./pages/Intelligence";
import Roi from "./pages/Roi";
import Inbound from "./pages/Inbound";
import PublicWorkWithMe from "./pages/PublicWorkWithMe";
import PublicMediaKit from "./pages/PublicMediaKit";
import Money from "./pages/Money";
import Brands from "./pages/Brands";
import RateIntelligence from "./pages/RateIntelligence";
import DealAnalyzer from "./pages/DealAnalyzer";
import DealWorkspace from "./pages/DealWorkspace";
import Deliverables from "./pages/Deliverables";
import BillingPlans from "./pages/BillingPlans";



export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/upgrade" element={<Upgrade />} />
            <Route path="/about" element={<About />} />
<Route path="/contact" element={<Contact />} />
<Route path="/privacy" element={<Privacy />} />
<Route path="/terms" element={<Terms />} />
<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />
<Route path="/payment" element={<Payment />} />
            <Route path="/features" element={<Features />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/:username/work-with-me" element={<PublicWorkWithMe />} />
            <Route path="/:username" element={<PublicMediaKit />} />





            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />


             <Route
              path="/pricing"
              element={<Pricing />}
            />

            <Route
  path="/analytics"
  element={
    <ProtectedRoute>
      <Analytics />
    </ProtectedRoute>
  }
/>


            <Route
              path="/deliverables"
              element={
                <ProtectedRoute>
                  <Deliverables />
                </ProtectedRoute>
              }
            />

            <Route
              path="/deals"
              element={
                <ProtectedRoute>
                  <Deals />
                </ProtectedRoute>
              }
            />

            <Route
              path="/deals/:id"
              element={
                <ProtectedRoute>
                  <DealWorkspace />
                </ProtectedRoute>
              }
            />

            <Route
              path="/deal-analyzer"
              element={
                <ProtectedRoute>
                  <DealAnalyzer />
                </ProtectedRoute>
              }
            />

            <Route
              path="/rates"
              element={
                <ProtectedRoute>
                  <RateIntelligence />
                </ProtectedRoute>
              }
            />

            <Route
              path="/brands"
              element={
                <ProtectedRoute>
                  <Brands />
                </ProtectedRoute>
              }
            />

            <Route
              path="/money"
              element={
                <ProtectedRoute>
                  <Money />
                </ProtectedRoute>
              }
            />

            <Route
              path="/inbound"
              element={
                <ProtectedRoute>
                  <Inbound />
                </ProtectedRoute>
              }
            />

            <Route
              path="/portfolio"
              element={
                <ProtectedRoute>
                  <Portfolio />
                </ProtectedRoute>
              }
            />

            <Route
              path="/contracts"
              element={
                <ProtectedRoute>
                  <Contracts />
                </ProtectedRoute>
              }
            />

                        <Route
              path="/intelligence"
              element={
                <ProtectedRoute>
                  <Intelligence />
                </ProtectedRoute>
              }
            />

            <Route
              path="/roi"
              element={
                <ProtectedRoute>
                  <Roi />
                </ProtectedRoute>
              }
            />

            <Route
              path="/billing"
              element={
                <ProtectedRoute>
                  <BillingPlans />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}
