"use client";

import { useActionState } from "react";
import MobileInput from "@/components/MobileInput";
import { addRetailer, resetPin, updateRetailer, type FormState } from "./actions";

type Retailer = { id: number; mobile: string; name: string; shopName: string; city: string };

function Msg({ s }: { s: FormState }) {
  if (s.error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{s.error}</p>;
  if (s.ok) return <p className="rounded-lg bg-tn-teal/10 px-3 py-2 text-sm text-tn-teal">{s.ok}</p>;
  return null;
}

function DetailFields({ r }: { r?: Retailer }) {
  const p = r ? `-${r.id}` : "";
  return (
    <>
      <div>
        <label className="label" htmlFor={`mobile${p}`}>Mobile</label>
        <MobileInput name="mobile" id={`mobile${p}`} defaultValue={r?.mobile} />
      </div>
      <div>
        <label className="label" htmlFor={`name${p}`}>Name</label>
        <input id={`name${p}`} name="name" required defaultValue={r?.name} className="input" />
      </div>
      <div>
        <label className="label" htmlFor={`shop${p}`}>Shop name</label>
        <input id={`shop${p}`} name="shopName" required defaultValue={r?.shopName} className="input" />
      </div>
      <div>
        <label className="label" htmlFor={`city${p}`}>City</label>
        <input id={`city${p}`} name="city" required defaultValue={r?.city} className="input" />
      </div>
    </>
  );
}

function PinInput({ id }: { id: string }) {
  return (
    <input id={id} name="pin" type="text" inputMode="numeric" pattern="[0-9]{4,6}" maxLength={6} required
      autoComplete="off" placeholder="4–6 digits" className="input tracking-widest" />
  );
}

export function AddRetailerForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(addRetailer, {});
  return (
    <form action={action} key={state.ok} className="card space-y-3 p-5">
      <h2 className="text-lg font-semibold text-brand-dark">Add retailer</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <DetailFields />
        <div>
          <label className="label" htmlFor="pin-new">PIN</label>
          <PinInput id="pin-new" />
        </div>
      </div>
      <Msg s={state} />
      <button disabled={pending} className="btn-primary">{pending ? "Adding…" : "Add retailer"}</button>
    </form>
  );
}

export function EditRetailerForm({ r }: { r: Retailer }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateRetailer, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={r.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <DetailFields r={r} />
      </div>
      <Msg s={state} />
      <button disabled={pending} className="btn-primary">{pending ? "Saving…" : "Save details"}</button>
    </form>
  );
}

export function ResetPinForm({ id }: { id: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resetPin, {});
  return (
    <form action={action} key={state.ok} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <label className="label" htmlFor={`pin-${id}`}>New PIN</label>
      <div className="flex gap-2">
        <PinInput id={`pin-${id}`} />
        <button disabled={pending} className="btn-outline shrink-0">{pending ? "…" : "Reset PIN"}</button>
      </div>
      <Msg s={state} />
    </form>
  );
}
