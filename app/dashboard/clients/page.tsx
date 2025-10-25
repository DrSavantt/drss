import { getClients } from '@/app/actions/clients'
import Link from 'next/link'

export default async function ClientsPage() {
  const clients = await getClients()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Clients</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Manage your client relationships
          </p>
        </div>
        <Link
          href="/dashboard/clients/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 text-center"
        >
          + New Client
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900">No clients yet</h3>
          <p className="mt-2 text-sm text-gray-600">
            Get started by creating your first client.
          </p>
          <Link
            href="/dashboard/clients/new"
            className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            + New Client
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/dashboard/clients/${client.id}`}
              className="group rounded-lg border border-gray-200 bg-white p-6 hover:border-blue-500 hover:shadow-md transition-all"
            >
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                {client.name}
              </h3>
              {client.email && (
                <p className="mt-2 text-sm text-gray-600">{client.email}</p>
              )}
              {client.website && (
                <p className="mt-1 text-sm text-gray-500">{client.website}</p>
              )}
              <p className="mt-4 text-xs text-gray-400">
                Created {new Date(client.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

