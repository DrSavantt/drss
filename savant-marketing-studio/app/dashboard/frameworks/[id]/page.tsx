import { getFramework } from '@/app/actions/frameworks';
import { notFound } from 'next/navigation';
import FrameworkEditForm from './edit-form';

export default async function FrameworkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const framework = await getFramework(id);

  if (!framework) {
    notFound();
  }

  return <FrameworkEditForm framework={framework} />;
}

