import { Fragment } from "react";
import { Route } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { SetPasswordPage } from "./pages/SetPasswordPage";
import { UnauthorizedPage } from "./pages/UnauthorizedPage";
import { RedirectIfAuth } from "./components/RedirectIfAuth";

export const authRoutes = (
  <Fragment>
    <Route path="/login" element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
    <Route path="/set-password" element={<SetPasswordPage />} />
    <Route path="/unauthorized" element={<UnauthorizedPage />} />
  </Fragment>
);
