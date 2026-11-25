import { useState, type FormEvent } from "react";
import { http } from "./http";
import { digits, MaskedInput } from "./masks";
import { Failure, useAction } from "./ui";

export function registrationToken(hash: string) {
  return new URLSearchParams(hash.slice(1)).get("confirmar-cadastro");
}

type Props = {
  token: string | null;
  onBack: () => void;
  onRestart: () => void;
  onComplete: () => void;
};

export function Registration({ token, onBack, onRestart, onComplete }: Props) {
  const action = useAction();
  const [cpf, setCpf] = useState("");
  const [sent, setSent] = useState(false);

  function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    void action.run(async () => {
      await http("/auth/register", "POST", { email: String(fields.get("email")).trim() });
      setSent(true);
    });
  }

  function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const password = String(fields.get("password"));
    void action.run(async () => {
      if (password !== fields.get("repeatPassword")) {
        throw new Error("As duas senhas precisam ser iguais.");
      }
      if (new TextEncoder().encode(password).length > 72) {
        throw new Error("A senha é muito longa. Use menos caracteres.");
      }
      await http("/auth/register/confirm", "POST", {
        token,
        name: String(fields.get("name")).trim(),
        cpf: digits(cpf),
        password,
      });
      onComplete();
    });
  }

  if (token !== null && !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    return (
      <>
        <h2>Link inválido</h2>
        <p className="muted">Solicite um novo link para criar sua conta.</p>
        <button className="primary full" onClick={onRestart}>Pedir novo link</button>
        <button className="secondary full login-follow-up" onClick={onBack}>Voltar ao login</button>
      </>
    );
  }

  return (
    <>
      <h2>{token === null ? "Criar conta" : "Concluir cadastro"}</h2>
      {sent ? (
        <p className="muted" role="status">
          Se o e-mail puder ser usado no cadastro, você receberá um link de confirmação.
          Confira também a pasta de spam.
        </p>
      ) : token === null ? (
        <>
          <p className="muted">Informe seu e-mail para receber o link de confirmação.</p>
          <form onSubmit={start}>
            <label>
              E-mail
              <input name="email" type="email" autoComplete="email" maxLength={255} required autoFocus />
            </label>
            <Failure error={action.error} />
            <button className="primary full" disabled={action.busy}>
              {action.busy ? "Enviando…" : "Enviar link de confirmação"}
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="muted">Informe seu nome e CPF e escolha uma senha de pelo menos 8 caracteres.</p>
          <form onSubmit={confirm}>
            <label>
              Nome completo
              <input name="name" autoComplete="name" maxLength={255} required autoFocus />
            </label>
            <label>
              CPF
              <MaskedInput
                kind="cpf"
                name="cpf"
                value={cpf}
                onValueChange={setCpf}
                inputMode="numeric"
                pattern="[0-9]{3}[.][0-9]{3}[.][0-9]{3}-[0-9]{2}"
                placeholder="000.000.000-00"
                required
              />
            </label>
            <label>
              Senha
              <input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required />
            </label>
            <label>
              Confirmar senha
              <input name="repeatPassword" type="password" autoComplete="new-password" minLength={8} maxLength={72} required />
            </label>
            <Failure error={action.error} />
            <button className="primary full" disabled={action.busy}>
              {action.busy ? "Criando…" : "Criar minha conta"}
            </button>
          </form>
        </>
      )}
      {token !== null && <button className="secondary full login-follow-up" disabled={action.busy} onClick={onRestart}>Pedir novo link</button>}
      {sent && <button className="secondary full" onClick={() => setSent(false)}>Usar outro e-mail</button>}
      <button className="secondary full login-follow-up" disabled={action.busy} onClick={onBack}>Voltar ao login</button>
    </>
  );
}
