import type { ContentPack, Concern, TraditionMeta } from "../types";

/* ────────────────────────────────────────────────────────────────────────────
   CONTENT PACK: "integrative"  —  the flagship, whole-person pack.

   Compliance rules baked into every entry (non-negotiable):
     • Worldview / education only. How each tradition THINKS about the body.
     • Never names a herb, formula, supplement, remedy or dosage.
     • Never claims any approach treats, cures, fixes or works.
     • Never ranks one tradition above another — equal, respectful framing.
     • Never diagnoses. Every panel routes to a qualified, registered human.

   Because this content is hand-written and static, it can never "hallucinate"
   a medical claim — which is exactly the safe-by-design positioning.

   To add a new vertical (e.g. "musculoskeletal", "women's health"), copy this
   file, swap the concerns, and register it in ./index.ts. No app changes.
   ──────────────────────────────────────────────────────────────────────────── */

const traditions: TraditionMeta[] = [
  { key: "western", label: "Conventional / Western medicine", short: "Western", tint: "west" },
  { key: "tcm", label: "Traditional Chinese Medicine", short: "TCM", tint: "tcm" },
  { key: "ayurveda", label: "Ayurveda", short: "Ayurveda", tint: "ayur" },
];

const concerns: Concern[] = [
  {
    id: "low-energy-sleep",
    label: "Low energy & poor sleep",
    patientPhrase: "persistent low energy and poor sleep",
    category: "Energy & sleep",
    blurb: "Tired through the day, but not resting well at night.",
    lenses: {
      western: {
        oneLiner: "Looks for measurable causes across the body's systems.",
        worldview:
          "Conventional medicine treats fatigue and disrupted sleep as signals that one or more body systems may be under strain. It reasons from physiology — thyroid, iron and blood counts, blood sugar, hormones, mood and sleep quality — and from evidence gathered through history, examination and tests. “Evidence-based” here means leaning on findings studied across large groups of people.",
        practitionerLooksAt:
          "A doctor typically asks how long it has been going on, your sleep pattern, mood, diet and stress, and may consider blood tests or a medication review to understand what's contributing.",
        whoYouSee:
          "A GP first, who may refer to a specialist (such as an endocrinologist or a sleep service) if something specific needs closer attention.",
      },
      tcm: {
        oneLiner: "Reads it as a pattern of energy and balance.",
        worldview:
          "Traditional Chinese Medicine understands the body as a system of flowing energy (qi) and balancing forces (yin and yang). Persistent tiredness with poor sleep is often described in terms of depleted or “stuck” energy and an imbalance between activity and rest. Names like the Spleen, Heart and Kidney are used as functional concepts — patterns of how the body behaves — rather than the organs alone.",
        practitionerLooksAt:
          "A TCM practitioner gathers a detailed picture through questions and by observing things like the tongue and pulse, to identify the individual “pattern” they understand to be present.",
        whoYouSee:
          "A practitioner registered with a recognised body (for acupuncture, a member of the British Acupuncture Council), who tailors their approach to you.",
      },
      ayurveda: {
        oneLiner: "Frames it through constitution and balance.",
        worldview:
          "Ayurveda is an ancient system that understands health as balance between three functional energies — vata, pitta and kapha (the doshas). Low energy and unsettled sleep are often interpreted as a disturbance of this balance, shaped by your individual constitution (prakriti), daily rhythm and digestion (described as “agni”, a kind of digestive fire). It is a worldview about patterns and routine, not a set of fixes.",
        practitionerLooksAt:
          "An Ayurvedic practitioner explores your constitution, routine, digestion and the qualities of your sleep to understand where balance may have shifted.",
        whoYouSee:
          "A qualified, registered Ayurvedic practitioner who works with your whole picture and lifestyle.",
      },
    },
  },
  {
    id: "stress-anxiety",
    label: "Stress, anxiety & overwhelm",
    patientPhrase: "ongoing stress, anxiety and feeling overwhelmed",
    category: "Mind & stress",
    blurb: "A racing mind, tension, or feeling constantly “on”.",
    lenses: {
      western: {
        oneLiner: "Considers mind and body together, with evidence-based support.",
        worldview:
          "Conventional medicine sees stress and anxiety as real experiences with both psychological and physical sides — affecting sleep, concentration, the gut and the body's stress response. It draws on talking therapies and, where appropriate, other support, guided by what research shows tends to help.",
        practitionerLooksAt:
          "A GP or therapist explores how you're feeling, for how long, how it affects daily life, and whether anything physical might be involved, to understand the fuller picture.",
        whoYouSee:
          "A GP, or a registered talking-therapy practitioner (such as a counsellor or psychologist), who can discuss options with you.",
      },
      tcm: {
        oneLiner: "Sees it as the movement and balance of energy.",
        worldview:
          "In Traditional Chinese Medicine, stress and a busy mind are often described as energy that has become “stuck” or out of balance — frequently linked to the Liver's role in the smooth flow of qi, and the Heart's connection to the mind (shen). These are functional concepts about how body and emotions move together.",
        practitionerLooksAt:
          "A TCM practitioner builds a detailed individual picture — including questions, tongue and pulse — to recognise the pattern they understand to be present.",
        whoYouSee: "A practitioner registered with a recognised body, who tailors their approach to you.",
      },
      ayurveda: {
        oneLiner: "Relates it to vata and daily rhythm.",
        worldview:
          "Ayurveda often relates a restless, overwhelmed mind to an excess of vata — the energy associated with movement and change — and to disruption of natural daily and seasonal rhythms. Balance is understood to come from steadiness, routine and grounding, interpreted through your individual constitution.",
        practitionerLooksAt:
          "An Ayurvedic practitioner looks at your constitution, routine, sleep and digestion to understand where things may have become unsettled.",
        whoYouSee: "A qualified, registered Ayurvedic practitioner who considers your whole lifestyle.",
      },
    },
  },
  {
    id: "digestion",
    label: "Digestive discomfort",
    patientPhrase: "ongoing digestive discomfort such as bloating and irregularity",
    category: "Digestion",
    blurb: "Bloating, irregularity, or a gut that feels “off”.",
    lenses: {
      western: {
        oneLiner: "Investigates the gut and its many influences.",
        worldview:
          "Conventional medicine approaches digestive symptoms by considering the gut itself alongside diet, stress and how the bowel functions. It uses history, examination and — where indicated — tests to rule things in or out, guided by evidence about what tends to help.",
        practitionerLooksAt:
          "A doctor asks about your symptoms, diet, patterns and triggers, and may suggest simple investigations to understand what's going on.",
        whoYouSee: "A GP first, who may involve a dietitian or gastroenterologist if needed.",
      },
      tcm: {
        oneLiner: "Centres on the Spleen and Stomach as energy concepts.",
        worldview:
          "Traditional Chinese Medicine places digestion close to the centre of health, describing it largely through the Spleen and Stomach as functional systems that “transform” food into energy. Bloating and irregularity are often read as a sign that this transforming function is out of balance.",
        practitionerLooksAt:
          "A TCM practitioner forms an individual picture through detailed questions and observation of tongue and pulse to identify the pattern.",
        whoYouSee: "A practitioner registered with a recognised body.",
      },
      ayurveda: {
        oneLiner: "Looks to “agni”, the digestive fire.",
        worldview:
          "Digestion is central in Ayurveda, described through “agni” — a digestive-fire concept — and the balance of the doshas. Discomfort is often interpreted as agni being too weak, too strong or irregular, shaped by routine, the qualities of food, and constitution.",
        practitionerLooksAt:
          "An Ayurvedic practitioner explores your eating routine, digestion and constitution to understand where balance may have shifted.",
        whoYouSee: "A qualified, registered Ayurvedic practitioner.",
      },
    },
  },
  {
    id: "aches-pains",
    label: "Persistent aches & pains",
    patientPhrase: "persistent aches and pains in the body",
    category: "Musculoskeletal",
    blurb: "Nagging muscle or joint pain that won't settle.",
    lenses: {
      western: {
        oneLiner: "Examines structure, movement and inflammation.",
        worldview:
          "Conventional medicine looks at persistent aches through the musculoskeletal system — muscles, joints, nerves and posture — and the role of inflammation, activity and past injury, using examination and sometimes imaging, informed by evidence.",
        practitionerLooksAt:
          "A doctor or physiotherapist assesses where it hurts, what movements affect it, and how it limits you, to understand the cause.",
        whoYouSee:
          "A GP or a registered physiotherapist; sometimes a specialist for specific joints or nerves.",
      },
      tcm: {
        oneLiner: "Describes blocked flow in the body's channels.",
        worldview:
          "Traditional Chinese Medicine often describes pain in terms of qi and blood not flowing smoothly through the body's channels (meridians) — captured in the idea that free flow is comfort and obstruction is pain. Influences like cold, damp and tension are described as affecting that flow.",
        practitionerLooksAt:
          "A TCM practitioner maps your individual pattern through questions and observation of tongue and pulse.",
        whoYouSee:
          "A practitioner registered with a recognised body (for acupuncture, the British Acupuncture Council).",
      },
      ayurveda: {
        oneLiner: "Often relates discomfort to vata and balance.",
        worldview:
          "Ayurveda frequently relates aches and stiffness to an excess of vata — the energy of movement — and to the balance of the doshas, interpreted through your constitution, routine and the qualities (such as cold or dryness) thought to influence the body.",
        practitionerLooksAt:
          "An Ayurvedic practitioner considers your constitution, routine and the nature of the discomfort.",
        whoYouSee: "A qualified, registered Ayurvedic practitioner.",
      },
    },
  },
  {
    id: "hormonal",
    label: "Hormonal & menstrual changes",
    patientPhrase: "hormonal or menstrual changes",
    category: "Hormonal & cyclical",
    blurb: "Cycle changes, or shifts that feel hormonal.",
    lenses: {
      western: {
        oneLiner: "Looks at the endocrine system and the cycle.",
        worldview:
          "Conventional medicine understands hormonal and menstrual changes through the endocrine system and the menstrual cycle, considering life stage, patterns and overall health, using history and — where helpful — tests, guided by evidence.",
        practitionerLooksAt:
          "A doctor asks about your cycle, its timing, and how symptoms affect you, and may consider tests to understand the picture.",
        whoYouSee: "A GP, who may refer to a gynaecologist or endocrinologist where appropriate.",
      },
      tcm: {
        oneLiner: "Reads cycles through balance and flow.",
        worldview:
          "Traditional Chinese Medicine understands cyclical and hormonal changes through the balance of yin and yang and the smooth flow of qi and blood, often referencing the Kidney and Liver as functional concepts tied to development, rhythm and reproduction.",
        practitionerLooksAt:
          "A TCM practitioner builds an individual picture, including the qualities of the cycle, through questions and observation.",
        whoYouSee: "A practitioner registered with a recognised body.",
      },
      ayurveda: {
        oneLiner: "Interprets cycles through the doshas.",
        worldview:
          "Ayurveda interprets cyclical and hormonal changes through the rhythm of the doshas — different phases of the cycle and of life being associated with vata, pitta or kapha qualities — understood in the context of your constitution and routine.",
        practitionerLooksAt: "An Ayurvedic practitioner considers your constitution, cycle and daily rhythm.",
        whoYouSee: "A qualified, registered Ayurvedic practitioner.",
      },
    },
  },
  {
    id: "headaches",
    label: "Headaches & migraines",
    patientPhrase: "recurring headaches or migraines",
    category: "Head & nervous system",
    blurb: "Frequent headaches or migraine episodes.",
    lenses: {
      western: {
        oneLiner: "Identifies the headache type and its triggers.",
        worldview:
          "Conventional medicine approaches recurring headaches by distinguishing different types, looking at triggers, sleep, hydration, posture and stress, and watching for any features that need closer attention — guided by evidence about what helps.",
        practitionerLooksAt:
          "A doctor asks about the pattern, location, triggers and any warning features, to understand the type and what's contributing.",
        whoYouSee: "A GP first, who may refer to a neurologist for certain patterns.",
      },
      tcm: {
        oneLiner: "Locates patterns of flow and balance.",
        worldview:
          "Traditional Chinese Medicine often interprets headaches by their location and quality, relating them to the flow of qi and blood and to functional concepts such as the Liver, and to influences like tension, heat or damp.",
        practitionerLooksAt:
          "A TCM practitioner identifies the individual pattern through detailed questions and observation of tongue and pulse.",
        whoYouSee: "A practitioner registered with a recognised body.",
      },
      ayurveda: {
        oneLiner: "Relates headaches to dosha balance.",
        worldview:
          "Ayurveda often relates headaches to an imbalance among the doshas — for example heat-related (pitta), tension or dryness (vata), or heaviness (kapha) qualities — interpreted through your constitution, routine and digestion.",
        practitionerLooksAt:
          "An Ayurvedic practitioner considers your constitution, routine and the nature of the headaches.",
        whoYouSee: "A qualified, registered Ayurvedic practitioner.",
      },
    },
  },
  {
    id: "low-mood",
    label: "Low mood & motivation",
    patientPhrase: "low mood and low motivation",
    category: "Mind & stress",
    blurb: "Flat, low, or struggling to find motivation.",
    lenses: {
      western: {
        oneLiner: "Treats mood as real, with evidence-based support.",
        worldview:
          "Conventional medicine recognises low mood as a genuine health experience with psychological, social and physical dimensions, drawing on talking therapies and other support shown by research to help, while also considering physical contributors such as sleep or thyroid.",
        practitionerLooksAt:
          "A GP or therapist explores how you've been feeling, for how long, and how it affects daily life, sometimes alongside simple physical checks.",
        whoYouSee: "A GP or a registered talking-therapy practitioner.",
      },
      tcm: {
        oneLiner: "Sees mood through energy and the mind (shen).",
        worldview:
          "Traditional Chinese Medicine often relates low mood to the smooth flow of qi and to the Heart's connection with the mind (shen), describing emotions and energy as moving together rather than separately.",
        practitionerLooksAt:
          "A TCM practitioner forms an individual picture through questions and observation to recognise the pattern.",
        whoYouSee: "A practitioner registered with a recognised body.",
      },
      ayurveda: {
        oneLiner: "Links mood to balance and routine.",
        worldview:
          "Ayurveda often associates low mood and heaviness with a kapha quality, or with disrupted rhythm and digestion, understood through your individual constitution and daily routine.",
        practitionerLooksAt: "An Ayurvedic practitioner looks at your routine, sleep, digestion and constitution.",
        whoYouSee: "A qualified, registered Ayurvedic practitioner.",
      },
    },
  },
  {
    id: "immune",
    label: "Frequent colds & low resilience",
    patientPhrase: "getting ill often and feeling low in resilience",
    category: "Immunity & resilience",
    blurb: "Catching everything going, slow to bounce back.",
    lenses: {
      western: {
        oneLiner: "Looks at overall health and what supports immunity.",
        worldview:
          "Conventional medicine considers frequent minor illness in the context of sleep, stress, nutrition and overall health, looking for anything specific where indicated, and leaning on evidence about what supports normal immune function.",
        practitionerLooksAt:
          "A doctor asks about how often you're unwell, your sleep, stress and lifestyle, to understand what's contributing.",
        whoYouSee: "A GP, who may investigate further if a pattern needs it.",
      },
      tcm: {
        oneLiner: "Describes a protective energy at the surface.",
        worldview:
          "Traditional Chinese Medicine describes resilience partly through “wei qi” — a protective energy understood to defend the body's surface — and links recurrent illness to the balance of qi and to the Spleen and Lung as functional concepts.",
        practitionerLooksAt:
          "A TCM practitioner builds an individual picture through questions and observation of tongue and pulse.",
        whoYouSee: "A practitioner registered with a recognised body.",
      },
      ayurveda: {
        oneLiner: "Connects resilience to “ojas” and digestion.",
        worldview:
          "Ayurveda relates resilience to a concept called “ojas” — understood as a vital essence supported by good digestion (agni), rest and routine — and interprets frequent illness through the balance of the doshas and your constitution.",
        practitionerLooksAt:
          "An Ayurvedic practitioner considers your digestion, routine, rest and constitution.",
        whoYouSee: "A qualified, registered Ayurvedic practitioner.",
      },
    },
  },
  {
    id: "something-else",
    label: "Something else",
    patientPhrase: "something else I'd like to understand",
    category: "General",
    blurb: "Describe it in your own words — we'll still show you each perspective.",
    lenses: {
      western: {
        oneLiner: "Starts from physiology and evidence.",
        worldview:
          "Conventional (Western) medicine understands the body through its physical systems and processes, and builds its approach on evidence — findings tested across large groups of people. It uses your history, examination and, where helpful, tests to understand what's happening.",
        practitionerLooksAt:
          "A doctor gathers your story and any relevant signs to understand the cause and what tends to help.",
        whoYouSee: "A GP first, who can refer on to a specialist when needed.",
      },
      tcm: {
        oneLiner: "Reads the body as flowing energy in balance.",
        worldview:
          "Traditional Chinese Medicine understands health as the smooth flow and balance of energy (qi) and the forces of yin and yang, using functional concepts — like organ-systems and patterns — to describe how the body behaves as a whole.",
        practitionerLooksAt:
          "A TCM practitioner builds an individual picture through detailed questions and observation of tongue and pulse.",
        whoYouSee: "A practitioner registered with a recognised body.",
      },
      ayurveda: {
        oneLiner: "Understands health as balance of the doshas.",
        worldview:
          "Ayurveda understands health as a balance between three functional energies — vata, pitta and kapha — shaped by your individual constitution, digestion and daily rhythm. It is a worldview about patterns and routine.",
        practitionerLooksAt: "An Ayurvedic practitioner considers your constitution, routine and digestion.",
        whoYouSee: "A qualified, registered Ayurvedic practitioner.",
      },
    },
  },
];

export const integrativePack: ContentPack = {
  id: "integrative",
  label: "Integrative & whole-person",
  description:
    "The flagship pack: nine everyday concerns, each seen through Western, Chinese and Ayurvedic lenses.",
  traditions,
  concerns,
};
