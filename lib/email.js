const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export async function mail(to, subject, body, url, label) {
  const html = `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto"><h2>4 man comics</h2>${body}<p><a href="${url}" style="display:inline-block;background:#ff5a3c;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold">${label}</a></p></div>`;
  if (!process.env.RESEND_API_KEY) return console.log('[email skipped, no RESEND_API_KEY]', to, subject, url);
  try {
    const r = await fetch('https://api.resend.com/emails', { method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html }) });
    if (!r.ok) console.error('Resend error', await r.text());
  } catch (e) { console.error('Email failed', e); }
}
export const turnMail = (to, url) => mail(to, "It's your turn to draw!", '<p>A friend passed you a comic panel. You only get to see the panel before yours. Good luck!</p>', url, 'Start drawing');
export const doneMail = (to, title, url) => mail(to, `Your comic is finished: ${title || 'Untitled comic'}`, `<p><b>${esc(title || 'Untitled comic')}</b> is done. See how it turned out!</p>`, url, 'View the comic');
export const endedMail = (to, reason, url) => mail(to, 'A comic ended early', `<p>This comic ended early because ${esc(reason)}. Here is what was finished.</p>`, url, 'View the comic');
export const stalledMail = (to, url) => mail(to, 'Your comic is stalled', '<p>One of your comics has been waiting on the same player for over a week. You can resend their link, skip them, or cancel it.</p>', url, 'Open my comics');
export const friendMail = (to, name, url) => mail(to, `${name} wants to be friends on 4 man comics`, `<p><b>${esc(name)}</b> sent you a friend request. Friends can add each other to comics so turns arrive automatically.</p>`, url, 'View request');
