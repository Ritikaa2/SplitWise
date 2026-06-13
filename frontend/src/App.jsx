import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { useAuth } from "./store/auth";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import GroupDetail from "./pages/GroupDetail";
import Groups from "./pages/Groups";
import ImportWizard from "./pages/ImportWizard";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
function Protected() {
    const token = useAuth((s) => s.token);
    return token ? <AppShell /> : <Navigate to="/login" replace/>;
}
export default function App() {
    return (<Routes>
      <Route path="/" element={<Landing />}/>
      <Route path="/login" element={<Login />}/>
      <Route path="/register" element={<Register />}/>
      <Route path="/app" element={<Protected />}>
        <Route index element={<Dashboard />}/>
        <Route path="groups" element={<Groups />}/>
        <Route path="groups/:id" element={<GroupDetail />}/>
        <Route path="expenses" element={<Expenses />}/>
        <Route path="import" element={<ImportWizard />}/>
        <Route path="reports" element={<Reports />}/>
        <Route path="settings" element={<Settings />}/>
      </Route>
    </Routes>);
}
