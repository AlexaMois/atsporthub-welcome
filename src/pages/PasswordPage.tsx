import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Пароль читается из переменной окружения VITE_DIRECTOR_PASSWORD.
// Никогда не хардкодить пароль прямо в коде — задайте его через .env.
const DIRECTOR_PASSWORD = import.meta.env.VITE_DIRECTOR_PASSWORD;

const PasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!DIRECTOR_PASSWORD) {
      // Защита от ошибочной конфигурации: если переменная не задана,
      // вход заблокирован — нельзя попасть паролем по умолчанию.
      console.error("VITE_DIRECTOR_PASSWORD is not set in .env");
      setError(true);
      return;
    }

    if (password === DIRECTOR_PASSWORD) {
      sessionStorage.setItem("director_auth", "true");
      navigate("/dashboard/director");
    } else {
      setError(true);
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
              setError(false);
            }}
            className={error ? "border-destructive" : ""}
            autoFocus
          />
          {error && (
            <p className="text-sm text-destructive">
              {!DIRECTOR_PASSWORD
                ? "Ошибка конфигурации: пароль не настроен. Обратитесь к администратору."
                : "Неверный пароль"}
            </p>
          )}
          <Button type="submit" className="w-full">
            Войти
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PasswordPage;
