import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "@/services/api";
import { errorMessage } from "@/services/storefront";
import { useAuthStore } from "@/store/auth.store";
import { SEOHead } from "@/components/common/SEOHead";

function Conversation({ id }: { id: string }) {
  const user = useAuthStore((s) => s.user);
  const client = useQueryClient();
  const [body, setBody] = useState("");
  const messages = useQuery({
    queryKey: ["chat", "messages", id],
    queryFn: () => chatApi.getMessages(id),
    refetchInterval: 15000,
  });
  const send = useMutation({
    mutationFn: () => chatApi.sendMessage({ threadId: id, body: body.trim() }),
    onSuccess: () => {
      setBody("");
      void client.invalidateQueries({ queryKey: ["chat", "messages", id] });
    },
  });
  return (
    <section className="mt-6 border rounded-xl p-5">
      <h2 className="text-xl font-bold mb-4">Conversation</h2>
      {messages.isPending ? (
        <p>Loading messages…</p>
      ) : messages.isError ? (
        <p role="alert">
          {errorMessage(messages.error)}{" "}
          <button className="text-link" onClick={() => messages.refetch()}>
            Try again
          </button>
        </p>
      ) : (
        <ol className="space-y-4" aria-live="polite">
          {messages.data.map((message) => (
            <li key={message.id} className="bg-surface rounded-lg p-4">
              <p className="text-xs font-bold mb-2">
                {message.senderId === user?.id
                  ? "You"
                  : message.sender?.firstName || "Team Core Sports Wear"}
              </p>
              <p className="whitespace-pre-wrap break-words">{message.body}</p>
            </li>
          ))}
        </ol>
      )}
      <form
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          send.mutate();
        }}
      >
        <label>
          <span className="field-label">Your message</span>
          <textarea
            className="field"
            rows={4}
            maxLength={5000}
            required
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </label>
        <button
          className="action action-red mt-4"
          disabled={!body.trim() || send.isPending || !messages.isSuccess}
        >
          {send.isPending ? "Sending…" : "Send message"}
        </button>
        {send.isError && (
          <p className="form-error" role="alert">
            {errorMessage(send.error)}
          </p>
        )}
      </form>
    </section>
  );
}
export default function ChatPage() {
  const [params, setParams] = useSearchParams();
  const id = params.get("thread") || "";
  const threads = useQuery({
    queryKey: ["chat", "threads"],
    queryFn: () => chatApi.listThreads(),
  });
  return (
    <div>
      <SEOHead title="Your conversations" />
      <h1 className="text-2xl font-bold mb-3">Your conversations</h1>
      <p className="mb-6">
        Continue an existing conversation here. For a new enquiry,{" "}
        <Link className="text-link" to="/contact">
          contact our team
        </Link>
        .
      </p>
      {threads.isPending ? (
        <p>Loading conversations…</p>
      ) : threads.isError ? (
        <p role="alert">
          {errorMessage(threads.error)}{" "}
          <button className="text-link" onClick={() => threads.refetch()}>
            Try again
          </button>
        </p>
      ) : threads.data.length ? (
        <ul className="space-y-3">
          {threads.data.map((thread) => (
            <li key={thread.id}>
              <button
                className="w-full text-left p-4 border rounded-lg hover:border-primary"
                aria-pressed={id === thread.id}
                onClick={() => setParams({ thread: thread.id })}
              >
                <span className="font-bold">
                  {thread.subject || "Conversation"}
                </span>
                <span className="ml-3 text-sm">{thread.status}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No conversations yet.</p>
      )}
      {id && threads.data?.some((thread) => thread.id === id) && (
        <Conversation key={id} id={id} />
      )}
    </div>
  );
}
