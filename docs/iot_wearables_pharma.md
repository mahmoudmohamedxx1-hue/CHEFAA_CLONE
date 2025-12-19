# IoT Devices and Wearables Integration with Pharmaceutical Platforms (2024–2025)

## Executive Summary

The integration of Internet of Things (IoT) medical devices and wearables into pharmaceutical platforms is moving from pilot experimentation to scaled deployment. In 2024–2025, three currents reinforce each other: rapid growth in connected medical devices, accelerated adoption of continuous monitoring in home and alternate sites of care, and the convergence of drugs with connected delivery systems and software. Together, these forces are reshaping how therapies are initiated, titrated, monitored, and supported in real time—across clinical development and commercial care.

The IoT medical devices market is scaling quickly, with market value rising from US$53.78 billion in 2024 to US$65.08 billion in 2025, and projected to reach US$154.74 billion by 2030 at an 18.9% CAGR. North America currently leads in adoption, driven by reimbursement frameworks, mature digital infrastructure, and widespread electronic health record (EHR) penetration, while Asia–Pacific shows strong momentum due to broader technology adoption and increasing healthcare digitization. This expansion is accompanied by shifting device mix (stationary devices for continuous monitoring in facilities and rapid growth in patient monitors), and networking improvements (Wi‑Fi dominance with growing Bluetooth and emerging Zigbee considerations).[^1][^14]

Connected drug delivery is a micro-market moving in the same direction but even faster. The global connected delivery devices market—Bluetooth-enabled inhalers, injectors, and pens—was approximately US$491.2 million in 2024 and is forecast to reach US$7.25 billion by 2034 (31.8% CAGR). Respiratory care and home settings dominate near-term applications. Notable developments include NuvoAir’s FDA 510(k)-cleared Air Next spirometer (in‑home spirometry with cloud data) and Insulclock CAP (transforming insulin pens into connected devices), both designed to feed clinical data to dashboards that clinicians can act on. Bluetooth dominates connectivity (47.7% market share in 2024), in part because pairing with smartphones simplifies onboarding and enables secure, low-energy data flows and compliance with modern security practices.[^8]

On the regulatory side, two frameworks matter most in 2024–2025: the FDA’s final guidance on cybersecurity in medical devices (June 2025) and the FDA’s approach to AI-enabled devices (including Software as a Medical Device, or SaMD). The 2025 cybersecurity guidance emphasizes secure-by-design, lifecycle risk management, and clear documentation expectations for premarket submissions (including secure update mechanisms, threat modeling, and coordinated vulnerability disclosure), while AI device lists and emerging AI SaMD policy discussions underscore transparency, performance monitoring, and change control for learning systems.[^9][^10][^28][^20] In parallel, the FDA’s list of sensor-based digital health technologies (sDHT) and the continued emergence of FDA-authorized AI-enabled devices provide a growing library of reference devices and evidentiary precedents that pharma can leverage when assembling integrated drug–device programs.[^23][^28]

Interoperability is the linchpin. Fast Healthcare Interoperability Resources (FHIR) has matured into the default standard for granular, web-native health data exchange. FHIR resources—Patient, Device, DeviceMetric, Observation, MedicationRequest, MedicationAdministration, and DiagnosticReport—map cleanly to device and adherence data flows. SMART on FHIR apps further enable secure, user-authorized access to EHR data. Combined with middleware patterns and disciplined data governance, FHIR lowers integration friction and enables clinical decision support (CDS) that is timely, contextual, and actionable.[^4][^5][^6][^19]

Strategically, pharma should prioritize five integration plays where the near-term return is clearest:
- Smart pill dispensers and electronic adherence technologies that tie dose events to app-based reminders and caregiver portals, with adherence signals flowing to EHR via FHIR for care team visibility.
- Medical-grade wearable vital sign monitoring (e.g., ECG patches, SpO2, temperature, blood pressure) with published validation metrics that can trigger dose adjustments or escalation protocols in CDS workflows.
- Connected respiratory and diabetes devices (smart inhalers, home spirometers, CGMs, connected insulin pens) that anchor decentralized care models and remotetitration protocols.
- Real-time data pipelines (device-to-cloud-to-EHR) with robust security controls aligned to FDA cybersecurity expectations.
- Companion adherence apps and prescription digital therapeutics (PDTs) that extend pharmacotherapy with behavioral support and remote monitoring—coordinated via FHIR and coordinated care platforms.

The remainder of this report translates these themes into detailed market, regulatory, technical, and implementation guidance for pharmaceutical and digital health teams.

## Scope and Methodology

This report examines how IoT devices and wearables integrate with pharmaceutical platforms across six focus areas:
1) Smart pill dispensers and adherence monitoring
2) Wearable devices for vital sign monitoring
3) Connected medical devices for chronic disease management
4) Real-time health data integration
5) Automated medication reminders and scheduling
6) Integration with electronic health records (EHR)

Timeframe: 2024–2025

Sources: The analysis synthesizes peer-reviewed publications, FDA guidance and device lists, market reports, and industry news listed in the References section. FHIR literature and implementation guides anchor interoperability content; scoping reviews and chronic disease wearable analyses inform clinical integration considerations; FDA guidance frames cybersecurity and AI lifecycle controls.[^4][^7][^9]

Limitations and information gaps:
- Direct FDA web access to the final cybersecurity guidance content was blocked at times; the 2025 update is confirmed via reputable secondary sources.[^10][^11]
- Wearable device accuracy metrics are summarized from a large scoping review; however, comprehensive, device-by-device tables extend beyond the provided context and require additional validation.[^3]
- Smart pill dispenser clinical outcomes versus standard care remain heterogeneous and protocol-dependent; further RCTs and systematic evaluations are warranted.[^2][^22]
- Country-specific reimbursement coding for remote patient monitoring (RPM) and remote therapeutic monitoring (RTM) beyond CMS general descriptions is not fully captured here.[^24]
- End-to-end vendor case studies with explicit FHIR payloads and EHR workflow screenshots are not available in the provided context.
- Quantitative ROI metrics attributable to FHIR-only integrations versus legacy HL7 implementations are limited.
- Full 2025 FDA AI-enabled device listings and taxonomy are referenced but not reproduced here.[^28][^29]

## Market Landscape and Growth Drivers (2024–2025)

Two adjacent markets—IoT medical devices and connected drug delivery—frame the opportunity for pharma. IoT medical devices are scaling across settings, while connected delivery systems bring drug and device into a single data stream.

To anchor the discussion, the following table summarizes the IoT medical devices market trajectory.

Table 1. IoT medical devices market summary

| Year | Market size (US$ Bn) | Notes |
|---|---:|---|
| 2024 | 53.78 | Base year |
| 2025 | 65.08 | Continued scaling |
| 2030 (projected) | 154.74 | 2025–2030 CAGR: 18.9% |

As shown above, growth reflects several reinforcing drivers: chronic disease prevalence, home-based care expansion, the need for real-time monitoring, and AI-enabled analytics layered on streaming data. Connectivity technologies and cloud platforms enable data capture at scale, while EHR interoperability unlocks clinical value at the point of care.[^1][^14]

Table 2. IoT medical devices market—drivers, restraints, opportunities

| Category | Highlights |
|---|---|
| Drivers | Need for real-time monitoring; chronic disease burden; sensor and wireless advances; cloud connectivity; AI/analytics; patient engagement; government digital health initiatives |
| Restraints | Deployment costs; IT talent shortages; data management and interoperability challenges; data security concerns |
| Opportunities | Low doctor–patient ratios (virtual care enablement); product launches/partnerships; medical tourism and adoption in emerging economies |

Segment dynamics matter. Stationary devices hold the largest share (facility-based continuous monitoring), while patient monitors are the fastest-growing product segment—consistent with the shift to home-based monitoring and hybrid care models. By connectivity, Wi‑Fi leads due to ubiquitous access and security enhancements; Bluetooth facilitates personal-area pairing with companion apps.[^1][^14]

Table 3. Segment highlights (end-user and connectivity)

| Segment | Current state | Strategic implication |
|---|---|---|
| End-user | Nursing homes, assisted living, long-term care, and home care settings dominant in 2024 | Align programs to home-first workflows and caregiver visibility |
| Connectivity | Wi‑Fi largest; Bluetooth significant for wearables and companion apps; Zigbee adoption limited by security concerns | Prioritize dual-mode device onboarding (Wi‑Fi + Bluetooth) with secure provisioning |

Geographically, North America remains the leading region in 2024, aided by supportive reimbursement, EHR penetration, and investment in digital health. Asia–Pacific is the growth frontier, reflecting broader technology adoption and healthcare modernization.[^1][^14]

### Connected Drug Delivery Devices

Connected delivery systems (e.g., smart inhalers, connected insulin pens, autoinjectors) convert drugs into data-generating therapies. Bluetooth is the de facto standard for mobile pairing and energy efficiency.

Table 4. Connected drug delivery market snapshot

| Metric | 2024 value | 2034 projection | Notes |
|---|---:|---:|---|
| Market size (US$ Mn) | 491.2 | 7,250 | CAGR: 31.8% (2024–2034) |
| Connectivity | 47.7% share | — | Bluetooth leadership |
| Applications | Respiratory, diabetes, others | — | Respiratory/homecare dominate |
| Homecare revenue (2024, US$ Mn) | 198.5 | — | Home-first care rising |

Three device exemplars illustrate capabilities and pathways to data integration:
- Smart inhalers (e.g., Aptar Pharma’s HeroTracker Sense) add reminders, technique feedback, and usage logs to metered-dose inhalers, creating adherence and technique signals for clinician review.
- NuvoAir Air Next received FDA 510(k) clearance (January 2024) for in-home spirometry, transmitting results to physician dashboards for remote assessment—directly relevant to respiratory trials and real-world care.
- Insulclock CAP (cleared October 2024) converts disposable insulin pens into connected devices, capturing dose timing and providing therapy optimization alerts.[^8]

Table 5. Connected delivery device exemplars

| Device | Function | Regulatory status | Integration pathway |
|---|---|---|---|
| Aptar HeroTracker Sense | Smart inhaler add-on for reminders and technique monitoring | Commercial | Mobile app, cloud dashboards |
| NuvoAir Air Next | In-home spirometer | FDA 510(k) clearance (Jan 2024) | Cloud-to-physician dashboards |
| Insulclock CAP | Connected insulin pen | FDA clearance (Oct 2024) | Mobile app, cloud analytics |

These devices fit neatly into pharma’s connected care narrative: capturing adherence and efficacy signals in real time, enabling remote adjustments, and supplying EHR-integrated data to clinicians and researchers.[^8]

## Smart Pill Dispensers and Adherence Monitoring

Medication nonadherence is a persistent contributor to poor outcomes and avoidable costs. Smart dispensers, electronic pill bottles and boxes, blister packs with circuit traces, ingestible sensors, and electronic medication management systems (EMMS) all aim to nudge, monitor, and verify dosing. Each modality has trade-offs between ingestion confirmation, scalability, and privacy.

A recent narrative review categorized technologies by data capture method and strengths/limitations. The central insight is that most systems use proxy measures (e.g., container openings), while ingestible sensors offer direct ingestion confirmation but introduce new considerations around privacy and tolerability. Integration into clinical workflows and pharmacy systems remains a critical barrier; interoperability and real-time visibility into adherence data are key to unlocking clinical value.[^22]

Table 6. Adherence technology comparison

| Modality | Data capture method | Ingestion confirmation | Connectivity | Integration considerations |
|---|---|---|---|---|
| Electronic pill bottles | Cap opening timestamp | No (proxy) | Wired/wireless (varies) | Simple deployment; single-medication bottles; risk of “pocket dosing” |
| Electronic pill boxes/bags | Compartment opening timestamp | No (proxy) | Cellular/Bluetooth/wireless | Supports multi-drug regimens; larger devices may raise privacy concerns |
| Blister packs with conductive trace | Circuit break per pocket | No (proxy) | Wireless | Reduces pocket dosing/curiosity openings; risk of false breaks |
| Ingestible sensors | Sensor activation in stomach | Yes (direct) | Patch/mobile app to cloud | High accuracy; privacy/tolerability considerations |
| EMMS (e.g., RFID + scale, automated dispensing) | RFID/scale/dispense event | No (proxy up to delivery) | Cloud, portals | Guides complex regimens; cannot confirm ingestion |
| Video-based (VDOT) | Self-recorded ingestion | Indirect (observational) | App/cloud review | Flexible; subject to technical and recall issues |
| Motion sensors (wearables) | Administration gestures | No (proxy) | Wearable/app | Noninvasive; limited accuracy vs. daily motions |
| Self-report apps | Patient-entered events | No (subjective) | App/cloud | Low cost; subject to bias |

Market signals reinforce pharma’s interest. The smart pill dispenser market was valued at US$2.72 billion in 2024 and is projected to reach US$5.04 billion by 2032 (8% CAGR). Growth is driven by chronic disease prevalence, aging populations, and the digitization of medication management. Emerging capabilities include IoT connectivity, caregiver portals, cloud-based adherence analytics, and early AI approaches for pattern recognition and personalized reminders.[^2] 

Table 7. Smart pill dispenser market overview

| Metric | Value | Notes |
|---|---:|---|
| 2024 market size (US$ Bn) | 2.72 | Base year |
| 2032 forecast (US$ Bn) | 5.04 | CAGR ~8% |
| Growth drivers | — | Chronic disease, aging, digitization, RPM |
| Challenges | — | Cost, reimbursement gaps, digital literacy |
| Example features | — | IoT connectivity, cloud analytics, caregiver portals, EHR integration ambitions |

Integrating Adherence Signals into Clinical and Pharmacy Workflows. The practical challenge is less about capturing an adherence event and more about transforming that event into a clinically useful signal—ideally at the point of care and within existing systems. This requires:
- Mapping dose events to FHIR resources (e.g., MedicationAdministration with effective[x] time, MedicationStatement for patient-reported or device-derived adherence summaries).
- Ensuring reliable device identification via Device and DeviceMetric, with clear provenance and time synchronization.
- Enabling caregiver and care-team portals to surface risk flags (e.g., missed doses above a threshold) and to trigger refill workflows with pharmacies or long-term care (LTC) facilities.
- Aligning with pharmacy platforms (e.g., EnterpriseRx) that support med synchronization and adherence tools at scale.[^4][^19][^25]

## Wearable Devices for Vital Sign Monitoring

Medical-grade wearables are now validated across cardiology, respiratory, endocrinology, neurology, orthopedics, oncology, and mental health. The most relevant vital sign domains for pharma include ECG/heart rhythm, heart rate, blood pressure (BP), respiratory rate, temperature, and oxygen saturation (SpO2). Continuous glucose monitoring (CGM) has become central to diabetes and increasingly to integrated metabolic care.

The clinical literature provides performance snapshots across device classes. While exact metrics vary by device and population, several findings illustrate accuracy and clinical relevance:

Table 8. Selected wearable vital sign performance metrics

| Use case | Device/modality | Metric(s) | Finding |
|---|---|---|---|
| AF detection | PPG smartwatches (Fitbit Heart Study) | PPV 98.2% (overall); 97.0% (≥65 years) | High positive predictive value in large cohort |
| ECG patch | Zio vs. Holter | Detected 57% more significant events | Superior event capture over 24-hour Holter |
| BP monitoring | Wrist-worn oscillometric (HeartGuide) | ICC 0.883–0.911; within ±10 mm Hg: 58.7% in-office, 47.2% out-of-office | Mixed agreement with ABPM; context-dependent |
| SpO2 | Wrist-worn reflective pulse oximeter (ScanWatch) | Clinical validation | Prospective evidence supports wrist-worn SpO2 in specific contexts |
| CGM accuracy | FreeStyle Libre, Dexcom G6 | MARD ~9.0–9.2% | Strong accuracy for interstitial glucose tracking |
| Noninvasive glucose | Single-wavelength PPG; iGLU 2.0 | MARD 7.62% (PPG); 4.86% (iGLU 2.0) | Experimental/prospective devices show promising accuracy |

These data, drawn from a 2024 scoping review, demonstrate that validated wearables can furnish clinically meaningful signals for screening (e.g., AF), monitoring (e.g., SpO2 trends), and titration (e.g., CGM-guided insulin adjustment). The review also highlights caveats: motion artifacts, calibration differences, and context-specific performance (e.g., in-office vs. out-of-office BP comparisons).[^3]

Integration with Pharma and Clinical Monitoring. Wearables become therapeutically relevant when their signals inform care plans. Examples include:
- ECG patch or PPG-triggered alerts leading to anticoagulation review or dose timing adjustments for rate control.
- CGM data driving basal/bolus optimization and adverse event prevention protocols.
- Home spirometry signals (FEV1) guiding asthma/COPD therapy escalation or rescue medication use thresholds.
- SpO2 or respiratory rate thresholds triggering outpatient escalation pathways.

To translate device outputs into care actions, device and observation data must be interoperable with EHRs, and rules must be embedded into CDS. FHIR’s Device, DeviceMetric, and Observation resources provide the scaffolding, while CDS hooks and SMART on FHIR apps deliver clinician-facing insights at the right moment in workflow.[^7][^4]

Table 9. Device signals mapped to FHIR resources and CDS hooks

| Device signal | FHIR resource(s) | CDS example |
|---|---|---|
| ECG rhythm strip/AF detection | Device, DeviceMetric, Observation, DiagnosticReport | Alert cardiology for anticoagulation review |
| SpO2 trend | Device, Observation | Escalation protocol for COPD/asthma |
| CGM glucose | Observation (with interpretation) | Basal/bolus adjustment guidance |
| Home spirometry (FEV1) | Device, Observation, DiagnosticReport | Step-up therapy in asthma/COPD |
| HR, RR, temperature | Device, Observation | Early warning score triggers |

By aligning device data to FHIR and embedding logic into CDS, pharma-sponsored programs can move beyond data collection to measurable clinical impact.[^4][^7]

## Connected Medical Devices for Chronic Disease Management

Therapeutic areas with mature connected-device ecosystems—diabetes, cardiovascular disease, COPD/asthma, and related conditions—are furthest along in pharma integration.

Diabetes. Continuous glucose monitors (CGMs) such as FreeStyle Libre and Dexcom G6 exhibit mean absolute relative difference (MARD) around 9%, supporting robust titration decisions. Connected insulin pens and AI-augmented automated insulin delivery systems leverage wearable fitness signals (e.g., activity, heart rate) to improve time-in-range and reduce time below range. In the clinic, CGM-to-EHR data flows enable structured review and retrospective analysis; in trials, they support decentralized endpoints.[^3]

Cardiovascular. ECG patches (e.g., Zio) outperform Holter in detecting clinically significant events. Wearable-guided cardiac rehabilitation improves functional capacity (e.g., VO2peak), steps, and distance compared with traditional models, supporting home-based programs and hybrid care.[^3]

Respiratory. Smart inhalers and in-home spirometry (e.g., Air Next) provide adherence and lung function data to adjust therapy in asthma and COPD. Bluetooth-enabled devices pair with smartphones and route data to clinician dashboards, facilitating timely interventions.[^8][^3]

Table 10. Chronic disease device categories, data, and therapeutic decisions

| Category | Device examples | Key data | Decision impacts |
|---|---|---|---|
| Diabetes | CGM (Libre, G6); connected pens; AI-augmented AID systems | Glucose trends; dose logs; activity/HR | Basal/bolus adjustments; hypoglycemia prevention |
| Cardiovascular | ECG patches; HR monitors | Rhythm events; HR; activity | Anticoagulation review; CR progression |
| Respiratory | Smart inhalers; home spirometers | Inhaler technique/usage; FEV1 | Step-up therapy; rescue protocol triggers |
| Multi-morbidity | Wearable vital sign platforms | HR, RR, SpO2, temperature | Early warning and escalation protocols |

Connected Devices and Homecare. Home settings and respiratory care dominate connected device adoption due to the need for ongoing monitoring and the practicality of smartphone pairing. Bluetooth facilitates low-friction onboarding, while cloud platforms enable clinician dashboards and alerts—critical for decentralized care models and virtual clinical operations.[^8]

## Real-Time Health Data Integration

The data path from device to EHR typically flows as: device sensor → gateway (smartphone or bedside hub) → cloud/middleware → FHIR API → EHR. Designing for real time requires attention to latency, error handling, provenance, and authentication—while security must be built in from the outset.

Table 11. Real-time data flow architecture

| Component | Considerations |
|---|---|
| Device/gateway | Local buffering; time sync; secure pairing; battery and reliability |
| Cloud/middleware | Scalable ingestion; transformation to FHIR; audit logs; resiliency |
| FHIR API | Standardized resources; RESTful operations; pagination; rate limits |
| EHR | Auth/authorization; SMART on FHIR; CDS hooks; clinician workflow fit |

Interoperability standards. FHIR (R4) provides granular resources and web-native APIs, with JSON/XML serialization and HTTP-based REST operations. SMART on FHIR leverages OAuth-based authorization for apps, enabling secure, user-granted access to data. FHIR’s granular approach contrasts favorably with legacy HL7 messaging, reducing variability and enabling modular consumption of data by multiple downstream consumers.[^4][^5]

Security and privacy. The FDA’s 2025 cybersecurity guidance underscores secure-by-design controls, threat modeling, vulnerability management, and secure update mechanisms—all documented within a quality system context. Sector-wide plans (e.g., Health Sector Coordinating Council’s joint security plan) and global guidance (e.g., GDHP) reinforce lifecycle security practices. These align naturally with encryption standards, role-based access control (RBAC), and multi-factor authentication (MFA) in integration middleware.[^9][^12][^13][^6]

Table 12. Security controls mapping (FDA guidance to technical measures)

| FDA cybersecurity theme | Technical control examples |
|---|---|
| Secure design and risk management | Threat modeling; architecture risk analysis; SBOMs; secure boot; hardware roots of trust |
| Vulnerability management | Coordinated disclosure; patching cadence; SBOM maintenance; testing protocols |
| Secure update mechanisms | Signed updates; secure OTA; rollback plans; version tracking |
| Authentication/authorization | OAuth2/OIDC; MFA; RBAC; least privilege |
| Logging and monitoring | Immutable logs; anomaly detection; audit trails |
| Data protection | Encryption in transit/at rest; key management; device identity |

## Automated Medication Reminders and Scheduling

Reminder systems span device-native alarms (e.g., dispensers, inhalers), mobile apps, caregiver portals, and pharmacy platforms. The most effective designs personalize schedules, escalate non-responsiveness, and integrate refill planning and synchronization.

Table 13. Reminder modalities and integration pathways

| Modality | Typical triggers | Escalation logic | Integration endpoints |
|---|---|---|---|
| Smart pill dispensers | Missed dose timer | Caregiver app alert; repeated prompts | Cloud portal; FHIR MedicationAdministration |
| Mobile apps (companion) | Schedule adherence; refill threshold | Push notifications; caregiver alert | App backend; FHIR MedicationStatement; pharmacy refill API |
| Pharmacy platforms | Refill due; med synchronization | Pharmacy outreach; auto-refill workflow | Pharmacy management system (e.g., EnterpriseRx) |
| Inhalers/connected pens | Usage frequency; technique cues | App coaching; clinician flag | Cloud dashboards; EHR via FHIR |

Market trends. As smart dispensers add cloud connectivity and caregiver portals, they enable timely interventions without adding friction to clinical teams. Pharmacy platforms like EnterpriseRx provide synchronization and adherence tools across populations, making them natural partners for adherence programs. Home-first workflows benefit from transparent caregiver visibility and real-time notifications when doses are missed.[^2][^25]

Patient Engagement and Adherence Outcomes. Evidence shows technology-assisted reminders and monitoring can increase adherence, but results vary by population and protocol. A 2024 review highlighted improved physical activity and rehabilitation adherence with wearables; digital weight-loss interventions demonstrated modest but significant improvements versus controls. Yet many adherence technologies rely on proxy measures (container openings), and direct ingestion confirmation (ingestible sensors) introduces privacy and tolerability trade-offs. As a result, design choices should emphasize usability, clear escalation logic, and integration with care team workflows.[^3][^22]

Table 14. Evidence snapshots: adherence interventions and outcomes

| Intervention | Outcome snapshot |
|---|---|
| Wearable-guided cardiac rehab (meta-analysis) | Improvements in LVEF, 6-minute walk distance, VO2peak |
| Digital weight-loss programs | Average 2.24 kg greater loss vs. controls over 6 months |
| Telerehab adherence (stroke) | Higher adherence vs. in-clinic (98.3% vs. 93.3%) |

## Integration with Electronic Health Records (EHR)

FHIR provides the “Rosetta Stone” for mapping device and adherence data into the EHR. The goal is not simply to push data in, but to fit seamlessly into clinician workflow—supporting documentation, CDS, and research.

Table 15. FHIR resource mapping for device and adherence data

| Data element | FHIR resource(s) | Notes |
|---|---|---|
| Device identity and capabilities | Device, DeviceMetric | UDI where available; metric definitions |
| Vital sign observations | Observation | LOINC-coded tests; interpretation |
| Medication orders | MedicationRequest | Order context; dose/timing |
| Dose administration events | MedicationAdministration | Effective time; performer; device reference |
| Adherence summary | MedicationStatement | Reason codes; adherence period |
| Diagnostic reports | DiagnosticReport | Summaries of device-based evaluations |

SMART on FHIR apps enable secure, user-consented access for medication reminder apps, adherence dashboards, or CDS tools to read and write specific data elements within the EHR, reducing the need for separate portals and manual transcription. In clinical investigations, EHR data can be used alongside device data to streamline endpoints and reduce site burden—subject to data quality and provenance expectations.[^4][^19][^18]

Workflow Integration and Clinical Decision Support. Device-EHR integration is foundational for CDS. In acute care, integrated devices (pumps, ventilators, vital signs machines) support safety alerts and early warnings; in ambulatory and home settings, wearable observations and adherence signals should likewise drive relevant CDS. Individualized models and advanced analytics (e.g., Bayesian, deep learning) can reduce false alarms, but only if data are timely, contextual, and interoperable. Mapping to EHR workflows—and using clinician-approved CDS hooks—improves adoption and reduces cognitive load.[^7]

## Regulatory and Compliance Framework (2024–2025)

Cybersecurity. FDA’s 2025 final guidance “Cybersecurity in Medical Devices: Quality System Considerations and Content of Premarket Submissions” strengthens expectations for secure design, lifecycle management, and documentation. Key themes include threat modeling, SBOMs, secure updates (including OTA), coordinated vulnerability disclosure, and patching strategies. Manufacturers must align quality system processes with cybersecurity risk management and be explicit about controls in submissions. Industry coverage confirms the 2025 update and highlights implications for premarket content.[^9][^10][^11]

AI-enabled devices and SaMD. FDA maintains a list of AI-enabled medical devices authorized for marketing, reflecting a growing ecosystem of algorithms embedded in clinical workflows. In parallel, draft guidance discussions on AI in SaMD emphasize lifecycle considerations, transparency, performance monitoring, and change control for adaptive models—relevant to pharma when algorithms influence therapy initiation, dosing, or monitoring. Academic reviews provide taxonomies of authorized AI devices and their clinical/technical features.[^28][^29]

sDHT list. FDA’s list of sensor-based digital health technologies provides visibility into authorized devices and indications, which can inform evidentiary strategies when integrating devices into pharma programs (e.g., selecting devices with established regulatory status and known performance characteristics).[^23]

Table 16. Regulatory timelines and document references

| Topic | 2024–2025 milestone | Implication |
|---|---|---|
| Cybersecurity guidance | Final guidance issued (June 2025) | Strengthened premarket documentation and lifecycle controls |
| AI-enabled devices | Ongoing listings and taxonomies | Algorithm governance and change control planning |
| sDHT list | Continuously updated | Device selection and evidence planning |

Table 17. Cybersecurity controls checklist mapped to FDA guidance

| Control area | Practical checklist |
|---|---|
| Risk management | Threat models; architectural risk analysis; security requirements |
| Design | Secure boot; hardware security; minimal attack surface |
| Software lifecycle | SBOMs; signed updates; vulnerability remediation |
| Operations | Coordinated disclosure; monitoring; incident response |
| Documentation | Security controls mapping; test evidence; labeling |

## Strategic Implications for Pharmaceutical Platforms

Pharma is moving “from pills to devices,” collaborating across the IoT ecosystem to deliver integrated therapies. This shift is as much about operating model change as about technology. To succeed, pharma should blend internal capabilities with targeted partnerships, and instrument programs for both clinical impact and scalable data.

Go-to-market strategies. Direct-to-patient models, companion apps, and connected devices are converging into end-to-end experiences that shorten time-to-therapy, improve adherence, and generate real-world evidence (RWE). Partnerships with device makers (e.g., inhalers, pens, patches), middleware vendors, and pharmacy platforms help pharma deliver at scale. Industry reporting in 2024 highlights acquisitions and collaborations that deepen device capabilities and expand data-driven care.[^27][^8]

Table 18. Pharma partnership archetypes

| Partner type | Value delivered | Examples (illustrative) |
|---|---|---|
| Device manufacturers | Connected delivery and monitoring hardware | Smart inhalers; connected pens; spirometers |
| Digital health platforms | App orchestration; analytics; CDS | Companion apps; adherence dashboards |
| EHR/middleware vendors | FHIR integration; workflow fit | SMART on FHIR apps; CDS hooks |
| Pharmacy platforms | Med sync; adherence programs | EnterpriseRx and similar |
| Health systems/ACO | Virtual care; RPM/RTM | Decentralized trials and care |

Evidence generation and outcomes. Wearables and connected devices enable continuous endpoints and more patient-centric trials. By integrating device data with EHRs and leveraging FHIR for standardized mapping, pharma can streamline endpoints, reduce site burden, and produce generalizable RWE. The same data flows support post-market surveillance and label expansions where device signals inform efficacy and safety.[^18][^4]

Business model evolution. Combination products (drug + connected device + software + service) expand the definition of therapy. Pricing and reimbursement will increasingly reflect measurable outcomes and adherence improvements. RPM and RTM codes, as well as evolving payer policies, create new venues for capturing value—though country-specific coverage details require local policy analysis. The strategic imperative is to build operating models that can scale across markets while maintaining data security and quality.[^24][^27][^8]

## Implementation Playbook

What follows is a pragmatic, phased plan to move from concept to scaled deployment, with security and interoperability embedded throughout.

1) Device selection and regulatory path
- Choose devices with appropriate regulatory status (e.g., sDHT listings, 510(k) clearances) and validated performance in target populations. For combination products, align early on device regulatory strategy and labeling.[^23][^8]

2) Data integration architecture
- Design a device-to-EHR pipeline using FHIR resources. Define Device, DeviceMetric, Observation, MedicationRequest/Administration/Statement, and DiagnosticReport mappings. Use SMART on FHIR for user-authorized access. Implement middleware for transformation, audit, and resilience.[^4][^5][^19]

3) EHR workflows and CDS integration
- Map signals to clinician workflows (e.g., alerts for missed doses, CGM-driven insulin adjustments). Pilot CDS hooks and measure alert fatigue; iterate on thresholds and logic with clinician champions.[^7]

4) Security controls and compliance
- Align to FDA cybersecurity guidance: threat modeling, SBOMs, secure updates, vulnerability management, logging, encryption, RBAC/MFA, and incident response. Document controls for premarket submissions and ongoing lifecycle management.[^9][^12][^13]

5) Pilot, scale-up, and continuous improvement
- Start with limited cohorts; validate adherence lift and clinical utility. Scale by integrating with pharmacy platforms and caregiver portals; expand to additional therapeutic areas. Monitor drift, update models and rules, and maintain SBOMs.

Table 19. Integration blueprint: modules, standards, data contracts

| Module | Standards/tools | Data contracts (illustrative) |
|---|---|---|
| Device ingestion | Bluetooth/Wi‑Fi; SDKs | DeviceID, metric type, timestamp, value |
| Middleware | FHIR server; IRIS or equivalent | Device, DeviceMetric, Observation resources |
| EHR integration | SMART on FHIR; CDS hooks | MedicationAdministration, MedicationStatement |
| Analytics | Cloud data platform | Derived metrics (time-in-range, missed dose %) |

Table 20. Security controls checklist aligned to FDA guidance

| Area | Control examples |
|---|---|
| Identity & access | Device identity; MFA; RBAC; OAuth2/OIDC |
| Data protection | TLS; encryption at rest; key rotation |
| Software integrity | Signed code; secure boot; SBOMs |
| Vulnerability mgmt | Regular scans; coordinated disclosure; patch SLAs |
| Monitoring | Audit logs; SIEM integration; anomaly detection |
| Incident response | Playbooks; forensic logging; regulatory reporting |

## Outlook to 2030: Convergence, AI, and 5G

By 2030, the market will be substantially larger and more mature. IoT medical devices are projected to reach US$154.74 billion by 2030 (18.9% CAGR from 2025), with patient monitors and home-based solutions as growth leaders. Device connectivity will continue to shift toward secure, low-power paradigms, while cloud platforms standardize data integration.[^1][^14]

AI will be embedded throughout—inside devices, in cloud analytics, and as SaMD—governed by evolving lifecycle and transparency expectations. FDA’s AI device listings and academic taxonomies point to a future where algorithms are tightly coupled to clinical contexts and change control is routine.[^28][^29]

5G will incrementally enhance real-time capabilities, particularly for bandwidth-intensive video or high-frequency multi-sensor streams. As public networks densify and enterprise campus deployments expand, the last mile will become less of a constraint for streaming clinical data, but security and reliability remain the gating factors for clinical use.[^21]

Table 21. 2025–2030 forecast highlights

| Domain | 2025 baseline | 2030 outlook | Note |
|---|---|---|---|
| IoT medical devices (US$ Bn) | 65.08 | 154.74 | CAGR 18.9% |
| Patient monitors | Fastest-growing segment | — | Home + facility hybrid |
| AI-enabled devices | Growing listings | Mature taxonomy and governance | Change control normalized |
| Connectivity | Wi‑Fi/Bluetooth dominant | 5G in specific use cases | Security-first designs |

## Appendices

### Appendix A: FHIR Resource Mapping Cheat Sheet for Device/Adherence Data

Table 22. FHIR resource mapping cheat sheet

| Entity | FHIR resource | Key fields |
|---|---|---|
| Device | Device | identifier (UDI), type, status |
| Device metric | DeviceMetric | type, category, measurement |
| Vital sign | Observation | code, value[x], effective[x], interpretation |
| Med order | MedicationRequest | intent, status, dosage, subject |
| Dose event | MedicationAdministration | status, effective[x], performer, device |
| Adherence summary | MedicationStatement | status, adherence, reason[x] |
| Diagnostic report | DiagnosticReport | code, conclusion, presentedForm |

References: FHIR standard and resources; SMART on FHIR app model.[^4][^5][^19]

### Appendix B: Evidence Snapshots from Wearables in Chronic Disease

- Cardiology: PPG-based AF detection with high PPV; ECG patches detecting more events than Holter; wearable-guided cardiac rehab improves functional capacity.
- Respiratory: Home spirometry and smart inhalers yield actionable adherence/technique signals; wearables for activity and sleep show usability considerations.
- Endocrinology: CGM accuracy around 9% MARD; AI-augmented insulin delivery with improved time-in-range; experimental noninvasive glucose approaches show promising MARDs in early studies.[^3]

### Appendix C: Glossary of Standards and Acronyms

- FHIR: Fast Healthcare Interoperability Resources
- HL7: Health Level Seven (legacy messaging standards)
- CDS: Clinical Decision Support
- SaMD: Software as a Medical Device
- sDHT: sensor-based Digital Health Technology
- RPM/RTM: Remote Patient Monitoring / Remote Therapeutic Monitoring
- MARD: Mean Absolute Relative Difference (accuracy metric for glucose monitoring)
- SBOM: Software Bill of Materials
- UDI: Unique Device Identifier
- OTA: Over-the-Air (software updates)

## References

[^1]: IoT Medical Devices Market Growth, Drivers, and Opportunities (MarketsandMarkets, 2025). https://www.marketsandmarkets.com/Market-Reports/iot-medical-device-market-15629287.html  
[^2]: Global Smart Pill Dispenser Market (Data Bridge Market Research, 2024). https://www.databridgemarketresearch.com/reports/global-smart-pill-dispenser-market  
[^3]: The Role of Wearable Devices in Chronic Disease Monitoring (Scoping Review, 2024). https://pmc.ncbi.nlm.nih.gov/articles/PMC11461032/  
[^4]: The Fast Health Interoperability Resources (FHIR) Standard (NIH/PMC, 2021). https://pmc.ncbi.nlm.nih.gov/articles/PMC8367140/  
[^5]: FHIR Implementation Guide Registry (FHIR.org). https://www.fhir.org/guides/registry/  
[^6]: Medical Device Integration with EHR: Best Practices and Examples (Cleveroad, 2023). https://www.cleveroad.com/blog/medical-device-integration-with-ehr/  
[^7]: Integrated Medical Devices and Clinical Decision Support in Acute Care (Scoping Review, 2022). https://pmc.ncbi.nlm.nih.gov/articles/PMC9797347/  
[^8]: Connected Drug Delivery Devices: Emerging Market Trends (2025). https://www.drugdeliveryleader.com/doc/connected-drug-delivery-devices-emerging-market-trends-0001  
[^9]: FDA Final Guidance: Cybersecurity in Medical Devices (June 2025). https://www.fda.gov/regulatory-information/search-fda-guidance-documents/cybersecurity-medical-devices-quality-system-considerations-and-content-premarket-submissions  
[^10]: FDA Replaces Cybersecurity Guidance for Medical Devices (RAPS, 2025). https://www.raps.org/news-and-articles/news-articles/2025/6/fda-replaces-cybersecurity-guidance-for-medical-de  
[^11]: FDA Releases Final Guidance on Medical Device Cybersecurity (Emergo by UL, 2025). https://www.emergobyul.com/news/fda-releases-final-guidance-medical-device-cybersecurity  
[^12]: Medical Technology and Health IT Joint Security Plan v2 (Health Sector Coordinating Council, 2024). https://healthsectorcouncil.org/wp-content/uploads/2024/03/Medical-Technology-and-Health-IT-Joint-Security-Plan-v2.pdf  
[^13]: GDHP Guidance for Medical Device Cybersecurity (2024). https://gdhp.health/wp-content/uploads/2024/10/GDHP-Guidance-for-Medical-Device-Cybersecurity_final.pdf  
[^14]: IoT Medical Devices Market Press Release (MarketsandMarkets, 2025). https://www.marketsandmarkets.com/PressReleases/iot-medical-device.asp  
[^15]: Internet of Things in Healthcare Market (Grand View Research). https://www.grandviewresearch.com/industry-analysis/internet-of-things-iot-healthcare-market  
[^16]: Internet of Medical Things (IoMT) Market (Market.us). https://market.us/report/internet-of-medical-things-iomt-market/  
[^17]: FHIR and the Future of Labeling (Reed Tech). https://www.reedtech.com/knowledge-center/fhir-labeling/  
[^18]: Use of EHR Data in Clinical Investigations (FDA Guidance). https://www.fda.gov/regulatory-information/search-fda-guidance-documents/use-electronic-health-record-data-clinical-investigations-guidance-industry  
[^19]: How FHIR Enables Seamless Healthcare Data Integration (Helixbeat). https://helixbeat.com/fhir-standard-enables-seamless-data-integration-in-healthcare/  
[^20]: Device Software Functions Including Mobile Medical Applications (FDA). https://www.fda.gov/medical-devices/digital-health-center-excellence/device-software-functions-including-mobile-medical-applications  
[^21]: Real-Time Health Monitoring Using 5G Networks: Deep Learning Approach (2025). https://pmc.ncbi.nlm.nih.gov/articles/PMC12488166/  
[^22]: Technologies for Medication Adherence Monitoring and Assessment Criteria (JMIR mHealth, 2022). https://pmc.ncbi.nlm.nih.gov/articles/PMC8949687/  
[^23]: Medical Devices that Incorporate Sensor-Based Digital Health Technology (sDHT) (FDA). https://www.fda.gov/medical-devices/digital-health-center-excellence/medical-devices-incorporate-sensor-based-digital-health-technology  
[^24]: Electronic Health Records (CMS). https://www.cms.gov/priorities/key-initiatives/e-health/records  
[^25]: EnterpriseRx Pharmacy Management Software (McKesson). https://www.mckesson.com/pharmacy-technology/solutions-software/pharmacy-management-software/enterpriserx-pharmacy-management-system/  
[^26]: FDA Clears Single-Use Chest-Based Wearable for Patient Monitoring (LifeSignals). https://respiratory-therapy.com/products-treatment/monitoring-treatment/patient-monitoring-products/fda-clears-single-use-chest-based-wearable-patient-monitoring/  
[^27]: From Pills to Devices: How Pharma Is Expanding Into the Medical Device Market (Forbes, 2024). https://www.forbes.com/councils/forbesbusinessdevelopmentcouncil/2024/11/18/from-pills-to-devices-how-pharma-is-expanding-into-the-medical-device-market/  
[^28]: Artificial Intelligence-Enabled Medical Devices (FDA). https://www.fda.gov/medical-devices/software-medical-device-samd/artificial-intelligence-enabled-medical-devices  
[^29]: How AI is used in FDA-authorized medical devices: a taxonomy (npj Digital Medicine, 2025). https://www.nature.com/articles/s41746-025-01800-1