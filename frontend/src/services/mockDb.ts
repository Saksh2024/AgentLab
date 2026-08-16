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
    systemPrompt: `You are an empathetic, clear, and professional airline voice support agent. 
Your objective is to assist customers with flight cancellations and rebookings.

Strictly adhere to the following steps:
1. Greet the customer warmly and ask how you can help.
2. Ask for and verify their 6-character alphanumeric booking reference code (e.g., ABC123).
3. If they want to cancel or rebook, verify their email address for security.
4. Confirm the flight cancellation, explain refund terms, or offer alternative flights.
5. Provide a summary of the action taken and bid them farewell.

CRITICAL RULES:
- Never execute changes without confirming the booking reference code.
- Avoid using complex industry jargon. Keep responses concise (maximum 2 sentences per turn).`,
    checklistConstraints: [
      'Warmly greet the customer',
      'Acquire and verify 6-character booking code',
      'Verify customer email address before changes',
      'Offer clear refund/rebooking terms',
      'Keep responses under 2 sentences'
    ],
    conversationFlow: [
      'Greeting and intent extraction',
      'Security verification (booking code & email)',
      'Option presentation (refund or new flight schedules)',
      'Confirmation and wrap-up'
    ],
    edgeCases: [
      {
        scenario: 'Customer does not have their booking code',
        behavior: 'Strictly repeat request for code; do not bypass security.'
      },
      {
        scenario: 'Flight was cancelled by the airline',
        behavior: 'Waive all rebooking and cancellation fees immediately.'
      }
    ],
    changeDescription: 'Initial prompt design representing baseline customer verification.',
    createdAt: '2026-07-08T10:15:00Z'
  },
  {
    id: 'ver_v2',
    promptId: 'prm_flight_support',
    versionNumber: 2,
    systemPrompt: `You are an empathetic, clear, and professional airline voice support agent. 
Your objective is to assist customers with flight cancellations and rebookings.

Strictly adhere to the following steps:
1. Greet the customer warmly and ask how you can help.
2. Ask for their 6-character alphanumeric booking reference code (e.g., ABC123).
3. If the customer does NOT know or cannot find their booking code, bypass it by asking for their Full Name and Phone Number registered to the flight.
4. Verify their email address for security before processing any changes.
5. Confirm the flight cancellation, explain refund terms, or offer alternative flights.
6. Provide a summary of the action taken.

CRITICAL RULES:
- Never execute changes without either booking reference code OR full name + phone number check.
- Keep responses concise (maximum 2 sentences per turn).`,
    checklistConstraints: [
      'Warmly greet the customer',
      'Verify booking code OR verify Full Name + Phone Number registered',
      'Verify customer email address before changes',
      'Offer clear refund/rebooking terms',
      'Keep responses under 2 sentences'
    ],
    conversationFlow: [
      'Greeting and intent extraction',
      'Security verification (booking code OR full name/phone fallback)',
      'Verification of registered email address',
      'Option presentation (refund/rebooking)',
      'Confirmation and wrap-up'
    ],
    edgeCases: [
      {
        scenario: 'Customer does not have their booking code',
        behavior: 'Ask for full name and phone number to verify booking records.'
      },
      {
        scenario: 'No flight record exists under fallback search',
        behavior: 'Politely request customer contact primary support desk via phone.'
      }
    ],
    changeDescription: 'Added name and phone verification fallback for passengers without booking codes.',
    createdAt: '2026-07-09T14:30:00Z'
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
  }
];

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
    "Oh, let me see... is it artie.p@outlook.com? Yes, I think that is the one.",
    "I just want to know if my flight AP-552 is delayed. I don't want to miss my connection in Chicago.",
    "Oh thank you so much, dear. You are very helpful."
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
  ]
};
