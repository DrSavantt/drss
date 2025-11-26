import { NextResponse } from 'next/server';
export const dynamic = 'force-static';

export async function POST(req: Request) {
  const { pin } = await req.json();
  const ok = Boolean(process.env.ADMIN_PIN) && pin === process.env.ADMIN_PIN;
  return NextResponse.json({ success: ok });
}
