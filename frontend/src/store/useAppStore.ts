import { create } from 'zustand';
import type {
  Prompt,
  PromptVersion,
  TestCase,
  Conversation,
  Message,
  AnalysisReport,
} from '../services/mockDb';
import {
  mockPrompts,
  mockPromptVersions,
  mockTestCases,
  mockConversations,
} from '../services/mockDb';
import { API_BASE } from '../config';


interface AppState {
  prompts: Prompt[];
  versions: PromptVersion[];
  testCases: TestCase[];
  conversations: Conversation[];
  
  // Selection States
  activePromptId: string;
  activeVersionId: string;
  activeTestCaseId: string;
  
  // Active Simulation Loop State
  activeConversation: Conversation | null;
  isSimulating: boolean;
  isAgentTyping: boolean;
  
  // Actions
  setActivePromptId: (id: string) => void;
  setActiveVersionId: (id: string) => void;
  setActiveTestCaseId: (id: string) => void;
  
  // Prompt Actions
  createNewPromptVersion: (systemPrompt: string, constraints: string[], flow: string[], changeDesc: string) => string;
  
  // Test Case Actions
  saveTestCase: (name: string, profile: string, goal: string, variables: Record<string, string>) => void;
  
  // Simulation Control Loop Actions
  startSimulation: (versionId: string, testCaseId: string) => void;
  stopSimulation: () => void;
  sendMessage: (text: string) => void;
  appendAgentStream: (chunk: string) => void;
  setAgentTyping: (isTyping: boolean) => void;
  runBatchRegression: (versionId: string, onProgress?: (completed: number, total: number) => void) => void;
  fetchVersions: () => Promise<void>;
  setConversationReport: (conversationId: string, report: AnalysisReport) => void;
  addConversation: (conv: Conversation) => void;
  saveEvolvedVersion: (previousPrompt: string, improvedPrompt: string, summary: string) => Promise<string | null>;
}

export const useAppStore = create<AppState>((set, get) => ({
  prompts: mockPrompts,
  versions: mockPromptVersions,
  testCases: mockTestCases,
  conversations: mockConversations,
  
  activePromptId: mockPrompts[0]?.id || '',
  activeVersionId: mockPromptVersions[mockPromptVersions.length - 1]?.id || '',
  activeTestCaseId: mockTestCases[0]?.id || '',
  
  activeConversation: null,
  isSimulating: false,
  isAgentTyping: false,
  
  setActivePromptId: (id) => set({ activePromptId: id }),
  setActiveVersionId: (id) => set({ activeVersionId: id }),
  setActiveTestCaseId: (id) => set({ activeTestCaseId: id }),
  
  createNewPromptVersion: (systemPrompt, constraints, flow, changeDesc) => {
    const { versions, activePromptId } = get();
    const promptVersions = versions.filter(v => v.promptId === activePromptId);
    const nextVerNumber = promptVersions.length + 1;
    const newVerId = `ver_v${nextVerNumber}_${Math.random().toString(36).substr(2, 4)}`;
    
    const newVersion: PromptVersion = {
      id: newVerId,
      promptId: activePromptId,
      versionNumber: nextVerNumber,
      systemPrompt,
      checklistConstraints: constraints,
      conversationFlow: flow,
      edgeCases: [
        {
          scenario: 'Fallback identity verification',
          behavior: 'Verify using full name and phone number if standard codes fail.'
        }
      ],
      changeDescription: changeDesc,
      createdAt: new Date().toISOString(),
    };
    
    set((state) => ({
      versions: [...state.versions, newVersion],
      activeVersionId: newVerId,
    }));
    
    return newVerId;
  },
  
  saveTestCase: (name, profile, goal, variables) => {
    const newTestCase: TestCase = {
      id: `tc_${Math.random().toString(36).substr(2, 6)}`,
      name,
      customerProfile: profile,
      goal,
      scenarioVariables: variables,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      testCases: [...state.testCases, newTestCase],
      activeTestCaseId: newTestCase.id,
    }));
  },
  
  startSimulation: (versionId, testCaseId) => {
    const { stopSimulation } = get();
    stopSimulation(); // Reset any active runs
    
    const newConversationId = `conv_${Math.random().toString(36).substr(2, 8)}`;
    
    const initialConv: Conversation = {
      id: newConversationId,
      promptVersionId: versionId,
      testCaseId,
      runMode: 'interactive',
      status: 'in_progress',
      messages: [],
      createdAt: new Date().toISOString(),
    };
    
    set({
      activeConversation: initialConv,
      isSimulating: true,
      isAgentTyping: true,
    });

    const activeVer = get().versions.find(v => v.id === versionId);
    const systemPrompt = activeVer ? activeVer.systemPrompt : "You are an AI customer support agent for hotel concierge support. Warmly greet the customer and ask how you can assist with their reservation.";

    // Trigger initial agent greeting dynamically matching system prompt domain
    fetch(`${API_BASE}/simulator/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_prompt: systemPrompt,
        history: [],
        latest_message: "greeting"
      })
    })
    .then(res => {
      if (!res.ok) throw new Error('API failed');
      return res.json();
    })
    .then((data: { response: string }) => {
      const agentMsg: Message = {
        id: `msg_agent_init_${Date.now()}`,
        sender: 'agent',
        content: data.response,
        timestamp: new Date().toISOString()
      };
      set((state) => {
        if (!state.activeConversation) return {};
        return {
          activeConversation: {
            ...state.activeConversation,
            messages: [agentMsg]
          },
          isAgentTyping: false
        };
      });
    })
    .catch(() => {
      const sysLower = systemPrompt.toLowerCase();
      let defaultGreeting = "Hello! Thank you for contacting customer support. How can I assist you today?";
      if (sysLower.includes("hotel") || sysLower.includes("motel") || sysLower.includes("stay") || sysLower.includes("resort") || sysLower.includes("check-in")) {
        defaultGreeting = "Hello! Thank you for contacting hotel concierge support. How can I assist you today with your stay or reservation?";
      } else if (sysLower.includes("flight") || sysLower.includes("airline") || sysLower.includes("pnr")) {
        defaultGreeting = "Hello! Thank you for contacting airline customer support. How can I assist you today with your flight?";
      } else if (sysLower.includes("doctor") || sysLower.includes("patient") || sysLower.includes("clinic") || sysLower.includes("medical")) {
        defaultGreeting = "Hello! Thank you for contacting our medical care coordination desk. How can I assist you with your appointment today?";
      } else if (sysLower.includes("pet") || sysLower.includes("grooming") || sysLower.includes("vet")) {
        defaultGreeting = "Hello! Thank you for contacting pet care concierge support. How can I assist you and your pet today?";
      }

      const fallbackMsg: Message = {
        id: `msg_agent_init_fallback_${Date.now()}`,
        sender: 'agent',
        content: defaultGreeting,
        timestamp: new Date().toISOString()
      };
      set((state) => {
        if (!state.activeConversation) return {};
        return {
          activeConversation: {
            ...state.activeConversation,
            messages: [fallbackMsg]
          },
          isAgentTyping: false
        };
      });
    });
  },
  
  stopSimulation: () => {
    const { activeConversation, conversations } = get();
    let updatedConvs = [...conversations];
    if (activeConversation && activeConversation.messages.length > 0) {
      const convToSave: Conversation = {
        ...activeConversation,
        status: 'completed'
      };
      const existingIdx = updatedConvs.findIndex(c => c.id === convToSave.id);
      if (existingIdx >= 0) {
        updatedConvs[existingIdx] = convToSave;
      } else {
        updatedConvs = [convToSave, ...updatedConvs];
      }
    }
    set({
      conversations: updatedConvs,
      isSimulating: false,
      isAgentTyping: false,
      activeConversation: null,
    });
  },
  
  setAgentTyping: (isTyping: boolean) => {
    set({ isAgentTyping: isTyping });
  },
  
  sendMessage: (text) => {
    const { activeConversation, isSimulating } = get();
    if (!activeConversation || !isSimulating) return;
    
    const userMsg: Message = {
      id: `msg_user_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      sender: 'customer',
      content: text,
      timestamp: new Date().toISOString()
    };
    
    // Map current history before user message is added
    const history = (activeConversation.messages || []).map(m => ({
      role: m.sender === 'customer' ? 'user' : 'assistant',
      content: m.content
    }));

    set((state) => {
      if (!state.activeConversation) return {};
      return {
        activeConversation: {
          ...state.activeConversation,
          messages: [...state.activeConversation.messages, userMsg]
        },
        isAgentTyping: true
      };
    });
    
    const activeVer = get().versions.find(v => v.id === activeConversation.promptVersionId);
    const systemPrompt = activeVer ? activeVer.systemPrompt : "You are a customer support agent for SwiftAir.";

    // Call actual uvicorn backend for live agent simulation
    fetch(`${API_BASE}/simulator/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_prompt: systemPrompt,
        history: history,
        latest_message: text
      })
    })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return res.json();
    })
    .then((data: { response: string }) => {
      const agentMsg: Message = {
        id: `msg_agent_${Date.now()}`,
        sender: 'agent',
        content: data.response,
        timestamp: new Date().toISOString()
      };
      set((state) => {
        if (!state.activeConversation) return {};
        return {
          activeConversation: {
            ...state.activeConversation,
            messages: [...state.activeConversation.messages, agentMsg]
          },
          isAgentTyping: false
        };
      });
    })
    .catch(err => {
      console.warn('Backend simulator API error, using static fallback message:', err);
      
      const lowerText = text.toLowerCase().trim();
      const messages = activeConversation.messages || [];
      const lastAgentMessage = [...messages].reverse().find(m => m.sender === 'agent');
      const lastAgentText = lastAgentMessage ? lastAgentMessage.content : '';

      // Determine the user's initial choice
      const firstCustomerMsg = messages.find(m => m.sender === 'customer');
      const firstChoice = firstCustomerMsg ? firstCustomerMsg.content.toLowerCase().trim() : '';
      const isInitialCancel = firstChoice === '2' || firstChoice.includes('cancel') || firstChoice.includes('refund');
      const isInitialRebook = firstChoice === '1' || firstChoice.includes('rebook');

      let fallbackReply = "I'm sorry, I didn't quite catch that. Please type the number of your option:\n1. Rebook your flight\n2. Cancel your flight & request a refund\n3. Check booking details or flight status";

      if (!lastAgentText || lastAgentText.includes("choose from the following options")) {
        // State 1: Greeting Selection
        if (lowerText === "1" || lowerText.includes("rebook")) {
          fallbackReply = "I can assist with rebooking your flight. Could you please provide your 6-digit PNR booking reference number?";
        } else if (lowerText === "2" || lowerText.includes("cancel") || lowerText.includes("refund")) {
          fallbackReply = "I can help cancel your flight. Under SwiftAir policy, cancellations within 24 hours of departure incur a $50 administrative fee. Could you please provide your 6-digit PNR booking reference to look up the ticket?";
        } else if (lowerText === "3" || lowerText.includes("lost") || lowerText.includes("detail") || lowerText.includes("booking") || lowerText.includes("find") || lowerText.includes("status")) {
          fallbackReply = "I can help retrieve your booking details. Could you please provide your 6-digit PNR booking reference number?";
        }
      } else if (lastAgentText.includes("confirm the cancellation") || (lastAgentText.includes("incur a $50 administrative fee") && !lastAgentText.includes("PNR booking reference"))) {
        // State 5: Confirmation check (Checked early to prevent general text matches)
        if (lowerText.includes("yes") || lowerText.includes("confirm") || lowerText.includes("proceed") || lowerText.includes("agree")) {
          fallbackReply = "Perfect. Your cancellation is confirmed. A refund of $240 (original ticket price minus the $50 fee) will be credited to your card within 3-5 business days. Is there anything else I can help you with?";
        } else {
          fallbackReply = "Cancellation canceled. Your ticket for Flight SA-302 remains active. Let me know if you would like to do anything else.";
        }
      } else if (lastAgentText.includes("provide your 6-digit PNR")) {
        // State 2: PNR reference verification
        if (lowerText.includes("no") || lowerText.includes("don't have") || lowerText.includes("dont have") || lowerText.includes("forgot") || lowerText.includes("lost it")) {
          fallbackReply = "No problem! As a fallback, could you please provide your registered phone number and full name so I can locate your ticket?";
        } else if (/\b\d{6}\b/.test(lowerText) || lowerText.includes("pnr") || lowerText.includes("code")) {
          if (isInitialCancel) {
            fallbackReply = "Thank you. I found your booking for SwiftAir Flight SA-302 to Chicago. Under SwiftAir policy, cancellations within 24 hours of departure incur a $50 administrative fee. Would you like to confirm the cancellation?";
          } else if (isInitialRebook) {
            fallbackReply = "Thank you. I found your booking for SwiftAir Flight SA-302 to Chicago. We have an available flight tomorrow at 9:00 AM. Would you like me to book that for you?";
          } else {
            fallbackReply = "Thank you. I have successfully retrieved your booking for SwiftAir Flight SA-302 to Chicago. How can I assist you with this ticket? We can either rebook for tomorrow, cancel for a refund, or send the details via SMS.";
          }
        }
      } else if (lastAgentText.includes("provide your registered phone number")) {
        // State 3: Fallback verification (phone/name)
        if (/\b\d{10}\b/.test(lowerText) || lowerText.length >= 6) {
          if (isInitialCancel) {
            fallbackReply = "Thank you. I found your booking for SwiftAir Flight SA-302 to Chicago. Under SwiftAir policy, cancellations within 24 hours of departure incur a $50 administrative fee. Would you like to confirm the cancellation?";
          } else if (isInitialRebook) {
            fallbackReply = "Thank you. I found your booking for SwiftAir Flight SA-302 to Chicago. We have an available flight tomorrow at 9:00 AM. Would you like me to book that for you?";
          } else {
            fallbackReply = "Thank you. I found your booking under your details. Your ticket is for SwiftAir Flight SA-302 to Chicago. Would you like to rebook this, cancel for a refund, or receive the details via SMS?";
          }
        }
      } else if (lastAgentText.includes("found your booking") || lastAgentText.includes("retrieved your booking") || lastAgentText.includes("details via SMS")) {
        // State 4: Booking found, deciding on action
        if (lowerText.includes("sms") || lowerText.includes("send") || lowerText.includes("text") || lowerText.includes("message")) {
          fallbackReply = "I have successfully sent the details of SwiftAir Flight SA-302 to your number via SMS. Would you like to proceed with rebooking or cancellation?";
        } else if (lowerText.includes("cancel") || lowerText.includes("refund") || lowerText === "2") {
          fallbackReply = "Under SwiftAir policy, cancellations within 24 hours of departure incur a $50 administrative fee. Would you like to confirm the cancellation?";
        } else if (lowerText.includes("rebook") || lowerText === "1") {
          fallbackReply = "I can help you rebook. We have a flight tomorrow at 9:00 AM. Would you like me to book that for you?";
        } else {
          fallbackReply = "Your ticket is active for SwiftAir Flight SA-302 to Chicago. Please let me know if you would like to cancel and request a refund, rebook for tomorrow, or receive the details via SMS.";
        }
      } else {
        const isGoodbye = lowerText.includes("thank") || 
                          lowerText.includes("thanks") || 
                          lowerText.includes("thx") || 
                          lowerText.includes("thnks") || 
                          lowerText.includes("bye") || 
                          lowerText === "no" || 
                          lowerText.startsWith("no ") || 
                          lowerText.includes("nothing") || 
                          lowerText.includes("no other");

        if (isGoodbye) {
          fallbackReply = "You're very welcome! Thank you for calling SwiftAir Support. Have a wonderful day!";
          // Mark simulation session as completed
          setTimeout(() => {
            set((state) => {
              if (!state.activeConversation) return {};
              return {
                activeConversation: {
                  ...state.activeConversation,
                  status: 'completed'
                }
              };
            });
          }, 500);
        } else {
          fallbackReply = "Is there anything else I can help you with? You can ask to rebook, cancel, or receive flight details via SMS.";
        }
      }

      const fallbackMsg: Message = {
        id: `msg_agent_fallback_${Date.now()}`,
        sender: 'agent',
        content: fallbackReply,
        timestamp: new Date().toISOString()
      };
      set((state) => {
        if (!state.activeConversation) return {};
        return {
          activeConversation: {
            ...state.activeConversation,
            messages: [...state.activeConversation.messages, fallbackMsg]
          },
          isAgentTyping: false
        };
      });
    });
  },


  
  appendAgentStream: (chunk) => {
    set((state) => {
      const active = state.activeConversation;
      if (!active) return {};
      
      const messages = [...active.messages];
      const lastMsg = messages[messages.length - 1];
      
      if (lastMsg && lastMsg.sender === 'agent') {
        messages[messages.length - 1] = {
          ...lastMsg,
          content: lastMsg.content + chunk
        };
      }
      
      return {
        activeConversation: {
          ...active,
          messages
        }
      };
    });
  },
  
  runBatchRegression: (versionId, onProgress) => {
    const { testCases, versions } = get();
    const targetVersion = versions.find(v => v.id === versionId);
    if (!targetVersion) return;
    
    let completedCount = 0;
    const totalCount = testCases.length;
    const newConversations: Conversation[] = [];
    
    testCases.forEach((tc, idx) => {
      setTimeout(() => {
        const successScore = versionId === 'ver_v2' 
          ? 100 
          : tc.id === 'tc_angry_no_code' ? 40 : 100;
          
        const messages: Message[] = [
          { id: `b_msg_1_${idx}`, sender: 'agent', content: 'Hello! Thank you for calling SwiftAir. How can I assist you?', timestamp: new Date().toISOString() },
          { id: `b_msg_2_${idx}`, sender: 'customer', content: tc.goal, timestamp: new Date().toISOString() },
          { id: `b_msg_3_${idx}`, sender: 'agent', content: successScore === 100 ? 'Let me lookup your reservation details. Verified.' : 'I must obtain your booking code to process this.', timestamp: new Date().toISOString() }
        ];
        
        const analysis: AnalysisReport = {
          id: `an_b_${Math.random().toString(36).substr(2, 6)}`,
          conversationId: `conv_b_${idx}_${Math.random().toString(36).substr(2, 4)}`,
          promptVersionId: versionId,
          successScore,
          hasFailures: successScore < 100,
          checklistResults: targetVersion.checklistConstraints.map((c, cIdx) => ({
            criteria: c,
            passed: successScore === 100 || cIdx === 0 || cIdx === 4,
            details: successScore === 100 ? 'Goal criteria met.' : 'Goal validation failed.'
          })),
          sentimentScore: successScore === 100 ? 0.4 : -0.7,
          tokenCount: 950,
          latencyMs: 780,
          costUsd: 0.009,
          rootCauseExplanation: successScore === 100 
            ? 'Successful regression search fallback execution.' 
            : 'Failure triggered by booking reference validation loop.',
          suggestedPromptImprovement: successScore === 100 ? '' : 'Add identity fallback prompts.',
          createdAt: new Date().toISOString()
        };
        
        const batchConv: Conversation = {
          id: analysis.conversationId,
          promptVersionId: versionId,
          testCaseId: tc.id,
          runMode: 'background',
          status: successScore === 100 ? 'completed' : 'failed',
          messages,
          analysisReport: analysis,
          createdAt: new Date().toISOString()
        };
        
        newConversations.push(batchConv);
        completedCount++;
        if (onProgress) {
          onProgress(completedCount, totalCount);
        }
        
        if (completedCount === totalCount) {
          set((state) => ({
            conversations: [...newConversations, ...state.conversations]
          }));
        }
      }, (idx + 1) * 300);
    });
  },
  
  fetchVersions: async () => {
    try {
      const res = await fetch(`${API_BASE}/versions/`);
      if (res.ok) {
        const data = await res.json();
        // Map backend Version to frontend PromptVersion
        const mappedFromBackend: PromptVersion[] = data.map((v: any) => {
          const sysLower = (v.improved_prompt || '').toLowerCase();
          const isHotel = sysLower.includes('hotel') || sysLower.includes('motel') || sysLower.includes('stay') || sysLower.includes('concierge');
          
          return {
            id: `ver_v${v.version_number}`,
            promptId: isHotel ? 'prm_hotel_concierge' : 'prm_flight_support',
            versionNumber: v.version_number,
            systemPrompt: v.improved_prompt,
            checklistConstraints: isHotel
              ? [
                  'Warmly greet the guest',
                  'Hotel-specific free cancellation policy ($0 fee within window)',
                  'Book at $0 zero-upfront hold support',
                  'Explicit fallback identity verification for lost codes',
                  '24/7 late check-in keyless entry & luggage holding',
                  'Brevity & hospitability constraint (max 2-3 sentences)'
                ]
              : v.version_number >= 3 
              ? ['Warmly greet the customer', 'Verify booking reference or fallback phone', 'Keep responses empathetic and short']
              : v.version_number === 2 
              ? ['Warmly greet the customer', 'Acquire booking reference number before cancellation checks']
              : ['Assist users with questions'],
            conversationFlow: isHotel
              ? ['Greeting and query parsing', 'Identity fallback / Code lookup', 'Policy confirmation & modification execution']
              : v.version_number >= 3
              ? ['Greeting and query parsing', 'Identity verification fallback']
              : v.version_number === 2
              ? ['Greeting and query parsing', 'Booking reference verification']
              : ['Greeting and query parsing'],
            edgeCases: [],
            changeDescription: v.summary_of_changes,
            createdAt: v.timestamp
          };
        });

        // Merge with existing versions to ensure none are lost
        const existingVersions = get().versions;
        const versionMap = new Map<string, PromptVersion>();
        existingVersions.forEach(v => versionMap.set(v.id, v));
        mappedFromBackend.forEach(v => versionMap.set(v.id, v));

        const merged = Array.from(versionMap.values());
        merged.sort((a, b) => a.versionNumber - b.versionNumber);
        
        set({ versions: merged });
        if (merged.length > 0) {
          const latest = merged[merged.length - 1];
          set({ activeVersionId: latest.id });
        }
      }
    } catch (err) {
      console.warn("Failed to fetch versions from backend SQLite:", err);
    }
  },

  setConversationReport: (conversationId: string, report: AnalysisReport) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, analysisReport: report, status: 'completed' } : c
      )
    }));
  },

  addConversation: (conv: Conversation) => {
    set((state) => ({
      conversations: [conv, ...state.conversations]
    }));
  },

  saveEvolvedVersion: async (previousPrompt: string, improvedPrompt: string, summary: string) => {
    try {
      const res = await fetch(`${API_BASE}/versions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previous_prompt: previousPrompt,
          improved_prompt: improvedPrompt,
          summary_of_changes: summary,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        await get().fetchVersions();
        const createdVerId = `ver_v${created.version_number}`;
        set({ activeVersionId: createdVerId });
        return createdVerId;
      }
    } catch (err) {
      console.warn("Failed to persist evolved version to backend SQLite:", err);
    }
    // Fallback in-memory version creation
    const newVerId = get().createNewPromptVersion(
      improvedPrompt,
      ['Warmly greet', 'Identity verification with fallback', 'Empathetic de-escalation', 'Max 2-3 sentences'],
      ['Greeting', 'Identity Verification', 'Resolution', 'Confirmation'],
      summary
    );
    return newVerId;
  }
}));

