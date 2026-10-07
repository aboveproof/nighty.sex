module.exports = async function handler(req, res) {
  const inc = req.query ? req.query.inc : null;
  const action = inc === '1' ? 'hit' : 'get';
  const url = `https://abacus.jasoncameron.dev/${action}/nighty.sex/views`;

  try {
    const upstream = await fetch(url, {
      headers: { Accept: 'application/json' }
    });

    if (upstream.ok) {
      const data = await upstream.json();
      const count = Number(data.value) || 0;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      return res.status(200).json({ views: count });
    }

    // If key not yet created, trigger hit to initialize
    if (upstream.status === 404 && action === 'get') {
      const initRes = await fetch('https://abacus.jasoncameron.dev/hit/nighty.sex/views');
      const initData = await initRes.json();
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      return res.status(200).json({ views: Number(initData.value) || 1 });
    }

    throw new Error(`Upstream returned ${upstream.status}`);
  } catch (err) {
    console.error('Views handler error:', err);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res.status(200).json({ views: 1 });
  }
};
