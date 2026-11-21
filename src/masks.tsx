import { forwardRef, useLayoutEffect, useRef, useState, type InputHTMLAttributes } from "react";

export const digits = (value: string) => value.replace(/\D/g, "");
export function formatCpf(value: string) {
  const d = digits(value).slice(0, 11);
  return d.slice(0, 3) + (d.length > 3 ? "." + d.slice(3, 6) : "") + (d.length > 6 ? "." + d.slice(6, 9) : "") + (d.length > 9 ? "-" + d.slice(9) : "");
}
export function formatPhone(value: string) {
  const d = digits(value).slice(0, 11);
  if (!d) return "";
  if (d.length <= 2) return "(" + d;
  const middle = d.length > 10 ? 5 : 4;
  return "(" + d.slice(0, 2) + ") " + d.slice(2, 2 + middle) + (d.length > 2 + middle ? "-" + d.slice(2 + middle) : "");
}
export const validPhone = (value: string) => !digits(value) || [10, 11].includes(digits(value).length);

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & { kind: "cpf" | "phone"; value: string; onValueChange: (value: string) => void };
export const MaskedInput = forwardRef<HTMLInputElement, Props>(function MaskedInput({kind, value, onValueChange, ...props}, forwarded) {
  const input = useRef<HTMLInputElement | null>(null);
  const caret = useRef<number | null>(null);
  const [, redraw] = useState(0);
  const format = kind === "cpf" ? formatCpf : formatPhone;
  useLayoutEffect(() => { if (caret.current !== null && input.current) { input.current.setSelectionRange(caret.current, caret.current); caret.current = null; } });
  function update(raw: string, position: number) {
    const formatted = format(raw);
    const before = digits(raw.slice(0, position)).length;
    let index = 0, count = 0;
    while (index < formatted.length && count < before) { if (/\d/.test(formatted[index])) count++; index++; }
    caret.current = index; onValueChange(formatted); redraw(n => n + 1);
  }
  return <input {...props} ref={node => { input.current = node; if (typeof forwarded === "function") forwarded(node); else if (forwarded) forwarded.current = node; }} value={value} onChange={e => update(e.target.value, e.target.selectionStart ?? e.target.value.length)} onKeyDown={e => {
    props.onKeyDown?.(e);
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || (e.key !== "Backspace" && e.key !== "Delete")) return;
    const el = e.currentTarget, start = el.selectionStart ?? 0, end = el.selectionEnd ?? start;
    if (start !== end) return;
    let index = e.key === "Backspace" ? start - 1 : start;
    const direction = e.key === "Backspace" ? -1 : 1;
    while (index >= 0 && index < value.length && !/\d/.test(value[index])) index += direction;
    if (index < 0 || index >= value.length) return;
    e.preventDefault(); update(value.slice(0, index) + value.slice(index + 1), index);
  }} />;
});
