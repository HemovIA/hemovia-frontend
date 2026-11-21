import { useRef, useState } from "react";
import { ApiError } from "./http";
import { validCpf, type Donor } from "./domain";
import { Failure, useSession } from "./ui";
import { digits, MaskedInput, validPhone } from "./masks";

export function DonorCpf() {
  const { call } = useSession();
  const [cpf, setCpf] = useState("");
  const [donor, setDonor] = useState<Donor>();
  const [state, setState] = useState<"idle" | "loading" | "missing" | "error">("idle");
  const [error, setError] = useState<unknown>();
  const [register, setRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const sequence = useRef(0);
  const input = useRef<HTMLInputElement>(null);
  const emailInput = useRef<HTMLInputElement>(null);
  function validate(value: string, found?: Donor) {
    input.current?.setCustomValidity(value && !found ? "Busque e selecione um doador ou limpe o CPF." : "");
  }
  async function search() {
    if (!validCpf(cpf)) { setError(new Error("Informe um CPF válido.")); setState("error"); return; }
    const current = ++sequence.current; setState("loading"); setError(undefined);
    try {
      const result = await call<Donor>(`/donors?cpf=${encodeURIComponent(digits(cpf))}`);
      if (current !== sequence.current) return;
      setDonor(result); validate(cpf, result); setState("idle");
    } catch (e) {
      if (current !== sequence.current) return;
      if (e instanceof ApiError && e.status === 404) setState("missing");
      else { setState("error"); setError(e); }
    }
  }
  async function create() {
    if (emailInput.current && !emailInput.current.reportValidity()) return;
    if (!validPhone(phone)) { setError(new Error("Informe DDD e telefone completo.")); setState("error"); return; }
    if (!name.trim()) { setError(new Error("Informe o nome do doador.")); return; }
    const current = ++sequence.current; setState("loading"); setError(undefined);
    try {
      const result = await call<Donor>("/donors", "POST", { name: name.trim(), cpf: digits(cpf), email: email || null, phoneNumber: digits(phone) || null });
      if (current !== sequence.current) return;
      setDonor(result); validate(cpf, result); setState("idle"); setRegister(false);
    } catch (e) { if (current === sequence.current) { setError(e); setState("error"); } }
  }
  return <div>
    <label>CPF do doador (opcional)<MaskedInput kind="cpf" ref={input} inputMode="numeric" value={cpf} onValueChange={(value) => {
       ++sequence.current; setCpf(value); setDonor(undefined); setState("idle"); setRegister(false); setError(undefined); validate(value);
    }} /></label>
    <input type="hidden" name="donorId" value={donor?.id || ""} />
    <button type="button" className="secondary" disabled={!cpf || state === "loading"} onClick={search}>Buscar doador</button>
    {donor && <p role="status">Doador selecionado: {donor.name} · {donor.cpf}</p>}
    {state === "loading" && <p role="status">Consultando…</p>}
    {state === "missing" && <p>Nenhum doador encontrado. <button type="button" onClick={() => setRegister(true)}>Cadastrar doador</button></p>}
    {state === "error" && <><Failure error={error} /><button type="button" onClick={search}>Tentar novamente</button></>}
    {register && <fieldset><legend>Cadastro rápido de doador</legend>
      <label>Nome<input value={name} onChange={(e) => setName(e.target.value)} maxLength={255} /></label>
      <label>E-mail (opcional)<input ref={emailInput} type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} /></label>
      <label>Telefone (opcional)<MaskedInput kind="phone" type="tel" value={phone} onValueChange={setPhone} /></label>
      <button type="button" disabled={state === "loading"} onClick={create}>Confirmar cadastro</button>
      <button type="button" onClick={() => setRegister(false)}>Cancelar</button>
    </fieldset>}
  </div>;
}
