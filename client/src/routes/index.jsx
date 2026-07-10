import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import AuthLayout from '@/layouts/AuthLayout';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import LandingPage from '@/pages/LandingPage';
import NotFoundPage from '@/pages/NotFoundPage';

import { ProtectedRoute, PublicOnlyRoute } from './guards';

// Code-split the authenticated app (charts, DnD, calendar are heavy) so the
// initial load stays lean.
const AppLayout = lazy(() => import('@/layouts/AppLayout'));
const DashboardPage = lazy(() => import('@/pages/app/DashboardPage'));
const ProjectsPage = lazy(() => import('@/pages/app/ProjectsPage'));
const ProjectBoardPage = lazy(() => import('@/pages/app/ProjectBoardPage'));
const ContractSystemPage = lazy(() => import('@/pages/app/ContractSystemPage'));
const MyTasksPage = lazy(() => import('@/pages/app/MyTasksPage'));
const TaskPage = lazy(() => import('@/pages/app/TaskPage'));
const CalendarPage = lazy(() => import('@/pages/app/CalendarPage'));
const SuggestionsPage = lazy(() => import('@/pages/app/SuggestionsPage'));
const TeamPage = lazy(() => import('@/pages/app/TeamPage'));
const TeamInsightsPage = lazy(() => import('@/pages/app/TeamInsightsPage'));
const NotificationsPage = lazy(() => import('@/pages/app/NotificationsPage'));
const ProfilePage = lazy(() => import('@/pages/app/ProfilePage'));
const SettingsPage = lazy(() => import('@/pages/app/SettingsPage'));
const AcceptInvitePage = lazy(() => import('@/pages/auth/AcceptInvitePage'));

/**
 * Application route tree.
 * - Public marketing route at `/`.
 * - Auth routes (login/register/forgot/reset) — only for signed-out users.
 * - Protected app routes under `/app` within the app shell.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
          { path: '/forgot-password', element: <ForgotPasswordPage /> },
          { path: '/reset-password', element: <ResetPasswordPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/accept-invite', element: <AcceptInvitePage /> },
      {
        path: '/app',
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'projects', element: <ProjectsPage /> },
          { path: 'projects/:projectId', element: <ProjectBoardPage /> },
          { path: 'contracts', element: <ContractSystemPage /> },
          { path: 'tasks', element: <MyTasksPage /> },
          { path: 'tasks/:taskId', element: <TaskPage /> },
          { path: 'calendar', element: <CalendarPage /> },
          { path: 'suggestions', element: <SuggestionsPage /> },
          { path: 'team', element: <TeamPage /> },
          { path: 'insights', element: <TeamInsightsPage /> },
          { path: 'notifications', element: <NotificationsPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: '/app/*', element: <Navigate to="/app" replace /> },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;
