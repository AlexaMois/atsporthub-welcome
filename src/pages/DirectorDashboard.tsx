import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FilterItem {
  id: string;
  name: string;
}

interface FilterGroup {
  title: string;
  items: FilterItem[];
}

const FUNC_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/bpium-api`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const fetchAction = async (action: string) => {
  const res = await fetch(`${FUNC_URL}?action=${action}`, {
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`${action} failed: ${res.status}`);
  return res.json();
};

const DirectorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: "Всего документов", value: 0 },
    { label: "Утверждено", value: 0 },
    { label: "На согласовании", value: 0 },
    { label: "Новых за месяц", value: 0 },
  ]);
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, Set<string>>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const [docs, roles, projects, directions, sources] = await Promise.all([
          fetchAction("get-documents"),
          fetchAction("get-roles"),
          fetchAction("get-projects"),
          fetchAction("get-directions"),
          fetchAction("get-sources"),
        ]);

        // Stats
        if (Array.isArray(docs)) {
          const total = docs.length;
          const approved = docs.filter((d: any) =>
            Array.isArray(d.status) ? d.status.includes("3") : d.status === "3"
          ).length;
          const inReview = docs.filter((d: any) =>
            Array.isArray(d.status) ? d.status.includes("2") : d.status === "2"
          ).length;

          const now = new Date();
          const newThisMonth = docs.filter((d: any) => {
            if (!d.date) return false;
            const dt = new Date(d.date);
            return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
          }).length;

          setStats([
            { label: "Всего документов", value: total },
            { label: "Утверждено", value: approved },
            { label: "На согласовании", value: inReview },
            { label: "Новых за месяц", value: newThisMonth },
          ]);
        }

        // Filter groups
        const groups: FilterGroup[] = [];
        const initial: Record<string, Set<string>> = {};

        const addGroup = (title: string, data: any[]) => {
          if (Array.isArray(data) && data.length > 0) {
            groups.push({
              title,
              items: data.map((r: any) => ({ id: String(r.id), name: r.name || `#${r.id}` })),
            });
            initial[title] = new Set();
          }
        };

        addGroup("Проекты", projects);
        addGroup("Роли", roles);
        addGroup("Направления", directions);
        addGroup("Источники", sources);

        setFilterGroups(groups);
        setActiveFilters(initial);
      } catch (e) {
        console.error("Failed to load data:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleFilter = (group: string, itemId: string) => {
    setActiveFilters((prev) => {
      const next = new Map(Object.entries(prev).map(([k, v]) => [k, new Set(v)]));
      const set = next.get(group)!;
      if (set.has(itemId)) set.delete(itemId);
      else set.add(itemId);
      return Object.fromEntries(next);
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 bg-[#0099ff] flex justify-between items-center px-4">
        <Button variant="ghost" className="text-white hover:bg-white/20" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Выйти
        </Button>
        <span className="text-white font-semibold">АТС Портал</span>
        <span className="text-white text-sm opacity-80">Генеральный директор</span>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 mx-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          stats.map((s) => (
            <div key={s.label} className="bg-card rounded-xl shadow-sm p-6">
              <div className="text-3xl font-bold text-primary">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))
        )}
      </div>

      <div className="mx-4 mt-6 space-y-4">
        {filterGroups.map((group) => (
          <div key={group.title}>
            <div className="text-xs text-muted-foreground uppercase mb-2">{group.title}</div>
            <div className="flex flex-wrap gap-2">
              {group.items.map((item) => {
                const active = activeFilters[group.title]?.has(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleFilter(group.title, item.id)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      active ? "bg-[#0099ff] text-white" : "bg-card border text-foreground"
                    }`}
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mx-4 mt-4">
        <Input placeholder="Поиск по всей базе..." className="w-full rounded-lg" />
      </div>

      <div className="mx-4 mt-4">
        <Button variant="outline" className="border-[#0099ff] text-[#0099ff] w-full">
          Посмотреть глазами сотрудника
        </Button>
      </div>
    </div>
  );
};

export default DirectorDashboard;
