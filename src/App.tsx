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
import ModulesPage from "./pages/admin/ModulesPage";
import ModuleForm from "./pages/admin/ModuleForm";
import LessonsPage from "./pages/admin/LessonsPage";
import LessonForm from "./pages/admin/LessonForm";
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
            <Route path="/admin/modules" element={<AdminLayout><ModulesPage /></AdminLayout>} />
            <Route path="/admin/modules/new" element={<AdminLayout><ModuleForm /></AdminLayout>} />
            <Route path="/admin/modules/:id" element={<AdminLayout><ModuleForm /></AdminLayout>} />
            <Route path="/admin/lessons" element={<AdminLayout><LessonsPage /></AdminLayout>} />
            <Route path="/admin/lessons/new" element={<AdminLayout><LessonForm /></AdminLayout>} />
            <Route path="/admin/lessons/:id" element={<AdminLayout><LessonForm /></AdminLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
