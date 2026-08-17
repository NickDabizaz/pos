import { matchesSearch } from "@/lib/textSearch";
import type { Customer } from "@/app/master/customer/lib/types";

export function filterCustomer(items: Customer[], query: string): Customer[] {
  return items.filter((item) =>
    matchesSearch([item.namacustomer, item.kodecustomer, item.telepon, item.email, item.alamat], query),
  );
}
