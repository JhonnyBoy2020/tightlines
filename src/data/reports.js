// Curated sources. checkedAt is our review date, never a claimed stocking date.
export const REPORTS = [
  { id: "hanningfield-closure-20261007", venueId: "hanningfield", type: "closure", title: "Temporary closure: low water levels", text: "The operator's general fishing page says fishing at Hanningfield is temporarily closed until further notice. Its venue page still lists normal season dates. Confirm reopening with the operator before travelling.", source: "Waterside Parks", url: "https://www.watersideparksuk.com/fishing/", checkedAt: "2026-10-07", eventDate: null },
  { id: "hanningfield-plan-2026", venueId: "hanningfield", type: "seasonal plan", title: "Seasonal stocking plan, not a recent stocking", text: "The operator describes a seasonal minimum of 51,000 rainbow trout plus 1,000 homegrown specimens. This is not evidence of an individual stocking event or current fishing availability.", source: "Waterside Parks", url: "https://www.watersideparksuk.com/park/hanningfield/fishing/", checkedAt: "2026-10-07", eventDate: null },
];
export const closureFor = id => REPORTS.find(r => r.venueId === id && r.type === "closure");
