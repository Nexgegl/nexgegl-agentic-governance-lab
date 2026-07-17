import { redirect } from "next/navigation";
import { useCases } from "@/lib/mock-data";

export function generateStaticParams() {
  return useCases.map((u) => ({ id: u.id }));
}

export default function UseCaseDetailRedirectPage({ params }: { params: { id: string } }) {
  redirect(`/ai-inventory/${params.id}`);
}
