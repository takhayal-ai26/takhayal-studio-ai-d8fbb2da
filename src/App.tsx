import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import Home from "./pages/Home";
import PortalHome from "./pages/PortalHome";
import Canvas from "./pages/Canvas";
import Pricing from "./pages/Pricing";
import ToolPage from "./pages/ToolPage";
import ToolsDirectory from "./pages/ToolsDirectory";
import Community from "./pages/Community";
import Templates from "./pages/Templates";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<PortalHome />} />
            <Route path="/studio" element={<Canvas />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/tools" element={<ToolsDirectory />} />
            <Route path="/tools/:toolId" element={<ToolPage />} />
            <Route path="/community" element={<Community />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
