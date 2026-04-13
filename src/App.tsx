import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import { AdminLayout } from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CoursesPage from "./pages/admin/CoursesPage";
import CourseForm from "./pages/admin/CourseForm";
import ModuleForm from "./pages/admin/ModuleForm";
import LessonForm from "./pages/admin/LessonForm";
import StudentsPage from "./pages/admin/StudentsPage";
import StudentForm from "./pages/admin/StudentForm";
import StudentDetail from "./pages/admin/StudentDetail";
import PaymentsPage from "./pages/admin/PaymentsPage";
import EnrollmentsPage from "./pages/admin/EnrollmentsPage";
import EnrollmentForm from "./pages/admin/EnrollmentForm";
import ActivityLogsPage from "./pages/admin/ActivityLogsPage";
import WebhookLogsPage from "./pages/admin/WebhookLogsPage";
import SettingsPage from "./pages/admin/SettingsPage";
import MessagesPage from "./pages/admin/MessagesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
            <Route path="/admin/courses" element={<AdminLayout><CoursesPage /></AdminLayout>} />
            <Route path="/admin/courses/new" element={<AdminLayout><CourseForm /></AdminLayout>} />
            <Route path="/admin/courses/:id" element={<AdminLayout><CourseForm /></AdminLayout>} />
            {/* Modules nested under courses */}
            <Route path="/admin/courses/:courseId/modules/new" element={<AdminLayout><ModuleForm /></AdminLayout>} />
            <Route path="/admin/courses/:courseId/modules/:id" element={<AdminLayout><ModuleForm /></AdminLayout>} />
            {/* Lessons nested under modules */}
            <Route path="/admin/courses/:courseId/modules/:moduleId/lessons/new" element={<AdminLayout><LessonForm /></AdminLayout>} />
            <Route path="/admin/courses/:courseId/modules/:moduleId/lessons/:id" element={<AdminLayout><LessonForm /></AdminLayout>} />
            <Route path="/admin/students" element={<AdminLayout><StudentsPage /></AdminLayout>} />
            <Route path="/admin/students/new" element={<AdminLayout><StudentForm /></AdminLayout>} />
            <Route path="/admin/students/:id" element={<AdminLayout><StudentForm /></AdminLayout>} />
            <Route path="/admin/students/:id/view" element={<AdminLayout><StudentDetail /></AdminLayout>} />
            <Route path="/admin/payments" element={<AdminLayout><PaymentsPage /></AdminLayout>} />
            <Route path="/admin/enrollments" element={<AdminLayout><EnrollmentsPage /></AdminLayout>} />
            <Route path="/admin/enrollments/new" element={<AdminLayout><EnrollmentForm /></AdminLayout>} />
            <Route path="/admin/enrollments/:id" element={<AdminLayout><EnrollmentForm /></AdminLayout>} />
            <Route path="/admin/messages" element={<AdminLayout><MessagesPage /></AdminLayout>} />
            <Route path="/admin/logs" element={<AdminLayout><ActivityLogsPage /></AdminLayout>} />
            <Route path="/admin/webhooks" element={<AdminLayout><WebhookLogsPage /></AdminLayout>} />
            <Route path="/admin/settings" element={<AdminLayout><SettingsPage /></AdminLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
