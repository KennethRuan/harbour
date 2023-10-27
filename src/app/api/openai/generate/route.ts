import { Message as VercelChatMessage, OpenAIStream, StreamingTextResponse } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

import { ChatOpenAI } from 'langchain/chat_models/openai';
import { BytesOutputParser } from 'langchain/schema/output_parser';
import { PromptTemplate } from 'langchain/prompts';
import { fetchJson } from '@/utils/api/fetchJson';

// import { codeToEngLang } from '@/utils/lang';
 
export const runtime = 'edge';

const codeToEngLang = new Map<string, string>([
  ['af', 'Afrikaans'],
  ['ar-AE', 'Arabic (UAE)'],
  ['ar-BH', 'Arabic (Bahrain)'],
  ['ar-DZ', 'Arabic (Algeria)'],
  ['ar-EG', 'Arabic (Egypt)'],
  ['ar-IQ', 'Arabic (Iraq)'],
  ['ar-JO', 'Arabic (Jordan)'],
  ['ar-KW', 'Arabic (Kuwait)'],
  ['ar-LB', 'Arabic (Lebanon)'],
  ['ar-LY', 'Arabic (Lybia)'],
  ['ar-MA', 'Arabic (Morocco)'],
  ['ar-OM', 'Arabic (Oman)'],
  ['ar-QA', 'Arabic (Qatar)'],
  ['ar-SA', 'Arabic (Saudi Arabia)'],
  ['ar-TN', 'Arabic (Tunisia)'],
  ['ar-YE', 'Arabic (Yemen)'],
  ['bg', 'Bulgarian'],
  ['ca', 'Catalan'],
  ['cs', 'Czech'],
  ['de-DE', 'German'],
  ['el-GR', 'Greek'],
  ['en-AU', 'English (Australia)'],
  ['en-CA', 'English (Canada)'],
  ['en-GB', 'English (UK)'],
  ['en-NZ', 'English (New Zealand)'],
  ['en-US', 'English (US)'],
  ['en-ZA', 'English (South Africa)'],
  ['es-AR', 'Spanish (Argentina)'],
  ['es-BO', 'Spanish (Bolivia)'],
  ['es-CL', 'Spanish (Chile)'],
  ['es-CO', 'Spanish (Colombia)'],
  ['es-CR', 'Spanish (Costa Rica)'],
  ['es-DO', 'Spanish (Dominican Republic)'],
  ['es-EC', 'Spanish (Ecuador)'],
  ['es-ES', 'Spanish (Spain)'],
  ['es-GT', 'Spanish (Guatemala)'],
  ['es-HN', 'Spanish (Honduras)'],
  ['es-MX', 'Spanish (Mexico)'],
  ['es-NI', 'Spanish (Nicaragua)'],
  ['es-PA', 'Spanish (Panama)'],
  ['es-PE', 'Spanish (Peru)'],
  ['es-PR', 'Spanish (Puerto Rico)'],
  ['es-PY', 'Spanish (Paraguay)'],
  ['es-SV', 'Spanish (El Salvador)'],
  ['es-UY', 'Spanish (Uruguay)'],
  ['es-VE', 'Spanish (Venezuela)'],
  ['eu', 'Basque'],
  ['fi', 'Finnish'],
  ['fr-FR', 'French'],
  ['gl', 'Galician'],
  ['he', 'Hebrew'],
  ['hu', 'Hungarian'],
  ["hi-IN", "Hindi"],
  ['id', 'Indonesian'],
  ['is', 'Icelandic'],
  ['it-IT', 'Italian'],
  ['ja', 'Japanese'],
  ['ko', 'Korean'],
  ['ms-MY', 'Malaysian'],
  ['nl-NL', 'Dutch'],
  ['pl', 'Polish'],
  ['pt-PT', 'Portuguese'],
  ['ro-RO', 'Romanian'],
  ['ru', 'Russian'],
  ['sk', 'Slovak'],
  ['sr-SP', 'Serbian'],
  ['sv-SE', 'Swedish'],
  ['tr', 'Turkish'],
  ['zh-CN', 'Mandarin Chinese'],
  ['zh-HK', 'Cantonese'],
  ['zh-TW', 'Taiwanese'],
  ['zu', 'Zulu']  
]);

/**
   * Basic memory formatter that stringifies and passes
   * message history directly into the model.
   */
const formatMessage = (message: VercelChatMessage) => {
  return `${message.role}: ${message.content}`
}

export async function POST(req: NextRequest) {
  try {
    // Extract the `messages` from the body of the request
    const body = await req.json();
    const messages = body.messages ?? [] as VercelChatMessage[];
    const { moduleName, langCode } = body;

    console.log("I GOT THIS CODE", langCode);

    const language = codeToEngLang.get(langCode) || 'English';

    // Get the module content from the JSON file
    const moduleContent = await fetchJson(moduleName);

    const { character_prompt } = moduleContent;

    const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage)
    const currentMessageContent = messages[messages.length - 1].content

    const TEMPLATE = `${character_prompt}

    Current conversation:
    {chat_history}

    User: {input}
    AI:`
  
    const prompt = PromptTemplate.fromTemplate(TEMPLATE)

    // See a full list of supported models at: https://js.langchain.com/docs/modules/model_io/models/
    const model = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      maxTokens: 1000,
      streaming: true,
      n: 1,
    })

    const outputParser = new BytesOutputParser()
  
    const chain = prompt.pipe(model).pipe(outputParser)
  
    const stream = await chain.stream({
      language: language, // This parameter exists inside character prompt which is parsed into the template, will this work? I don't know
      chat_history: formattedPreviousMessages.join('\n'),
      input: currentMessageContent
    })
  
    // Respond with the stream
    return new StreamingTextResponse(stream)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
  
}