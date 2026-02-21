import { NextResponse } from "next/server";

function maskKey(key: string | undefined): string | null {
  if (!key || key.length < 12) return null;
  const prefix = key.slice(0, 20);
  const suffix = key.slice(-5);
  return `${prefix}...${suffix}`;
}

export async function GET() {
  return NextResponse.json({
    openai: maskKey(process.env.OPENAI_API_KEY),
    anthropic: maskKey(process.env.ANTHROPIC_API_KEY),
  });
}
