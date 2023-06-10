import { type NextRequest } from 'next/server'
import { client, getInfo } from '@/app/api/utils/common'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    inputs,
    query,
  } = body
  const { user } = getInfo(request)
  const res = await client.createCompletionMessage(inputs, query, user, true)
  return new Response(res.data as any)
}
