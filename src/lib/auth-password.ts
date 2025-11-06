// Server-only module - bcrypt requires native bindings
import 'server-only'
import * as bcrypt from '@node-rs/bcrypt'

export async function hashPassword(password: string): Promise<string> {
  const hash = await bcrypt.hash(password, 10)
  return hash
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    const isValid = await bcrypt.verify(password, hash)
    return isValid
  } catch (error) {
    console.error('Error verifying password:', error)
    return false
  }
}
