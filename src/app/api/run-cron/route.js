
export async function GET() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cron/process-stream-queue`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
    });

    const data = await res.text();

    return new Response(data, { status: res.status });
  } catch (e) {
    return new Response("Internal Error", { status: 500 });
  }
}
