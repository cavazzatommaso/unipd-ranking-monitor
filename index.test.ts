import { test, expect } from "bun:test";
import { extractRanking } from "./index";

// Trimmed from real uel.unipd.it markup (MIDRU pending, PSCO published 2026-10).
const page = (body: string) =>
  `<h2><button>Graduatoria generale di merito </button> </h2> <div id="x" class="accordion-collapse collapse"> <div class="accordion-body">${body}</div></div>`;

test("pending section has no links", () => {
  expect(extractRanking(page("<p>La graduatoria … sarà resa disponibile in questa sezione …</p>"))?.links).toEqual([]);
});

test("published section yields the PDF link", () => {
  const r = extractRanking(page('<p>La graduatoria generale di merito per l’a.a. 2026/27 è disponibile al seguente <a href="https://uel.unipd.it/content/wp-content/uploads/2026/10/Graduatoria_generale_PSSCO-2.pdf">link</a>.</p>'));
  expect(r?.links).toEqual(["https://uel.unipd.it/content/wp-content/uploads/2026/10/Graduatoria_generale_PSSCO-2.pdf"]);
});

test("missing section returns null", () => {
  expect(extractRanking("<html></html>")).toBeNull();
});
