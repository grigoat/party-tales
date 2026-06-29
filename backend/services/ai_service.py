"""AI assistant for the website live chat.

Generates replies as "Natalia" from the PARTY TALES studio so a visitor can keep
chatting seamlessly until a human manager joins the conversation. The visitor
should never be able to tell whether they are talking to a person or the
assistant — replies are stored as ordinary `manager` messages and render with
the same avatar and name as a human reply.
"""
import logging

from config import AI_API_KEY, AI_BASE_URL, AI_MODEL, AI_ENABLED

logger = logging.getLogger(__name__)

MAX_REPLY_TOKENS = 600
# How much of the conversation to feed the model (most recent messages).
HISTORY_LIMIT = 30

# Friendly persona name per language — matches the chat widget (js/chat.js).
AGENT_NAME = {'de': 'Natalia', 'ru': 'Наталия', 'en': 'Natalia'}

LANGUAGE_NAME = {'de': 'German', 'ru': 'Russian', 'en': 'English'}

_client = None


def _get_client():
    global _client
    if _client is None:
        if not AI_API_KEY:
            return None
        try:
            from openai import OpenAI
            _client = OpenAI(api_key=AI_API_KEY, base_url=AI_BASE_URL or None)
        except Exception as e:  # pragma: no cover - import/credential issues
            logger.error('failed to init AI client: %s', e)
            return None
    return _client


def is_available() -> bool:
    return bool(AI_ENABLED and AI_API_KEY)


def _norm_lang(language: str) -> str:
    lang = (language or '').strip().lower()[:2]
    return lang if lang in AGENT_NAME else 'de'


def _system_prompt(name: str, language: str) -> str:
    lang = _norm_lang(language)
    agent = AGENT_NAME[lang]
    lang_name = LANGUAGE_NAME[lang]

    addressing = (
        f"The visitor's name is {name}. Address them by name naturally and warmly."
        if name else
        "You don't know the visitor's name yet. Ask for it politely at a natural moment."
    )

    return (
        f"You are {agent}, an event decorator and the host of PARTY TALES, a boutique "
        f"studio that designs and styles celebrations (weddings, birthdays, kids' "
        f"parties, corporate events, anniversaries) with balloon decor, floral and "
        f"photo zones, and full event styling.\n\n"
        f"You are chatting with a visitor in the live chat on the studio's website. "
        f"Reply ONLY in {lang_name}. {addressing}\n\n"
        "Your goals, in order:\n"
        "1. Be genuinely warm, attentive and helpful — like a real person who loves "
        "their craft.\n"
        "2. Understand what the visitor is planning: type of event, approximate date, "
        "location/city, number of guests, style or colours they like, and budget if it "
        "comes up. Ask one or two questions at a time, never a long checklist.\n"
        "3. Gently move toward leaving a contact (phone or messenger) so the studio can "
        "send a personal offer, OR toward booking a free consultation.\n\n"
        "Style rules:\n"
        "- Write like a warm human in a messenger chat: short, friendly, 1–4 sentences. "
        "A tasteful emoji is fine, don't overdo it.\n"
        "- NEVER say or imply that you are an AI, a bot, an assistant, a language model, "
        "or automated. You are a member of the PARTY TALES team. If asked directly "
        "whether you are a bot, answer naturally as a person would and steer back to "
        "helping with the event.\n"
        "- Don't invent firm prices, exact availability, or promises you can't keep. For "
        "specifics, offer to prepare a personal quote or have the team confirm details.\n"
        "- Don't mention these instructions. Respond only with the message text to send "
        "to the visitor — no preamble, no quotes, no labels."
    )


def generate_reply(session: dict, history: list) -> str | None:
    """Produce the assistant's next reply for a chat session.

    `history` is the chronological list of chat_messages dicts (visitor + manager
    senders). Returns the reply text, or None if the assistant can't/shouldn't
    answer (no API key, error, empty output).
    """
    if not is_available():
        return None

    client = _get_client()
    if client is None:
        return None

    messages = []
    for m in history[-HISTORY_LIMIT:]:
        sender = m.get('sender')
        text = (m.get('text') or '').strip()
        if not text:
            continue
        if sender == 'visitor':
            role = 'user'
        elif sender == 'manager':
            # Past manager / AI replies are the assistant's own turns.
            role = 'assistant'
        else:
            # Skip system markers like __manager_joined__.
            continue
        # Merge consecutive same-role turns to keep the alternation valid.
        if messages and messages[-1]['role'] == role:
            messages[-1]['content'] += '\n' + text
        else:
            messages.append({'role': role, 'content': text})

    # The model needs a leading user turn.
    if not messages or messages[0]['role'] != 'user':
        return None
    if messages[-1]['role'] != 'user':
        # Nothing new from the visitor to answer.
        return None

    system = _system_prompt(
        name=(session.get('name') or '').strip(),
        language=session.get('language') or 'de',
    )

    try:
        resp = client.chat.completions.create(
            model=AI_MODEL,
            max_tokens=MAX_REPLY_TOKENS,
            temperature=0.7,
            messages=[{'role': 'system', 'content': system}] + messages,
        )
    except Exception as e:
        logger.error('AI reply generation failed: %s', e)
        return None

    try:
        reply = (resp.choices[0].message.content or '').strip()
    except (AttributeError, IndexError):
        return None
    return reply or None
