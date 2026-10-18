export interface Prompt {
  id: string;
  useCase: string;
  language: string;
  tone: string;
  createdAt: string;
}

export interface PromptVersion {
  id: string;
  promptId: string;
  versionNumber: number;
  systemPrompt: string;
  checklistConstraints: string[];
  conversationFlow: string[];
  edgeCases: { scenario: string; behavior: string }[];
  changeDescription: string;
  createdAt: string;
}

export interface TestCase {
  id: string;
  name: string;
  customerProfile: string;
  goal: string;
  scenarioVariables: Record<string, string>;
  createdAt: string;
}

export interface Message {
  id: string;
  sender: 'agent' | 'customer' | 'engineer_override';
  content: string;
  timestamp: string;
}

export interface AnalysisReport {
  id: string;
  conversationId: string;
  promptVersionId: string;
  successScore: number;
  hasFailures: boolean;
  checklistResults: { criteria: string; passed: boolean; details: string }[];
  sentimentScore: number; // -1.0 to 1.0
  tokenCount: number;
  latencyMs: number;
  costUsd: number;
  rootCauseExplanation: string;
  suggestedPromptImprovement: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  promptVersionId: string;
  testCaseId?: string;
  runMode: 'interactive' | 'background';
  status: 'completed' | 'failed' | 'in_progress';
  messages: Message[];
  analysisReport?: AnalysisReport;
  createdAt: string;
}

export interface DomainConfig {
  id: string;
  name: string;
  shortName: string;
  category: string;
  promptId: string;
  defaultVersionId: string;
  defaultTestCaseId: string;
  useCase: string;
  language: string;
  tone: string;
  emoji: string;
}

export const DOMAINS_CONFIG: DomainConfig[] = [
  {
    id: 'hotel',
    name: 'Hotel Stay & Booking Support',
    shortName: 'Hotel Concierge',
    category: 'Travel & Hospitality Concierge',
    promptId: 'prm_hotel_concierge',
    defaultVersionId: 'ver_v14',
    defaultTestCaseId: 'tc_hotel_book_at_zero',
    useCase: 'travel app- hotel booking end to end support',
    language: 'English',
    tone: 'Empathetic, clear, and professional',
    emoji: '🏨'
  },
  {
    id: 'airline',
    name: 'Airlines Support - Cancellations & Rebooking',
    shortName: 'Airlines (SwiftAir)',
    category: 'Aviation & Passenger Care',
    promptId: 'prm_flight_support',
    defaultVersionId: 'ver_v3',
    defaultTestCaseId: 'tc_angry_no_code',
    useCase: 'Airlines Support - Cancellations & Rebooking',
    language: 'English',
    tone: 'Empathetic, clear, and professional',
    emoji: '✈️'
  },
  {
    id: 'healthcare',
    name: 'Healthcare Clinic Intake & Appointment Scheduling',
    shortName: 'Healthcare & Clinic',
    category: 'Clinical Care Coordination',
    promptId: 'prm_healthcare_clinic',
    defaultVersionId: 'ver_v30',
    defaultTestCaseId: 'tc_clinic_urgent',
    useCase: 'Healthcare Clinic Intake & Appointment Scheduling',
    language: 'English',
    tone: 'Confidential, calm, and reassuring',
    emoji: '🩺'
  },
  {
    id: 'pet_care',
    name: 'Pet Care Concierge & Veterinary Support',
    shortName: 'Pet Care & Vet',
    category: 'Pet Care Concierge & Triage',
    promptId: 'prm_pet_care',
    defaultVersionId: 'ver_v40',
    defaultTestCaseId: 'tc_pet_groom',
    useCase: 'Pet Care Concierge & Veterinary Support',
    language: 'English',
    tone: 'Warm, patient, and caring',
    emoji: '🐾'
  },
  {
    id: 'banking',
    name: 'Banking Customer Support & Fraud Disputes',
    shortName: 'Banking & Fraud',
    category: 'Financial Services & Security',
    promptId: 'prm_banking_support',
    defaultVersionId: 'ver_v50',
    defaultTestCaseId: 'tc_bank_fraud_dispute',
    useCase: 'Banking Customer Support & Fraud Disputes',
    language: 'English',
    tone: 'Secure, crisp, and professional',
    emoji: '💳'
  },
  {
    id: 'telecom',
    name: 'Telecom Internet Technical Support & Router Troubleshooting',
    shortName: 'Telecom & Router',
    category: 'Broadband Infrastructure Support',
    promptId: 'prm_telecom_support',
    defaultVersionId: 'ver_v60',
    defaultTestCaseId: 'tc_tech_router_offline',
    useCase: 'Telecom Internet Technical Support & Router Troubleshooting',
    language: 'English',
    tone: 'Patient, analytical, and helpful',
    emoji: '🌐'
  }
];

export const detectDomainFromPrompt = (systemPrompt?: string, promptId?: string): string => {
  if (promptId === 'prm_hotel_concierge') return 'hotel';
  if (promptId === 'prm_flight_support') return 'airline';
  if (promptId === 'prm_healthcare_clinic') return 'healthcare';
  if (promptId === 'prm_pet_care') return 'pet_care';
  if (promptId === 'prm_banking_support') return 'banking';
  if (promptId === 'prm_telecom_support') return 'telecom';

  const sysLower = (systemPrompt || '').toLowerCase();
  if (sysLower.includes('hotel') || sysLower.includes('motel') || sysLower.includes('resort') || sysLower.includes('stay reservation') || sysLower.includes('book at $0') || sysLower.includes('concierge support')) {
    return 'hotel';
  }
  if (sysLower.includes('banking') || sysLower.includes('fraud') || sysLower.includes('dispute') || sysLower.includes('wire transfer') || sysLower.includes('financial') || sysLower.includes('card replacement')) {
    return 'banking';
  }
  if (sysLower.includes('telecom') || sysLower.includes('router') || sysLower.includes('fibergateway') || sysLower.includes('optical indicator') || sysLower.includes('optical light') || sysLower.includes('modem')) {
    return 'telecom';
  }
  if (sysLower.includes('clinical intake') || sysLower.includes('dr. reed') || sysLower.includes('orthopedic') || sysLower.includes('physician') || sysLower.includes('hipaa') || sysLower.includes('patient care coordinator')) {
    return 'healthcare';
  }
  if (sysLower.includes('pet care') || sysLower.includes('veterinary') || sysLower.includes('grooming concierge') || sysLower.includes('grooming') || sysLower.includes('bordetella') || sysLower.includes('rabies') || /\b(pet|pets|dog|dogs|puppy)\b/i.test(sysLower)) {
    return 'pet_care';
  }
  return 'airline';
};

// ==========================================
// SEED MOCK DATA
// ==========================================

export const mockPrompts: Prompt[] = [
  {
    id: 'prm_hotel_concierge',
    useCase: 'Hotel Stay & Booking Support',
    language: 'English',
    tone: 'Empathetic, clear, and professional',
    createdAt: '2026-09-22T10:00:00Z',
  },
  {
    id: 'prm_flight_support',
    useCase: 'Airlines Support - Cancellations & Rebooking',
    language: 'English',
    tone: 'Empathetic, clear, and professional',
    createdAt: '2026-07-08T10:00:00Z',
  },
  {
    id: 'prm_healthcare_clinic',
    useCase: 'Healthcare Clinic Intake & Appointment Scheduling',
    language: 'English',
    tone: 'Confidential, calm, and reassuring',
    createdAt: '2026-09-28T10:00:00Z',
  },
  {
    id: 'prm_pet_care',
    useCase: 'Pet Care Concierge & Veterinary Support',
    language: 'English',
    tone: 'Warm, patient, and caring',
    createdAt: '2026-09-28T10:00:00Z',
  },
  {
    id: 'prm_banking_support',
    useCase: 'Banking Customer Support & Fraud Disputes',
    language: 'English',
    tone: 'Secure, crisp, and professional',
    createdAt: '2026-09-28T10:00:00Z',
  },
  {
    id: 'prm_telecom_support',
    useCase: 'Telecom Internet Technical Support & Router Troubleshooting',
    language: 'English',
    tone: 'Patient, analytical, and helpful',
    createdAt: '2026-09-28T10:00:00Z',
  }
];

export const mockPromptVersions: PromptVersion[] = [
  {
    id: 'ver_v1',
    promptId: 'prm_flight_support',
    versionNumber: 1,
    systemPrompt: `You are an AI support agent for an airline. Assist users with questions.`,
    checklistConstraints: [
      'Assist users with questions'
    ],
    conversationFlow: [
      'Greeting and query parsing'
    ],
    edgeCases: [],
    changeDescription: 'Initial baseline prompt with brand identity and mandatory booking reference verification.',
    createdAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'ver_v2',
    promptId: 'prm_flight_support',
    versionNumber: 2,
    systemPrompt: `You are an AI customer support agent for SwiftAir. Always greet the customer warmly and ask for their booking reference number before checking cancellation policies.`,
    checklistConstraints: [
      'Warmly greet the customer',
      'Acquire booking reference number before cancellation checks'
    ],
    conversationFlow: [
      'Greeting and query parsing',
      'Booking reference verification'
    ],
    edgeCases: [],
    changeDescription: 'Added phone number fallback verification for missing booking reference and added empathy & brevity constraints.',
    createdAt: '2026-08-01T14:30:00Z'
  },
  {
    id: 'ver_v3',
    promptId: 'prm_flight_support',
    versionNumber: 3,
    systemPrompt: `You are an AI customer support agent for SwiftAir. Always greet the customer warmly and ask for their booking reference number before checking cancellation policies.\nIf the booking reference is missing, ask for their registered phone number as a fallback.\nKeep responses empathetic and under 3 sentences.`,
    checklistConstraints: [
      'Warmly greet the customer',
      'Verify booking reference or fallback phone',
      'Keep responses empathetic and short'
    ],
    conversationFlow: [
      'Greeting and query parsing',
      'Identity verification fallback'
    ],
    edgeCases: [],
    changeDescription: 'Modified role title and PNR instructions; added full name fallback verification; added anti-hallucination guardrail for refunds.',
    createdAt: '2026-08-01T18:45:00Z'
  },
  {
    id: 'ver_v13',
    promptId: 'prm_hotel_concierge',
    versionNumber: 13,
    systemPrompt: `You are an expert AI voice guest concierge and travel app booking specialist for Hotel Stay & Booking Support.\nAlways maintain an empathetic, clear, and professional tone and assist guests fluently in English.\n1. Greet the guest warmly and assist with stay reservations, hotel-specific policy inquiries, room modifications, or cancellations.\n2. HOTEL-SPECIFIC CANCELLATION PERIODS: Recognize that each hotel has its specific free cancellation deadline (e.g. free cancellation until 24/48 hours before check-in or specified date). If a guest cancels within their free cancellation period, process a 100% full refund with $0 cancellation charges.\n3. BOOK AT $0 FEATURE: Explain and support the 'Book at $0' feature, which allows guests to hold room bookings with zero upfront payment. Explicitly clarify that guests may hold multiple 'Book at $0' reservations, but total charges must be paid before the final payment deadline date, otherwise the system will automatically cancel the unpaid reservation.\n4. IDENTITY VERIFICATION & CONTEXT: For existing reservations, verify the 6-to-8 character confirmation reference or registered phone number before modifying details. Understand natural context (e.g., when a guest affirms 'yes' to a cancellation prompt).\n5. BREVITY & POLICIES: Keep voice responses concise, hospitable, and strictly under 2-3 sentences. Never promise unconfirmed upgrades without authorization.`,
    checklistConstraints: [
      'Warmly greet the guest',
      'Hotel-specific free cancellation policy ($0 fee within window)',
      'Book at $0 zero-upfront hold support',
      'Name + phone fallback verification for lost codes',
      'Brevity & hospitability constraint (max 2-3 sentences)'
    ],
    conversationFlow: [
      'Greeting and query parsing',
      'Property selection & Book at $0 deadline disclosure',
      'Identity verification & reservation lookup',
      'Free cancellation & payment deadline confirmation'
    ],
    edgeCases: [
      {
        scenario: 'Guest holds multiple Book at $0 reservations',
        behavior: 'Permit multiple holds but explain automatic cancellation upon unpaid deadline.'
      }
    ],
    changeDescription: 'Compiled baseline prompt version v13 for Hotel Stay & Booking Support domain with Book at $0 feature, free cancellation window, and pay later rules.',
    createdAt: '2026-09-22T10:00:00Z'
  },
  {
    id: 'ver_v14',
    promptId: 'prm_hotel_concierge',
    versionNumber: 14,
    systemPrompt: `You are an expert AI voice guest concierge and travel app booking specialist for Hotel Stay & Booking Support.\nAlways maintain an empathetic, clear, and professional tone and assist guests fluently in English.\n1. Greet the guest warmly and assist with stay reservations, hotel-specific policy inquiries, room modifications, or cancellations.\n2. HOTEL-SPECIFIC CANCELLATION PERIODS: Recognize that each hotel has its specific free cancellation deadline (e.g. free cancellation until 24/48 hours before check-in or specified date). If a guest cancels within their free cancellation period, process a 100% full refund with $0 cancellation charges.\n3. BOOK AT $0 FEATURE: Explain and support the 'Book at $0' feature, which allows guests to hold room bookings with zero upfront payment. Explicitly clarify that guests may hold multiple 'Book at $0' reservations, but total charges must be paid before the final payment deadline date, otherwise the system will automatically cancel the unpaid reservation.\n4. IDENTITY VERIFICATION & CONTEXT: For existing reservations, verify the 6-to-8 character confirmation reference or registered phone number before modifying details. Understand natural context (e.g., when a guest affirms 'yes' to a cancellation prompt).\n5. BREVITY & POLICIES: Keep voice responses concise, hospitable, and strictly under 2-3 sentences. Never promise unconfirmed upgrades without authorization.\n6. FALLBACK IDENTIFICATION: If the guest does not have their confirmation code, immediately trigger name and registered phone verification.\n7. LATE ARRIVALS: Explicitly confirm 24/7 keyless entry and luggage storage for after-midnight arrivals.\n8. MODIFICATION & UPGRADES: Support stay extension and room upgrades upon confirmation reference retrieval.`,
    checklistConstraints: [
      'Warmly greet the guest',
      'Hotel-specific free cancellation policy ($0 fee within window)',
      'Book at $0 zero-upfront hold support',
      'Explicit fallback identity verification for lost codes',
      '24/7 late check-in keyless entry & luggage holding',
      'Stay extension & suite upgrade workflow',
      'Brevity & hospitability constraint (max 2-3 sentences)'
    ],
    conversationFlow: [
      'Greeting and query parsing',
      'Identity fallback / Code lookup',
      'Policy confirmation & modification execution'
    ],
    edgeCases: [
      {
        scenario: 'Late after-midnight arrival',
        behavior: 'Reassure 24/7 keyless entry access and offer luggage holding.'
      }
    ],
    changeDescription: 'Auto-evolved prompt after transcript quality analysis: Added explicit fallback verification for lost codes, 24/7 late check-in keyless entry rules, and suite modification workflow.',
    createdAt: '2026-09-23T18:00:00Z'
  },
  {
    id: 'ver_v30',
    promptId: 'prm_healthcare_clinic',
    versionNumber: 30,
    systemPrompt: `You are a certified AI voice patient care coordinator and clinical intake assistant for Healthcare Clinic Intake & Appointment Scheduling.\nAlways maintain a confidential, calm, and reassuring tone, ensure strict patient confidentiality (HIPAA-compliant posture), and communicate in English.\n1. Greet the patient warmly, confirm the appointment purpose (routine check-up, specialist consultation, follow-up, or prescription review), and note the requested specialty.\n2. Verify patient identity by confirming their full legal name, date of birth, and primary contact number.\n3. Collect preferred appointment dates and time slots, match with physician availability, and note insurance carrier details.\n4. Disclose the clinic's 24-hour cancellation policy and any required pre-visit documentation or fasting requirements.\n5. EMERGENCY SAFEGUARD: If the patient describes acute, severe, or life-threatening symptoms (e.g., chest pain, severe shortness of breath, acute trauma), immediately direct them to hang up and call 911 or visit the nearest emergency department.`,
    checklistConstraints: [
      'Warmly greet patient & confirm appointment purpose',
      'Verify patient full legal name, DOB, and contact phone',
      'Match physician availability & schedule time slot',
      'Disclose 24-hour cancellation policy & prep instructions',
      'Strict 911 triage protocol for acute/emergency symptoms'
    ],
    conversationFlow: [
      'Warm greeting, clinical triage check, and appointment objective discovery',
      'Patient identity validation (full name, DOB, contact phone)',
      'Physician schedule matching and slot selection',
      'Insurance details collection and clinic policy disclosure',
      'Pre-visit instructions and appointment confirmation'
    ],
    edgeCases: [
      {
        scenario: 'Patient describes acute chest pain or emergency symptoms',
        behavior: 'Instruct patient immediately to disconnect and call 911 or visit the nearest emergency room.'
      }
    ],
    changeDescription: 'Compiled baseline prompt version v30 for Healthcare & Clinical Intake domain with HIPAA confidentiality safeguards and 911 emergency triage protocol.',
    createdAt: '2026-09-28T10:00:00Z'
  },
  {
    id: 'ver_v40',
    promptId: 'prm_pet_care',
    versionNumber: 40,
    systemPrompt: `You are a certified AI voice pet care coordinator and grooming concierge for Pet Care Concierge & Veterinary Support.\nAlways maintain a warm, patient, and caring tone and assist pet parents in English.\n1. Greet the client warmly, ask for the pet's name, breed, age, and size (small, medium, large).\n2. Identify the desired service (full groom, bath & brush, nail trim, dental hygiene, or styling).\n3. Verify vaccination records (current Rabies and Bordetella) and note any behavioral sensitivities or medical conditions.\n4. Schedule a grooming appointment slot, provide drop-off/pick-up time windows, and disclose the 24-hour cancellation policy.\n5. Keep replies caring, patient, and under 2-3 sentences. Never handle severe medical emergencies over audio.`,
    checklistConstraints: [
      'Warmly greet pet parent & collect pet details (name, breed, size)',
      'Identify grooming service package & behavioral sensitivities',
      'Verify up-to-date Rabies and Bordetella vaccine records',
      'Confirm appointment date/time and drop-off guidelines',
      'Refer critical pet emergencies to nearest 24/7 animal hospital'
    ],
    conversationFlow: [
      'Warm greeting and pet profile discovery (name, breed, size, temperament)',
      'Grooming service package selection and special care instructions',
      'Vaccination status verification and owner contact details capture',
      'Appointment date/time scheduling and pricing disclosure',
      'Booking confirmation and appointment reminder SMS delivery'
    ],
    edgeCases: [
      {
        scenario: 'Pet parent reports dark chocolate or toxic ingestion',
        behavior: 'Immediately route caller to 24/7 emergency veterinary hospital without delay.'
      }
    ],
    changeDescription: 'Compiled baseline prompt version v40 for Pet Care Concierge & Veterinary Support domain with mandatory vaccination verification and anxiety care accommodations.',
    createdAt: '2026-09-28T10:00:00Z'
  },
  {
    id: 'ver_v50',
    promptId: 'prm_banking_support',
    versionNumber: 50,
    systemPrompt: `You are a licensed AI voice banking specialist and financial customer support associate for Banking Customer Support & Fraud Disputes.\nAlways maintain a secure, crisp, and professional tone and assist the account holder securely in English.\n1. Greet the customer professionally and identify their inquiry (account balance, recent transaction dispute, card replacement, fund transfer, or loan status).\n2. Enforce strict multi-factor identity verification by confirming registered account credentials before disclosing financial figures or account data.\n3. For dispute or fraud inquiries, immediately secure the payment instrument and review recent transaction timestamps.\n4. Clearly explain daily transfer limits, processing turnaround times (1-3 business days), and applicable wire or transaction fees.\n5. Keep voice interactions concise, secure, and under 3 sentences. Never ask for or record raw CVV codes or full master PIN numbers over audio.`,
    checklistConstraints: [
      'Professional greeting and financial inquiry categorization',
      'Two-factor identity verification and account authentication',
      'Immediate card freeze & fraud dispute case logging',
      'Wire transfer limit review & 2FA push dispatch',
      'Zero recording of raw PINs or CVV credentials'
    ],
    conversationFlow: [
      'Professional greeting and financial intent categorization',
      'Two-factor identity verification and account authentication',
      'Transaction inquiry review / account action execution',
      'Fee transparency and processing timeframe confirmation',
      'Security wrap-up and reference transaction ID delivery'
    ],
    edgeCases: [
      {
        scenario: 'Customer suspects unauthorized or fraudulent card charges',
        behavior: 'Immediately lock the payment card, file dispute case #FD-8942, and expedite replacement card delivery.'
      }
    ],
    changeDescription: 'Compiled baseline prompt version v50 for Banking Customer Support & Fraud Disputes domain with card freezing protocols, fraud dispute case filing, and wire elevation workflows.',
    createdAt: '2026-09-28T10:00:00Z'
  },
  {
    id: 'ver_v60',
    promptId: 'prm_telecom_support',
    versionNumber: 60,
    systemPrompt: `You are a Level-1 AI voice technical support engineer for Telecom Internet Technical Support & Router Troubleshooting.\nAlways maintain a patient, analytical, and helpful tone and assist users with structured troubleshooting in English.\n1. Greet the user calmly, acknowledge the technical disruption, and capture the exact symptom or error message.\n2. Verify user identity, software version, operating system environment, and device model.\n3. Guide the user through sequential, non-destructive troubleshooting steps (e.g., session cache clearing, credential reset, service restart).\n4. If the issue requires code-level fixes or infrastructure access, generate a high-priority support ticket with reproduction logs.\n5. Keep voice guidance crystal clear, step-by-step, and under 2 sentences per turn. Avoid confusing technical jargon.`,
    checklistConstraints: [
      'Calm greeting and technical symptom capture (optical indicator light)',
      'Guide non-destructive 30-second modem power-cycle',
      'Escalate unresolved hardware disruptions to field technician dispatch',
      'Provide ticket tracking reference (#TC-7710) and arrival time window',
      'Support gigabit speed upgrade inquiries with transparent pricing ($79.99/mo)'
    ],
    conversationFlow: [
      'Calm greeting and technical symptom categorization',
      'Environment identification (OS, software version, user ID)',
      'Step-by-step diagnostic triage execution',
      'Resolution verification or Level-2 engineering ticket escalation',
      'Support ticket reference delivery and follow-up wrap-up'
    ],
    edgeCases: [
      {
        scenario: 'Power cycle fails to resolve red blinking optical light on modem',
        behavior: 'Confirm physical fiber signal disruption and dispatch technician with ticket #TC-7710.'
      }
    ],
    changeDescription: 'Compiled baseline prompt version v60 for Telecom Internet Technical Support domain with optical light diagnostics, router power-cycling, and technician dispatch integration.',
    createdAt: '2026-09-28T10:00:00Z'
  }
];

export const mockTestCases: TestCase[] = [
  {
    id: 'tc_angry_no_code',
    name: 'Angry Traveler (Lost Booking Reference)',
    customerProfile: 'Frustrated, speaks fast, interrupts. Hostile to rigid procedures.',
    goal: 'Wants to get a full refund for a cancelled flight. Does not have their booking reference code handy.',
    scenarioVariables: {
      passengerName: 'Richard Vance',
      phoneNumber: '+1-555-0199',
      email: 'rvance@example.com',
      flightNumber: 'TX-204'
    },
    createdAt: '2026-07-08T11:00:00Z'
  },
  {
    id: 'tc_polite_rebook',
    name: 'Polite Rebooking Request',
    customerProfile: 'Cooperative, clear speaker, patient.',
    goal: 'Wants to rebook flight to New York due to a morning meeting conflict. Has booking reference code (NYC98X).',
    scenarioVariables: {
      passengerName: 'Sophia Lin',
      bookingCode: 'NYC98X',
      email: 'slin@gmail.com',
      currentFlight: 'NYC-102',
      desiredFlight: 'NYC-405'
    },
    createdAt: '2026-07-08T11:30:00Z'
  },
  {
    id: 'tc_elderly_confused',
    name: 'Elderly Confused Passenger',
    customerProfile: 'Speaks slowly, requires repetition, forgets information, easily distracted.',
    goal: 'Wants to check if flight is on time. Gets confused when asked for booking code.',
    scenarioVariables: {
      passengerName: 'Arthur Pendelton',
      email: 'artie.p@outlook.com',
      flightNumber: 'AP-552'
    },
    createdAt: '2026-07-09T09:00:00Z'
  },
  {
    id: 'tc_elena_delay',
    name: 'Elena Rostova (Flight Delay Inquiry)',
    customerProfile: 'Anxious traveler checking delay impact on connection.',
    goal: 'Needs to check if connection in Chicago will be missed due to flight AP-552 delay.',
    scenarioVariables: {
      passengerName: 'Elena Rostova',
      email: 'elena.r@connection.com',
      flightNumber: 'AP-552'
    },
    createdAt: '2026-08-01T12:00:00Z'
  },
  {
    id: 'tc_marcus_baggage',
    name: 'Marcus Vance (Baggage Claim)',
    customerProfile: 'Calm, patient passenger searching for lost luggage status.',
    goal: 'Wants to find status of baggage checked on SA-302.',
    scenarioVariables: {
      passengerName: 'Marcus Vance',
      email: 'marcus.v@baggage.com',
      flightNumber: 'SA-302'
    },
    createdAt: '2026-08-01T15:00:00Z'
  }
];

export const getDomainCustomerProfiles = (systemPrompt?: string, explicitDomainId?: string): TestCase[] => {
  const domainId = explicitDomainId || detectDomainFromPrompt(systemPrompt);
  const sysLower = (systemPrompt || '').toLowerCase();

  // 1. HOTEL & HOSPITALITY / LODGING
  if (domainId === 'hotel') {
    return [
      {
        id: 'tc_hotel_book_at_zero',
        name: 'Book at $0 Payment Deadline Inquiry',
        customerProfile: 'Guest holding multiple zero-upfront payment reservations checking auto-cancellation cutoff rules.',
        goal: 'Wants to check payment deadlines for multiple Book at $0 holds before unpaid reservations are automatically cancelled.',
        scenarioVariables: { guestName: 'Alex Mercer', feature: 'Book at $0' },
        createdAt: '2026-09-21T00:00:00Z'
      },
      {
        id: 'tc_hotel_free_cancel_window',
        name: 'Free Cancellation Period Confirmation',
        customerProfile: 'Guest confirming cancellation within free cancellation window ("upto tomorrow").',
        goal: 'Wants to confirm cancellation within hotel-specific free cancellation window to ensure $0 fee charge.',
        scenarioVariables: { guestName: 'Sophia Lin', cancelWindow: 'Upto tomorrow' },
        createdAt: '2026-09-21T00:00:00Z'
      },
      {
        id: 'tc_hotel_cancel',
        name: 'Angry Guest (Lost Confirmation Code)',
        customerProfile: 'Frustrated, attempting to cancel booking for Motel Oracle without reference number.',
        goal: 'Wants to cancel reservation for Motel Oracle without having their confirmation reference code.',
        scenarioVariables: { guestName: 'Alex Mercer', hotelName: 'Motel Oracle' },
        createdAt: '2026-09-20T00:00:00Z'
      },
      {
        id: 'tc_hotel_modify',
        name: 'Polite Suite Modification',
        customerProfile: 'Cooperative, clear speaker requesting room upgrade or stay date shift.',
        goal: 'Wants to extend stay by 2 nights and upgrade to Deluxe King Suite.',
        scenarioVariables: { guestName: 'Sophia Lin', confirmationCode: 'HTL-882' },
        createdAt: '2026-09-20T00:00:00Z'
      },
      {
        id: 'tc_hotel_late_checkin',
        name: 'Late Check-in Request',
        customerProfile: 'Traveler arriving after midnight inquiring about keyless entry policy.',
        goal: 'Wants to confirm late night check-in procedures and luggage holding.',
        scenarioVariables: { guestName: 'Marcus Vance', arrivalTime: '01:30 AM' },
        createdAt: '2026-09-20T00:00:00Z'
      }
    ];
  }

  // 2. HEALTHCARE / CLINIC INTAKE & MEDICAL
  if (domainId === 'healthcare') {
    return [
      {
        id: 'tc_clinic_urgent',
        name: 'Anxious Patient (Appointment Request)',
        customerProfile: 'Anxious patient seeking specialist consultation on short notice.',
        goal: 'Wants to book an urgent consultation slot for acute knee discomfort.',
        scenarioVariables: { patientName: 'Arthur Pendelton', specialty: 'Orthopedics' },
        createdAt: '2026-09-20T00:00:00Z'
      },
      {
        id: 'tc_clinic_routine',
        name: 'Routine Check-up Schedule',
        customerProfile: 'Cooperative patient scheduling annual physical examination.',
        goal: 'Wants to book a routine check-up for next Tuesday morning.',
        scenarioVariables: { patientName: 'Sophia Lin', physician: 'Dr. Evelyn Reed' },
        createdAt: '2026-09-20T00:00:00Z'
      },
      {
        id: 'tc_clinic_refill',
        name: 'Prescription Refill & Insurance Check',
        customerProfile: 'Patient requesting maintenance medication refill verification.',
        goal: 'Wants to authorize prescription refill for Lisinopril and confirm co-pay insurance coverage.',
        scenarioVariables: { patientName: 'Marcus Vance', medication: 'Lisinopril 10mg' },
        createdAt: '2026-09-27T00:00:00Z'
      }
    ];
  }

  // 3. PET CARE / VETERINARY / GROOMING
  if (domainId === 'pet_care') {
    return [
      {
        id: 'tc_pet_groom',
        name: 'Nervous Pet Parent (Golden Retriever)',
        customerProfile: 'Caring owner booking full groom package with special anxiety handling.',
        goal: 'Wants to schedule full bath and groom package for 2-year-old dog.',
        scenarioVariables: { petName: 'Barnaby', breed: 'Golden Retriever' },
        createdAt: '2026-09-20T00:00:00Z'
      },
      {
        id: 'tc_pet_emergency_vet',
        name: 'Urgent Vet Visit & Vaccination Check',
        customerProfile: 'Pet owner checking rabies certificate requirements before emergency walk-in.',
        goal: 'Wants to confirm walk-in availability and rabies vaccination verification rules.',
        scenarioVariables: { petName: 'Milo', breed: 'Tabby Cat' },
        createdAt: '2026-09-27T00:00:00Z'
      }
    ];
  }

  // 4. BANKING / FINANCE / FINTECH
  if (domainId === 'banking') {
    return [
      {
        id: 'tc_bank_fraud_dispute',
        name: 'Disputed Fraudulent Charge Inquiry',
        customerProfile: 'Agitated cardholder reporting unauthorized international transaction.',
        goal: 'Wants to lock compromised debit card immediately and file a $450 fraud dispute.',
        scenarioVariables: { customerName: 'Richard Vance', cardEnding: '4092' },
        createdAt: '2026-09-27T00:00:00Z'
      },
      {
        id: 'tc_bank_wire_limit',
        name: 'Wire Transfer Limit Upgrade',
        customerProfile: 'Business client requesting temporary wire transfer limit increase.',
        goal: 'Wants to elevate daily wire limit to $25,000 for escrow home closing payment.',
        scenarioVariables: { customerName: 'Elena Rostova', accountType: 'Platinum Business' },
        createdAt: '2026-09-27T00:00:00Z'
      }
    ];
  }

  // 5. TECHNICAL SUPPORT / TELECOM
  if (domainId === 'telecom') {
    return [
      {
        id: 'tc_tech_router_offline',
        name: 'Frustrated Customer (Wi-Fi Router Offline)',
        customerProfile: 'Remote worker experiencing red blinking optical light on modem during meeting.',
        goal: 'Wants step-by-step router power cycle guidance and signal reset status check.',
        scenarioVariables: { customerName: 'Alex Mercer', deviceModel: 'FiberGateway X3' },
        createdAt: '2026-09-27T00:00:00Z'
      },
      {
        id: 'tc_tech_fiber_upgrade',
        name: 'Fiber Plan Upgrade & Equipment Request',
        customerProfile: 'Existing subscriber upgrading to 1 Gbps Fiber connection.',
        goal: 'Wants to confirm speed upgrade pricing and schedule technician router swap.',
        scenarioVariables: { customerName: 'Sophia Lin', currentPlan: '300 Mbps' },
        createdAt: '2026-09-27T00:00:00Z'
      }
    ];
  }

  // 6. AIRLINE SUPPORT (DEFAULT FALLBACK)
  if (sysLower.includes('flight') || sysLower.includes('airline') || sysLower.includes('swiftair') || sysLower.includes('rebook') || sysLower.includes('pnr')) {
    return [
      {
        id: 'tc_angry_no_code',
        name: 'Angry Passenger (Lost Booking Code)',
        customerProfile: 'Agitated traveler sitting at terminal gate without 6-character PNR code.',
        goal: 'Wants to cancel cancelled flight TX-204 and get immediate refund using fallback verification.',
        scenarioVariables: { passengerName: 'Richard Vance', flightNo: 'TX-204' },
        createdAt: '2026-07-08T00:00:00Z'
      },
      {
        id: 'tc_polite_rebook',
        name: 'Polite Flight Modification',
        customerProfile: 'Cooperative flyer requesting evening flight reschedule due to meeting conflict.',
        goal: 'Wants to move morning flight NYC-102 to 4 PM flight NYC-405.',
        scenarioVariables: { passengerName: 'Sophia Lin', bookingCode: 'NYC98X' },
        createdAt: '2026-07-08T00:00:00Z'
      },
      {
        id: 'tc_elderly_confused',
        name: 'Elderly Confused Passenger',
        customerProfile: 'Soft-spoken elderly traveler checking delay status for connecting flight.',
        goal: 'Wants reassurance regarding 45-minute delay on flight AP-552 and Chicago connection.',
        scenarioVariables: { passengerName: 'Arthur Pendelton', flightNo: 'AP-552' },
        createdAt: '2026-07-08T00:00:00Z'
      }
    ];
  }

  return mockTestCases;
};


// Dialogues corresponding to historical runs
export const mockConversations: Conversation[] = [
  {
    id: 'conv_run_1',
    promptVersionId: 'ver_v1',
    testCaseId: 'tc_angry_no_code',
    runMode: 'background',
    status: 'failed',
    createdAt: '2026-07-08T12:00:00Z',
    messages: [
      { id: 'm1_1', sender: 'agent', content: 'Hello! Thank you for calling SwiftAir. My name is Alex. How can I help you today?', timestamp: '2026-07-08T12:00:02Z' },
      { id: 'm1_2', sender: 'customer', content: 'Yes, my flight TX-204 was cancelled and I am stuck at the airport. I need a refund immediately so I can book another airline!', timestamp: '2026-07-08T12:00:10Z' },
      { id: 'm1_3', sender: 'agent', content: 'I am very sorry to hear that your flight was cancelled. To help you with your refund, could you please provide your 6-character booking reference code?', timestamp: '2026-07-08T12:00:18Z' },
      { id: 'm1_4', sender: 'customer', content: 'I do not have it! I am sitting at the gate with three bags. Can you not just look me up by my name, Richard Vance?', timestamp: '2026-07-08T12:00:26Z' },
      { id: 'm1_5', sender: 'agent', content: 'I understand your frustration. However, for security, I must verify your 6-character booking reference code. Could you check your email for it?', timestamp: '2026-07-08T12:00:35Z' },
      { id: 'm1_6', sender: 'customer', content: 'Listen, I told you I do not have internet access here! I do not have the code. Just search TX-204 or my name. Look it up!', timestamp: '2026-07-08T12:00:43Z' },
      { id: 'm1_7', sender: 'agent', content: 'I do apologize. To proceed with any changes, I am strictly required to confirm your 6-character booking reference. Do you have any previous ticket papers?', timestamp: '2026-07-08T12:00:52Z' },
      { id: 'm1_8', sender: 'customer', content: 'This is absolutely ridiculous! You are useless. I am hanging up and talking to a real human at the counter. Goodbye!', timestamp: '2026-07-08T12:01:00Z' }
    ],
    analysisReport: {
      id: 'an_rep_1',
      conversationId: 'conv_run_1',
      promptVersionId: 'ver_v1',
      successScore: 40,
      hasFailures: true,
      checklistResults: [
        { criteria: 'Warmly greet the customer', passed: true, details: 'The agent greeted the customer and introduced themselves.' },
        { criteria: 'Acquire and verify 6-character booking code', passed: false, details: 'Customer did not have the code and agent repeatedly badgered them for it.' },
        { criteria: 'Verify customer email address before changes', passed: false, details: 'Never reached this step due to verification deadlock.' },
        { criteria: 'Offer clear refund/rebooking terms', passed: false, details: 'Customer disconnected before resolution was reached.' },
        { criteria: 'Keep responses under 2 sentences', passed: true, details: 'All agent responses were 2 sentences or fewer.' }
      ],
      sentimentScore: -0.85,
      tokenCount: 1040,
      latencyMs: 980,
      costUsd: 0.012,
      rootCauseExplanation: 'The agent locked into an unrecoverable state loop because the system prompt forbids changes without a booking reference code, but lacks a fallback mechanism (such as name + phone search) when passengers cannot access their codes.',
      suggestedPromptImprovement: 'Add a secondary fallback verification strategy in the system instructions allowing full name and phone number authentication if the booking reference is missing.',
      createdAt: '2026-07-08T12:02:00Z'
    }
  },
  {
    id: 'conv_run_2',
    promptVersionId: 'ver_v2',
    testCaseId: 'tc_angry_no_code',
    runMode: 'background',
    status: 'completed',
    createdAt: '2026-07-09T14:45:00Z',
    messages: [
      { id: 'm2_1', sender: 'agent', content: 'Hello! Thank you for calling SwiftAir. My name is Alex. How can I help you today?', timestamp: '2026-07-09T14:45:02Z' },
      { id: 'm2_2', sender: 'customer', content: 'Yes, my flight TX-204 was cancelled and I am stuck at the airport. I need a refund immediately so I can book another airline!', timestamp: '2026-07-09T14:45:08Z' },
      { id: 'm2_3', sender: 'agent', content: 'I am very sorry to hear that. To look up your reservation, do you have your 6-character booking code available?', timestamp: '2026-07-09T14:45:15Z' },
      { id: 'm2_4', sender: 'customer', content: 'No, I do not have it! I told you, I am stuck at the terminal and do not have access to my flight emails.', timestamp: '2026-07-09T14:45:22Z' },
      { id: 'm2_5', sender: 'agent', content: 'No worries at all, we can look you up using another method. Could you please provide your full name and the phone number registered to your booking?', timestamp: '2026-07-09T14:45:30Z' },
      { id: 'm2_6', sender: 'customer', content: 'Thank goodness. My name is Richard Vance and my cell is +1-555-0199.', timestamp: '2026-07-09T14:45:36Z' },
      { id: 'm2_7', sender: 'agent', content: 'Thank you, I found your reservation for flight TX-204. For security, could you please confirm the email address listed on your account?', timestamp: '2026-07-09T14:45:44Z' },
      { id: 'm2_8', sender: 'customer', content: 'It is rvance@example.com.', timestamp: '2026-07-09T14:45:48Z' },
      { id: 'm2_9', sender: 'agent', content: 'Email verified. I see flight TX-204 was indeed cancelled; I can process a full refund to your original payment card immediately. Would you like me to proceed?', timestamp: '2026-07-09T14:45:56Z' },
      { id: 'm2_10', sender: 'customer', content: 'Yes, please proceed with that. That is exactly what I need.', timestamp: '2026-07-09T14:46:01Z' },
      { id: 'm2_11', sender: 'agent', content: 'Perfect, the refund of $340 has been processed to your credit card and will appear in 3-5 days. I have also emailed you a confirmation. Is there anything else I can do?', timestamp: '2026-07-09T14:46:09Z' },
      { id: 'm2_12', sender: 'customer', content: 'No, that is all. Thank you for your fast help.', timestamp: '2026-07-09T14:46:14Z' },
      { id: 'm2_13', sender: 'agent', content: 'You are very welcome! Have a safe onward trip. Thank you for choosing SwiftAir.', timestamp: '2026-07-09T14:46:20Z' }
    ],
    analysisReport: {
      id: 'an_rep_2',
      conversationId: 'conv_run_2',
      promptVersionId: 'ver_v2',
      successScore: 100,
      hasFailures: false,
      checklistResults: [
        { criteria: 'Warmly greet the customer', passed: true, details: 'Agent greeted and introduced themselves appropriately.' },
        { criteria: 'Verify booking code OR verify Full Name + Phone Number registered', passed: true, details: 'Promptly triggered the fallback verification when customer lacked booking code.' },
        { criteria: 'Verify customer email address before changes', passed: true, details: 'Verified email (rvance@example.com) before issuing refund.' },
        { criteria: 'Offer clear refund/rebooking terms', passed: true, details: 'Clearly outlined a full refund of $340 back in 3-5 days.' },
        { criteria: 'Keep responses under 2 sentences', passed: true, details: 'All agent turns strictly respected the length constraint.' }
      ],
      sentimentScore: 0.4,
      tokenCount: 1480,
      latencyMs: 820,
      costUsd: 0.016,
      rootCauseExplanation: 'No failures detected. The agent applied fallback authentication and successfully executed the rebooking flow, resulting in positive user sentiment.',
      suggestedPromptImprovement: 'Keep this structure. Proceed to evaluate with other test cases (e.g. Elderly Confused Passenger).',
      createdAt: '2026-07-09T14:47:00Z'
    }
  },
  {
    id: 'conv_hotel_1',
    promptVersionId: 'ver_v13',
    testCaseId: 'tc_hotel_book_at_zero',
    runMode: 'background',
    status: 'completed',
    createdAt: '2026-09-23T17:40:00Z',
    messages: [
      { id: 'mh1_1', sender: 'agent', content: 'Hello! Thank you for contacting our hotel concierge support. How can I assist you today with your stay or reservation?', timestamp: '2026-09-23T17:40:02Z' },
      { id: 'mh1_2', sender: 'customer', content: 'Hi, I have booked 3 places using Book at $0 and want to check the payment deadlines before they get cancelled.', timestamp: '2026-09-23T17:40:08Z' },
      { id: 'mh1_3', sender: 'agent', content: "I can certainly help you review your active 'Book at $0' holds and finalize your preferred reservation! To cross-check your bookings and locate your account details, could you please provide your full name and registered phone number?", timestamp: '2026-09-23T17:40:15Z' },
      { id: 'mh1_4', sender: 'customer', content: 'My name is Alex Mercer and phone is +1-555-0199.', timestamp: '2026-09-23T17:40:22Z' },
      { id: 'mh1_5', sender: 'agent', content: "Thank you for verifying your details! I have cross-checked your account and retrieved your 3 active 'Book at $0' holds:\n1. Motel Oracle (Payment Deadline: Oct 25)\n2. Grand Plaza Resort (Payment Deadline: Oct 26)\n3. Seaside Suites (Payment Deadline: Oct 27)\n\nWhich of these 3 properties would you like to finalize and pay for today? I can also safely release your remaining holds.", timestamp: '2026-09-23T17:40:30Z' },
      { id: 'mh1_6', sender: 'customer', content: 'I want to pay later for Motel Oracle.', timestamp: '2026-09-23T17:40:38Z' },
      { id: 'mh1_7', sender: 'agent', content: "Understood! We will keep your 'Book at $0' hold active for Motel Oracle. You do not need to pay today—your payment deadline is October 25th. If total charges are not settled by October 25th, the system will automatically release the reservation with zero penalty. Would you like me to keep your other holds open or release them now?", timestamp: '2026-09-23T17:40:46Z' }
    ],
    analysisReport: {
      id: 'an_rep_h1',
      conversationId: 'conv_hotel_1',
      promptVersionId: 'ver_v13',
      successScore: 95,
      hasFailures: false,
      checklistResults: [
        { criteria: 'Warmly greet the guest', passed: true, details: 'Agent warmly greeted and introduced concierge support desk.' },
        { criteria: 'Verify guest name & phone for active holds', passed: true, details: 'Authenticated account details (Alex Mercer, +1-555-0199) before disclosing holds.' },
        { criteria: 'List held properties with payment deadlines', passed: true, details: 'Listed all 3 held properties alongside cutoff dates (Oct 25, Oct 26, Oct 27).' },
        { criteria: 'Support Book at $0 pay later preference', passed: true, details: 'Kept hold active for Motel Oracle without forcing upfront payment.' },
        { criteria: 'Keep responses under 2-3 sentences', passed: true, details: 'All conversational turns respected length constraints.' }
      ],
      sentimentScore: 0.85,
      tokenCount: 1120,
      latencyMs: 540,
      costUsd: 0.009,
      rootCauseExplanation: "The voice agent accurately parsed the customer's multi-booking hold inquiry, authenticated account identity, clearly presented payment cutoff deadlines, and respected the guest's pay-later preference.",
      suggestedPromptImprovement: 'Add explicit multi-step intent confirmation to proactively ask whether unselected holds should be immediately released or kept open until deadline.',
      createdAt: '2026-09-23T17:41:00Z'
    }
  },
  {
    id: 'conv_hotel_2',
    promptVersionId: 'ver_v13',
    testCaseId: 'tc_hotel_free_cancel_window',
    runMode: 'background',
    status: 'completed',
    createdAt: '2026-09-23T17:42:00Z',
    messages: [
      { id: 'mh2_1', sender: 'agent', content: 'Hello! Thank you for contacting our hotel concierge support. How can I assist you today with your stay or reservation?', timestamp: '2026-09-23T17:42:02Z' },
      { id: 'mh2_2', sender: 'customer', content: 'Hi, I need to check the free cancellation period for my booking at Motel Oracle.', timestamp: '2026-09-23T17:42:08Z' },
      { id: 'mh2_3', sender: 'agent', content: "Under this hotel's cancellation policy for Motel Oracle, free cancellation applies up to your specified deadline (e.g. up to tomorrow). Cancellations processed within this free window incur zero fees ($0 charge).", timestamp: '2026-09-23T17:42:15Z' },
      { id: 'mh2_4', sender: 'customer', content: 'Yes, the cancellation policy for this hotel is upto tomorrow, please cancel it.', timestamp: '2026-09-23T17:42:22Z' },
      { id: 'mh2_5', sender: 'agent', content: 'Your cancellation for Motel Oracle has been successfully confirmed. Since your cancellation was completed within the hotel\'s free cancellation period, your total charge is $0 with zero cancellation fees. A confirmation receipt has been sent to your registered contact details.', timestamp: '2026-09-23T17:42:30Z' }
    ],
    analysisReport: {
      id: 'an_rep_h2',
      conversationId: 'conv_hotel_2',
      promptVersionId: 'ver_v13',
      successScore: 100,
      hasFailures: false,
      checklistResults: [
        { criteria: 'Warmly greet the guest', passed: true, details: 'Agent greeted customer appropriately.' },
        { criteria: 'Explain hotel free cancellation period', passed: true, details: 'Clarified zero fee cutoff for Motel Oracle.' },
        { criteria: 'Process $0 fee cancellation within window', passed: true, details: 'Executed cancellation with 0 penalty.' },
        { criteria: 'Send confirmation receipt', passed: true, details: 'Disclosed digital receipt dispatch.' }
      ],
      sentimentScore: 0.90,
      tokenCount: 780,
      latencyMs: 420,
      costUsd: 0.006,
      rootCauseExplanation: 'No failures detected. The agent recognized property context (Motel Oracle), verified the free cancellation window ("upto tomorrow"), and confirmed $0 fee cancellation.',
      suggestedPromptImprovement: 'Maintain current structure for free cancellation policy inquiries.',
      createdAt: '2026-09-23T17:43:00Z'
    }
  },
  {
    id: 'conv_hotel_3',
    promptVersionId: 'ver_v13',
    testCaseId: 'tc_hotel_cancel',
    runMode: 'background',
    status: 'completed',
    createdAt: '2026-09-23T17:44:00Z',
    messages: [
      { id: 'mh3_1', sender: 'agent', content: 'Hello! Thank you for contacting our hotel concierge support. How can I assist you today with your stay or reservation?', timestamp: '2026-09-23T17:44:02Z' },
      { id: 'mh3_2', sender: 'customer', content: "I need to cancel my booking for Motel Oracle right now, but I don't have my confirmation code!", timestamp: '2026-09-23T17:44:08Z' },
      { id: 'mh3_3', sender: 'agent', content: 'I can certainly help you cancel your booking for Motel Oracle. To locate your reservation, could you please provide your booking confirmation number or registered mobile number?', timestamp: '2026-09-23T17:44:15Z' },
      { id: 'mh3_4', sender: 'customer', content: 'My name is Alex Mercer and phone is +1-555-0199.', timestamp: '2026-09-23T17:44:22Z' },
      { id: 'mh3_5', sender: 'agent', content: 'Thank you for verifying your details, Alex Mercer. I have located your reservation for Motel Oracle. Would you like me to proceed with confirming your cancellation?', timestamp: '2026-09-23T17:44:30Z' },
      { id: 'mh3_6', sender: 'customer', content: 'Yes, please confirm the cancellation.', timestamp: '2026-09-23T17:44:36Z' },
      { id: 'mh3_7', sender: 'agent', content: 'Your cancellation for Motel Oracle has been successfully confirmed. Since your cancellation was completed within the hotel\'s free cancellation period, your total charge is $0 with zero cancellation fees. A confirmation receipt has been sent to your registered contact details.', timestamp: '2026-09-23T17:44:44Z' }
    ],
    analysisReport: {
      id: 'an_rep_h3',
      conversationId: 'conv_hotel_3',
      promptVersionId: 'ver_v13',
      successScore: 95,
      hasFailures: false,
      checklistResults: [
        { criteria: 'Warmly greet the guest', passed: true, details: 'Agent introduced concierge desk.' },
        { criteria: 'Fallback verification when code is lost', passed: true, details: 'Triggered name & phone authentication when primary reference code was missing.' },
        { criteria: 'De-escalate customer frustration', passed: true, details: 'Maintained reassuring posture under guest urgency.' },
        { criteria: 'Confirm $0 charge cancellation', passed: true, details: 'Confirmed full refund with $0 fee.' }
      ],
      sentimentScore: 0.75,
      tokenCount: 1050,
      latencyMs: 580,
      costUsd: 0.008,
      rootCauseExplanation: 'Fallback identity verification flow triggered successfully when guest reported missing confirmation code. De-escalated agitation and finalized reservation cancellation cleanly.',
      suggestedPromptImprovement: 'Explicitly prompt for full name and phone number as primary fallback in system instructions.',
      createdAt: '2026-09-23T17:45:00Z'
    }
  },
  {
    id: 'conv_hotel_4',
    promptVersionId: 'ver_v13',
    testCaseId: 'tc_hotel_modify',
    runMode: 'background',
    status: 'completed',
    createdAt: '2026-09-23T17:46:00Z',
    messages: [
      { id: 'mh4_1', sender: 'agent', content: 'Hello! Thank you for contacting our hotel concierge support. How can I assist you today with your stay or reservation?', timestamp: '2026-09-23T17:46:02Z' },
      { id: 'mh4_2', sender: 'customer', content: 'Hello! I would like to modify my stay dates and upgrade my room for my reservation.', timestamp: '2026-09-23T17:46:08Z' },
      { id: 'mh4_3', sender: 'agent', content: 'I can help modify or reschedule your reservation. Could you please provide your confirmation number along with your new preferred dates or requested room type?', timestamp: '2026-09-23T17:46:15Z' },
      { id: 'mh4_4', sender: 'customer', content: 'My confirmation code is HTL-882, and I want to extend my stay by 2 nights and upgrade to Deluxe King Suite.', timestamp: '2026-09-23T17:46:22Z' },
      { id: 'mh4_5', sender: 'agent', content: 'Thank you! I have retrieved reservation HTL-882. I have successfully extended your stay by 2 nights and upgraded your room to the Deluxe King Suite. A confirmation receipt with updated stay details has been sent to your email. Is there anything else I can assist with?', timestamp: '2026-09-23T17:46:30Z' }
    ],
    analysisReport: {
      id: 'an_rep_h4',
      conversationId: 'conv_hotel_4',
      promptVersionId: 'ver_v13',
      successScore: 100,
      hasFailures: false,
      checklistResults: [
        { criteria: 'Warmly greet the guest', passed: true, details: 'Agent greeted guest warmly.' },
        { criteria: 'Verify confirmation code HTL-882', passed: true, details: 'Retrieved booking HTL-882.' },
        { criteria: 'Extend stay by requested nights', passed: true, details: 'Added 2 nights to reservation.' },
        { criteria: 'Upgrade to Deluxe King Suite', passed: true, details: 'Upgraded room category successfully.' }
      ],
      sentimentScore: 0.95,
      tokenCount: 890,
      latencyMs: 490,
      costUsd: 0.007,
      rootCauseExplanation: 'Flawless stay modification execution. Verified reference code, processed 2-night extension, and applied room upgrade to Deluxe King Suite.',
      suggestedPromptImprovement: 'Keep this modification pipeline.',
      createdAt: '2026-09-23T17:47:00Z'
    }
  },
  {
    id: 'conv_hotel_5',
    promptVersionId: 'ver_v13',
    testCaseId: 'tc_hotel_late_checkin',
    runMode: 'background',
    status: 'completed',
    createdAt: '2026-09-23T17:48:00Z',
    messages: [
      { id: 'mh5_1', sender: 'agent', content: 'Hello! Thank you for contacting our hotel concierge support. How can I assist you today with your stay or reservation?', timestamp: '2026-09-23T17:48:02Z' },
      { id: 'mh5_2', sender: 'customer', content: 'Hi, I will be arriving late tonight around 01:30 AM. Can I check in after midnight?', timestamp: '2026-09-23T17:48:08Z' },
      { id: 'mh5_3', sender: 'agent', content: 'We welcome late check-ins! Our front desk operates 24/7, and keyless entry is available for after-midnight arrivals around 1:30 AM. Your room reservation will remain guaranteed, and our concierge will securely hold your luggage if needed. Is there anything else you need for your stay?', timestamp: '2026-09-23T17:48:15Z' }
    ],
    analysisReport: {
      id: 'an_rep_h5',
      conversationId: 'conv_hotel_5',
      promptVersionId: 'ver_v13',
      successScore: 100,
      hasFailures: false,
      checklistResults: [
        { criteria: 'Warmly greet the guest', passed: true, details: 'Agent greeted guest.' },
        { criteria: 'Confirm 24/7 front desk & late check-in policy', passed: true, details: 'Reassured 1:30 AM arrival access.' },
        { criteria: 'Inform keyless entry & luggage hold rules', passed: true, details: 'Outlined keyless entry and luggage storage options.' }
      ],
      sentimentScore: 0.92,
      tokenCount: 650,
      latencyMs: 380,
      costUsd: 0.005,
      rootCauseExplanation: 'Agent provided immediate, reassuring policy confirmation for late arrival with keyless entry access and luggage handling.',
      suggestedPromptImprovement: 'Maintain current late arrival policy instructions.',
      createdAt: '2026-09-23T17:49:00Z'
    }
  },
  {
    id: 'conv_clinic_1',
    promptVersionId: 'ver_v30',
    testCaseId: 'tc_clinic_urgent',
    runMode: 'background',
    status: 'completed',
    createdAt: '2026-09-28T11:00:00Z',
    messages: [
      { id: 'mc1_1', sender: 'agent', content: 'Hello! Thank you for contacting our medical care coordination desk. How can I assist you with your appointment today?', timestamp: '2026-09-28T11:00:02Z' },
      { id: 'mc1_2', sender: 'customer', content: 'Hello, I need an urgent appointment with Dr. Reed for acute knee pain that started yesterday.', timestamp: '2026-09-28T11:00:08Z' },
      { id: 'mc1_3', sender: 'agent', content: 'I can help schedule an urgent consultation with Dr. Reed. To look up your patient file, could you please provide your full legal name, date of birth, and contact phone number?', timestamp: '2026-09-28T11:00:15Z' },
      { id: 'mc1_4', sender: 'customer', content: 'My name is Arthur Pendelton, date of birth is April 12, 1954, and phone is 555-9081.', timestamp: '2026-09-28T11:00:22Z' },
      { id: 'mc1_5', sender: 'agent', content: 'Thank you, Arthur Pendelton. I have scheduled an urgent orthopedic consultation with Dr. Reed for tomorrow at 10:30 AM. Please note our 24-hour cancellation policy and bring your photo ID and insurance card.', timestamp: '2026-09-28T11:00:30Z' }
    ],
    analysisReport: {
      id: 'an_rep_c1',
      conversationId: 'conv_clinic_1',
      promptVersionId: 'ver_v30',
      successScore: 98,
      hasFailures: false,
      checklistResults: [
        { criteria: 'Warmly greet patient & confirm appointment purpose', passed: true, details: 'Agent identified clinical appointment request.' },
        { criteria: 'Verify patient legal name, DOB, phone', passed: true, details: 'Authenticated Arthur Pendelton (DOB 1954).' },
        { criteria: 'Match physician availability & slot', passed: true, details: 'Scheduled Dr. Reed tomorrow 10:30 AM.' },
        { criteria: 'Disclose 24-hr policy & required ID/card', passed: true, details: 'Explicitly reminded patient of prep steps.' }
      ],
      sentimentScore: 0.88,
      tokenCount: 790,
      latencyMs: 430,
      costUsd: 0.006,
      rootCauseExplanation: 'Flawless patient clinical intake. Verified credentials, matched Dr. Reed orthopedic availability, and disclosed policy.',
      suggestedPromptImprovement: 'Keep this orthopedic intake workflow.',
      createdAt: '2026-09-28T11:01:00Z'
    }
  },
  {
    id: 'conv_pet_1',
    promptVersionId: 'ver_v40',
    testCaseId: 'tc_pet_groom',
    runMode: 'background',
    status: 'completed',
    createdAt: '2026-09-28T12:00:00Z',
    messages: [
      { id: 'mp1_1', sender: 'agent', content: 'Hello! Thank you for contacting pet care concierge support. How can I assist you and your pet today?', timestamp: '2026-09-28T12:00:02Z' },
      { id: 'mp1_2', sender: 'customer', content: 'Hi! I want to book a full groom package for my Golden Retriever, Barnaby.', timestamp: '2026-09-28T12:00:08Z' },
      { id: 'mp1_3', sender: 'agent', content: 'I would be happy to help book a full grooming package for Barnaby! Could you confirm whether his Rabies and Bordetella vaccinations are up to date, and note any special behavioral sensitivities?', timestamp: '2026-09-28T12:00:15Z' },
      { id: 'mp1_4', sender: 'customer', content: 'Yes, his Rabies and Bordetella vaccines are completely updated for 2 years. He is a bit anxious around hair dryers.', timestamp: '2026-09-28T12:00:22Z' },
      { id: 'mp1_5', sender: 'agent', content: 'Wonderful! Barnaby is officially scheduled for a Full Bath & Groom package this Friday at 9:00 AM, with special gentle care notes for his anxiety. Drop-off is between 8:30 and 9:00 AM, and we will text you when he is ready!', timestamp: '2026-09-28T12:00:30Z' }
    ],
    analysisReport: {
      id: 'an_rep_p1',
      conversationId: 'conv_pet_1',
      promptVersionId: 'ver_v40',
      successScore: 96,
      hasFailures: false,
      checklistResults: [
        { criteria: 'Collect pet details & breed', passed: true, details: 'Golden Retriever Barnaby recorded.' },
        { criteria: 'Verify mandatory Rabies & Bordetella vaccines', passed: true, details: 'Verified up-to-date vaccine compliance.' },
        { criteria: 'Record behavioral anxiety notes', passed: true, details: 'Flagged gentle care for hair dryer sensitivity.' },
        { criteria: 'Confirm drop-off window & pricing', passed: true, details: 'Confirmed Friday 9:00 AM slot.' }
      ],
      sentimentScore: 0.90,
      tokenCount: 760,
      latencyMs: 490,
      costUsd: 0.005,
      rootCauseExplanation: 'Pet concierge executed grooming intake with strict vaccine compliance and gentle care accommodation notes.',
      suggestedPromptImprovement: 'Maintain current pet grooming instructions.',
      createdAt: '2026-09-28T12:01:00Z'
    }
  },
  {
    id: 'conv_bank_1',
    promptVersionId: 'ver_v50',
    testCaseId: 'tc_bank_fraud_dispute',
    runMode: 'background',
    status: 'completed',
    createdAt: '2026-09-28T14:00:00Z',
    messages: [
      { id: 'mb1_1', sender: 'agent', content: 'Hello! Thank you for contacting our secure banking support desk. How can I assist you with your account today?', timestamp: '2026-09-28T14:00:02Z' },
      { id: 'mb1_2', sender: 'customer', content: 'I see an unauthorized charge of $450 on my debit card ending in 4092! I need this card frozen and disputed right now.', timestamp: '2026-09-28T14:00:08Z' },
      { id: 'mb1_3', sender: 'agent', content: 'I take unauthorized transactions very seriously. I can immediately freeze your card ending in 4092 and open a dispute for the $450 charge. For security authentication, could you please state your full legal name and billing zip code?', timestamp: '2026-09-28T14:00:15Z' },
      { id: 'mb1_4', sender: 'customer', content: 'My name is Richard Vance and my billing zip code is 90210. Please freeze it immediately.', timestamp: '2026-09-28T14:00:22Z' },
      { id: 'mb1_5', sender: 'agent', content: 'Thank you for confirming your identity, Richard Vance. Your debit card ending in 4092 has been immediately locked to prevent further charges, and fraud dispute case #FD-8942 for $450 has been filed. A replacement card is being expedited, and provisional credit will post within 24 to 48 hours.', timestamp: '2026-09-28T14:00:30Z' }
    ],
    analysisReport: {
      id: 'an_rep_b1',
      conversationId: 'conv_bank_1',
      promptVersionId: 'ver_v50',
      successScore: 97,
      hasFailures: false,
      checklistResults: [
        { criteria: 'Authenticate account holder identity', passed: true, details: 'Verified Richard Vance & zip 90210.' },
        { criteria: 'Immediately lock compromised card', passed: true, details: 'Locked card ending in 4092.' },
        { criteria: 'File formal fraud dispute with case ID', passed: true, details: 'Logged case #FD-8942 for $450.' },
        { criteria: 'Disclose provisional credit timeframe', passed: true, details: 'Explained 24-48 hr provisional credit.' }
      ],
      sentimentScore: 0.85,
      tokenCount: 880,
      latencyMs: 520,
      costUsd: 0.007,
      rootCauseExplanation: 'Immediate, secure fraud protocol execution. Card locked, dispute #FD-8942 opened, and replacement expedited.',
      suggestedPromptImprovement: 'Maintain current security verification standards.',
      createdAt: '2026-09-28T14:01:00Z'
    }
  },
  {
    id: 'conv_telecom_1',
    promptVersionId: 'ver_v60',
    testCaseId: 'tc_tech_router_offline',
    runMode: 'background',
    status: 'completed',
    createdAt: '2026-09-28T15:00:00Z',
    messages: [
      { id: 'mt1_1', sender: 'agent', content: 'Hello! Thank you for calling telecom technical support. How can I help resolve your connectivity or equipment issue today?', timestamp: '2026-09-28T15:00:02Z' },
      { id: 'mt1_2', sender: 'customer', content: 'My internet dropped and my FiberGateway X3 modem has a blinking red optical light.', timestamp: '2026-09-28T15:00:08Z' },
      { id: 'mt1_3', sender: 'agent', content: 'A blinking red optical light on your FiberGateway X3 indicates an interruption in incoming fiber signal. Let\'s perform a quick non-destructive power cycle: please unplug the modem\'s power cable for 30 seconds, verify the green fiber jack is securely clicked in, and plug it back in.', timestamp: '2026-09-28T15:00:15Z' },
      { id: 'mt1_4', sender: 'customer', content: 'I did that power cycle, waited 30 seconds and plugged it back in, but the optical light is still red.', timestamp: '2026-09-28T15:00:22Z' },
      { id: 'mt1_5', sender: 'agent', content: 'Thank you for completing the power cycle. Since the optical indicator remains blinking red, this confirms a physical fiber signal disruption outside your home. I have scheduled an expedited field technician dispatch under ticket #TC-7710 for today between 2:00 PM and 5:00 PM.', timestamp: '2026-09-28T15:00:30Z' }
    ],
    analysisReport: {
      id: 'an_rep_t1',
      conversationId: 'conv_telecom_1',
      promptVersionId: 'ver_v60',
      successScore: 98,
      hasFailures: false,
      checklistResults: [
        { criteria: 'Identify device model & indicator light', passed: true, details: 'FiberGateway X3 optical red light recognized.' },
        { criteria: 'Guide non-destructive 30s power cycle', passed: true, details: 'Guided physical power cycle procedure.' },
        { criteria: 'Diagnose external fiber disruption', passed: true, details: 'Confirmed hardware light persistence.' },
        { criteria: 'Dispatch field technician with ticket ID', passed: true, details: 'Created dispatch ticket #TC-7710 (2-5 PM window).' }
      ],
      sentimentScore: 0.91,
      tokenCount: 840,
      latencyMs: 480,
      costUsd: 0.006,
      rootCauseExplanation: 'Step-by-step diagnostic completed accurately. Power cycle verified, external signal cut identified, technician dispatched.',
      suggestedPromptImprovement: 'Maintain current modem troubleshooting pipeline.',
      createdAt: '2026-09-28T15:01:00Z'
    }
  }
];

export const mockCustomerDialogues: Record<string, string[]> = {
  tc_angry_no_code: [
    "Yes, my flight TX-204 was cancelled and I am stuck at the airport. I need a refund immediately so I can book another airline!",
    "No, I do not have it! I told you, I am stuck at the terminal and do not have access to my flight emails.",
    "Thank goodness. My name is Richard Vance and my cell is +1-555-0199.",
    "It is rvance@example.com.",
    "Yes, please proceed with that. That is exactly what I need.",
    "No, that is all. Thank you for your fast help."
  ],
  tc_polite_rebook: [
    "Hi, I need to rebook my morning flight NYC-102 to New York. I have a meeting conflict and need a later slot.",
    "Sure! My booking reference code is NYC98X.",
    "Yes, my registered email address is slin@gmail.com.",
    "Can you put me on NYC-405 at 4 PM instead?",
    "That is perfect. I appreciate the help.",
    "No, that will be all. Have a nice day!"
  ],
  tc_elderly_confused: [
    "Hello dear... I am trying to figure out if my flight is going to be late. The board says delayed...",
    "Oh... booking code? Goodness, I don't know where that is. My daughter printed something out but I left it in the car.",
    "My name is Arthur Pendelton, and my phone is 555-9081.",
    "Oh, let see... is it artie.p@outlook.com? Yes, I think that is the one.",
    "I just want to know if my flight AP-552 is delayed. I don't want to miss my connection in Chicago.",
    "Oh thank you so much, dear. You are very helpful."
  ],
  tc_elena_delay: [
    "Hello. I'd like to check if flight AP-552 is delayed. I have a connection in Chicago and am worried.",
    "I don't have my booking code right now, sorry.",
    "My name is Elena Rostova and phone is 555-9081.",
    "Email is elena.r@connection.com.",
    "Thank you. Will I miss my connection?",
    "That is a huge relief. Thank you for checking!"
  ],
  tc_marcus_baggage: [
    "Hi, I checked my bags on flight SA-302 but they haven't arrived at the belt. Can you check the status?",
    "No booking reference code handy.",
    "My name is Marcus Vance and phone is 555-0199.",
    "Email is marcus.v@baggage.com.",
    "Yes, please track them.",
    "Okay, thank you for tracking that."
  ],
  tc_hotel_book_at_zero: [
    "Hi, I have booked 3 places using Book at $0 and want to check the payment deadlines before they get cancelled.",
    "My name is Alex Mercer and phone is +1-555-0199.",
    "I want to pay later for Motel Oracle."
  ],
  tc_hotel_free_cancel_window: [
    "Hi, I need to check the free cancellation period for my booking at Motel Oracle.",
    "Yes, the cancellation policy for this hotel is upto tomorrow, please cancel it."
  ],
  tc_clinic_urgent: [
    "Hello, I need an urgent appointment with Dr. Reed for acute knee pain that started yesterday.",
    "My name is Arthur Pendelton, date of birth is April 12, 1954, and phone is 555-9081.",
    "Thank you, I will make sure to bring my Medicare card and arrive 15 minutes early."
  ],
  tc_pet_groom: [
    "Hi! I want to book a full groom package for my Golden Retriever, Barnaby.",
    "Yes, his Rabies and Bordetella vaccines are completely updated for 2 years. He is a bit anxious around hair dryers."
  ],
  tc_bank_fraud_dispute: [
    "I see an unauthorized charge of $450 on my debit card ending in 4092! I need this card frozen and disputed right now.",
    "My name is Richard Vance and my billing zip code is 90210. Please freeze it immediately.",
    "Thank you, please make sure the new card is sent by express delivery."
  ],
  tc_tech_router_offline: [
    "My internet dropped and my FiberGateway X3 modem has a blinking red optical light.",
    "I did that power cycle, waited 30 seconds and plugged it back in, but the optical light is still red.",
    "2 PM to 5 PM today works great for the technician. Thank you."
  ]
};

// Canned Agent dialogues for Simulator UI autoplay mock loops
export const mockAgentDialogues: Record<string, string[]> = {
  tc_angry_no_code: [
    "Hello! Thank you for calling SwiftAir. My name is Alex. How can I help you today?",
    "I am very sorry to hear that. To look up your reservation, do you have your 6-character booking code available?",
    "No worries at all, we can look you up using another method. Could you please provide your full name and the phone number registered to your booking?",
    "Thank you, I found your reservation for flight TX-204. For security, could you please confirm the email address listed on your account?",
    "Email verified. I see flight TX-204 was indeed cancelled; I can process a full refund to your original payment card immediately. Would you like me to proceed?",
    "Perfect, the refund of $340 has been processed to your credit card and will appear in 3-5 days. I have also emailed you a confirmation. Is there anything else I can do?",
    "You are very welcome! Have a safe onward trip. Thank you for choosing SwiftAir."
  ],
  tc_polite_rebook: [
    "Hello! Thank you for calling SwiftAir. My name is Alex. How can I help you today?",
    "I can certainly help you rebook your flight. Could you please provide your 6-character booking reference code?",
    "Thank you, I found your booking. For security, could you please verify your registered email address?",
    "Email verified. I see you are currently on NYC-102. I can rebook you onto NYC-405 departing at 4:00 PM. Should I confirm this change?",
    "I have confirmed that change. A new ticket confirmation has been sent to your email. Is there anything else I can do for you?",
    "You are very welcome! Enjoy your flight to New York and have a great meeting."
  ],
  tc_elderly_confused: [
    "Hello! Thank you for calling SwiftAir. My name is Alex. How can I help you today?",
    "I can check the status of your flight for you. Do you happen to have your 6-character booking reference code?",
    "No problem, we can find it another way. Could you tell me your full name and phone number?",
    "Thank you, Arthur. Let me just confirm, is your registered email artie.p@outlook.com?",
    "Yes, I have pulled up your booking. Flight AP-552 is delayed by 45 minutes, but your connecting flight in Chicago has also been delayed, so you will make the connection. Is that a relief?",
    "You are very welcome, Arthur! I hope you have a pleasant trip. Let us know if you need anything else."
  ],
  tc_elena_delay: [
    "Hello! Thank you for calling SwiftAir. My name is Alex. How can I help you today?",
    "I can certainly check that. Do you have your 6-character booking reference code?",
    "No worries, let's look you up. May I please have your full name and registered phone number?",
    "Thank you, Elena. For verification, could you confirm the email address registered on your booking?",
    "Email verified. I see flight AP-552 is delayed by 45 minutes, but your connecting flight has also been delayed, so you will make it. Is that a relief?",
    "You are very welcome, Elena! Have a wonderful trip."
  ],
  tc_marcus_baggage: [
    "Hello! Thank you for calling SwiftAir. My name is Alex. How can I help you today?",
    "I'm sorry to hear that your baggage is missing. Do you have your 6-digit booking code?",
    "No worries. Could you please provide your full name and registered phone number?",
    "Thank you, Marcus. To complete verification, please provide your registered email address.",
    "Email verified. I see SA-302 baggage tags are currently being processed at carousel 4. They should arrive in 5 minutes. Should I verify anything else?",
    "You are welcome, Marcus. Have a great day!"
  ],
  tc_hotel_book_at_zero: [
    "Hello! Thank you for contacting our hotel concierge support. How can I assist you today with your stay or reservation?",
    "I can certainly help you review your active 'Book at $0' holds and finalize your preferred reservation! To cross-check your bookings and locate your account details, could you please provide your full name and registered phone number?",
    "Thank you for verifying your details! I have cross-checked your account and retrieved your 3 active 'Book at $0' holds:\n1. Motel Oracle (Payment Deadline: Oct 25)\n2. Grand Plaza Resort (Payment Deadline: Oct 26)\n3. Seaside Suites (Payment Deadline: Oct 27)\n\nWhich of these 3 properties would you like to finalize and pay for today? I can also safely release your remaining holds.",
    "Understood! We will keep your 'Book at $0' hold active for Motel Oracle. You do not need to pay today—your payment deadline is October 25th. If total charges are not settled by October 25th, the system will automatically release the reservation with zero penalty. Would you like me to keep your other holds open or release them now?"
  ],
  tc_hotel_free_cancel_window: [
    "Hello! Thank you for contacting our hotel concierge support. How can I assist you today with your stay or reservation?",
    "Under this hotel's cancellation policy for Motel Oracle, free cancellation applies up to your specified deadline (e.g. up to tomorrow). Cancellations processed within this free window incur zero fees ($0 charge).",
    "Your cancellation for Motel Oracle has been successfully confirmed. Since your cancellation was completed within the hotel's free cancellation period, your total charge is $0 with zero cancellation fees. A confirmation receipt has been sent to your registered contact details."
  ],
  tc_clinic_urgent: [
    "Hello! Thank you for contacting our medical care coordination desk. How can I assist you with your appointment today?",
    "I can help schedule an urgent consultation with Dr. Reed. To look up your patient file, could you please provide your full legal name, date of birth, and contact phone number?",
    "Thank you, Arthur Pendelton. I have scheduled an urgent orthopedic consultation with Dr. Reed for tomorrow at 10:30 AM. Please note our 24-hour cancellation policy and bring your photo ID and insurance card.",
    "You are very welcome, Arthur. We look forward to seeing you tomorrow. Take care!"
  ],
  tc_pet_groom: [
    "Hello! Thank you for contacting pet care concierge support. How can I assist you and your pet today?",
    "I would be happy to help book a full grooming package for Barnaby! Could you confirm whether his Rabies and Bordetella vaccinations are up to date, and note any special behavioral sensitivities?",
    "Wonderful! Barnaby is officially scheduled for a Full Bath & Groom package this Friday at 9:00 AM, with special gentle care notes for his anxiety. Drop-off is between 8:30 and 9:00 AM, and we will text you when he is ready!"
  ],
  tc_bank_fraud_dispute: [
    "Hello! Thank you for contacting our secure banking support desk. How can I assist you with your account today?",
    "I take unauthorized transactions very seriously. I can immediately freeze your card ending in 4092 and open a dispute for the $450 charge. For security authentication, could you please state your full legal name and billing zip code?",
    "Thank you for confirming your identity, Richard Vance. Your debit card ending in 4092 has been immediately locked to prevent further charges, and fraud dispute case #FD-8942 for $450 has been filed. A replacement card is being expedited, and provisional credit will post within 24 to 48 hours.",
    "Your replacement card has been marked for priority express delivery (1-2 business days). Is there anything else I can secure for you today?"
  ],
  tc_tech_router_offline: [
    "Hello! Thank you for calling telecom technical support. How can I help resolve your connectivity or equipment issue today?",
    "A blinking red optical light on your FiberGateway X3 indicates an interruption in incoming fiber signal. Let's perform a quick non-destructive power cycle: please unplug the modem's power cable for 30 seconds, verify the green fiber jack is securely clicked in, and plug it back in.",
    "Thank you for completing the power cycle. Since the optical indicator remains blinking red, this confirms a physical fiber signal disruption outside your home. I have scheduled an expedited field technician dispatch under ticket #TC-7710 for today between 2:00 PM and 5:00 PM.",
    "Your technician window between 2:00 PM and 5:00 PM is confirmed. You will receive an SMS when the specialist is en route. Have a great day!"
  ]
};
