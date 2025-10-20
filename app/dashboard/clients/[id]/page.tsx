import { getClient } from '@/app/actions/clients'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { DeleteClientButton } from './delete-button'

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const client = await getClient(params.id)

  if (!client) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href="/dashboard/clients"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          ← Back to Clients
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
            {client.email && (
              <p className="mt-2 text-gray-600">{client.email}</p>
            )}
            {client.website && (
              <a
                href={client.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 text-sm text-blue-600 hover:text-blue-700"
              >
                {client.website} ↗
              </a>
            )}
          </div>
          <div className="flex gap-2">
            <Link
              href={`/dashboard/clients/${client.id}/edit`}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Edit
            </Link>
            <DeleteClientButton clientId={client.id} clientName={client.name} />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(client.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(client.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href={`/dashboard/clients/${client.id}/projects`}
              className="rounded-md border-2 border-gray-200 p-4 hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <p className="font-semibold text-gray-900">Projects</p>
              <p className="text-sm text-gray-600 mt-1">Manage client projects</p>
            </Link>
            <Link
              href={`/dashboard/clients/${client.id}/content`}
              className="rounded-md border-2 border-gray-200 p-4 hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <p className="font-semibold text-gray-900">Content</p>
              <p className="text-sm text-gray-600 mt-1">View all content</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

