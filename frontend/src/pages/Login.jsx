import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../store/auth";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
export default function Login() {
    const navigate = useNavigate();
    const setSession = useAuth((s) => s.setSession);
    const [remember, setRemember] = useState(true);
    const [form, setForm] = useState({ email: "", password: "" });
    const mutation = useMutation({
        mutationFn: () => api.login(form.email, form.password),
        onSuccess: (data) => { setSession(data.access_token, data.user, remember); navigate("/app"); },
    });
    function submit(event) {
        event.preventDefault();
        mutation.mutate();
    }
    return (<main className="grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-400">Sign in to manage balances, imports, and settlements.</p>
        <form onSubmit={submit} className="mt-6 grid gap-4">
          <Input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}/>
          <Input required minLength={8} type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}/>
          <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}/> Remember me</label>
          {mutation.error && <p className="text-sm text-danger">{mutation.error.message}</p>}
          <Button disabled={mutation.isPending}>{mutation.isPending && <Loader2 className="h-4 w-4 animate-spin"/>} Login</Button>
        </form>
        <p className="mt-4 text-sm text-slate-400">No account? <Link className="text-accent" to="/register">Create one</Link></p>
      </Card>
    </main>);
}
