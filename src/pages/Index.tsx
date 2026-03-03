import { useNavigate } from "react-router-dom";
import { Car, Wrench, Radio, ClipboardCheck, ShieldCheck, HeartPulse, Cog, Zap, HardHat, Package, Briefcase, UserCheck, Users, Settings, Anchor, Crown, Lock } from "lucide-react";
import atsLogo from "@/assets/ats-logo.jpg";

const roles = [
  { name: "Водитель", icon: Car },
  { name: "Механик РММ", icon: Wrench },
  { name: "Диспетчер", icon: Radio },
  { name: "Механик по выпуску", icon: ClipboardCheck },
  { name: "Специалист БДД, ОТ, ПБ и ОС", icon: ShieldCheck },
  { name: "Медработник", icon: HeartPulse },
  { name: "Машинист / оператор техники", icon: Cog },
  { name: "Электромонтёр / Энергетик", icon: Zap },
  { name: "Рабочий", icon: HardHat },
  { name: "Кладовщик", icon: Package },
  { name: "Начальник участка / Руководитель проекта", icon: Briefcase },
  { name: "Специалист по кадрам", icon: UserCheck },
  { name: "Все сотрудники", icon: Users },
  { name: "Механик ЛТК", icon: Settings },
  { name: "Стропальщик", icon: Anchor },
  { name: "Генеральный директор", icon: Crown },
];

const Index = () => {
  const navigate = useNavigate();

  const handleClick = (roleName: string) => {
    if (roleName === "Генеральный директор") {
      navigate("/login/director");
    } else {
      navigate(`/role/${encodeURIComponent(roleName)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 bg-primary flex items-center px-5 gap-3">
        <img src={atsLogo} alt="АТС" className="h-8 w-8 rounded" />
        <span className="text-primary-foreground font-semibold text-lg">АТС Портал</span>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-12">
        <h1 className="text-2xl font-bold text-center mt-8 mb-8 text-foreground">Кто вы?</h1>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {roles.map(({ name, icon: Icon }) => (
            <button
              key={name}
              onClick={() => handleClick(name)}
              className="relative bg-card rounded-xl shadow-sm p-6 flex flex-col items-center gap-3 hover:shadow-md transition-shadow cursor-pointer border border-border"
            >
              {name === "Генеральный директор" && (
                <Lock className="absolute top-3 right-3 text-primary" size={18} />
              )}
              <Icon size={32} className="text-primary" />
              <span className="text-[15px] sm:text-sm font-medium text-foreground">{name}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
