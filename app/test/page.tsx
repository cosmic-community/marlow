const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3220'

export default function TestPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <div className="space-y-3">
        <h1 className="text-4xl">Agent door</h1>
        <p>
          The chat and this door are{' '}
          <a className="underline" href="/chat">
            Leo
          </a>
          , the Cosmic support agent. A visiting assistant reads{' '}
          <a className="underline" href="/agent.txt">
            agent.txt
          </a>{' '}
          and sends one message. It does not find that file on its own, so paste this site into the assistant.
        </p>
        <p>The house pages are what a browsing assistant can read. Leo is the agent that answers through CAP.</p>
      </div>
      <section className="space-y-2">
        <h2 className="text-2xl">From the terminal</h2>
        <pre className="overflow-x-auto rounded-lg bg-ink p-4 text-sm text-paper">{`curl -s ${origin}/agent.txt

curl -s ${origin}/cap/v1/messages \\
  -H 'content-type: application/json' \\
  -H 'CAP-Version: 1.0' \\
  -H 'CAP-From: agent:marlow-test' \\
  -d '{"message":"What can you help me with?"}'`}</pre>
      </section>
      <section className="space-y-2">
        <h2 className="text-2xl">From an MCP client</h2>
        <pre className="overflow-x-auto rounded-lg bg-ink p-4 text-sm text-paper">{`npx @conciergeprotocol/mcp
# CAP_ENDPOINT=${origin}/cap/v1/messages
# CAP_FROM=agent:marlow-test`}</pre>
      </section>
    </div>
  )
}
