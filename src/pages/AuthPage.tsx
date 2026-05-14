import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { LogIn, UserPlus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ROLE_OPTIONS = [
  { value: "staff", label: "Сотрудник" },
  { value: "dealer", label: "Дилер" },
  { value: "agent", label: "Агент" },
  { value: "designer", label: "Дизайнер" },
  { value: "client", label: "Клиент" },
];

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [city, setCity] = useState("");
  const [pendingRole, setPendingRole] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const mapAuthError = (err: { message?: string } | null, ctx: "login" | "register"): string => {
      if (!err) return "Произошла ошибка. Попробуйте снова.";
      if (ctx === "login") return "Неверный email или пароль";
      const msg = err.message || "";
      if (/already registered|already exists|duplicate/i.test(msg)) {
        return "Регистрация не удалась. Если у вас уже есть аккаунт, войдите.";
      }
      if (/password/i.test(msg)) return "Пароль не соответствует требованиям безопасности.";
      if (/email/i.test(msg)) return "Указан некорректный email.";
      return "Не удалось завершить регистрацию. Попробуйте снова.";
    };

    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) {
        console.error("[auth] signIn error:", error);
        setError(mapAuthError(error, "login"));
      }
    } else {
      if (!fullName.trim() || !phone.trim() || !city.trim()) {
        setError("ФИО, телефон и город обязательны для регистрации");
        setLoading(false);
        return;
      }
      if (!pendingRole) {
        setError("Выберите кем вы являетесь");
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName, phone, telegram, pendingRole, city);
      if (error) {
        console.error("[auth] signUp error:", error);
        setError(mapAuthError(error, "register"));
      }
      else setSuccess("Регистрация прошла успешно! Проверьте почту для подтверждения. После подтверждения email администратор одобрит ваш доступ.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">COZY ART</h1>
          <p className="text-muted-foreground text-sm">Калькулятор стоимости изделий</p>
        </div>

        <div className="glass-panel p-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            {mode === "login" ? <LogIn className="w-5 h-5 text-primary" /> : <UserPlus className="w-5 h-5 text-primary" />}
            {mode === "login" ? "Вход в систему" : "Регистрация"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <Label htmlFor="fullName">ФИО <span className="text-destructive">*</span></Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Иванов Иван Иванович"
                    required
                    className="mt-1 bg-secondary border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Телефон <span className="text-destructive">*</span></Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 (999) 123-45-67"
                    required
                    className="mt-1 bg-secondary border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="telegram">Telegram</Label>
                  <Input
                    id="telegram"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    placeholder="@username"
                    className="mt-1 bg-secondary border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Город <span className="text-destructive">*</span></Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Москва"
                    required
                    className="mt-1 bg-secondary border-border"
                  />
                </div>
                <div>
                  <Label>Кем вы являетесь? <span className="text-destructive">*</span></Label>
                  <Select value={pendingRole} onValueChange={setPendingRole}>
                    <SelectTrigger className="mt-1 bg-secondary border-border">
                      <SelectValue placeholder="Выберите роль" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@company.ru"
                required
                className="mt-1 bg-secondary border-border"
              />
            </div>

            <div>
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="mt-1 bg-secondary border-border"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-success">{success}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Загрузка..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setSuccess(""); }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {mode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Доступ только для сотрудников и партнёров
        </p>
      </motion.div>
    </div>
  );
}
