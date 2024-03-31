import { lazy } from "react";
import { Navigate, RouteObject, useRoutes } from "react-router-dom";
import { UiLayout } from "./ui/ui-layout";

const AccountListFeature = lazy(() => import("./account/account-list-feature"));
const AccountDetailFeature = lazy(
  () => import("./account/account-detail-feature")
);
// const ClusterFeature = lazy(() => import("./cluster/cluster-feature"));
const DashboardFeature = lazy(() => import("./dashboard/dashboard-feature"));

// const ProgramFeature = lazy(() => import("./program/program-feature"));
const links: { label: string; path: string }[] = [
  { label: "Home", path: "/home" },
  { label: "Profile", path: "/profile" },
  // { label: "Clusters", path: "/clusters" },
  // { label: "Settings", path: "/settings" },
  // { label: "upload", path: "/upload" },
  // { label: "Program Debug", path: "/program" },
];

const routes: RouteObject[] = [
  { path: "/profile/", element: <AccountListFeature /> },
  { path: "/profile/:address", element: <AccountDetailFeature /> },
  // { path: "/clusters", element: <ClusterFeature /> },
  // { path: "/settings", element: <SettingsPage /> },
  // { path: "/upload", element: <Upload /> },
  // { path: "program/*", element: <ProgramFeature /> },
];

export function AppRoutes() {
  return (
    <UiLayout links={links}>
      {useRoutes([
        { index: true, element: <Navigate to={"/home"} replace={true} /> },
        { path: "/home", element: <DashboardFeature /> },
        ...routes,
        { path: "*", element: <Navigate to={"/profile/"} replace={true} /> },
      ])}
    </UiLayout>
  );
}
