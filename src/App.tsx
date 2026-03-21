import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Equipamentos from "./pages/Equipamentos";
import ProdutoDetalhe from "./pages/ProdutoDetalhe";
import Ebooks from "./pages/Ebooks";
import EbookDetalhe from "./pages/EbookDetalhe";
import Jogos from "./pages/Jogos";
import Simulador from "./pages/Simulador";
import MapaSobrevivencia from "./pages/MapaSobrevivencia";
import Desafios from "./pages/Desafios";
import Admin from "./pages/Admin";
import Perfil from "./pages/Perfil";
import Comunidade from "./pages/Comunidade";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/equipamentos" element={<Equipamentos />} />
          <Route path="/equipamentos/:id" element={<ProdutoDetalhe />} />
          <Route path="/ebooks" element={<Ebooks />} />
          <Route path="/ebooks/:id" element={<EbookDetalhe />} />
          <Route path="/jogos" element={<Jogos />} />
          <Route path="/simulador" element={<Simulador />} />
          <Route path="/mapa-sobrevivencia" element={<MapaSobrevivencia />} />
          <Route path="/desafios" element={<Desafios />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
