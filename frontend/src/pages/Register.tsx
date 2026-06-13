import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../store/auth";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";

export default function Register() {
  const navigate = useNavigate();
  const setSession = useAuth((s) => s.setSession);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const mutation = useMutation({
    mutationFn: () => api.register(form.name, form.email, form.password),
    onSuccess: (data) => { setSession(data.access_token, data.user, true); navigate("/app"); },
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    if (form.password !== form.confirm) return;
    mutation.mutate();
  }
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold">Create account</h1>
        <form onSubmit={submit} className="mt-6 grid gap-4">
          <Input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input required minLength={8} type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Input required minLength={8} type="password" placeholder="Confirm password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
          {form.confirm && form.password !== form.confirm && <p className="text-sm text-danger">Passwords do not match.</p>}
          {mutation.error && <p className="text-sm text-danger">{mutation.error.message}</p>}
          <Button disabled={mutation.isPending || form.password !== form.confirm}>Register</Button>
        </form>
        <p className="mt-4 text-sm text-slate-400">Have an account? <Link className="text-accent" to="/login">Sign in</Link></p>
      </Card>
    </main>
  );
}

