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

// ==========================================
// SEED MOCK DATA
// ==========================================

export const mockPrompts: Prompt[] = [
  {
    id: 'prm_flight_support',
    useCase: 'Airlines Support - Cancellations & Rebooking',
    language: 'English',
    tone: 'Empathetic, clear, and professional',
    createdAt: '2026-07-08T10:00:00Z',
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

export const getDomainCustomerProfiles = (systemPrompt?: string): TestCase[] => {
  const sysLower = (systemPrompt || '').toLowerCase();

  // 1. HOTEL & HOSPITALITY / LODGING
  if (sysLower.includes('hotel') || sysLower.includes('motel') || sysLower.includes('resort') || sysLower.includes('stay') || sysLower.includes('check-in') || sysLower.includes('concierge')) {
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
  if (sysLower.includes('doctor') || sysLower.includes('patient') || sysLower.includes('clinic') || sysLower.includes('dental') || sysLower.includes('medical') || sysLower.includes('health') || sysLower.includes('physician')) {
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
  if (sysLower.includes('grooming') || sysLower.includes('pet') || sysLower.includes('dog') || sysLower.includes('cat') || sysLower.includes('vet') || sysLower.includes('puppy')) {
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
  if (sysLower.includes('bank') || sysLower.includes('card') || sysLower.includes('account') || sysLower.includes('fraud') || sysLower.includes('dispute') || sysLower.includes('transfer') || sysLower.includes('loan')) {
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
  if (sysLower.includes('tech') || sysLower.includes('wifi') || sysLower.includes('router') || sysLower.includes('internet') || sysLower.includes('troubleshoot') || sysLower.includes('modem') || sysLower.includes('telecom')) {
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
  ]
};
