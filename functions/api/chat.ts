interface Env {
  AI: {
    run(
      model: string,
      input: {
        messages: { role: string; content: string }[];
        stream?: boolean;
        max_tokens?: number;
      },
    ): Promise<ReadableStream | { response: string }>;
  };
}

const SYSTEM_PROMPT = `You are OnChainLab AI, an expert Bitcoin on-chain analyst assistant.
You help users understand Bitcoin on-chain metrics and market conditions.

Rules:
- Answer ONLY about Bitcoin on-chain metrics, market analysis, and the data provided.
- Use the provided metric context to give specific, data-backed answers.
- When quoting numbers, cite the metric name and date.
- Be concise — 2-4 sentences for simple questions, more for complex analysis.
- If you don't have enough data to answer, say so honestly.
- Never provide financial advice. Always note this is analysis, not investment recommendations.
- Use plain language but show you understand the technical indicators deeply.`;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as {
      message?: string;
      context?: string;
      history?: { role: string; content: string }[];
    };

    if (!body.message || typeof body.message !== "string") {
      return new Response(JSON.stringify({ error: "Missing message" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Sanitize input
    const userMessage = body.message.slice(0, 2000);
    const dataContext = (body.context ?? "").slice(0, 8000);
    const history = (body.history ?? []).slice(-6);

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(dataContext
        ? [
            {
              role: "system",
              content: `Current metric data:\n${dataContext}`,
            },
          ]
        : []),
      ...history.map((h) => ({
        role: h.role === "user" ? "user" : "assistant",
        content: String(h.content).slice(0, 2000),
      })),
      { role: "user", content: userMessage },
    ];

    const result = await context.env.AI.run(
      "@cf/meta/llama-3.1-8b-instruct",
      {
        messages,
        stream: false,
        max_tokens: 512,
      },
    );

    const response =
      typeof result === "object" && "response" in result
        ? (result as { response: string }).response
        : "Sorry, I couldn't generate a response.";

    return new Response(JSON.stringify({ response }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
