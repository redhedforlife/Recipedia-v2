import { redirect } from "next/navigation";

export default async function DishPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/graph?mode=dish&focus=${slug}`);
}
