import { type NextRequest } from 'next/server'
import { OpenAIStream } from '@/app/api/utils/stream'
import { getInfo, client } from '@/app/api/utils/common'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    inputs,
    query,
    response_mode: responseMode
  } = body
  const { user } = getInfo(request);
  const res = await client.createCompletionMessage(inputs, query, user, responseMode)
  const stream = await OpenAIStream(res as any)
  return new Response(stream as any)
}