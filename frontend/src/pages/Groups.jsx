import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { api } from "../lib/api";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
export default function Groups() {
    const client = useQueryClient();
    const [search, setSearch] = useState("");
    const [name, setName] = useState("");
    const { data = [] } = useQuery({ queryKey: ["groups", search], queryFn: () => api.groups(search) });
    const create = useMutation({ mutationFn: () => api.createGroup({ name, default_currency: "INR", members: [] }), onSuccess: () => { setName(""); client.invalidateQueries({ queryKey: ["groups"] }); } });
    function submit(event) { event.preventDefault(); if (name)
        create.mutate(); }
    return (<div className="grid gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div><h1 className="text-3xl font-bold">Groups</h1><p className="text-slate-400">Create, search, edit, and inspect shared expense groups.</p></div>
        <form onSubmit={submit} className="flex gap-2"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New group name"/><Button><Plus className="h-4 w-4"/>Create</Button></form>
      </div>
      <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-500"/><Input className="pl-9" placeholder="Search groups" value={search} onChange={(e) => setSearch(e.target.value)}/></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.map((group) => (<Link key={group.id} to={`/app/groups/${group.id}`}>
            <Card className="h-full transition hover:-translate-y-1 hover:border-accent/50">
              <h2 className="text-lg font-semibold">{group.name}</h2>
              <p className="mt-2 min-h-10 text-sm text-slate-400">{group.description ?? "No description yet"}</p>
              <p className="mt-4 text-sm text-accent">{group.default_currency}</p>
            </Card>
          </Link>))}
      </div>
    </div>);
}
