import { LogOut, Moon, Sun } from "lucide-react";
import type { User } from "./domain";
import { DonorChat } from "./donor-chat";
import { formatCpf, formatPhone } from "./masks";
import { Failure, Logo } from "./ui";

export const donorAccountPath = "/area-do-doador";

type Props = {
  user: User;
  dark: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
  logoutBusy: boolean;
  logoutError: unknown;
};

export function DonorAccount({ user, dark, onToggleTheme, onLogout, logoutBusy, logoutError }: Props) {
  const cpf = user.cpf?.trim() ?? "";
  const phone = user.phoneNumber?.trim() ?? "";
  const formattedCpf = /^\d{11}$/.test(cpf) ? formatCpf(cpf) : cpf;
  const formattedPhone = /^\d{10,11}$/.test(phone) ? formatPhone(phone) : phone;

  return (
    <>
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <header className="donor-header">
        <div className="donor-header-inner">
          <Logo />
          <div className="donor-header-actions">
            <button
              className="icon-button"
              type="button"
              aria-label={dark ? "Ativar tema claro" : "Ativar tema escuro"}
              onClick={onToggleTheme}
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button type="button" className="secondary" disabled={logoutBusy} onClick={onLogout}>
              <LogOut size={17} />
              {logoutBusy ? "Saindo…" : "Sair"}
            </button>
          </div>
        </div>
      </header>
      <main className="donor-content" id="main-content" tabIndex={-1}>
        <h1>Área do doador</h1>
        <Failure error={logoutError} />
        <DonorChat key={user.id} />
        <section className="card donor-profile" aria-labelledby="donor-profile-heading">
          <h2 id="donor-profile-heading">Dados da conta</h2>
          <dl className="donor-details">
            <div>
              <dt>Nome completo</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>E-mail</dt>
              <dd>{user.email?.trim() || "Não informado"}</dd>
            </div>
            <div>
              <dt>CPF</dt>
              <dd>{formattedCpf || "Não informado"}</dd>
            </div>
            <div>
              <dt>Telefone</dt>
              <dd>{formattedPhone || "Não informado"}</dd>
            </div>
          </dl>
        </section>
      </main>
    </>
  );
}
