import React from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Search, Users } from "lucide-react";
import { api } from "../lib/api";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { money } from "../lib/utils";

export default function Groups() {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { data = [] } = useQuery({ queryKey: ["groups", search], queryFn: () => api.groups(search) });
  const create = useMutation({
    mutationFn: () => api.createGroup({
      name: name.trim(),
      description: description.trim(),
      default_currency: "INR",
      budgets: [
        { category: "Food", monthly_limit: 15000, currency: "INR" },
        { category: "Travel", monthly_limit: 25000, currency: "INR" },
      ],
      members: [],
    }),
    onSuccess: () => {
      setName("");
      setDescription("");
      client.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  function submit(event) {
    event.preventDefault();
    if (name.trim()) create.mutate();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Groups</h1>
          <p className="text-sm text-ink-lighter mt-1">Manage your expense groups</p>
        </div>
      </div>

      {/* Create Group */}
      <Card className="p-6">
        <h2 className="font-semibold text-ink mb-4">Create a new group</h2>
        <form onSubmit={submit} className="flex gap-3 items-end">
          <div className="flex-1">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name" />
          </div>
          <div className="flex-1">
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" />
          </div>
          <Button disabled={!name.trim() || create.isPending}>
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </form>
        {create.error && <p className="mt-2 text-sm text-danger">{create.error.message}</p>}
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
        <Input className="pl-10" placeholder="Search groups..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Groups Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.map((group) => (
          <Link key={group.id} to={`/app/groups/${group.id}`}>
            <Card className="surface-hover h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="icon-tile">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <span className="pill">{group.default_currency}</span>
              </div>
              <h3 className="font-semibold text-ink">{group.name}</h3>
              <p className="mt-1 text-sm text-ink-lighter">{group.description || "No description"}</p>
              <div className="mt-4 flex gap-4 text-sm">
                <div>
                  <span className="text-ink-lighter">Members: </span>
                  <span className="font-semibold text-ink">{group.member_count ?? 0}</span>
                </div>
                <div>
                  <span className="text-ink-lighter">Tracked: </span>
                  <span className="font-semibold text-ink">{money(group.total_spend ?? 0)}</span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {!data.length && (
        <Card className="text-center py-12 border-dashed">
          <Users className="h-8 w-8 text-ink-muted mx-auto mb-3" />
          <p className="font-medium text-ink">No groups found</p>
          <p className="text-sm text-ink-lighter mt-1">Create a group to get started.</p>
        </Card>
      )}
    </div>
  );
}