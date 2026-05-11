import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

import LandingPage from './pages/Landing/LandingPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import OnboardingPage from './pages/Onboarding/OnboardingPage';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardPage from './pages/Dashboard/DashboardPage';
import AICoachPage from './pages/Dashboard/AICoachPage';
import MealPlannerPage from './pages/Dashboard/MealPlannerPage';
import BudgetPage from './pages/Dashboard/BudgetPage';

// Placeholders for remaining modules
const Progress = () => <DashboardLayout><div className="p-8"><h1 className="text-2xl font-bold">Progress</h1></div></DashboardLayout>;
const Loans = () => <DashboardLayout><div className="p-8"><h1 className="text-2xl font-bold">Future Loans</h1></div></DashboardLayout>;
const SettingsPage = () => <DashboardLayout><div className="p-8"><h1 className="text-2xl font-bold">Settings</h1></div></DashboardLayout>;

export default function App() {
  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route 
            path="/dashboard" 
            element={
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            } 
          />
          <Route 
            path="/ai-coach" 
            element={
              <DashboardLayout>
                <AICoachPage />
              </DashboardLayout>
            } 
          />
          <Route 
            path="/meal-planner" 
            element={
              <DashboardLayout>
                <MealPlannerPage />
              </DashboardLayout>
            } 
          />
          <Route 
            path="/budget" 
            element={
              <DashboardLayout>
                <BudgetPage />
              </DashboardLayout>
            } 
          />
          <Route path="/progress" element={<Progress />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}
