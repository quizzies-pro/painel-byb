import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Check, Eye, EyeOff, Loader2, Mail } from "lucide-react";

type Step = "email" | "password" | "forgot" | "reset-sent";

export default function Login() {
  const { user, isAdmin, loading, signIn, resetPassword } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const normalizedEmail = email.trim().toLowerCase();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
      </div>
    );
  }

  if (user && isAdmin) return <Navigate to="/admin" replace />;

  const handleEmail = (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
      setErrorMessage("Informe um e-mail válido.");
      return;
    }

    setEmail(normalizedEmail);
    setStep("password");
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
    const { error } = await signIn(normalizedEmail, password);
    setIsLoading(false);
    if (error) {
      setErrorMessage("Senha incorreta ou acesso não autorizado.");
    }
  };

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
    const { error } = await resetPassword(normalizedEmail);
    setIsLoading(false);
    if (error) {
      setErrorMessage("Não foi possível enviar o link. Tente novamente.");
    } else {
      setStep("reset-sent");
    }
  };

  const returnToEmail = () => {
    setPassword("");
    setShowPassword(false);
    setErrorMessage("");
    setStep("email");
  };

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-background">
      <section className="relative hidden w-[52%] flex-col justify-between border-r border-border bg-card p-12 lg:flex xl:p-16">
        <img src="/dive-hub-logo.png" alt="Dive | Hub" className="h-auto w-44 object-contain object-left" />

        <div className="max-w-xl pb-8">
          <p className="mb-5 font-mono text-xs uppercase text-muted-foreground">Painel administrativo</p>
          <h1 className="text-5xl font-medium leading-[1.06] text-foreground xl:text-6xl">
            Direção
            <span className="block text-muted-foreground">Implementação</span>
            <span className="block">Validação</span>
            <span className="block text-muted-foreground">Escala</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground">
            Gerencie produtos, conteúdos, alunos e acessos com clareza e precisão.
          </p>
        </div>

        <p className="text-xs text-muted-foreground">Dive | Hub</p>
      </section>

      <section className="flex min-h-screen flex-1 items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <img src="/dive-hub-logo.png" alt="Dive | Hub" className="mx-auto mb-12 h-auto w-40 object-contain lg:hidden" />

          <div className="mb-10 flex items-center gap-2" aria-label={`Etapa ${step === "email" ? 1 : 2} de 2`}>
            <span className="h-1 w-10 rounded-full bg-primary" />
            <span className={`h-1 w-10 rounded-full transition-colors ${step === "email" ? "bg-muted" : "bg-primary"}`} />
          </div>

          <div key={step} className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-2 motion-safe:duration-300">
            {step === "email" && (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-medium text-foreground">Acesse o Dive | Hub</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Digite seu e-mail administrativo para continuar.</p>
                </div>
                <form onSubmit={handleEmail} className="space-y-5" noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      maxLength={254}
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setErrorMessage("");
                      }}
                      placeholder="seu@email.com"
                      required
                      autoFocus
                      aria-invalid={Boolean(errorMessage)}
                      aria-describedby={errorMessage ? "login-error" : undefined}
                      className="h-11 bg-card px-3"
                    />
                  </div>
                  {errorMessage && <p id="login-error" role="alert" className="text-sm text-destructive">{errorMessage}</p>}
                  <Button type="submit" className="h-11 w-full">Continuar</Button>
                </form>
              </>
            )}

            {step === "password" && (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-medium text-foreground">Digite sua senha</h2>
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    <span className="max-w-[280px] truncate">{normalizedEmail}</span>
                  </div>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          setErrorMessage("");
                        }}
                        placeholder="Digite sua senha"
                        required
                        autoComplete="current-password"
                        autoFocus
                        aria-invalid={Boolean(errorMessage)}
                        aria-describedby={errorMessage ? "login-error" : undefined}
                        className="h-11 bg-card px-3 pr-11"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowPassword((visible) => !visible)}
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        className="absolute right-0.5 top-0.5 h-10 w-10 text-muted-foreground hover:bg-transparent hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                      </Button>
                    </div>
                  </div>
                  {errorMessage && <p id="login-error" role="alert" className="text-sm text-destructive">{errorMessage}</p>}
                  <div className="flex justify-end">
                    <Button type="button" variant="link" onClick={() => setStep("forgot")} className="h-auto p-0 text-xs">
                      Esqueceu sua senha?
                    </Button>
                  </div>
                  <Button type="submit" disabled={isLoading} className="h-11 w-full">
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    Entrar
                  </Button>
                  <Button type="button" variant="ghost" onClick={returnToEmail} className="w-full text-muted-foreground">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Alterar e-mail
                  </Button>
                </form>
              </>
            )}

            {step === "forgot" && (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-medium text-foreground">Recuperar senha</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Enviaremos um link de redefinição para {normalizedEmail}.</p>
                </div>
                <form onSubmit={handleReset} className="space-y-4">
                  {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}
                  <Button type="submit" disabled={isLoading} className="h-11 w-full">
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    Enviar link
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setStep("password")} className="w-full text-muted-foreground">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar
                  </Button>
                </form>
              </>
            )}

            {step === "reset-sent" && (
              <div className="text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="mt-5 text-2xl font-medium text-foreground">Confira seu e-mail</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Enviamos as instruções para {normalizedEmail}.</p>
                <Button type="button" variant="ghost" onClick={() => setStep("password")} className="mt-6 w-full text-muted-foreground">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar para entrar
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
