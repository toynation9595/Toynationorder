import ImportForm from "./ImportForm";

export const metadata = { title: "Import stock – Toy Nation Admin" };

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-1 text-2xl font-semibold text-brand-dark">Import ERP stock</h1>
      <p className="mb-5 text-sm text-gray-500">
        Products are matched by barcode. Updates code, ERP name, unit, wholesale price (ERP Sales Price), stock and last received date. Categories, visibility, images, display names and descriptions are never changed.
        Barcodes missing from the file are marked out of stock. New barcodes take the category of an existing product with the same code.
      </p>
      <ImportForm />
    </div>
  );
}
