import { NextResponse } from 'next/server';

// Temporary in-memory / cache storage for Push Subscriptions
// In production with Supabase, this can also sync to a push_subscriptions table
const subscriptions: any[] = [];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { subscription, userId, userName, userAgent } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Abonnement Push invalide' }, { status: 400 });
    }

    // Check if subscription already registered
    const existingIndex = subscriptions.findIndex((s) => s.endpoint === subscription.endpoint);
    const item = {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      userId: userId || null,
      userName: userName || 'Utilisateur',
      userAgent: userAgent || 'Inconnu',
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      subscriptions[existingIndex] = item;
    } else {
      subscriptions.push(item);
    }

    return NextResponse.json({
      success: true,
      message: 'Abonnement push enregistré avec succès',
      totalSubscriptions: subscriptions.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erreur serveur' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    total: subscriptions.length,
    subscriptions: subscriptions.map((s) => ({
      endpointSnippet: s.endpoint.substring(0, 40) + '...',
      userName: s.userName,
      updatedAt: s.updatedAt,
    })),
  });
}
