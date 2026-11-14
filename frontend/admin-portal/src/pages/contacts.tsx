import { useQuery } from '@tanstack/react-query'
import api from '@/config/api'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
type Contact = { id: string; name: string; email: string; subject: string; message: string; created_at: string }
export default function ContactsPage() {
  const query = useQuery({
    queryKey: ['storefront-contacts'],
    queryFn: () => api.get<Contact[]>('/storefront/contacts').then((r) => r.data),
  })
  return (
    <div className="space-y-6">
      <PageHeader
        title="Website enquiries"
        description="The latest 100 contact submissions from the Team Core Sports Wear website."
      />
      <Button variant="outline" onClick={() => query.refetch()}>
        Refresh
      </Button>
      {query.isPending ? (
        <p>Loading enquiries…</p>
      ) : query.isError ? (
        <p role="alert">Could not load enquiries. Please try again.</p>
      ) : !query.data?.length ? (
        <p>No website enquiries yet.</p>
      ) : (
        query.data.map((c) => (
          <article key={c.id} className="rounded-xl border p-5 space-y-3">
            <div className="flex flex-wrap justify-between gap-3">
              <h2 className="font-bold">{c.subject}</h2>
              <time>{new Date(c.created_at).toLocaleString()}</time>
            </div>
            <p>
              {c.name} ·{' '}
              <a className="underline" href={'mailto:' + encodeURIComponent(c.email)}>
                {c.email}
              </a>
            </p>
            <p className="whitespace-pre-wrap break-words">{c.message}</p>
            <p className="text-xs text-muted-foreground">Reference: {c.id}</p>
          </article>
        ))
      )}
    </div>
  )
}
