import { CategoryEditorPage } from "@/features/categories/category-editor-page";

interface EditPostCategoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostCategoryPage({ params }: EditPostCategoryPageProps) {
  const { id } = await params;
  return <CategoryEditorPage scope="POST" mode="edit" categoryId={id} />;
}
