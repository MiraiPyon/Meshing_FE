import { createElement } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { Landing } from "./pages/Landing";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { AuthCallback } from "./pages/AuthCallback";
import { isAuthenticated } from "./lib/auth";

function DashboardGate() {
  if (!isAuthenticated()) {
    return createElement(Navigate, { replace: true, to: "/login" });
  }

  return createElement(Dashboard);
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Landing,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/auth/callback",
    Component: AuthCallback,
  },
  {
    path: "/dashboard",
    Component: DashboardGate,
  },
]);
