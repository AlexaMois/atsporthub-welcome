import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiCall } from "@/lib/api";

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

    const result = await apiCall("check-password", { password });

    if (result.error) {
      setError(result.error);
    } else if (result.ok && result.data?.ok && result.data?.token) {
      sessionStorage.setItem("director_token", result.data.token);
      navigate("/dashboard/director");
    } else if (result.status === 429) {
      setError("Слишком много попыток. Подождите 15 минут.");
    } else if (result.status === 401) {
      setError("Неверный пароль");
    } else if (result.data?.error === "not_configured") {
      setError("Ошибка конфигурации: пароль не настроен. Обратитесь к администратору.");
    } else {
      setError("Ошибка сервера. Попробуйте позже.");
    }

    setLoading(false);
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
