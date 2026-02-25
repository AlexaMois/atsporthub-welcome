import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const RolePage = () => {
  const { roleName } = useParams<{ roleName: string }>();
  const decoded = decodeURIComponent(roleName || "");

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 bg-primary flex items-center px-5">
        <span className="text-primary-foreground font-semibold text-lg">АТС Портал</span>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-8">
        <Link to="/" className="inline-flex items-center gap-2 text-primary mb-6 hover:underline text-sm">
          <ArrowLeft size={16} /> Назад
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Раздел для {decoded}</h1>
      </main>
    </div>
  );
};

export default RolePage;
