import { type NextRequest } from 'next/server'
import { APP_ID, API_KEY } from '@/config'
import { CompletionClient } from 'langgenius-client'
import uuid from 'uuid'

const userPrefix = `user_${APP_ID}:`;

export const getInfo = (request: NextRequest) => {
  const sessionId = request.cookies.get('session_id')?.value || uuid.v4();
  const user = userPrefix + sessionId;
  return {
    sessionId,
    user
  }
}

export const setSession = (sessionId: string) => {
  return { 'Set-Cookie': `session_id=${sessionId}` }
}

export const client = new CompletionClient(API_KEY)