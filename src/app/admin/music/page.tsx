'use client'
import { Music } from 'lucide-react'
import { MusicUploader } from '@/components/admin/MusicUploader'

export default function AdminMusicPage() {
  return (
    <div
      className="min-h-dvh bg-[#080808]"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
    >
      <div className="max-w-lg mx-auto px-5 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-yellow-400/20 flex items-center justify-center">
            <Music size={18} className="text-yellow-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-yellow-500 font-bold">Dad&apos;s Panel</p>
            <h1 className="font-black text-white text-xl uppercase tracking-widest leading-tight">Music Manager</h1>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-6">
          Upload Suno-generated MP3 tracks for each game screen.
          Files are stored in Firebase Storage and served globally.
        </p>

        <MusicUploader />

        <div className="mt-8 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-600 font-bold mb-2">How to use</p>
          <ol className="text-gray-600 text-xs space-y-1 list-decimal list-inside">
            <li>Create tracks at <span className="text-gray-400">suno.com</span> and download as MP3</li>
            <li>Click the upload button for the matching game screen</li>
            <li>Track goes live immediately — no code changes needed</li>
            <li>All family devices pick up the new music automatically</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
