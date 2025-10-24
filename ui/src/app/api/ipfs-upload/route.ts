import { NextRequest, NextResponse } from 'next/server'
import { verifyMessage, getAddress } from 'viem'
import { randomUUID } from 'crypto'

const MAX_IMAGE_SIZE = 500 * 1024
const MAX_VOICE_SIZE = 1024 * 1024
const ALLOWED_IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'webp'])
const ALLOWED_AUDIO_EXT = new Set(['mp3', 'wav', 'ogg', 'm4a', 'webm'])
const MAX_UPLOADS_PER_DAY = 5

const nonceStore = new Map<string, { address: `0x${string}`; ts: number }>()
const usageStore = new Map<string, { count: number; resetAt: number }>()

function getExt(name: string) {
  const i = name.lastIndexOf('.')
  if (i === -1) return ''
  return name.substring(i + 1).toLowerCase()
}

function bumpUsage(addr: string) {
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  const rec = usageStore.get(addr) || { count: 0, resetAt: now + day }
  if (now > rec.resetAt) {
    rec.count = 0
    rec.resetAt = now + day
  }
  rec.count += 1
  usageStore.set(addr, rec)
  return rec
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')?.toLowerCase() as `0x${string}` | null
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })
  const nonce = randomUUID()
  const ts = Date.now()
  const checksum = getAddress(address)
  const message = `HighestVoice IPFS Upload\nAddress: ${checksum}\nNonce: ${nonce}\nTimestamp: ${ts}`
  nonceStore.set(nonce, { address: checksum, ts })
  return NextResponse.json({ nonce, message, ts })
}

export async function POST(req: NextRequest) {
  try {
    const pinataJwt = process.env.PINATA_JWT
    if (!pinataJwt) return NextResponse.json({ error: 'Server missing PINATA_JWT' }, { status: 500 })

    const form = await req.formData()
    const file = form.get('file') as File | null
    const type = (form.get('type') as string | null) || ''
    const address = form.get('address') as `0x${string}` | null
    const signature = form.get('signature') as `0x${string}` | null
    const nonce = (form.get('nonce') as string | null) || ''
    const tsStr = (form.get('ts') as string | null) || ''

    if (!file || !type || !address || !signature || !nonce || !tsStr) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 })
    }

    const record = nonceStore.get(nonce)
    if (!record) return NextResponse.json({ error: 'invalid nonce' }, { status: 401 })

    if (record.address.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json({ error: 'address mismatch' }, { status: 401 })
    }

    const ts = Number(tsStr)
    if (!Number.isFinite(ts) || Date.now() - ts > 10 * 60 * 1000) {
      return NextResponse.json({ error: 'stale timestamp' }, { status: 401 })
    }

    const checksum = getAddress(address)
    const message = `HighestVoice IPFS Upload\nAddress: ${checksum}\nNonce: ${nonce}\nTimestamp: ${ts}`
    const ok = await verifyMessage({ message, signature, address: checksum })
    if (!ok) return NextResponse.json({ error: 'invalid signature' }, { status: 401 })

    const usage = usageStore.get(checksum) || { count: 0, resetAt: Date.now() + 24 * 60 * 60 * 1000 }
    if (usage.count >= MAX_UPLOADS_PER_DAY) {
      return NextResponse.json({ error: 'daily limit reached' }, { status: 429 })
    }

    const fileName = (file as any).name || 'upload'
    const ext = getExt(fileName)

    if (type === 'image') {
      if (!ALLOWED_IMAGE_EXT.has(ext)) return NextResponse.json({ error: 'invalid image extension' }, { status: 400 })
      if (file.size > MAX_IMAGE_SIZE) return NextResponse.json({ error: 'image too large' }, { status: 400 })
    } else if (type === 'audio') {
      if (!ALLOWED_AUDIO_EXT.has(ext)) return NextResponse.json({ error: 'invalid audio extension' }, { status: 400 })
      if (file.size > MAX_VOICE_SIZE) return NextResponse.json({ error: 'audio too large' }, { status: 400 })
    } else {
      return NextResponse.json({ error: 'invalid type' }, { status: 400 })
    }

    const fd = new FormData()
    fd.set('file', file, fileName)

    const pinRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: { Authorization: `Bearer ${pinataJwt}` },
      body: fd,
    })

    if (!pinRes.ok) {
      const err = await pinRes.text().catch(() => 'pinata error')
      return NextResponse.json({ error: 'pinata failed', details: err }, { status: 502 })
    }

    const data = await pinRes.json()
    bumpUsage(checksum)
    nonceStore.delete(nonce)

    return NextResponse.json({ cid: data.IpfsHash || data.Hash || data.cid, size: file.size, ext })
  } catch (e: any) {
    return NextResponse.json({ error: 'upload failed', details: e?.message || 'unknown' }, { status: 500 })
  }
}
