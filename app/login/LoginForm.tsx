"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";
import MobileInput from "@/components/MobileInput";

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="mobile" className="label">Mobile number</label>
        <MobileInput name="mobile" />
      </div>
      <div>
        <label htmlFor="pin" className="label">PIN</label>
        <input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          pattern="[0-9]{4,6}"
          maxLength={6}
          required
          className="input tracking-widest"
          placeholder="••••"
        />
      </div>
      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
