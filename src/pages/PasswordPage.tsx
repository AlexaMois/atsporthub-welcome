import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// URL Edge Function. Пароль проверяется на сервере — не виден в браузере.
const FUNC_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/bpium-api`;

const PasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${FUNC_URL}?action=check-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ password }),
      });

      if (res.status === 200) {
        sessionStorage.setItem("director_auth", "true");
        navigate("/dashboard/director");
      } else if (res.status === 401) {
        setError("Неверный пароль");
      } else {
        const data = await res.json().catch(() => ({}));
        if (data?.error === "not_configured") {
          setError("Ошибка конфигурации: пароль не настроен. Обратитесь к администратору.");
        } else {
          setError("Ошибка сервера. Попробуйте позже.");
        }
      }
    } catch {
      setError("Нет связи с сервером. Проверьте интернет.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4">
        <Button variant="ghost" onClick={() => navigate("/")} className="gap-1">
          <ArrowLeft size={18} />
          Назад
        </Button>
      </div>

      <div className="max-w-sm mx-auto mt-16 px-4 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-primary">
          <Lock className="text-white" size={28} />
        </div>

        <h1 className="mt-4 text-xl font-bold text-foreground">Защищённый вход</h1>
        <p className="mt-1 text-sm text-muted-foreground text-center">
          Доступ только для Генерального директора
        </p>

        <form onSubmit={handleSubmit} className="w-full mt-6 space-y-3">
          <Input
            type="password"
            placeholder="Введите пароль"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            className={error ? "border-destructive" : ""}
            autoFocus
            disabled={loading}
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Проверка..." : "Войти"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PasswordPage;
