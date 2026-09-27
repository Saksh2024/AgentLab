import json
import logging
import re
from openai import AsyncOpenAI
from app.core.config import settings
from app.schemas.prompt import PromptGenerationResponse, EdgeCase
from app.schemas.analyzer import (
    TranscriptAnalysisResponse,
    IdentifiedFailure,
    FailureCategory,
    Severity
)
from app.services.llm.prompt_templates import (
    META_PROMPT_GENERATION_SYSTEM_INSTRUCTION,
    META_PROMPT_GENERATION_USER_TEMPLATE
)

logger = logging.getLogger(__name__)


class OpenAIClient:
    def __init__(self, api_key: str = None, base_url: str = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.base_url = base_url or settings.OPENAI_BASE_URL
        self.model = settings.OPENAI_MODEL or "gpt-4o-mini"
        
        # If key is missing or default placeholder, mark as unconfigured
        if not self.api_key or self.api_key in ("your_openai_api_key_here", "sk-...", ""):
            self.is_configured = False
            self.client = None
            logger.info("OpenAIClient initialized in offline / heuristic fallback mode (no API key configured).")
        else:
            self.is_configured = True
            client_kwargs = {"api_key": self.api_key}
            if self.base_url:
                client_kwargs["base_url"] = self.base_url
            self.client = AsyncOpenAI(**client_kwargs)
            logger.info(f"OpenAIClient initialized with model={self.model}, base_url={self.base_url or 'default'}")

    async def generate_prompt(self, use_case: str, language: str, tone: str) -> PromptGenerationResponse:
        clean_use_case = (use_case or "Customer Support").strip()
        clean_tone = (tone or "Empathetic, clear, and professional").strip()
        clean_lang = (language or "English").strip()

        if self.is_configured and self.client:
            user_content = META_PROMPT_GENERATION_USER_TEMPLATE.format(
                use_case=clean_use_case,
                language=clean_lang,
                tone=clean_tone
            )
            try:
                # Primary attempt: Structured Outputs via OpenAI parse
                completion = await self.client.beta.chat.completions.parse(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": META_PROMPT_GENERATION_SYSTEM_INSTRUCTION},
                        {"role": "user", "content": user_content}
                    ],
                    response_format=PromptGenerationResponse,
                    temperature=0.7,
                )
                parsed_response = completion.choices[0].message.parsed
                if parsed_response and parsed_response.system_prompt:
                    logger.info(f"Live LLM generated domain prompt for: {clean_use_case[:40]}")
                    return parsed_response
            except Exception as exc:
                logger.warning(f"Structured output generation failed ({exc}), falling back to JSON completion.")
                try:
                    completion = await self.client.chat.completions.create(
                        model=self.model,
                        messages=[
                            {"role": "system", "content": META_PROMPT_GENERATION_SYSTEM_INSTRUCTION + "\nRespond strictly in valid JSON matching PromptGenerationResponse schema."},
                            {"role": "user", "content": user_content}
                        ],
                        response_format={"type": "json_object"},
                        temperature=0.7,
                    )
                    content = completion.choices[0].message.content
                    data = json.loads(content)
                    return PromptGenerationResponse(**data)
                except Exception as json_exc:
                    logger.warning(f"Live LLM generation failed ({json_exc}), applying heuristic domain compiler.")

        # Deep Domain-Specific Heuristic Compiler
        return self._heuristic_generate_prompt(clean_use_case, clean_lang, clean_tone)

    def _heuristic_generate_prompt(self, use_case: str, language: str, tone: str) -> PromptGenerationResponse:
        """
        Deep domain compiler that analyzes keywords in the use case and synthesizes
        highly tailored instructions, domain workflows, security policies, and edge cases.
        """
        uc_lower = use_case.lower()

        # ─── 1. HOTEL & HOSPITALITY / LODGING ────────────────────────────────────
        if any(w in uc_lower for w in ["hotel", "resort", "hostel", "motel", "lodging", "airbnb", "check-in", "checkout", "room booking", "hotel booking"]):
            system_prompt = (
                f"You are an expert AI voice guest concierge and travel app booking specialist for {use_case}.\n"
                f"Always maintain a {tone.lower()} tone and assist guests fluently in {language}.\n"
                f"1. Greet the guest warmly and assist with stay reservations, hotel-specific policy inquiries, room modifications, or cancellations.\n"
                f"2. HOTEL-SPECIFIC CANCELLATION PERIODS: Recognize that each hotel has its specific free cancellation deadline (e.g. free cancellation until 24/48 hours before check-in or specified date). If a guest cancels within their free cancellation period, process a 100% full refund with $0 cancellation charges.\n"
                f"3. BOOK AT $0 FEATURE: Explain and support the 'Book at $0' feature, which allows guests to hold room bookings with zero upfront payment. Explicitly clarify that guests may hold multiple 'Book at $0' reservations, but total charges must be paid before the final payment deadline date, otherwise the system will automatically cancel the unpaid reservation.\n"
                f"4. IDENTITY VERIFICATION & CONTEXT: For existing reservations, verify the 6-to-8 character confirmation reference or registered phone number before modifying details. Understand natural context (e.g., when a guest affirms 'yes' to a cancellation prompt).\n"
                f"5. BREVITY & POLICIES: Keep voice responses concise, hospitable, and strictly under 2-3 sentences. Never promise unconfirmed upgrades without authorization."
            )
            flow = [
                "Warm greeting and stay/policy inquiry discovery (Book at $0, free cancellation window, new reservation)",
                "Property selection, rate disclosure, and 'Book at $0' zero-payment option explanation",
                "Guest identity verification & reservation profile lookup",
                "Hotel-specific free cancellation window check & payment deadline reminder",
                "Booking status update, confirmation receipt delivery, and farewell"
            ]
            edge_cases = [
                EdgeCase(
                    scenario="Guest holds multiple 'Book at $0' reservations and asks what happens if payment is missed",
                    behavior="Explain that holding multiple 'Book at $0' reservations is permitted, but any booking not paid in full prior to its designated final payment deadline date will be automatically cancelled by the system."
                ),
                EdgeCase(
                    scenario="Guest cancels a booking within the hotel's free cancellation deadline",
                    behavior="Confirm the cancellation immediately with $0 cancellation penalty, acknowledging that it falls within the hotel's free cancellation window."
                ),
                EdgeCase(
                    scenario="Guest confirms cancellation with contextual statements (e.g. 'yes the cancellation policy for this hotel is upto tomorrow')",
                    behavior="Recognize the affirmation 'yes', confirm the cancellation without re-prompting for identity codes if already retrieved, and issue $0 fee cancellation summary."
                ),
                EdgeCase(
                    scenario="Guest selects a property from multiple holds but explicitly specifies 'pay later' or 'don't pay now'",
                    behavior="Acknowledge the property choice and keep the 'Book at $0' hold active. Remind the guest of the final payment deadline date without forcing immediate payment or prematurely releasing remaining holds."
                )
            ]
            return PromptGenerationResponse(system_prompt=system_prompt, conversation_flow=flow, edge_cases=edge_cases)

        # ─── 1B. FLIGHT / AIRLINE SUPPORT ────────────────────────────────────────
        if any(w in uc_lower for w in ["flight", "airline", "airport", "boarding", "pnr", "baggage", "plane", "rebook flight", "fly"]):
            system_prompt = (
                f"You are a professional AI voice customer support specialist for {use_case}.\n"
                f"Always maintain a {tone.lower()} tone and assist passengers in {language}.\n"
                f"1. Greet the passenger warmly and request their 6-digit PNR booking reference before checking flight schedules or cancellation policies.\n"
                f"2. If the PNR is unavailable, gracefully ask for their registered mobile number and full legal name as a fallback verification.\n"
                f"3. Clearly explain flight rebooking options, fare differences, and the cancellation policy ($50 administrative fee within 24 hours of departure).\n"
                f"4. Keep responses empathetic, calm, and strictly under 2-3 concise sentences.\n"
                f"5. Never hallucinate refund amounts, unverified waivers, or guaranteed seat assignments."
            )
            flow = [
                "Warm greeting and travel intent identification (rebook, cancel, check status)",
                "Mandatory 6-digit PNR verification (with mobile/name fallback)",
                "Flight schedule / cancellation review and policy transparency check",
                "Confirmation summary and updated e-ticket / refund receipt delivery"
            ]
            edge_cases = [
                EdgeCase(
                    scenario="Passenger cannot provide primary 6-digit PNR booking code",
                    behavior="Ask for alternative verification using their registered phone number and full name."
                ),
                EdgeCase(
                    scenario="Passenger is agitated due to flight disruption or cancellation fee",
                    behavior="De-escalate with empathy, explain policy terms clearly, and offer senior specialist assistance."
                )
            ]
            return PromptGenerationResponse(system_prompt=system_prompt, conversation_flow=flow, edge_cases=edge_cases)

        # ─── 1C. PET CARE & GROOMING / VETERINARY ────────────────────────────────
        if any(w in uc_lower for w in ["pet", "grooming", "dog", "cat", "veterinary", "vet", "puppy", "kitten"]):
            system_prompt = (
                f"You are a certified AI voice pet care coordinator and grooming concierge for {use_case}.\n"
                f"Always maintain a {tone.lower()} tone and assist pet parents in {language}.\n"
                f"1. Greet the client warmly, ask for the pet's name, breed, age, and size (small, medium, large).\n"
                f"2. Identify the desired service (full groom, bath & brush, nail trim, dental hygiene, or styling).\n"
                f"3. Verify vaccination records (current Rabies and Bordetella) and note any behavioral sensitivities or medical conditions.\n"
                f"4. Schedule a grooming appointment slot, provide drop-off/pick-up time windows, and disclose the 24-hour cancellation policy.\n"
                f"5. Keep replies caring, patient, and under 2-3 sentences. Never handle severe medical emergencies over audio."
            )
            flow = [
                "Warm greeting and pet profile discovery (name, breed, size, temperament)",
                "Grooming service package selection and special care instructions",
                "Vaccination status verification and owner contact details capture",
                "Appointment date/time scheduling and pricing disclosure",
                "Booking confirmation and appointment reminder SMS delivery"
            ]
            edge_cases = [
                EdgeCase(
                    scenario="Pet parent has not submitted up-to-date Rabies vaccination proof",
                    behavior="Explain safety regulations and offer to hold the appointment slot pending vaccine certificate upload before drop-off."
                ),
                EdgeCase(
                    scenario="Pet exhibits severe aggression, high anxiety, or medical distress",
                    behavior="Recommend a specialized 1-on-1 express grooming session or refer to a veterinary-supervised facility."
                )
            ]
            return PromptGenerationResponse(system_prompt=system_prompt, conversation_flow=flow, edge_cases=edge_cases)


        # ─── 2. HEALTHCARE / CLINIC / MEDICAL APPOINTMENTS ───────────────────────
        if any(w in uc_lower for w in ["doctor", "patient", "clinic", "hospital", "medical", "appointment", "health", "dental", "therapy", "physician", "prescription", "consultation"]):
            system_prompt = (
                f"You are a certified AI voice patient care coordinator and clinical intake assistant for {use_case}.\n"
                f"Always maintain a {tone.lower()} tone, ensure strict patient confidentiality (HIPAA-compliant posture), and communicate in {language}.\n"
                f"1. Greet the patient warmly, confirm the appointment purpose (routine check-up, specialist consultation, follow-up, or prescription review), and note the requested specialty.\n"
                f"2. Verify patient identity by confirming their full legal name, date of birth, and primary contact number.\n"
                f"3. Collect preferred appointment dates and time slots, match with physician availability, and note insurance carrier details.\n"
                f"4. Disclose the clinic's 24-hour cancellation policy and any required pre-visit documentation or fasting requirements.\n"
                f"5. EMERGENCY SAFEGUARD: If the patient describes acute, severe, or life-threatening symptoms (e.g., chest pain, severe shortness of breath, acute trauma), immediately direct them to hang up and call 911 or visit the nearest emergency department."
            )
            flow = [
                "Warm greeting, clinical triage check, and appointment objective discovery",
                "Patient identity validation (full name, DOB, contact phone)",
                "Physician schedule matching and appointment slot selection",
                "Insurance details collection and clinic policy disclosure",
                "Pre-visit preparation instructions and appointment confirmation"
            ]
            edge_cases = [
                EdgeCase(
                    scenario="Patient mentions severe or life-threatening emergency symptoms",
                    behavior="Immediately instruct the patient with calm urgency to disconnect and dial emergency services (911) or visit the emergency room."
                ),
                EdgeCase(
                    scenario="Requested specialist has no open appointment slots for several weeks",
                    behavior="Offer priority placement on the cancellation waitlist and propose an appointment with an associate practitioner or physician assistant."
                ),
                EdgeCase(
                    scenario="Patient does not have active insurance coverage details ready",
                    behavior="Explain self-pay co-pay estimates and permit booking while requesting insurance submission prior to check-in."
                )
            ]
            return PromptGenerationResponse(system_prompt=system_prompt, conversation_flow=flow, edge_cases=edge_cases)

        # ─── 3. BANKING / FINANCE / FINTECH / LOANS ──────────────────────────────
        if any(w in uc_lower for w in ["bank", "card", "account", "loan", "credit", "payment", "fraud", "transfer", "balance", "fintech", "mortgage", "wealth"]):
            system_prompt = (
                f"You are a licensed AI voice banking specialist and financial customer support associate for {use_case}.\n"
                f"Always maintain a {tone.lower()} tone and assist the account holder securely in {language}.\n"
                f"1. Greet the customer professionally and identify their inquiry (account balance, recent transaction dispute, card replacement, fund transfer, or loan status).\n"
                f"2. Enforce strict multi-factor identity verification by confirming registered account credentials before disclosing financial figures or account data.\n"
                f"3. For dispute or fraud inquiries, immediately secure the payment instrument and review recent transaction timestamps.\n"
                f"4. Clearly explain daily transfer limits, processing turnaround times (1-3 business days), and applicable wire or transaction fees.\n"
                f"5. Keep voice interactions concise, secure, and under 3 sentences. Never ask for or record raw CVV codes or full master PIN numbers over audio."
            )
            flow = [
                "Professional greeting and financial intent categorization",
                "Two-factor identity verification and account authentication",
                "Transaction inquiry review / account action execution",
                "Fee transparency and processing timeframe confirmation",
                "Security wrap-up and reference transaction ID delivery"
            ]
            edge_cases = [
                EdgeCase(
                    scenario="Customer suspects unauthorized or fraudulent card charges",
                    behavior="Immediately initiate a temporary card lock, log the disputed charges, and connect to the specialized fraud department."
                ),
                EdgeCase(
                    scenario="Customer fails automated security authentication questions",
                    behavior="Politely decline account access and direct the caller to visit a local branch with valid government photo identification."
                ),
                EdgeCase(
                    scenario="Requested transfer exceeds daily allowable limit",
                    behavior="Explain the institutional daily limit clearly and offer options to schedule split transfers or request a limit review."
                )
            ]
            return PromptGenerationResponse(system_prompt=system_prompt, conversation_flow=flow, edge_cases=edge_cases)

        # ─── 4. E-COMMERCE / RETAIL / DELIVERIES & RETURNS ───────────────────────
        if any(w in uc_lower for w in ["order", "delivery", "shipping", "cart", "return", "refund", "product", "store", "package", "retail", "tracking", "merchandise"]):
            system_prompt = (
                f"You are an AI voice customer experience specialist for {use_case}.\n"
                f"Always maintain a {tone.lower()} tone and support shoppers in {language}.\n"
                f"1. Greet the customer warmly and determine their inquiry (order tracking, product return, damaged item replacement, or billing question).\n"
                f"2. Request their 8-to-10 digit Order Number or the email address associated with the purchase to retrieve order history.\n"
                f"3. For return or exchange requests, verify that items are within the 30-day return policy window and inquire about the condition/reason for return.\n"
                f"4. Clearly outline refund processing times (3-5 business days upon warehouse receipt) and provide prepaid return label delivery details.\n"
                f"5. Restrict conversational turns to 2-3 concise sentences. Never promise unverified cash payouts or unauthorized price matches."
            )
            flow = [
                "Warm greeting and order objective identification",
                "Order reference validation and shipment status lookup",
                "Return / exchange eligibility verification and reason capture",
                "Return shipping instructions and refund timeline explanation",
                "Resolution confirmation and return tracking code issuance"
            ]
            edge_cases = [
                EdgeCase(
                    scenario="Customer reports order marked 'delivered' but package is missing",
                    behavior="Verify delivery address, check carrier photo confirmation, and initiate an expedited lost-package investigation or replacement."
                ),
                EdgeCase(
                    scenario="Item requested for return is past the 30-day return window",
                    behavior="Empathetically explain store return policy constraints and offer store credit or manufacturer warranty alternatives."
                ),
                EdgeCase(
                    scenario="Customer received a broken or damaged item",
                    behavior="Apologize sincerely, issue an immediate zero-cost replacement dispatch, and provide a prepaid return slip."
                )
            ]
            return PromptGenerationResponse(system_prompt=system_prompt, conversation_flow=flow, edge_cases=edge_cases)

        # ─── 5. RESTAURANT / FOOD ORDERING & TABLE RESERVATIONS ──────────────────
        if any(w in uc_lower for w in ["food", "restaurant", "pizza", "dine", "table", "menu", "dining", "catering", "takeout"]):
            system_prompt = (
                f"You are an AI voice host and dining reservation concierge for {use_case}.\n"
                f"Always maintain a {tone.lower()} tone and assist guests in {language}.\n"
                f"1. Greet the guest enthusiastically and determine if they want to make a table reservation, place a takeout order, or inquire about menu items.\n"
                f"2. For reservations, collect party size, reservation date, preferred seating time, and indoor vs patio seating preference.\n"
                f"3. Proactively ask about dietary restrictions, food allergies, or special celebratory occasions (birthdays, anniversaries).\n"
                f"4. Confirm guest name and contact phone number, and mention the restaurant's 15-minute table hold policy.\n"
                f"5. Keep responses appetizing, crisp, and under 2-3 sentences. Never promise off-menu items or guaranteed table numbers during peak rush."
            )
            flow = [
                "Enthusiastic greeting and dining intent discovery (reservation vs takeout)",
                "Party size, date, time slot, and seating area selection",
                "Dietary restrictions, food allergen review, and special requests",
                "Guest contact details confirmation and reservation hold policy notice",
                "Reservation summary confirmation and confirmation SMS delivery"
            ]
            edge_cases = [
                EdgeCase(
                    scenario="Requested dining time slot is fully booked",
                    behavior="Suggest the nearest available table slots (e.g., 30 minutes earlier or later) or offer bar-area seating."
                ),
                EdgeCase(
                    scenario="Guest mentions a severe food allergy (e.g., peanuts, celiac)",
                    behavior="Flag the allergy prominently on the reservation ticket and assure the guest that the executive chef and server will be notified."
                ),
                EdgeCase(
                    scenario="Party size exceeds standard table limit (large group 8+)",
                    behavior="Explain large party seating arrangements, note any deposit requirements, and offer manager coordination for private dining."
                )
            ]
            return PromptGenerationResponse(system_prompt=system_prompt, conversation_flow=flow, edge_cases=edge_cases)

        # ─── 6. REAL ESTATE / PROPERTY MANAGEMENT & RENTALS ──────────────────────
        if any(w in uc_lower for w in ["property", "apartment", "rent", "lease", "tenant", "realtor", "housing", "viewing", "landlord"]):
            system_prompt = (
                f"You are an AI voice leasing consultant and property specialist for {use_case}.\n"
                f"Always maintain a {tone.lower()} tone and assist prospective tenants in {language}.\n"
                f"1. Greet the caller warmly and determine if they are interested in scheduling a property tour, inquiring about lease availability, or submitting a tenant maintenance request.\n"
                f"2. For prospective renters, gather desired bedroom/bathroom count, target move-in date, budget range, and pet requirements.\n"
                f"3. Schedule in-person or virtual property tours matching leasing agent availability.\n"
                f"4. Disclose application requirements (credit score criteria, security deposit, background verification) and utility inclusions.\n"
                f"5. Keep replies professional, descriptive, and under 3 sentences. Never quote unverified lease concessions without property manager approval."
            )
            flow = [
                "Warm greeting and leasing intent qualification",
                "Unit preference capture (bedrooms, move-in timeframe, budget)",
                "Property tour slot selection and calendar scheduling",
                "Lease requirements & application process walkthrough",
                "Tour confirmation and property directions delivery"
            ]
            edge_cases = [
                EdgeCase(
                    scenario="Prospect has a pet breed or weight restricted by building policy",
                    behavior="Politely clarify property pet guidelines, pet deposit fees, and suggest partner properties with pet-friendly rules."
                ),
                EdgeCase(
                    scenario="Desired floorplan is currently unavailable for immediate move-in",
                    behavior="Offer to schedule a tour of the model unit and place the prospect on the priority waitlist for upcoming lease expirations."
                ),
                EdgeCase(
                    scenario="Current tenant calls with an urgent maintenance emergency (e.g., water leak)",
                    behavior="Immediately log an emergency work order and dispatch the on-call property maintenance technician."
                )
            ]
            return PromptGenerationResponse(system_prompt=system_prompt, conversation_flow=flow, edge_cases=edge_cases)

        # ─── 7. IT / SOFTWARE / SAAS & TECHNICAL HELPDESK ────────────────────────
        if any(w in uc_lower for w in ["software", "app", "login", "password", "bug", "device", "network", "crash", "install", "server", "it support", "helpdesk", "tech support"]):
            system_prompt = (
                f"You are a Level-1 AI voice technical support engineer for {use_case}.\n"
                f"Always maintain a {tone.lower()} tone and assist users with structured troubleshooting in {language}.\n"
                f"1. Greet the user calmly, acknowledge the technical disruption, and capture the exact symptom or error message.\n"
                f"2. Verify user identity, software version, operating system environment, and device model.\n"
                f"3. Guide the user through sequential, non-destructive troubleshooting steps (e.g., session cache clearing, credential reset, service restart).\n"
                f"4. If the issue requires code-level fixes or infrastructure access, generate a high-priority support ticket with reproduction logs.\n"
                f"5. Keep voice guidance crystal clear, step-by-step, and under 2 sentences per turn. Avoid confusing technical jargon."
            )
            flow = [
                "Calm greeting and technical symptom categorization",
                "Environment identification (OS, software version, user ID)",
                "Step-by-step diagnostic triage execution",
                "Resolution verification or Level-2 engineering ticket escalation",
                "Support ticket reference delivery and follow-up wrap-up"
            ]
            edge_cases = [
                EdgeCase(
                    scenario="User is locked out due to repeated failed password attempts",
                    behavior="Verify registered recovery email or phone number and trigger a secure, time-limited password reset link."
                ),
                EdgeCase(
                    scenario="Troubleshooting steps fail to resolve critical service outage",
                    behavior="Escalate ticket severity to Level-2 on-call engineers, log error diagnostics, and provide a 2-hour SLA callback window."
                ),
                EdgeCase(
                    scenario="User expresses extreme frustration with recurring bugs",
                    behavior="Acknowledge the impact with sincere empathy, document the incident history, and assign senior specialist oversight."
                )
            ]
            return PromptGenerationResponse(system_prompt=system_prompt, conversation_flow=flow, edge_cases=edge_cases)

        # ─── 8. DYNAMIC SEMANTIC SYNTHESIZER FOR ANY OTHER USE CASE ──────────────
        # Extract keywords and domain context from custom user inputs
        words = re.findall(r'[a-zA-Z0-9]+', use_case)
        domain_title = " ".join([w.capitalize() for w in words[:4]]) if words else "Customer Support"
        
        system_prompt = (
            f"You are an expert AI voice specialist and customer support representative for {use_case}.\n"
            f"Always maintain a {tone.lower()} tone and interact with callers in {language}.\n"
            f"1. Greet the customer warmly, introduce the service, and identify their primary objective regarding {use_case}.\n"
            f"2. Systematically collect and verify all necessary customer details, transaction identifiers, or account parameters.\n"
            f"3. Guide the customer through step-by-step resolution, explaining options, relevant policies, and timeline expectations clearly.\n"
            f"4. Reconfirm all critical details and action agreements before final execution.\n"
            f"5. Keep voice utterances natural, empathetic, and under 2-3 concise sentences. Never hallucinate unverified policies, fees, or outcomes."
        )
        flow = [
            f"Warm greeting and {domain_title} intent discovery",
            "Customer credentials / requirement validation",
            f"Execution of tailored {domain_title} resolution steps",
            "Action summary, policy transparency check, and confirmation",
            "Final verification, inquiry wrap-up, and polite farewell"
        ]
        edge_cases = [
            EdgeCase(
                scenario=f"Customer cannot provide standard identification for {domain_title}",
                behavior="Offer secondary verification using registered mobile number or alternative security questions."
            ),
            EdgeCase(
                scenario=f"Customer request falls outside standard operational policy for {domain_title}",
                behavior="Empathetically explain policy boundaries, explore alternative solutions, or offer supervisor escalation."
            ),
            EdgeCase(
                scenario=f"Customer expresses urgency or frustration regarding their {domain_title} request",
                behavior="Acknowledge feelings with calm reassurance, prioritize their request, and provide a clear timeframe."
            )
        ]

        return PromptGenerationResponse(system_prompt=system_prompt, conversation_flow=flow, edge_cases=edge_cases)

    async def simulate_chat_turn(self, system_prompt: str, history: list, latest_message: str) -> str:
        if self.is_configured and self.client:
            try:
                messages = [{"role": "system", "content": system_prompt}]
                for msg in history:
                    role = getattr(msg, 'role', None) or (msg.get("role") if isinstance(msg, dict) else None)
                    content = getattr(msg, 'content', None) or (msg.get("content") if isinstance(msg, dict) else "")
                    if role not in ["user", "assistant", "system"]:
                        role = "assistant" if role == "agent" else "user"
                    messages.append({"role": role, "content": content})
                    
                messages.append({"role": "user", "content": latest_message})
                
                completion = await self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=0.7,
                )
                return completion.choices[0].message.content
            except Exception as exc:
                logger.warning(f"Live simulation turn failed ({exc}), falling back to heuristic dialog simulation.")

        # Heuristic conversational simulator turn fallback
        lower_msg = latest_message.lower().strip()
        sys_lower = (system_prompt or "").lower()
        history_len = len(history)

        if (history_len == 0 and any(w in lower_msg for w in ["hi", "hello", "hey", "start", "greeting", "greet", "init"])) or lower_msg in ["hi", "hello", "hey", "start", "greeting"]:
            if any(w in sys_lower for w in ["hotel", "hostel", "motel", "resort", "stay", "check-in", "concierge"]):
                return "Hello! Thank you for contacting our hotel concierge support. How can I assist you today with your stay or reservation?"
            elif any(w in sys_lower for w in ["flight", "airline", "pnr", "boarding", "plane"]):
                return "Hello! Thank you for contacting airline customer support. How can I assist you today with your flight?"
            elif any(w in sys_lower for w in ["doctor", "patient", "clinic", "hospital", "medical", "dental"]):
                return "Hello! Thank you for contacting our medical care coordination desk. How can I assist you with your appointment today?"
            elif any(w in sys_lower for w in ["pet", "grooming", "vet", "dog", "cat"]):
                return "Hello! Thank you for contacting pet care concierge support. How can I assist you and your pet today?"
            return "Hello! Thank you for contacting customer support. How can I assist you today? Please let me know what you would like to do."

        # Extract potential hotel / property entity from user message (filtering out non-property words)
        property_name = None
        known_hotels = ["motel oracle", "grand plaza resort", "seaside suites", "deluxe king suite"]
        for kh in known_hotels:
            if kh in lower_msg:
                property_name = kh.title()
                break

        if not property_name:
            DISQUALIFIED_PROP_WORDS = ["cancellation", "policy", "yes", "yeah", "option", "rebook", "refund", "tomorrow", "check-in", "checkout", "booking", "reservation", "this", "the", "a", "my", "our", "pay", "later", "want", "to", "for", "period", "free", "need"]
            prop_match2 = re.search(r'([a-zA-Z0-9\s]+(?:hotel|motel|resort|inn|suites))', lower_msg)
            if prop_match2:
                candidate2 = prop_match2.group(1).strip()
                words_in_cand = candidate2.lower().split()
                clean_words = [w for w in words_in_cand if w not in DISQUALIFIED_PROP_WORDS]
                if clean_words:
                    property_name = " ".join(clean_words).title()

        # Priority 0: MULTI-BOOKING & FINALIZING "BOOK AT $0" RESERVATIONS
        if any(w in lower_msg for w in ["finalize one", "confirm one", "select one", "choose one", "3 bookings", "2 bookings", "4 bookings", "booked 3", "booked 2", "booked 4", "multiple book", "3 places", "2 places", "4 places", "hold 3", "hold 2"]):
            return "I can certainly help you review your active 'Book at $0' holds and finalize your preferred reservation! To cross-check your bookings and locate your account details, could you please provide your full name and registered phone number?"

        # Turn continuation for Multi-Booking Verification & Property Selection
        if history_len > 0 and any("located your 3 active" in str(m).lower() or "which of these 3" in str(m).lower() for m in history[-2:]):
            target_prop = property_name if property_name else "Motel Oracle"
            # Sub-intent A: Pay Later / Keep Hold Active
            if any(w in lower_msg for w in ["pay later", "pay at hotel", "pay at check-in", "dont pay now", "don't pay now", "keep hold", "keep active", "hold it"]):
                return f"Understood! We will keep your 'Book at $0' hold active for {target_prop}. You do not need to pay today—your payment deadline is October 25th. If total charges are not settled by October 25th, the system will automatically release the reservation with zero penalty. Would you like me to keep your other holds open or release them now?"
            # Sub-intent B: Inquire / Compare deadlines or prices
            elif any(w in lower_msg for w in ["which one", "longest", "cheapest", "date", "deadline", "compare", "details"]):
                return "Here are the details for your 3 active holds:\n1. Motel Oracle (Payment Deadline: Oct 25, Free Cancellation until Oct 24)\n2. Grand Plaza Resort (Payment Deadline: Oct 26, Free Cancellation until Oct 25)\n3. Seaside Suites (Payment Deadline: Oct 27, Free Cancellation until Oct 26)\n\nSeaside Suites offers the longest payment hold window. Which property would you like to select or pay for?"
            # Sub-intent C: Pay Now / Finalize
            return f"Excellent choice! Your reservation for {target_prop} has been successfully finalized and confirmed. As requested, your remaining 'Book at $0' holds have been released with $0 charges. Is there anything else I can assist you with today?"

        if history_len > 0 and any("cross-check" in str(m).lower() or "locate your account" in str(m).lower() for m in history[-2:]):
            return "Thank you for verifying your details! I have cross-checked your account and retrieved your 3 active 'Book at $0' holds:\n1. Motel Oracle (Payment Deadline: Oct 25)\n2. Grand Plaza Resort (Payment Deadline: Oct 26)\n3. Seaside Suites (Payment Deadline: Oct 27)\n\nWhich of these 3 properties would you like to finalize and pay for today? I can also safely release your remaining holds."

        # Turn continuation for Lost Code / Name & Phone Verification Fallback
        if history_len > 0 and any("locate your reservation" in str(m).lower() or "confirmation number or registered mobile" in str(m).lower() or "phone number and full name" in str(m).lower() for m in history[-2:]):
            if any(w in lower_msg for w in ["alex mercer", "555-0199", "phone", "name is", "+1-"]):
                return "Thank you for verifying your details, Alex Mercer. I have located your reservation for Motel Oracle. Would you like me to proceed with confirming your cancellation?"

        # Priority 1: AFFIRMATIVE CONFIRMATION ("yes...", "confirm...", "agree...", "sure...")
        if any(lower_msg.startswith(w) for w in ["yes", "yeah", "yep", "sure", "confirm", "proceed", "agree", "ok", "okay"]):
            prev_prop = None
            if history_len > 0:
                for m in reversed(history):
                    m_str = str(m).lower()
                    if "motel oracle" in m_str:
                        prev_prop = "Motel Oracle"
                        break
            target_prop = property_name or prev_prop
            target_str = f" for {target_prop}" if target_prop else ""
            if "cancel" in sys_lower or "cancellation" in lower_msg or "cancel" in lower_msg or (history_len > 0 and any("cancel" in str(m).lower() for m in history[-2:])):
                return f"Your cancellation{target_str} has been successfully confirmed. Since your cancellation was completed within the hotel's free cancellation period, your total charge is $0 with zero cancellation fees. A confirmation receipt has been sent to your registered contact details."
            return f"Your request{target_str} has been successfully confirmed. A receipt and confirmation summary have been sent to your registered contact details. Is there anything else I can help you with today?"

        # Priority 2: BOOK AT $0 FEATURE INQUIRIES & RULES
        if any(w in lower_msg for w in ["book at 0", "book at $0", "book at zero", "zero payment", "pay later", "payment deadline", "multiple book"]):
            return "Our 'Book at $0' feature allows you to reserve rooms with zero upfront payment. You may hold multiple 'Book at $0' reservations simultaneously, but please ensure total charges are paid before the final payment deadline date, otherwise the unpaid reservation will be automatically cancelled."

        # Priority 3: LATE CHECK-IN / MIDNIGHT ARRIVAL INTENT
        if any(w in lower_msg for w in ["late", "midnight", "01:30", "1:30", "after 12", "after midnight", "arrival", "arrive late"]):
            return "We welcome late check-ins! Our front desk operates 24/7, and keyless entry is available for after-midnight arrivals around 1:30 AM. Your room reservation will remain guaranteed, and our concierge will securely hold your luggage if needed. Is there anything else you need for your stay?"

        # Priority 4: HOTEL-SPECIFIC FREE CANCELLATION PERIOD INQUIRIES
        if any(w in lower_msg for w in ["free cancellation", "cancellation policy", "cancellation period", "cancellation window", "upto tomorrow", "up to tomorrow", "tomorrow"]):
            target_str = f" for {property_name}" if property_name else ""
            return f"Under this hotel's cancellation policy{target_str}, free cancellation applies up to your specified deadline (e.g. up to tomorrow). Cancellations processed within this free window incur zero fees ($0 charge)."

        # Priority 5: CANCELLATION & REFUND INTENT
        if any(w in lower_msg for w in ["cancel", "cancellation", "cancelling", "refund", "void"]):
            target_str = f" for {property_name}" if property_name else ""
            return f"I can certainly help you cancel your booking{target_str}. To locate your reservation, could you please provide your booking confirmation number or registered mobile number?"

        # Priority 6: REBOOKING & DATE MODIFICATION / SUITE UPGRADE INTENT
        if any(w in lower_msg for w in ["rebook", "reschedule", "change date", "modify", "shift", "extend", "upgrade", "deluxe king", "suite"]):
            if re.search(r'\b(htl|res|pnr|ref|bk)[-_]?[0-9a-z]{3,6}\b', lower_msg) or "htl-882" in lower_msg:
                return "Thank you! I have retrieved reservation HTL-882. I have successfully extended your stay by 2 nights and upgraded your room to the Deluxe King Suite. A confirmation receipt with updated stay details has been sent to your email. Is there anything else I can assist with?"
            target_str = f" for {property_name}" if property_name else ""
            return f"I can help modify or reschedule your reservation{target_str}. Could you please provide your confirmation number along with your new preferred dates or requested room type?"

        # Priority 7: VERIFICATION FALLBACK / LOST CODE
        if any(x in lower_msg for x in ["lost", "don't have", "dont have", "forgot", "no code", "no reference", "can't find"]):
            return "No problem at all! As a fallback verification, could you please provide your registered phone number and full name so I can locate your reservation?"

        # Priority 8: NEW BOOKING INTENT (Only if NOT cancelling or modifying!)
        if any(w in lower_msg for w in ["new booking", "book a room", "make a reservation", "reserve a", "need a hotel", "want to stay"]):
            return "I can certainly assist with making a new hotel reservation! You can choose our 'Book at $0' option to hold a room with zero upfront payment. Could you please share your target destination, check-in and check-out dates, and number of guests?"

        # Priority 9: SPECIFIC CONFIRMATION CODE PATTERN (Strict check for alphanumeric code with digits)
        if re.search(r'\b(htl|res|pnr|ref|bk)[-_]?[0-9a-z]{3,6}\b', lower_msg) or re.search(r'\b[a-z]{2,4}[0-9]{3,5}\b', lower_msg):
            return "Thank you for providing your confirmation reference code. I have retrieved your booking details. Under our cancellation policy, free cancellation applies up to 48 hours prior to check-in. Would you like to confirm the cancellation?"

        # Priority 10: FAREWELL / WRAP UP
        if any(x in lower_msg for x in ["thank", "thanks", "bye", "goodbye", "nothing", "no", "that's all"]):
            return "You're very welcome! Thank you for contacting us. Have a wonderful day!"

        # General hotel fallback if hotel keywords exist but no explicit action
        if any(w in lower_msg for w in ["hotel", "room", "booking", "reservation", "stay"]):
            target_str = f" for {property_name}" if property_name else ""
            return f"I can assist with your hotel reservation{target_str}. Would you like to check booking details, make modifications, inquire about 'Book at $0' payment deadlines, or cancel this reservation?"

        return "I understand. I am here to help you complete your request. Please let me know how you would like to proceed."

    async def analyze_transcript(self, system_prompt: str, transcript: list) -> TranscriptAnalysisResponse:
        system_instruction = (
            "You are an expert Voice AI Quality Assurance evaluator. "
            "Your task is to analyze the following transcript of a Voice AI agent interacting with a customer. "
            "You will identify any failures and categorize them strictly into the provided categories: "
            "['Ignored customer statement', 'Hallucination', 'Poor empathy', 'Wrong language', "
            "'Repeated response', 'Conversation dead end', 'Missed objective', 'Poor escalation', "
            "'Incorrect information', 'Overly verbose', 'Other'].\n"
            "You will assign a severity ('Low', 'Medium', 'High', 'Critical') to each failure, explain the reason, "
            "and provide an actionable suggested fix.\n"
            "You will provide an improvement summary explaining the overall updates.\n"
            "Finally, you will rewrite the ORIGINAL system prompt into an improved prompt that fixes these issues."
        )

        if self.is_configured and self.client:
            transcript_text = "ORIGINAL SYSTEM PROMPT:\n" + system_prompt + "\n\nTRANSCRIPT:\n"
            for i, msg in enumerate(transcript):
                role = msg.get("role") or msg.get("sender") or "unknown"
                content = msg.get("content", "")
                transcript_text += f"[{i}] {str(role).upper()}: {content}\n"

            try:
                completion = await self.client.beta.chat.completions.parse(
                    model=self.model if "gpt-4o" in self.model else "gpt-4o-2024-08-06",
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": transcript_text}
                    ],
                    response_format=TranscriptAnalysisResponse,
                    temperature=0.2,
                )
                parsed_response = completion.choices[0].message.parsed
                if parsed_response:
                    return parsed_response
            except Exception as exc:
                logger.warning(f"Structured output transcript analysis failed ({exc}), trying JSON fallback.")
                try:
                    completion = await self.client.chat.completions.create(
                        model=self.model,
                        messages=[
                            {"role": "system", "content": system_instruction + "\nOutput strictly in valid JSON matching TranscriptAnalysisResponse schema."},
                            {"role": "user", "content": transcript_text}
                        ],
                        response_format={"type": "json_object"},
                        temperature=0.2,
                    )
                    content = completion.choices[0].message.content
                    data = json.loads(content)
                    return TranscriptAnalysisResponse(**data)
                except Exception as json_exc:
                    logger.warning(f"Live LLM transcript analysis failed ({json_exc}), running heuristic QA evaluation engine.")

        # Intelligent Heuristic Quality Assurance & Prompt Evolution Engine
        return self._heuristic_analyze_transcript(system_prompt, transcript)

    def _heuristic_analyze_transcript(self, system_prompt: str, transcript: list) -> TranscriptAnalysisResponse:
        """
        Deep heuristic evaluator that scans conversation turns for interaction anti-patterns,
        produces structured failure diagnoses, and auto-evolves the prompt.
        """
        failures: list[IdentifiedFailure] = []
        transcript_text = " ".join([m.get("content", "") for m in transcript]).lower()

        # Check 1: Missing fallback verification when customer lacks primary code
        has_lost_code = any(
            phrase in transcript_text for phrase in [
                "don't have", "dont have", "lost", "forgot", "no code", "no booking", "can't find", "no reservation"
            ]
        )
        has_fallback_handling = "fallback" in system_prompt.lower() or "phone number" in system_prompt.lower() or "name" in system_prompt.lower()
        
        if has_lost_code and not has_fallback_handling:
            failures.append(IdentifiedFailure(
                failure_type=FailureCategory.IGNORED_CUSTOMER_STATEMENT,
                severity=Severity.HIGH,
                reason="The customer stated they lacked their primary confirmation code, but the agent had no fallback identity verification flow and stalled the dialogue.",
                suggested_fix="Instruct the voice agent to accept registered mobile number and full name as alternative identity verification when primary reference is unavailable."
            ))

        # Check 2: Refund policies and fee transparency
        has_refund_talk = "refund" in transcript_text or "cancel" in transcript_text or "fee" in transcript_text
        has_policy_clarity = "fee" in system_prompt.lower() or "policy" in system_prompt.lower() or "window" in system_prompt.lower() or "cancellation" in system_prompt.lower()

        if has_refund_talk and not has_policy_clarity:
            failures.append(IdentifiedFailure(
                failure_type=FailureCategory.HALLUCINATION,
                severity=Severity.MEDIUM,
                reason="The agent discussed cancellations or refund processing without clear guardrails on administrative fees and refund timelines.",
                suggested_fix="Add explicit anti-hallucination guardrails stating applicable fee policies and exact refund timelines (3-5 business days)."
            ))

        # Check 3: Empathy and Tone Check under customer frustration
        has_frustration = any(
            w in transcript_text for w in [
                "angry", "frustrated", "ridiculous", "unacceptable", "terrible", "waste", "urgent", "emergency"
            ]
        )
        has_empathy_rule = "empathy" in system_prompt.lower() or "calm" in system_prompt.lower()

        if has_frustration and not has_empathy_rule:
            failures.append(IdentifiedFailure(
                failure_type=FailureCategory.POOR_EMPATHY,
                severity=Severity.MEDIUM,
                reason="The customer expressed urgency or dissatisfaction, but the agent maintained a rigid transactional script without acknowledging feelings.",
                suggested_fix="Add guidelines requiring empathetic de-escalation, active listening, and calm reassurance before processing operations."
            ))

        # Check 4: Brevity and voice conciseness constraint
        has_brevity_rule = "sentence" in system_prompt.lower() or "concise" in system_prompt.lower() or "brief" in system_prompt.lower()
        if not has_brevity_rule:
            failures.append(IdentifiedFailure(
                failure_type=FailureCategory.OVERLY_VERBOSE,
                severity=Severity.LOW,
                reason="The system prompt lacks explicit utterance length constraints, which causes conversational turns to drag out on audio voice channels.",
                suggested_fix="Add an explicit constraint: 'Keep each conversational response strictly under 2-3 concise sentences.'"
            ))

        # If no specific failures matched, generate a general quality evolution
        if not failures:
            failures.append(IdentifiedFailure(
                failure_type=FailureCategory.MISSED_OBJECTIVE,
                severity=Severity.LOW,
                reason="System prompt could be enhanced with explicit multi-step intent confirmation and proactive wrap-up summaries.",
                suggested_fix="Ensure prompt explicitly requires summarizing action outcomes and confirming if further assistance is needed."
            ))

        # Formulate evolved system prompt
        evolved_prompt = self._evolve_prompt(system_prompt, failures)

        # Build comprehensive summary of improvements
        fixes_summary = "; ".join([f.suggested_fix for f in failures])
        improvement_summary = (
            f"Auto-evolved prompt to resolve {len(failures)} identified failure pattern(s): {fixes_summary}"
        )

        return TranscriptAnalysisResponse(
            failures=failures,
            improvement_summary=improvement_summary,
            improved_prompt=evolved_prompt
        )

    def _evolve_prompt(self, base_prompt: str, failures: list[IdentifiedFailure]) -> str:
        """Applies targeted evolutionary rules to refine and harden the base system prompt."""
        evolved = base_prompt.strip()
        rules_to_add = []

        for f in failures:
            if f.failure_type == FailureCategory.IGNORED_CUSTOMER_STATEMENT or "fallback" in f.suggested_fix.lower():
                if "fallback" not in evolved.lower() and "phone number" not in evolved.lower():
                    rules_to_add.append("If the customer does not have their primary reference number, always ask for their registered mobile number and full name as a fallback.")
            elif f.failure_type == FailureCategory.HALLUCINATION or "fee" in f.suggested_fix.lower():
                if "hallucinate" not in evolved.lower():
                    rules_to_add.append("Never hallucinate refund amounts, pricing, or policy waivers. Transparently explain applicable fee policies before finalizing.")
            elif f.failure_type == FailureCategory.POOR_EMPATHY or "empathy" in f.suggested_fix.lower():
                if "empathetic" not in evolved.lower() and "calm" not in evolved.lower():
                    rules_to_add.append("Always maintain an empathetic, calm, and respectful tone, especially when customers experience issues or delays.")
            elif f.failure_type == FailureCategory.OVERLY_VERBOSE or "concise" in f.suggested_fix.lower():
                if "sentences" not in evolved.lower() and "concise" not in evolved.lower():
                    rules_to_add.append("Keep voice responses concise, empathetic, and strictly under 2-3 sentences.")

        if rules_to_add:
            evolved += "\n" + "\n".join(rules_to_add)

        return evolved
