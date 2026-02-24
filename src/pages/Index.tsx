import { useNavigate } from "react-router-dom";
import { Car, Wrench, Radio, Package, UserCheck, Crown, Lock } from "lucide-react";

const roles = [
  { name: "Водитель", icon: Car },
  { name: "Механик", icon: Wrench },
  { name: "Диспетчер", icon: Radio },
  { name: "Кладовщик", icon: Package },
  { name: "Специалист по кадрам", icon: UserCheck },
  { name: "Генеральный директор", icon: Crown },
];

const Index = () => {
  const navigate = useNavigate();

  const handleClick = (roleName: string) => {
    console.log(roleName);
    navigate(`/role/${encodeURIComponent(roleName)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 bg-primary flex items-center px-5">
        <span className="text-primary-foreground font-semibold text-lg">АТС Портал</span>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-12">
        <h1 className="text-2xl font-bold text-center mt-8 mb-8 text-foreground">Кто вы?</h1>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
              <span className="text-sm font-medium text-foreground">{name}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
