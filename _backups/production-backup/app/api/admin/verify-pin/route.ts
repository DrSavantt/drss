import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { pin } = await req.json();
    
    // Get PIN from environment variable
    const adminPin = process.env.ADMIN_PIN;
    
    // If no PIN is set, deny access
    if (!adminPin) {
      return NextResponse.json({ success: false }, { status: 500 });
    }
    
    // Verify PIN (must be exactly 6 digits)
    const isValid = pin && typeof pin === 'string' && pin.length === 6 && pin === adminPin;
    
    return NextResponse.json({ success: isValid });
  } catch (error) {
    console.error('PIN verification error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
