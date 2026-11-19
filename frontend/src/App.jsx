import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ClientDashboard from "./pages/client/ClientDashboard";
import NewLegalRequest from "./pages/client/NewLegalRequest";
import ClientWorkspace from "./pages/client/ClientWorkspace";
import AdvisorDashboard from "./pages/advisor/AdvisorDashboard";
import AdvisorWorkspace from "./pages/advisor/AdvisorWorkspace";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import AccessControl from "./pages/admin/AccessControl";
import PlatformSettings from "./pages/admin/PlatformSettings";
import AdminLegalRequests from "./pages/admin/AdminLegalRequests";
import CollaborationWorkspace from "./pages/shared/CollaborationWorkspace";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute allowedRoles={["client"]} />}>
          <Route path="/client/dashboard" element={<ClientDashboard />} />
          <Route path="/client/new-request" element={<NewLegalRequest />} />
          <Route path="/client/requests" element={<ClientWorkspace section="requests" />} />
          <Route path="/client/consultations" element={<ClientWorkspace section="consultations" />} />
          <Route path="/client/messages" element={<ClientWorkspace section="messages" />} />
          <Route path="/client/profile" element={<ClientWorkspace section="profile" />} />
          <Route path="/client/documents" element={<CollaborationWorkspace role="client" section="documents" />} />
          <Route path="/client/deadlines" element={<CollaborationWorkspace role="client" section="deadlines" />} />
          <Route path="/client/notifications" element={<CollaborationWorkspace role="client" section="notifications" />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["advisor"]} />}>
          <Route path="/advisor/dashboard" element={<AdvisorDashboard />} />
          <Route path="/advisor/requests" element={<AdvisorWorkspace section="requests" />} />
          <Route path="/advisor/consultations" element={<AdvisorWorkspace section="consultations" />} />
          <Route path="/advisor/messages" element={<AdvisorWorkspace section="messages" />} />
          <Route path="/advisor/profile" element={<AdvisorWorkspace section="profile" />} />
          <Route path="/advisor/documents" element={<CollaborationWorkspace role="advisor" section="documents" />} />
          <Route path="/advisor/deadlines" element={<CollaborationWorkspace role="advisor" section="deadlines" />} />
          <Route path="/advisor/notifications" element={<CollaborationWorkspace role="advisor" section="notifications" />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/requests" element={<AdminLegalRequests />} />
          <Route path="/admin/access-control" element={<AccessControl />} />
          <Route path="/admin/settings" element={<PlatformSettings />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
