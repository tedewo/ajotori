import Link from 'next/link';

export default function CreateListingHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto container-center py-4">
        <Link href="/">
          <div className="text-2xl font-semibold text-slate-900 hover:text-slate-700 cursor-pointer">
            Ajotori
          </div>
        </Link>
      </div>
    </header>
  );
}
