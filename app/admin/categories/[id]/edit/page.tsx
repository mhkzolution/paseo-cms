import { CategoryEditorPage } from "@/features/categories/category-editor-page";

interface EditStoreCategoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditStoreCategoryPage({ params }: EditStoreCategoryPageProps) {
  const { id } = await params;
  return <CategoryEditorPage scope="STORE" mode="edit" categoryId={id} />;
}
