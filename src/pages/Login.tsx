import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Login() {
  const { user, isAdmin, loading, signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
      </div>
    );
  }

  if (user && isAdmin) return <Navigate to="/admin" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);
    if (error) {
      toast.error("Credenciais inválidas");
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await resetPassword(email);
    setIsLoading(false);
    if (error) {
      toast.error("Erro ao enviar email de recuperação");
    } else {
      toast.success("Email de recuperação enviado");
      setShowReset(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            TTS Academy
          </h1>
          <p className="text-sm text-muted-foreground">
            {showReset ? "Recuperar senha" : "Painel Administrativo"}
          </p>
        </div>

        <form onSubmit={showReset ? handleReset : handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm text-muted-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ttsacademy.com"
              required
              className="bg-card border-border text-foreground placeholder:text-muted-foreground/50"
            />
          </div>

          {!showReset && (
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-muted-foreground">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-card border-border text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : showReset ? (
              "Enviar link"
            ) : (
              "Entrar"
            )}
          </Button>
        </form>

        <button
          onClick={() => setShowReset(!showReset)}
          className="block w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {showReset ? "Voltar ao login" : "Esqueci minha senha"}
        </button>
      </div>
    </div>
  );
}
