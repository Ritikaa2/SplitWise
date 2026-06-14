import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CalendarClock, Home, Plane, Plus, Search, Sparkles, Users, Utensils } from "lucide-react";
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
  const [emoji, setEmoji] = useState("Home");
  const { data = [] } = useQuery({ queryKey: ["groups", search], queryFn: () => api.groups(search) });
  const create = useMutation({
    mutationFn: () => api.createGroup({
      name: name.trim(),
      description: description.trim(),
      default_currency: "INR",
      emoji,
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
    <div className="grid gap-6">
      <section className="page-hero soft-grid grid gap-5 p-5 md:p-7 lg:grid-cols-[1fr_420px]">
        <div>
          <p className="text-sm font-semibold uppercase text-primary">People and plans</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-black leading-tight text-ink md:text-5xl">Create groups for real life.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65 md:text-base">Keep rent, trips, lunches and projects separate so each group has its own members, budgets and settlement plan.</p>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {[
              ["Home bills", Home],
              ["Trip money", Plane],
              ["Food tabs", Utensils],
            ].map(([label, Icon]) => (
              <div key={label} className="rounded-lg border border-ink/10 bg-white/80 p-3 text-sm font-bold text-ink">
                <Icon className="mb-2 h-4 w-4 text-primary" />
                {label}
              </div>
            ))}
          </div>
        </div>
        <Card className="surface-hover">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-secondary" />
            <h2 className="font-black text-ink">Add a polished group</h2>
          </div>
          <form onSubmit={submit} className="grid gap-3">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New group name" />
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this group pays for" />
            <select className="field text-sm" value={emoji} onChange={(event) => setEmoji(event.target.value)}>
              <option value="Home">Home</option>
              <option value="Plane">Trip</option>
              <option value="Briefcase">Work</option>
              <option value="Utensils">Food</option>
            </select>
            <Button disabled={!name.trim() || create.isPending}>
              <Plus className="h-4 w-4" />
              Create group
            </Button>
            {create.error && <p className="text-sm text-danger">{create.error.message}</p>}
          </form>
        </Card>
      </section>

      <div className="relative">
        <Search className="absolute left-3 top-3.5 h-4 w-4 text-ink/35" />
        <Input className="pl-9" placeholder="Search your groups" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.map((group) => (
          <Link key={group.id} to={`/app/groups/${group.id}`}>
            <Card className="surface-hover h-full">
              <div className="flex items-start justify-between gap-3">
                <div className="icon-tile">
                  <Users className="h-5 w-5" />
                </div>
                <span className="pill">{group.default_currency}</span>
              </div>
              <h2 className="mt-4 text-lg font-black text-ink">{group.name}</h2>
              <p className="mt-2 min-h-10 text-sm leading-6 text-ink/60">{group.description ?? "No description yet"}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-background/80 p-3">
                  <p className="text-xs font-semibold uppercase text-ink/45">Members</p>
                  <p className="mt-1 font-black text-ink">{group.member_count ?? 0}</p>
                </div>
                <div className="rounded-lg bg-background/80 p-3">
                  <p className="text-xs font-semibold uppercase text-ink/45">Tracked</p>
                  <p className="mt-1 font-black text-ink">{money(group.total_spend ?? 0)}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary">
                <CalendarClock className="h-4 w-4" />
                Open timeline and balances
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {!data.length && (
        <Card className="border-dashed text-center">
          <p className="font-semibold text-ink">No groups found</p>
          <p className="mt-1 text-sm text-ink/55">Create a group for your home, trip or team tab.</p>
        </Card>
      )}
    </div>
  );
}
