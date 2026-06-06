export type HealthStatusValue =
  | "HEALTHY"
  | "MILD_CONCERN"
  | "MODERATE_CONCERN"
  | "SEVERE"
  | "CRITICAL";

export interface HealthReportTemplate {
  key: string;
  title: string;
  aliases: string[];
  defaultHealthStatus: HealthStatusValue;
  summary: string;
  symptoms: string[];
  causes: string[];
  treatmentProtocol: string[];
  feedingGuidance: string[];
  preventiveMeasures: string[];
  recoveryChecklist: string[];
  quarantineAdvice: string;
  dosageInstructions?: string;
  suggestedDuration?: string;
  medicineId?: string;
}

const HEALTH_REPORT_TEMPLATES: HealthReportTemplate[] = [
  {
    key: "healthy",
    title: "Healthy Stock",
    aliases: ["healthy", "normal", "clear"],
    defaultHealthStatus: "HEALTHY",
    summary:
      "No disease pattern is indicated by the AI output. Continue routine monitoring and verify water quality stability before the next feeding cycle.",
    symptoms: [
      "Normal swimming behavior",
      "Strong appetite and feed response",
      "No visible lesions, discoloration, or fin damage",
    ],
    causes: [
      "Stable husbandry conditions",
      "Good oxygenation and acceptable ammonia levels",
      "Consistent feeding and low handling stress",
    ],
    treatmentProtocol: [
      "No medication is recommended at this stage.",
      "Keep routine observation and repeat AI check only if behavior changes.",
    ],
    feedingGuidance: [
      "Maintain the normal feed program.",
      "Do not increase feed aggressively unless biomass and appetite justify it.",
    ],
    preventiveMeasures: [
      "Keep dissolved oxygen, pH, and ammonia within farm targets.",
      "Remove mortalities and feed waste during daily rounds.",
      "Document any unusual behavior early.",
    ],
    recoveryChecklist: [
      "Confirm appetite remains stable for the next 7 days.",
      "Confirm no sudden mortality appears in the same batch.",
      "Keep the next routine health scan on schedule.",
    ],
    quarantineAdvice:
      "Quarantine is not required unless abnormal signs appear after this check.",
    suggestedDuration: "Routine observation only",
  },
  {
    key: "columnaris",
    title: "Columnaris Bacterial Infection",
    aliases: ["columnaris", "flavobacterium", "cotton mouth"],
    defaultHealthStatus: "SEVERE",
    summary:
      "This report matches the common Columnaris pattern. Immediate action is required because the disease can spread rapidly under warm water and crowding stress.",
    symptoms: [
      "Pale or white mouth area",
      "Skin erosions or saddleback lesions",
      "Frayed fins and lethargy near water inlets",
    ],
    causes: [
      "High organic load and poor sanitation",
      "Handling stress or overcrowding",
      "Warm water that accelerates bacterial growth",
    ],
    treatmentProtocol: [
      "Isolate the affected batch from shared equipment when possible.",
      "Start the approved antibacterial protocol from the farm health team.",
      "Increase aeration and reduce stress during treatment.",
    ],
    feedingGuidance: [
      "Reduce feed by 15-25% until appetite and swimming stabilize.",
      "Avoid overfeeding during the treatment window.",
    ],
    preventiveMeasures: [
      "Disinfect nets and handling tools after every use.",
      "Avoid sudden grading or movement during outbreaks.",
      "Keep stocking density inside operating limits.",
    ],
    recoveryChecklist: [
      "Lesions dry and stop expanding",
      "Mortality trend returns to baseline",
      "Fish resume normal feed response for 3 consecutive days",
    ],
    quarantineAdvice:
      "Treat this batch as isolated until lesions regress and mortality returns to normal.",
    dosageInstructions:
      "Follow the farm-approved antibacterial dosage exactly as issued by the health team or veterinarian.",
    suggestedDuration: "5-7 days with daily observation",
    medicineId: "COL-BAC-01",
  },
  {
    key: "bacterial-gill-disease",
    title: "Bacterial Gill Disease",
    aliases: ["gill disease", "bacterial gill", "gill infection"],
    defaultHealthStatus: "SEVERE",
    summary:
      "The pattern is consistent with bacterial gill damage. Oxygen stress usually worsens the condition quickly, so aeration and water exchange should be prioritized.",
    symptoms: [
      "Rapid gill movement or gasping",
      "Fish gathering near aeration points",
      "Reduced feed intake and dull coloration",
    ],
    causes: [
      "Low oxygen and poor water turnover",
      "High suspended solids irritating the gills",
      "Secondary bacterial pressure during stressful events",
    ],
    treatmentProtocol: [
      "Increase aeration immediately and inspect diffusers or blowers.",
      "Apply the approved gill infection treatment from the health protocol.",
      "Reduce handling until breathing behavior improves.",
    ],
    feedingGuidance: [
      "Feed lightly while respiration is elevated.",
      "Pause aggressive feeding if fish are surfacing or crowding aeration.",
    ],
    preventiveMeasures: [
      "Maintain solids removal and stable aeration.",
      "Avoid biomass spikes that outgrow oxygen capacity.",
      "Check morning dissolved oxygen more frequently during hot weather.",
    ],
    recoveryChecklist: [
      "Respiration rate normalizes",
      "Fish spread evenly in the tank again",
      "Morning oxygen remains stable without emergency aeration",
    ],
    quarantineAdvice:
      "Limit movement of fish and equipment until gill irritation and gasping are no longer observed.",
    dosageInstructions:
      "Use the approved gill treatment protocol and verify dosage against actual tank volume before application.",
    suggestedDuration: "3-5 days plus follow-up observation",
    medicineId: "BGD-CARE-02",
  },
  {
    key: "streptococcosis",
    title: "Streptococcosis",
    aliases: ["streptococcus", "streptococcosis"],
    defaultHealthStatus: "CRITICAL",
    summary:
      "This report indicates a streptococcal-type outbreak pattern. Mortality can escalate quickly, so escalation to the health team should happen immediately.",
    symptoms: [
      "Erratic swimming or spinning",
      "Popped eyes or cloudy eyes",
      "Sudden mortality with weak feed response",
    ],
    causes: [
      "Warm water and severe stress load",
      "Poor biosecurity or contaminated handling tools",
      "High-density culture under unstable conditions",
    ],
    treatmentProtocol: [
      "Escalate to the health supervisor immediately.",
      "Apply only the approved prescription treatment path for streptococcal cases.",
      "Tighten mortality collection and record-keeping twice daily.",
    ],
    feedingGuidance: [
      "Reduce feeding aggressively until the mortality curve stabilizes.",
      "Resume normal ration gradually after health review clearance.",
    ],
    preventiveMeasures: [
      "Separate tools by tank during an active event.",
      "Lower stress from grading, transport, or abrupt management changes.",
      "Keep emergency oxygen support ready in high-risk periods.",
    ],
    recoveryChecklist: [
      "Neurological behavior stops",
      "Mortality drops back near baseline",
      "Fish regain feed response for several days in a row",
    ],
    quarantineAdvice:
      "Strict isolation is recommended until mortality and abnormal behavior stop.",
    dosageInstructions:
      "Do not improvise dosage. Use only the authorized treatment instructions issued for the diagnosed case.",
    suggestedDuration: "Escalated case: follow health team schedule",
    medicineId: "STREP-EMR-03",
  },
  {
    key: "tilv",
    title: "Tilapia Lake Virus",
    aliases: ["tilv", "tilapia lake virus", "lake virus"],
    defaultHealthStatus: "CRITICAL",
    summary:
      "The AI result matches Tilapia Lake Virus. Treat this as a high-risk viral event and escalate quickly because losses can rise fast in stressed batches.",
    symptoms: [
      "Weak swimming and loss of appetite",
      "Darkening or general stress appearance",
      "Sudden mortality pattern in the affected batch",
    ],
    causes: [
      "Viral exposure through fish movement or shared equipment",
      "Poor biosecurity between tanks",
      "Stress from handling, water instability, or crowding",
    ],
    treatmentProtocol: [
      "Escalate immediately to the health supervisor.",
      "Isolate the affected batch and stop unnecessary movement.",
      "Focus on supportive care, oxygen stability, and mortality tracking.",
    ],
    feedingGuidance: [
      "Reduce feed while appetite is weak.",
      "Resume gradually only after behavior and mortality stabilize.",
    ],
    preventiveMeasures: [
      "Apply strict biosecurity between tanks.",
      "Quarantine new or transferred fish before mixing.",
      "Disinfect equipment and avoid shared handling tools.",
    ],
    recoveryChecklist: [
      "Mortality returns to baseline",
      "Fish regain normal swimming and appetite",
      "No new linked tanks show the same pattern",
    ],
    quarantineAdvice:
      "Strict isolation is recommended until the health team clears the batch.",
    dosageInstructions:
      "No medication should be improvised for viral cases. Follow the farm health team plan.",
    suggestedDuration: "Escalated case: follow health team schedule",
    medicineId: "TILV-EMR-08",
  },
  {
    key: "aeromonas",
    title: "Aeromonas-Type Infection",
    aliases: ["aeromonas", "motile aeromonas", "hemorrhagic septicemia"],
    defaultHealthStatus: "SEVERE",
    summary:
      "This report fits an Aeromonas-style bacterial infection. Fast sanitation and treatment response are important because lesions and septic signs can worsen quickly.",
    symptoms: [
      "Red patches or hemorrhagic skin areas",
      "Open ulcers or abdominal swelling",
      "Weak swimming and low appetite",
    ],
    causes: [
      "High bacterial pressure in dirty water",
      "Injury during handling or grading",
      "Stress from poor water quality or abrupt change",
    ],
    treatmentProtocol: [
      "Clean the tank environment and tighten mortality removal.",
      "Start the approved bacterial treatment route after confirmation.",
      "Review aeration, ammonia, and solids loading on the same day.",
    ],
    feedingGuidance: [
      "Feed conservatively until ulcer progression stops.",
      "Use highly digestible feed only while fish are stressed.",
    ],
    preventiveMeasures: [
      "Reduce skin injuries during sampling and transfer.",
      "Keep tools disinfected between tanks.",
      "Monitor water quality after heavy feeding or biomass increase.",
    ],
    recoveryChecklist: [
      "No new red lesions appear",
      "Appetite begins returning",
      "Mortality stabilizes over several monitoring cycles",
    ],
    quarantineAdvice:
      "Restrict shared handling and keep the batch under close observation until lesions are stable.",
    dosageInstructions:
      "Apply the approved antibacterial dosage against actual biomass and tank volume.",
    suggestedDuration: "5-7 days with reassessment",
    medicineId: "AERO-BAC-04",
  },
  {
    key: "fin-rot",
    title: "Fin Rot / Surface Bacterial Lesion",
    aliases: ["fin rot", "fin erosion", "surface lesion"],
    defaultHealthStatus: "MODERATE_CONCERN",
    summary:
      "This pattern is consistent with fin erosion or a surface bacterial lesion. The case is usually manageable if stress and water quality are corrected early.",
    symptoms: [
      "Frayed or eroded fins",
      "Localized redness or surface irritation",
      "Mild appetite drop",
    ],
    causes: [
      "Chronic low-level water quality stress",
      "Fin damage from crowding or handling",
      "Secondary bacterial growth on injured tissue",
    ],
    treatmentProtocol: [
      "Correct stressors first, especially water quality and crowding.",
      "Apply the approved surface lesion protocol if signs continue.",
      "Increase observation frequency to catch deterioration early.",
    ],
    feedingGuidance: [
      "Keep feed normal to slightly reduced depending on appetite.",
      "Avoid waste accumulation from uneaten feed.",
    ],
    preventiveMeasures: [
      "Avoid rough handling and net abrasion.",
      "Keep biosecurity between tanks consistent.",
      "Do not let feed waste accumulate on the bottom.",
    ],
    recoveryChecklist: [
      "Fin edges stop deteriorating",
      "No fresh red zones appear",
      "Feed response returns to normal",
    ],
    quarantineAdvice:
      "Segregation is recommended if lesions are spreading or multiple fish are affected.",
    dosageInstructions:
      "Use the farm-approved lesion treatment plan if local signs continue or worsen.",
    suggestedDuration: "3-5 days with daily checks",
    medicineId: "FIN-CARE-05",
  },
  {
    key: "ich",
    title: "Ich / White Spot Stress Pattern",
    aliases: ["ich", "white spot", "ichthyophthirius"],
    defaultHealthStatus: "MODERATE_CONCERN",
    summary:
      "The result resembles an ich or white-spot style external parasite pattern. Early detection helps limit spread and secondary bacterial stress.",
    symptoms: [
      "White spot-like irritation on skin or fins",
      "Flashing or rubbing behavior",
      "Stress breathing in advanced cases",
    ],
    causes: [
      "Parasite exposure under stressed immunity",
      "Water quality instability",
      "Movement of fish without proper quarantine",
    ],
    treatmentProtocol: [
      "Follow the approved anti-parasitic protocol for the affected tank.",
      "Increase observation for secondary bacterial signs.",
      "Avoid transferring exposed fish to clean systems.",
    ],
    feedingGuidance: [
      "Use a moderate ration until stress behavior settles.",
      "Do not force normal feed volume when fish are flashing or gasping.",
    ],
    preventiveMeasures: [
      "Quarantine new fish before mixing.",
      "Keep sanitation consistent between tanks.",
      "Monitor for secondary lesions after parasite treatment.",
    ],
    recoveryChecklist: [
      "Rubbing behavior stops",
      "Visible irritation reduces",
      "No secondary lesion pattern appears after treatment",
    ],
    quarantineAdvice:
      "Avoid moving the affected batch until visible irritation and flashing stop.",
    dosageInstructions:
      "Use the approved anti-parasitic dosage schedule and verify compatibility with the current water parameters.",
    suggestedDuration: "Follow parasite treatment cycle",
    medicineId: "ICH-PROT-06",
  },
  {
    key: "parasitic-disease",
    title: "Parasitic Disease Pattern",
    aliases: [
      "parasitic",
      "parasite",
      "parasitic disease",
      "parasitic diseases",
      "external parasite",
    ],
    defaultHealthStatus: "MODERATE_CONCERN",
    summary:
      "The AI result points to a parasitic disease pattern. Early control should focus on confirming visible irritation, reducing stress, and preventing spread.",
    symptoms: [
      "Flashing, rubbing, or irritation behavior",
      "Visible spots, surface irritation, or skin stress",
      "Reduced appetite in affected fish",
    ],
    causes: [
      "Parasite exposure from new fish or shared water/equipment",
      "Weak quarantine practices",
      "Stress from water quality instability",
    ],
    treatmentProtocol: [
      "Confirm the signs with a manual inspection.",
      "Apply the approved anti-parasitic protocol for the tank.",
      "Watch for secondary bacterial lesions after treatment.",
    ],
    feedingGuidance: [
      "Keep ration moderate while stress behavior is present.",
      "Avoid overfeeding if fish are flashing or gasping.",
    ],
    preventiveMeasures: [
      "Quarantine new fish before mixing.",
      "Disinfect nets and shared tools.",
      "Keep water quality stable during the treatment cycle.",
    ],
    recoveryChecklist: [
      "Rubbing behavior stops",
      "Surface irritation reduces",
      "Appetite returns without new lesions",
    ],
    quarantineAdvice:
      "Avoid moving the affected batch until irritation and parasite signs are controlled.",
    dosageInstructions:
      "Use only the approved anti-parasitic dosage schedule for the farm and tank volume.",
    suggestedDuration: "Follow parasite treatment cycle",
    medicineId: "PARA-PROT-09",
  },
  {
    key: "water-stress",
    title: "Water Quality Stress Event",
    aliases: [
      "ammonia",
      "stress",
      "hypoxia",
      "oxygen",
      "ph stress",
      "water quality",
    ],
    defaultHealthStatus: "MILD_CONCERN",
    summary:
      "The pattern is more consistent with a water quality stress event than a fixed infectious disease. The first response should focus on the environment.",
    symptoms: [
      "Gasping or crowding near aeration",
      "Dull coloration or sudden inactivity",
      "Feed refusal during stressful hours",
    ],
    causes: [
      "Low oxygen, high ammonia, or unstable pH",
      "Poor circulation or solids accumulation",
      "Feeding load beyond system capacity",
    ],
    treatmentProtocol: [
      "Correct the water quality problem first.",
      "Increase aeration or water exchange as needed.",
      "Hold medication unless the health team confirms a secondary infection.",
    ],
    feedingGuidance: [
      "Reduce feed immediately until water quality stabilizes.",
      "Resume the normal ration only after appetite recovers.",
    ],
    preventiveMeasures: [
      "Track oxygen, ammonia, and pH trends daily.",
      "Adjust feed when biomass or temperature changes quickly.",
      "Maintain blower and diffuser performance.",
    ],
    recoveryChecklist: [
      "Water parameters return to target range",
      "Fish stop surfacing or clustering",
      "Appetite returns under stable water conditions",
    ],
    quarantineAdvice:
      "Quarantine is secondary here; fix the tank environment first and monitor for secondary disease.",
    suggestedDuration: "24-72 hours of close monitoring",
  },
  {
    key: "generic-bacterial",
    title: "Generic Bacterial Health Alert",
    aliases: ["bacterial", "infection", "unknown"],
    defaultHealthStatus: "MODERATE_CONCERN",
    summary:
      "The AI detected a disease pattern but the class did not map cleanly to a named protocol. Use the generic bacterial containment workflow until the health team confirms the diagnosis.",
    symptoms: [
      "Behavior or lesion change detected by AI",
      "Potential appetite loss or stress behavior",
      "Possible early skin, fin, or respiratory signs",
    ],
    causes: [
      "General bacterial pressure",
      "Stress, poor sanitation, or water instability",
      "Handling injury or cross-contamination risk",
    ],
    treatmentProtocol: [
      "Escalate the case for manual review.",
      "Isolate equipment and tighten tank sanitation.",
      "Use the farm-approved generic bacterial response path until confirmed.",
    ],
    feedingGuidance: [
      "Reduce feed moderately and monitor appetite closely.",
      "Do not return to full ration until the batch stabilizes.",
    ],
    preventiveMeasures: [
      "Strengthen hygiene between tanks.",
      "Review aeration and ammonia immediately.",
      "Repeat inspection with fresh images if symptoms progress.",
    ],
    recoveryChecklist: [
      "No new lesions or abnormal behavior",
      "Feed response stabilizes",
      "Manual health review clears the batch",
    ],
    quarantineAdvice:
      "Treat the case as potentially infectious until clarified by the health team.",
    dosageInstructions:
      "Follow the generic bacterial response protocol approved for the farm.",
    suggestedDuration: "3-5 days with reassessment",
    medicineId: "GEN-BAC-07",
  },
];

export const normalizeHealthLabel = (value?: string) =>
  (value || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const resolveHealthReportTemplate = (
  value?: string,
): HealthReportTemplate => {
  const normalized = normalizeHealthLabel(value);

  if (!normalized) {
    return HEALTH_REPORT_TEMPLATES.find(
      (template) => template.key === "generic-bacterial",
    )!;
  }

  const matched = HEALTH_REPORT_TEMPLATES.find((template) =>
    template.aliases.some((alias) => normalized.includes(alias)),
  );

  return (
    matched ||
    HEALTH_REPORT_TEMPLATES.find(
      (template) => template.key === "generic-bacterial",
    )!
  );
};

export const getHealthLibraryTemplates = () =>
  HEALTH_REPORT_TEMPLATES.filter((template) => template.key !== "healthy");

export const getHealthTemplateByKey = (key?: string) =>
  HEALTH_REPORT_TEMPLATES.find((template) => template.key === key) ||
  HEALTH_REPORT_TEMPLATES[0];
