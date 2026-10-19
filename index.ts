const PAGES = [
  "https://uel.unipd.it/master-e-corsi/midru-valutazione-formazione-e-sviluppo-delle-risorse-umane/",
  "https://uel.unipd.it/master-e-corsi/psap-psicopatologia-dellapprendimento/",
];
const INTERVAL_MIN = Number(process.env.INTERVAL_MINUTES ?? 10);
const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;
const STATE = Bun.file("state.json");

// The "Graduatoria generale di merito" accordion body: placeholder text until published,
// then a sentence with a link to Graduatoria_generale_XXX.pdf.
export function extractRanking(html: string) {
  const body = html.match(/graduatoria generale di merito\s*<\/button>[\s\S]*?accordion-body">([\s\S]*?)<\/div>/i)?.[1];
  if (body === undefined) return null;
  const links = [...body.matchAll(/href="([^"]+)"/g)].map(m => m[1]!);
  const text = body.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&#8217;/g, "’").replace(/\s+/g, " ").trim();
  return { text, links };
}

async function notify(msg: string) {
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: msg }),
  });
  // throw so the caller skips saving state and retries next run
  if (!res.ok) throw new Error(`telegram ${res.status}: ${await res.text()}`);
}

async function check() {
  const state: Record<string, string> = (await STATE.exists()) ? await STATE.json() : {};
  for (const url of PAGES) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const r = extractRanking(await res.text());
      // ponytail: section missing usually means the page layout changed, worth a ping
      const key = r ? r.text + r.links.join() : "SECTION NOT FOUND";
      if (state[url] === key) continue;
      const published = !!r?.links.length;
      await notify(
        `${published ? "🎉 Graduatoria pubblicata!" : "ℹ️ Sezione graduatoria cambiata"}\n${url}\n\n${r?.text ?? "Sezione 'Graduatoria generale di merito' non trovata"}\n${r?.links.join("\n") ?? ""}`,
      );
      state[url] = key;
      console.log(new Date().toISOString(), "changed:", url);
    } catch (e) {
      console.error(new Date().toISOString(), url, e); // ponytail: transient errors just retry next tick
    }
  }
  await Bun.write(STATE, JSON.stringify(state, null, 2));
}

if (import.meta.main) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) throw new Error("Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env");
  await check();
  // --once: single check, used by the GitHub Actions cron
  if (!process.argv.includes("--once")) {
    setInterval(check, INTERVAL_MIN * 60_000);
    console.log(`checking every ${INTERVAL_MIN} min`);
  }
}
