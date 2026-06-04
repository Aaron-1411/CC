import type { ContentPack, Concern, TraditionMeta } from "../types";

/* ────────────────────────────────────────────────────────────────────────────
   CONTENT PACK: "musculoskeletal"  —  a second vertical that PROVES the seam.

   It deliberately uses a DIFFERENT set of traditions from the integrative pack
   (Physiotherapy, Osteopathy, Acupuncture/TCM), with their own tints, concerns
   and reviewer — and yet renders with zero changes to any page or component.
   Point clinicConfig.contentPackId at "musculoskeletal" to ship a back-and-joint
   clinic instead of a whole-person one.

   Same non-negotiable compliance rules as every pack:
     • Worldview / education only — how each tradition THINKS about the body.
     • Never names a treatment, technique-as-cure, supplement or dosage.
     • Never claims any approach treats, cures, fixes or works.
     • Never ranks one tradition above another — equal, respectful framing.
     • Never diagnoses. Every panel routes to a qualified, registered human.
   ──────────────────────────────────────────────────────────────────────────── */

const traditions: TraditionMeta[] = [
  {
    key: "physio",
    label: "Physiotherapy & conventional care",
    short: "Physio",
    tint: "205 44% 44%",
    whatToExpect:
      "Physiotherapy may follow a GP referral or self-referral; NHS physio is free, private is paid and often 30–45 minutes. Expect questions about the problem and how it limits you, a movement assessment, and a plan you take an active part in.",
    evidenceAndRegulation:
      "Physiotherapists are regulated by the Health and Care Professions Council (HCPC) and doctors by the GMC. Care is guided by national guidance and research — ask what the current evidence suggests for your situation.",
  },
  {
    key: "osteopathy",
    label: "Osteopathy",
    short: "Osteopathy",
    tint: "158 34% 39%",
    whatToExpect:
      "A first osteopathy appointment is usually 45–60 minutes and privately paid. Expect a detailed history, a physical and movement assessment, and a discussion of what the osteopath observes about how your body moves.",
    evidenceAndRegulation:
      "Osteopaths are statutorily regulated in the UK — by law they must be registered with the General Osteopathic Council (GOsC). The evidence base varies by use; a registered osteopath can discuss it and refer you on where appropriate.",
  },
  {
    key: "tcm-acu",
    label: "Acupuncture & Traditional Chinese Medicine",
    short: "Acupuncture",
    tint: "18 55% 48%",
    whatToExpect:
      "A first acupuncture/TCM consultation is often 60–90 minutes and privately paid. Expect detailed questions and observation, such as tongue and pulse, to build an individual picture.",
    evidenceAndRegulation:
      "Acupuncture and TCM are voluntarily self-regulated in the UK — look for British Acupuncture Council membership. The evidence base varies by use; a registered practitioner can discuss it honestly and tell you when to see your GP.",
  },
];

const concerns: Concern[] = [
  {
    id: "low-back-pain",
    label: "Low back pain",
    patientPhrase: "ongoing low back pain",
    category: "Spine",
    blurb: "An aching, stiff or sore lower back.",
    commonGround: [
      "Staying gently active, rather than resting completely, is encouraged across approaches.",
      "Sleep, stress and how you load your back through the day all matter.",
      "Most back pain eases with time, and understanding it reduces fear and helps recovery.",
    ],
    redFlags: [
      "Numbness around the saddle/groin area, or loss of bladder or bowel control — this is an emergency: call 999.",
      "Leg weakness or numbness that is spreading or severe — seek prompt medical advice.",
      "Back pain after a significant injury, or with fever, unexplained weight loss or night sweats — see your GP.",
    ],
    lenses: {
      physio: {
        oneLiner: "Looks at movement, load and how the back is coping.",
        worldview:
          "Physiotherapy and conventional care understand most back pain through how the spine and surrounding muscles move and tolerate load, shaped by activity, posture, sleep and stress. Reassurance, staying active and gradually building movement are central themes, guided by evidence and national guidance.",
        practitionerLooksAt:
          "A physiotherapist assesses how you move, what eases or aggravates it, and how it affects daily life, to build a picture and a plan you take part in.",
        whoYouSee:
          "A registered physiotherapist (HCPC), or your GP, who can refer on if something needs closer attention.",
      },
      osteopathy: {
        oneLiner: "Reads it through whole-body structure and movement.",
        worldview:
          "Osteopathy understands back pain in the context of the whole body's structure and movement — how the spine, pelvis, muscles and joints work together — and the idea that the body tends to function best when it moves freely. It is a hands-on, assessment-led worldview.",
        practitionerLooksAt:
          "An osteopath takes a detailed history and assesses your posture and movement to understand how your body is coping as a whole.",
        whoYouSee: "An osteopath registered with the General Osteopathic Council (a legal requirement to practise).",
      },
      "tcm-acu": {
        oneLiner: "Describes obstructed flow in the body's channels.",
        worldview:
          "Traditional Chinese Medicine often describes back pain in terms of qi and blood not flowing smoothly through the body's channels, with influences such as cold, damp or strain affecting that flow. It is a worldview about the balance and movement of energy.",
        practitionerLooksAt:
          "A TCM practitioner maps your individual pattern through detailed questions and observation of tongue and pulse.",
        whoYouSee: "A practitioner registered with a recognised body (for acupuncture, the British Acupuncture Council).",
      },
    },
  },
  {
    id: "neck-shoulder",
    label: "Neck & shoulder pain",
    patientPhrase: "persistent neck and shoulder pain",
    category: "Neck & shoulder",
    blurb: "Tension, stiffness or ache across the neck and shoulders.",
    commonGround: [
      "How you set up your screen and workspace, and taking movement breaks, matter across approaches.",
      "Sleep position, stress and sustained postures all influence neck and shoulder tension.",
      "Gentle movement usually beats staying rigidly still.",
    ],
    redFlags: [
      "Neck pain after a significant injury or fall — seek prompt medical advice.",
      "Arm weakness, numbness or pins-and-needles that is spreading or severe — see your GP promptly.",
      "Neck pain with fever, severe headache, dizziness or visual changes — contact NHS 111 or, if severe, call 999.",
    ],
    lenses: {
      physio: {
        oneLiner: "Considers posture, load and movement.",
        worldview:
          "Physiotherapy understands neck and shoulder pain through posture, movement, load and how the area is coping over time, with staying active and graded movement as central themes, informed by evidence.",
        practitionerLooksAt:
          "A physiotherapist looks at how your neck and shoulders move, what aggravates them, and how they affect daily tasks.",
        whoYouSee: "A registered physiotherapist (HCPC), or your GP.",
      },
      osteopathy: {
        oneLiner: "Sees the neck within whole-body movement.",
        worldview:
          "Osteopathy considers the neck and shoulders as part of the whole body's structure — including the upper back and how you hold and move yourself — working from the idea that free movement supports comfort.",
        practitionerLooksAt:
          "An osteopath assesses your posture and movement across the upper body to understand how things are working together.",
        whoYouSee: "An osteopath registered with the General Osteopathic Council.",
      },
      "tcm-acu": {
        oneLiner: "Relates tension to the flow in local channels.",
        worldview:
          "Traditional Chinese Medicine often relates neck and shoulder tension to qi not flowing smoothly through the channels of the area, with influences such as stress, cold or strain described as affecting that flow.",
        practitionerLooksAt:
          "A TCM practitioner builds an individual picture through questions and observation of tongue and pulse.",
        whoYouSee: "A practitioner registered with a recognised body.",
      },
    },
  },
  {
    id: "knee-hip",
    label: "Knee or hip pain",
    patientPhrase: "ongoing knee or hip pain",
    category: "Joints",
    blurb: "A sore, stiff or aching knee or hip.",
    commonGround: [
      "Gradually building strength and maintaining movement is encouraged across approaches.",
      "Load through the day, footwear and body weight can all influence joint comfort.",
      "Pacing — neither overloading nor avoiding movement — is widely recommended.",
    ],
    redFlags: [
      "A hot, swollen, red joint, or joint pain with fever — seek prompt medical advice.",
      "A joint that locks, gives way, or cannot bear weight after an injury — get it assessed promptly.",
      "Joint pain with unexplained weight loss or feeling generally unwell — see your GP.",
    ],
    lenses: {
      physio: {
        oneLiner: "Focuses on strength, load and how the joint moves.",
        worldview:
          "Physiotherapy understands knee and hip pain through how the joint moves, the strength and load around it, and how it copes with activity — with graded strengthening and movement as central themes, guided by evidence.",
        practitionerLooksAt:
          "A physiotherapist assesses how the joint moves and loads, what aggravates it, and how it limits you.",
        whoYouSee: "A registered physiotherapist (HCPC), or your GP, who can refer on where needed.",
      },
      osteopathy: {
        oneLiner: "Looks at the joint within whole-body mechanics.",
        worldview:
          "Osteopathy considers a painful knee or hip in the context of how the whole body moves and distributes load — how the joint, pelvis and surrounding structures work together.",
        practitionerLooksAt:
          "An osteopath assesses your movement and posture to understand how the joint is working within the whole.",
        whoYouSee: "An osteopath registered with the General Osteopathic Council.",
      },
      "tcm-acu": {
        oneLiner: "Describes flow and balance around the joint.",
        worldview:
          "Traditional Chinese Medicine often describes joint discomfort through the flow of qi and blood and influences such as cold or damp, interpreted as part of the body's overall balance.",
        practitionerLooksAt:
          "A TCM practitioner forms an individual picture through questions and observation of tongue and pulse.",
        whoYouSee: "A practitioner registered with a recognised body.",
      },
    },
  },
  {
    id: "recurrent-strain",
    label: "Recurrent strains & overuse",
    patientPhrase: "recurring strains from activity or sport",
    category: "Activity & sport",
    blurb: "Niggles and strains that keep coming back with activity.",
    commonGround: [
      "Building activity up gradually, and allowing recovery time, matters across approaches.",
      "Technique, sleep and overall load all influence recurring strains.",
      "Sudden jumps in training tend to be a common thread worth reviewing.",
    ],
    redFlags: [
      "A sudden severe pain or 'pop' with rapid swelling, or being unable to bear weight — get it assessed promptly.",
      "Numbness, pins-and-needles or weakness in the limb — seek medical advice.",
      "A strain that is not settling at all over time — see your GP or a registered physiotherapist.",
    ],
    lenses: {
      physio: {
        oneLiner: "Centres on load, capacity and recovery.",
        worldview:
          "Physiotherapy understands recurring strains largely through load and capacity — how much demand is placed on tissues versus what they are currently used to — alongside technique, recovery and sleep, guided by evidence.",
        practitionerLooksAt:
          "A physiotherapist looks at your activity, how the strain happens, and how you recover, to build a picture and a plan.",
        whoYouSee: "A registered physiotherapist (HCPC), or your GP.",
      },
      osteopathy: {
        oneLiner: "Looks at movement patterns and how the body compensates.",
        worldview:
          "Osteopathy considers recurring strains in the context of whole-body movement patterns and how one area may be affected by how the rest of the body moves and shares load.",
        practitionerLooksAt:
          "An osteopath assesses your movement and posture to understand the patterns around a recurring strain.",
        whoYouSee: "An osteopath registered with the General Osteopathic Council.",
      },
      "tcm-acu": {
        oneLiner: "Frames recovery through flow and balance.",
        worldview:
          "Traditional Chinese Medicine often frames recurrent strain and slow recovery through the flow of qi and blood and the body's overall balance and resilience.",
        practitionerLooksAt:
          "A TCM practitioner builds an individual picture through detailed questions and observation.",
        whoYouSee: "A practitioner registered with a recognised body.",
      },
    },
  },
  {
    id: "desk-posture",
    label: "Desk & posture tension",
    patientPhrase: "tension and stiffness from desk work and posture",
    category: "Work & posture",
    blurb: "Stiffness and tension that builds up from sitting and screens.",
    commonGround: [
      "Varying your posture and taking regular movement breaks matters more than one 'perfect' position.",
      "Workstation setup, stress and sleep all play a part.",
      "Little and often beats long, static stretches of sitting.",
    ],
    redFlags: [
      "Arm or hand numbness, weakness or pins-and-needles — see your GP.",
      "Tension that worsens despite changes, or is linked to severe headaches — seek advice.",
      "Any new neurological symptoms — contact NHS 111 or your GP.",
    ],
    lenses: {
      physio: {
        oneLiner: "Looks at sustained postures and movement variety.",
        worldview:
          "Physiotherapy understands desk-related tension through sustained postures, lack of movement variety and how tissues tolerate prolonged load — with movement variety and activity as central themes, informed by evidence.",
        practitionerLooksAt:
          "A physiotherapist looks at your work setup, movement habits and what eases or aggravates the tension.",
        whoYouSee: "A registered physiotherapist (HCPC), or your GP.",
      },
      osteopathy: {
        oneLiner: "Considers whole-body alignment and movement.",
        worldview:
          "Osteopathy considers desk-related tension in the context of whole-body alignment and movement — how sustained positions affect the way the body moves as a whole.",
        practitionerLooksAt:
          "An osteopath assesses your posture and movement to understand how desk work is affecting you.",
        whoYouSee: "An osteopath registered with the General Osteopathic Council.",
      },
      "tcm-acu": {
        oneLiner: "Relates stiffness to tension and flow.",
        worldview:
          "Traditional Chinese Medicine often relates desk-related stiffness to qi becoming 'stuck' through tension and lack of movement, interpreted as part of the body's overall balance.",
        practitionerLooksAt:
          "A TCM practitioner builds an individual picture through questions and observation.",
        whoYouSee: "A practitioner registered with a recognised body.",
      },
    },
  },
  {
    id: "something-else",
    label: "Something else",
    patientPhrase: "another musculoskeletal issue I'd like to understand",
    category: "General",
    blurb: "Describe it in your own words — we'll still show you each perspective.",
    commonGround: [
      "Movement, load, sleep, stress and pacing influence most musculoskeletal issues across approaches.",
      "Writing down what you've noticed — and what you want from the visit — helps any practitioner.",
    ],
    redFlags: [
      "Anything severe, rapidly worsening, or following a significant injury — get it assessed promptly.",
      "Numbness, weakness or loss of bladder or bowel control — seek urgent help; in an emergency call 999.",
    ],
    lenses: {
      physio: {
        oneLiner: "Starts from movement, load and function.",
        worldview:
          "Physiotherapy and conventional care understand musculoskeletal problems through how the body moves and tolerates load, and how a problem affects function — with staying active and graded movement as recurring themes, guided by evidence.",
        practitionerLooksAt:
          "A physiotherapist gathers your story, assesses movement, and builds a plan you take part in.",
        whoYouSee: "A registered physiotherapist (HCPC), or your GP, who can refer on when needed.",
      },
      osteopathy: {
        oneLiner: "Understands the part through the whole.",
        worldview:
          "Osteopathy understands a musculoskeletal complaint in the context of the whole body's structure and movement, working from the idea that the body functions best when it moves freely.",
        practitionerLooksAt: "An osteopath assesses your posture and movement to understand the whole picture.",
        whoYouSee: "An osteopath registered with the General Osteopathic Council.",
      },
      "tcm-acu": {
        oneLiner: "Reads the body through flow and balance.",
        worldview:
          "Traditional Chinese Medicine understands musculoskeletal discomfort through the flow of qi and blood and the body's overall balance, using functional concepts to describe how the body behaves as a whole.",
        practitionerLooksAt:
          "A TCM practitioner builds an individual picture through detailed questions and observation of tongue and pulse.",
        whoYouSee: "A practitioner registered with a recognised body.",
      },
    },
  },
];

export const musculoskeletalPack: ContentPack = {
  id: "musculoskeletal",
  label: "Musculoskeletal & movement",
  description:
    "A back-and-joint vertical: six common complaints seen through Physiotherapy, Osteopathy and Acupuncture/TCM lenses.",
  traditions,
  concerns,
  review: {
    reviewedBy: "Clinical sign-off recorded at each release",
    role: "UK-registered medical reviewer",
    date: "2026-06-01",
    version: "1.0",
    statement:
      "Before release, every entry is checked against the safety rules — education only, no diagnosis, no named treatment or technique-as-cure, no efficacy or ranking claims — with each concern routing to a qualified, registered practitioner. The reviewing clinician's name and registration are recorded with each signed-off version.",
  },
};
