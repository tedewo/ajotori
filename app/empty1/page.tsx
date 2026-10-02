import { redirect } from 'next/navigation';

export default function ListingsRedirectPage(): never {
  redirect('/ilmoitukset/');
}
