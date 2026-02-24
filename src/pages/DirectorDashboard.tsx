import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const fallbackStats = [
  { label: "Всего документов", value: 34 },
  { label: "Утверждено", value: 34 },
  { label: "На согласовании", value: 0 },
  { label: "Новых за месяц", value: 5 },
];

const filterGroups = [
  { title: "Проекты", items: ["ГПНЗ", "ВЧНГ", "СН", "ДНГКМ", "АУП"] },
  { title: "Роли", items: ["Водитель", "Механик РММ", "Диспетчер"] },
  { title: "Направления", items: ["БДД", "ОТ", "ПБ", "ГСМ"] },
];

const DirectorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(fallbackStats);
  const [activeFilters, setActiveFilters] = useState<Record<string, Set<string>>>({
    Проекты: new Set(),
    Роли: new Set(),
    Направления: new Set(),
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/bpium-api?action=get-documents`,
          {
            headers: {
              'apikey': anonKey,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!res.ok) throw new Error('Failed to fetch');
        const docs = await res.json();

        if (Array.isArray(docs)) {
          const total = docs.length;
          const approved = docs.filter((d: any) =>
            Array.isArray(d.status) ? d.status.includes('3') : d.status === '3'
          ).length;

          setStats([
            { label: "Всего документов", value: total },
            { label: "Утверждено", value: approved },
            { label: "На согласовании", value: 0 },
            { label: "Новых за месяц", value: 5 },
          ]);
        }
      } catch (e) {
        console.error('Failed to load documents:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleFilter = (group: string, item: string) => {
    setActiveFilters((prev) => {
      const next = new Map(Object.entries(prev).map(([k, v]) => [k, new Set(v)]));
      const set = next.get(group)!;
      if (set.has(item)) set.delete(item);
      else set.add(item);
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
            <div className="text-xs text-gray-400 uppercase mb-2">{group.title}</div>
            <div className="flex flex-wrap gap-2">
              {group.items.map((item) => {
                const active = activeFilters[group.title]?.has(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleFilter(group.title, item)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      active ? "bg-[#0099ff] text-white" : "bg-white border text-gray-700"
                    }`}
                  >
                    {item}
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
