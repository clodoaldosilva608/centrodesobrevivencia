import { useState, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import SplashScreen from "./pages/SplashScreen";
import Welcome from "./pages/Welcome";
import Index from "./pages/Index";
import Equipamentos from "./pages/Equipamentos";
import ProdutoDetalhe from "./pages/ProdutoDetalhe";
import Cursos from "./pages/Cursos";
import Ebooks from "./pages/Ebooks";
import EbookDetalhe from "./pages/EbookDetalhe";
import Jogos from "./pages/Jogos";
import JogoDetalhe from "./pages/JogoDetalhe";
import Simulador from "./pages/Simulador";
import MapaSobrevivencia from "./pages/MapaSobrevivencia";
import Desafios from "./pages/Desafios";
import Admin from "./pages/Admin";
import Perfil from "./pages/Perfil";
import Comunidade from "./pages/Comunidade";
import SimuladorFloresta from "./pages/SimuladorFloresta";
import Estatisticas from "./pages/Estatisticas";
import Bussola from "./pages/Bussola";
import Gis from "./pages/Gis";
import Login from "./pages/Login";
import VisaoOsiris from "./pages/VisaoOsiris";
import NotFound from "./pages/NotFound";
import OnboardingTutorial from "./components/OnboardingTutorial";
import EngagementNotification from "./components/EngagementNotification";
import { AchievementNotifProvider } from "./contexts/AchievementNotifContext";
import { AuthProvider } from "./contexts/AuthContext";
import PWAInstallBanner from "./components/PWAInstallBanner";
import ShareInviteButton from "./components/ShareInviteButton";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(() => {
    const seen = sessionStorage.getItem("sh_splash_seen");
    return !seen;
  });

  const handleSplashFinish = useCallback(() => {
    sessionStorage.setItem("sh_splash_seen", "1");
    setShowSplash(false);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AchievementNotifProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AnimatePresence>
              {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
            </AnimatePresence>
            {!showSplash && (
              <BrowserRouter>
                <OnboardingTutorial />
                <EngagementNotification />
                <PWAInstallBanner />
                <ShareInviteButton />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/welcome" element={<Welcome />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/equipamentos" element={<Equipamentos />} />
                  <Route path="/equipamentos/:id" element={<ProdutoDetalhe />} />
                  <Route path="/cursos" element={<Cursos />} />
                  <Route path="/ebooks" element={<Ebooks />} />
                  <Route path="/ebooks/:id" element={<EbookDetalhe />} />
                  <Route path="/jogos" element={<Jogos />} />
                  <Route path="/jogos/simulador-sobrevivencia-floresta" element={<SimuladorFloresta />} />
                  <Route path="/jogos/:id" element={<JogoDetalhe />} />
                  <Route path="/simulador" element={<Simulador />} />
                  <Route path="/mapa-sobrevivencia" element={<MapaSobrevivencia />} />
                  <Route path="/desafios" element={<Desafios />} />
                  <Route path="/admin" element={
                    <ProtectedRoute adminOnly>
                      <Admin />
                    </ProtectedRoute>
                  } />
                  <Route path="/perfil" element={<Perfil />} />
                  <Route path="/comunidade" element={<Comunidade />} />
                  <Route path="/estatisticas" element={<Estatisticas />} />
                  <Route
                    path="/bussola"
                    element={
                      <ProtectedRoute>
                        <Bussola />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/gis"
                    element={
                      <ProtectedRoute>
                        <Gis />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/visao-osiris" element={<VisaoOsiris />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            )}
          </TooltipProvider>
        </AchievementNotifProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
