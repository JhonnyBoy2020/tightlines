/* ============================================================
   Month-by-month stillwater trout guide — South-East England
   Compiled from UK stillwater sources (see SOURCES). Water
   temperatures are typical small-stillwater ranges and shift
   with the weather; use the live water estimate first.
   ============================================================ */

export const MONTH_GUIDE = [
  {
    m: 0, water: "4–6°C", headline: "Deep, slow and patient",
    biting: ["Bloodworm (midge larvae) in the silt", "Small black buzzers", "Shrimp & hoglouse", "Stockie fry"],
    flies: ["Bloodworm (red, 10–12)", "Black buzzer (14)", "Diawl Bach (12)", "Hare's Ear", "Shrimp"],
    lures: ["Orange Blob", "Black & green Booby", "Cat's Whisker", "Black Tadpole", "Humungus"],
    line: "Di-3 / Di-5, or floater with a long leader", depth: "Bottom foot", retrieve: "Static booby, or dead-slow figure-of-eight with long pauses",
    when: "11:00–15:00 — the warmest hours", tips: ["Find the deepest water; fish hold tight to the bottom.", "After a hard frost, wait for the sun to lift the margins.", "Bright, clear winter water: drop a size and go more natural."],
  },
  {
    m: 1, water: "4–7°C", headline: "Bloodworm and blobs — first big buzzers on mild spells",
    biting: ["Bloodworm", "Small black buzzers", "Shrimp & hoglouse", "First large buzzers on mild days"],
    flies: ["Bloodworm (red)", "Black buzzer with orange cheeks (12)", "Diawl Bach", "Pheasant Tail Nymph", "Shrimp"],
    lures: ["Orange Blob", "Booby (black / orange)", "Cat's Whisker", "Black Snake", "Humungus"],
    line: "Di-3 / Di-5, or slow intermediate", depth: "Bottom to mid-water", retrieve: "Slow figure-of-eight, short twitches",
    when: "Midday to mid-afternoon", tips: ["A mild south-westerly spell often brings the first buzzer hatch.", "Orange is a strong trigger in cold early-season water.", "Keep the team simple: lure on the point, nymph on the dropper."],
  },
  {
    m: 2, water: "6–8°C", headline: "Big black buzzers wake up",
    biting: ["Large black buzzers (sizes 10–12)", "Bloodworm", "Shrimp", "Early lake olive nymphs"],
    flies: ["Black buzzer (10–12, orange or red cheeks)", "Bloodworm", "Diawl Bach", "Pheasant Tail Nymph", "Hare's Ear"],
    lures: ["Cat's Whisker", "Orange Blob", "Black & green Fritz", "Booby", "Black Tadpole"],
    line: "Intermediate / Di-3; floater + 15–20ft leader on calm days", depth: "3–10ft", retrieve: "Very slow figure-of-eight; lures on steady pulls",
    when: "Late morning to afternoon", tips: ["Calm days: suspend a buzzer team static under an indicator.", "Freshly stocked fish chase lures; residents want buzzers.", "Look for fish moving in the wind lanes from midday."],
  },
  {
    m: 3, water: "8–11°C", headline: "Buzzer season builds",
    biting: ["Buzzers (black, red, olive)", "Lake olive nymphs", "Corixa (water boatmen)", "Shrimp"],
    flies: ["Black / red buzzer (12)", "Diawl Bach", "Cruncher", "Hare's Ear", "CDC Shuttlecock"],
    lures: ["Cat's Whisker", "Viva", "Orange Blob", "Booby"],
    line: "Floater or intermediate", depth: "Surface to 6ft", retrieve: "Washing line or slow figure-of-eight",
    when: "Late morning to dusk on mild days", tips: ["The first proper evening rises start on warm, still evenings.", "Try a different buzzer size before changing pattern.", "Cloudy, breezy days: fish the buzzers high in the ripple."],
  },
  {
    m: 4, water: "11–14°C", headline: "Peak buzzer month — fish the film",
    biting: ["Buzzers (olive, black, green)", "Lake olives", "Hawthorn fly (early May)", "Damsel nymphs from late May"],
    flies: ["Olive buzzer (12)", "CDC Shuttlecock", "Hopper (claret)", "Hawthorn", "Diawl Bach", "Damsel nymph"],
    lures: ["Booby (washing-line point)", "FAB", "Cat's Whisker"],
    line: "Floater + long leader; intermediate for the washing line", depth: "Top 6 inches to 4ft", retrieve: "Static or dead-slow; let the wind drift the flies",
    when: "All day under cloud; flat-calm mornings and evenings are prime", tips: ["Fish in the film? Grease the leader to the top dropper and fish an emerger.", "Hawthorn falls happen on warm, breezy days near trees.", "Wind lanes collect hatching buzzers — drift or cast into them."],
  },
  {
    m: 5, water: "14–17°C", headline: "Damsels, sedges and evening rises",
    biting: ["Damsel nymphs (migrating to the margins)", "Large red midges", "Sedges at dusk", "Daphnia blooms", "Beetles"],
    flies: ["Damsel nymph (10–12)", "Red buzzer (12)", "Hopper", "Sedge (dry, dusk)", "Shipman's Buzzer", "Cruncher"],
    lures: ["Orange / coral (for daphnia)", "Booby", "Cat's Whisker"],
    line: "Floater or intermediate; sinking line for daphnia feeders", depth: "Margins & surface; daphnia depth on bright days", retrieve: "Damsel: figure-of-eight with twitches; dries static",
    when: "Dawn and evening on bright days; all day if overcast", tips: ["Damsel nymphs swim towards reeds and margins — cast along the bank.", "Daphnia sink in bright sun and rise when it clouds over.", "The last hour of light often brings sedge-feeding fish up."],
  },
  {
    m: 6, water: "17–20°C", headline: "Heat: go early, go late, go deep",
    biting: ["Daphnia", "Large red midges", "Sedges", "Beetles & ants", "Corixa"],
    flies: ["Red / olive buzzer (deep)", "Diawl Bach", "Sedge", "Foam Beetle", "Hopper", "Damsel nymph"],
    lures: ["Orange Blob / FAB (daphnia)", "Booby on a Di-3"],
    line: "Di-3 / Di-5 in the day; floater at dawn and dusk", depth: "8–15ft+ in the heat", retrieve: "Slow figure-of-eight; hang at the end of the retrieve",
    when: "First two hours of light and last two before dark", tips: ["Above ~20°C the water holds little oxygen — play fish fast.", "Avoid catch-and-release in very warm water; fish struggle to recover.", "Fish near inflows, aerators and the deepest water."],
  },
  {
    m: 7, water: "17–20°C", headline: "Dawn and dusk — first daddies arrive",
    biting: ["Sedges", "Terrestrials (beetles, ants)", "Daphnia", "First daddy longlegs (late month)", "Early fry"],
    flies: ["Sedge", "Hopper", "Deep buzzer", "Diawl Bach", "Daddy Longlegs (late month)"],
    lures: ["Booby", "Orange Blob", "Floating Fry (late month)"],
    line: "Floater at dawn / dusk; Di-3 in the heat of the day", depth: "Surface early and late; deep midday", retrieve: "Dries static; nymphs slow",
    when: "Dawn and dusk", tips: ["After a summer storm, a cool breezy day can fire the fish up.", "Late-summer daddies get blown off grassland on breezy days.", "Bright days: long leaders, fine tippet, small naturals."],
  },
  {
    m: 8, water: "14–17°C", headline: "Daddy and fry month",
    biting: ["Daddy longlegs", "Coarse-fish fry", "Corixa", "Sedges", "Second buzzer peak (sizes 12–14)"],
    flies: ["Daddy Longlegs", "Hopper (brown / claret)", "Corixa", "Olive-brown buzzer (12–14)", "Diawl Bach"],
    lures: ["Floating Fry", "Minkie", "Humungus", "White Snake"],
    line: "Floater for daddies; intermediate for fry", depth: "Surface to 6ft", retrieve: "Daddy: static, twitch occasionally; fry: static drift or slow pulls",
    when: "All day as the water cools", tips: ["Use at least 5lb tippet with daddies — takes are savage.", "Look for fry shoals scattering and gulls picking at the surface.", "Fish the bank the wind is blowing onto after rain."],
  },
  {
    m: 9, water: "11–14°C", headline: "Fry bashers and lures",
    biting: ["Fry", "Late daddies", "Corixa", "Snails", "Buzzers"],
    flies: ["Daddy (while they last)", "Corixa", "Black buzzer (12)", "Cruncher", "Hare's Ear"],
    lures: ["Minkie / Zonker", "Humungus", "Floating Fry", "Booby", "Woolly Bugger"],
    line: "Intermediate / Di-3 for fry; faster sinkers as it cools", depth: "Margins & mid-water", retrieve: "Fry: long slow pulls, then a hang",
    when: "All day — fish feed hard before winter", tips: ["Trout move back into the margins as the water cools.", "Fish near weed beds and jetties where fry gather.", "Small waters cool faster than reservoirs and fish well early in the month."],
  },
  {
    m: 10, water: "8–10°C", headline: "Back-end lures and bugs",
    biting: ["Fry", "Shrimp & hoglouse", "Bloodworm", "Sparse buzzers"],
    flies: ["Bloodworm", "Shrimp", "Hare's Ear", "Black buzzer (14)", "Diawl Bach"],
    lures: ["Cat's Whisker", "Blob (orange / pink)", "Booby", "Minkie", "Snake"],
    line: "Intermediate / Di-3", depth: "Mid-water to bottom", retrieve: "Figure-of-eight; one-foot strip and pause",
    when: "Late morning to mid-afternoon", tips: ["Clear winter water: trout see further — fish finer.", "Try two depths at once: lure on the point, bug on the dropper.", "Short days: be on the water for the midday window."],
  },
  {
    m: 11, water: "5–7°C", headline: "Winter rules: slow and deep",
    biting: ["Bloodworm", "Shrimp & hoglouse", "Small black midges"],
    flies: ["Bloodworm", "Shrimp", "Black buzzer (14)", "Diawl Bach", "Pheasant Tail Nymph"],
    lures: ["Blob", "Booby", "Cat's Whisker", "Black Tadpole", "Humungus"],
    line: "Di-3 / Di-5, or floater fished static", depth: "Bottom foot", retrieve: "Dead slow; long pauses",
    when: "11:00–14:30", tips: ["A static booby near the bottom is the go-to on cold days.", "Mild, cloudy days with a falling barometer are the best winter days.", "Many fisheries close on frozen days — check before driving."],
  },
];

/* Natural food intensity by month (0 none … 3 peak) */
export const FOOD_CALENDAR = [
  { k: "Buzzers (midge pupae)", v: [1, 1, 2, 3, 3, 3, 2, 2, 3, 2, 1, 1] },
  { k: "Bloodworm", v: [3, 3, 2, 1, 1, 0, 0, 0, 1, 1, 2, 3] },
  { k: "Lake olives", v: [0, 0, 1, 2, 3, 2, 1, 1, 2, 1, 0, 0] },
  { k: "Hawthorn fly", v: [0, 0, 0, 1, 3, 0, 0, 0, 0, 0, 0, 0] },
  { k: "Damsel nymphs", v: [0, 0, 0, 0, 1, 3, 3, 2, 1, 0, 0, 0] },
  { k: "Sedges / caddis", v: [0, 0, 0, 0, 1, 2, 3, 3, 2, 1, 0, 0] },
  { k: "Daphnia", v: [0, 0, 0, 1, 2, 3, 3, 3, 2, 1, 0, 0] },
  { k: "Beetles & ants", v: [0, 0, 0, 0, 1, 2, 3, 3, 1, 0, 0, 0] },
  { k: "Daddy longlegs", v: [0, 0, 0, 0, 0, 0, 1, 2, 3, 2, 0, 0] },
  { k: "Fry", v: [1, 0, 0, 0, 0, 0, 1, 2, 3, 3, 2, 1] },
  { k: "Corixa", v: [1, 1, 1, 1, 0, 0, 1, 1, 2, 3, 2, 1] },
  { k: "Shrimp / hoglouse / snail", v: [3, 3, 2, 2, 1, 1, 1, 1, 1, 2, 3, 3] },
];

/* Fly glossary — what it is and how to fish it */
export const FLIES = [
  { n: "Buzzer", t: "Imitative", i: "Midge pupa rising to hatch — the core of a stillwater trout's diet", h: "Floating line, 15–20ft leader, team of 2–3; dead-slow figure-of-eight or static" },
  { n: "Bloodworm", t: "Imitative", i: "Red midge larva living in the silt", h: "Near the bottom on a long leader, near-static" },
  { n: "Diawl Bach", t: "Imitative", i: "General nymph / buzzer suggestion", h: "Any line, on a dropper; slow figure-of-eight" },
  { n: "Hare's Ear", t: "Imitative", i: "General nymph, shrimp, sedge pupa", h: "Point or dropper, slow pulls" },
  { n: "Pheasant Tail Nymph", t: "Imitative", i: "Olive and general nymphs", h: "Slow figure-of-eight, mid-water" },
  { n: "Cruncher", t: "Imitative", i: "Olive nymph / general food", h: "Dropper on a team, steady figure-of-eight" },
  { n: "Damsel nymph", t: "Imitative", i: "Damselfly nymph swimming to the margins", h: "Floater or intermediate, figure-of-eight with twitches, along the bank" },
  { n: "Corixa", t: "Imitative", i: "Water boatman", h: "Short sharp pulls in shallow water near weed" },
  { n: "Shrimp", t: "Imitative", i: "Freshwater shrimp", h: "Slow along the bottom near weed and margins" },
  { n: "CDC Shuttlecock", t: "Emerger / dry", i: "Hatching buzzer stuck in the film", h: "Static in the surface film, greased leader" },
  { n: "Shipman's Buzzer", t: "Emerger / dry", i: "Emerging midge in the film", h: "Static on a long, fine leader" },
  { n: "Hopper", t: "Dry", i: "Adult midge / terrestrial", h: "Static or slow drift in a ripple" },
  { n: "Sedge (dry)", t: "Dry", i: "Adult caddis fly", h: "Static, or skated at dusk" },
  { n: "Daddy Longlegs", t: "Dry", i: "Crane fly blown onto the water", h: "Static on 5lb+ tippet; twitch occasionally" },
  { n: "Hawthorn", t: "Dry", i: "Black terrestrial fly, early May", h: "Static near trees on breezy days" },
  { n: "Foam Beetle", t: "Dry", i: "Terrestrial beetle", h: "Static, summer ripple" },
  { n: "Floating Fry", t: "Lure / imitative", i: "Dead or dying fry", h: "Static near fry shoals; drift and wait" },
  { n: "Cat's Whisker", t: "Lure", i: "Attractor / fry", h: "Steady pulls, any depth" },
  { n: "Booby", t: "Lure", i: "Buoyant attractor", h: "Static on a sinking line and a short leader, or on the point of a washing line" },
  { n: "Blob", t: "Lure", i: "Bright attractor (also mimics daphnia)", h: "Pulled or static; orange in cold water and daphnia time" },
  { n: "FAB", t: "Lure", i: "Foam-arsed blob — buoyant attractor", h: "Washing-line point fly" },
  { n: "Minkie / Zonker", t: "Lure", i: "Fry", h: "Slow pulls then a hang; intermediate / Di-3" },
  { n: "Humungus", t: "Lure", i: "Fry / attractor", h: "Steady pulls, mid-water" },
  { n: "Snake", t: "Lure", i: "Long-tailed attractor", h: "Slow, long pulls" },
  { n: "Tadpole / Woolly Bugger", t: "Lure", i: "General attractor", h: "Figure-of-eight or strips" },
  { n: "Viva", t: "Lure", i: "Black & green attractor", h: "Steady pulls in early season" },
];

/* Pressure & weather rules of thumb */
export const PRESSURE_NOTES = [
  { k: "Falling", t: "Before a front arrives, trout often feed hard for a short spell. Be on the water as the barometer drops." },
  { k: "Low & unsettled", t: "Cloud, wind and rain keep fish confident and in the upper layers. Usually good sport." },
  { k: "Rising after rain", t: "Fish can sulk for a day while the weather clears; renewed insect activity can then switch them on." },
  { k: "Static high (≥1021 hPa)", t: "Bright, calm and stable — fish sit deeper and turn selective. Fish smaller flies, longer leaders and finer tippet." },
  { k: "A caveat", t: "Pressure works mainly through the weather it brings: light, wind, cloud and insect hatches. Treat it as one factor among several." },
];

export const SOURCES = [
  { t: "The Essential Fly — buzzer patterns & monthly midge guide", u: "https://www.theessentialfly.com/troutbuzzerfishingfliesuk.html" },
  { t: "The Essential Fly — rainbow trout seasonal tactics", u: "https://www.theessentialfly.com/rainbow-trout-fly-fishing.html" },
  { t: "The Essential Fly — UK hatch guide", u: "https://www.theessentialfly.com/blog/a-brief-guide-to-trout-fly-hatches.html" },
  { t: "The Friendly Fisherman — seasonal stillwater tactics", u: "https://www.thefriendlyfisherman.co.uk/articles/fly-fishing-technique/starting_stillwater_trout_fishing2.asp" },
  { t: "Flies Online — autumn fly fishing", u: "https://www.fliesonline.co.uk/articles/82-top-tips-autumn-fly-fishing-species-and-patterns/" },
  { t: "Guide Flyfishing — winter stillwater tactics", u: "https://www.guideflyfishing.co.uk/winter-stillwater-trout-fishing-tactics/" },
  { t: "The Fly Dresser — barometric pressure and trout", u: "https://theflydresser.com/blog/barometric-pressure-trout-fishing/" },
  { t: "Trout Resource — the counter-view on pressure", u: "https://www.troutresource.com/2022/02/12/why-barometric-pressure-is-not-a-useful-guide-for-trout-fishing/" },
];
