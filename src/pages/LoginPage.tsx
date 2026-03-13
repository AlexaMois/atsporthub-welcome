import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { FUNC_URL } from "@/lib/config";

const LoginPage = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = phone.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${FUNC_URL}?action=verify-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: trimmed }),
      });

      const data = await res.json();

      if (res.status === 200 && data.ok) {
        // Сохраняем токен и данные пользователя
        sessionStorage.setItem("user_token", data.token);
        sessionStorage.setItem("user_fio", data.fio ?? "");
        sessionStorage.setItem("user_roles", JSON.stringify(data.roles ?? []));
        navigate("/portal");
      } else if (res.status === 404) {
        setError("Номер не найден. Обратитесь к администратору.");
      } else if (res.status === 403) {
        if (data.error === "fired") setError("Доступ закрыт: сотрудник уволен.");
        else if (data.error === "blocked") setError("Доступ заблокирован. Обратитесь к администратору.");
        else setError("Доступ недоступен. Обратитесь к администратору.");
      } else {
        setError("Ошибка сервера. Попробуйте позже.");
      }
    } catch {
      setError("Нет связи с сервером. Проверьте интернет.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold">Вход в портал АТС</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Введите номер телефона, указанный в системе
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="tel"
              placeholder="+7 900 000 00 00"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError(null);
              }}
              className={error ? "border-destructive" : ""}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive mt-2">{error}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading || !phone.trim()}>
            {loading ? "Проверяем..." : "Войти"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Если ваш номер не принят — обратитесь к непосредственному руководителю
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
