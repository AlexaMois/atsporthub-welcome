import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "atc2026") {
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
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "#0099ff" }}>
          <Lock className="text-white" size={28} />
        </div>

        <h1 className="text-xl font-bold mt-6 text-foreground">Защищённый вход</h1>
        <p className="text-sm text-muted-foreground mt-1">Роль: Генеральный директор</p>

        <form onSubmit={handleSubmit} className="w-full mt-8 space-y-3">
          <Input
            type="password"
            placeholder="Введите пароль"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            className="rounded-lg"
          />
          {error && (
            <p className="text-sm text-destructive">Неверный пароль, попробуйте ещё раз</p>
          )}
          <Button type="submit" className="w-full rounded-lg text-white" style={{ backgroundColor: "#0099ff" }}>
            Войти
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PasswordPage;
