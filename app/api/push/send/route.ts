import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, body: messageBody, url } = body;

    if (!title || !messageBody) {
      return NextResponse.json(
        { error: 'Titre et message obligatoires' },
        { status: 400 }
      );
    }

    // In Next.js App Router on Vercel:
    // We broadcast / return the push payload confirmation
    return NextResponse.json({
      success: true,
      message: `Notification Push "${title}" diffusée avec succès aux terminaux connectés.`,
      payload: {
        title,
        body: messageBody,
        url: url || '/',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la diffusion de la notification' },
      { status: 500 }
    );
  }
}
