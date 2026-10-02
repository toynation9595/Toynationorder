type Props = {
  name: string;
  defaultValue?: string;
  required?: boolean;
  id?: string;
};

/** 10-digit Indian mobile with a fixed +91 prefix. */
export default function MobileInput({ name, defaultValue, required = true, id }: Props) {
  return (
    <div className="flex rounded-xl border border-gray-300 bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
      <span className="flex items-center border-r border-gray-200 px-3 text-sm font-medium text-gray-500">+91</span>
      <input
        id={id ?? name}
        name={name}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        pattern="[6-9][0-9]{9}"
        maxLength={10}
        required={required}
        defaultValue={defaultValue}
        placeholder="10-digit mobile"
        className="w-full rounded-r-xl bg-transparent px-3 py-2.5 text-sm outline-none"
      />
    </div>
  );
}
