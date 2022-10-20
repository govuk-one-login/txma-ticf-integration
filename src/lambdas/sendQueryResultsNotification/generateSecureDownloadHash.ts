import crypto from 'crypto'

export const generateSecureDownloadHash = () => {
  return crypto.randomUUID()
}
