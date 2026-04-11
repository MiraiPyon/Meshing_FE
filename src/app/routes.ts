import { Suspense, createElement, lazy, type ComponentType, type LazyExoticComponent } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { RouteLoadingScreen } from "./components/layout/RouteLoadingScreen";
import { isAuthenticated } from "../infrastructure/auth/local-storage-auth";

function getRouterBasename() {
  const baseUrl = import.meta.env.BASE_URL;

  if (baseUrl === "/") {
    return baseUrl;
  }

  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function withPageLoader(Page: LazyExoticComponent<ComponentType>) {
  return function LazyPageRoute() {
    return createElement(
      Suspense,
      { fallback: createElement(RouteLoadingScreen) },
      createElement(Page),
    );
  };
}

const LandingRoute = withPageLoader(
  lazy(async () => {
    const module = await import("./pages/Landing");
    return { default: module.Landing };
  }),
);

const LoginRoute = withPageLoader(
  lazy(async () => {
    const module = await import("./pages/Login");
    return { default: module.Login };
  }),
);

const AuthCallbackRoute = withPageLoader(
  lazy(async () => {
    const module = await import("./pages/AuthCallback");
    return { default: module.AuthCallback };
  }),
);

const DashboardRoute = withPageLoader(
  lazy(async () => {
    const module = await import("./pages/Dashboard");
    return { default: module.Dashboard };
  }),
);

function DashboardGate() {
  if (!isAuthenticated()) {
    return createElement(Navigate, { replace: true, to: "/login" });
  }

  return createElement(DashboardRoute);
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingRoute,
  },
  {
    path: "/login",
    Component: LoginRoute,
  },
  {
    path: "/auth/callback",
    Component: AuthCallbackRoute,
  },
  {
    path: "/dashboard",
    Component: DashboardGate,
  },
], {
  basename: getRouterBasename(),
});
