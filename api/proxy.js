export default async function handler(req, res) {
  const targetUrl = 'https://calendlydocker.com/csr.php';

  try {
    const palladiumRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(req.body),
    });

    const text = await palladiumRes.text();

    res.status(200).send(text);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy failed' });
  }
}
