import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui";
import { ConsoleLayout } from "@/components/layout/ConsoleLayout";
import { RequireAuth } from "@/modules/auth/components/RequireAuth";
import { authRoutes } from "@/modules/auth/route";
import { appRoutes } from "@/routes";

function App() {
  return (
    <TooltipProvider delayDuration={300}>
      <BrowserRouter>
        <Routes>
          {authRoutes}
          <Route
            element={
              <RequireAuth>
                <ConsoleLayout />
              </RequireAuth>
            }
          >
            {appRoutes}
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;
