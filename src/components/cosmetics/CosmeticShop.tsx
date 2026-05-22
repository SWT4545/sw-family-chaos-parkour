'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingBag } from 'lucide-react'
import { ALL_COSMETICS, getCosmeticsByType } from '@/lib/cosmetics/CosmeticRegistry'
import { CosmeticInventoryManager } from '@/lib/cosmetics/CosmeticInventory'
import { LocalProfiles } from '@/lib/profiles/LocalProfiles'
import type { Cosmetic, CosmeticType } from '@/types/cosmetics'

const TABS: { id: CosmeticType; label: string; emoji: string }[] = [
  { id: 'trail',       label: 'Trails',  emoji: '✨' },
  { id: 'border',      label: 'Borders', emoji: '🖼️' },
  { id: 'victoryPose', label: 'Poses',   emoji: '🏆' },
  { id: 'emote',       label: 'Emotes',  emoji: '😄' },
  { id: 'badge',       label: 'Badges',  emoji: '🎖️' },
]

const RARITY_COLORS = {
  common:    { bg: 'rgba(107,114,128,0.15)', border: '#6b728040', text: '#9ca3af' },
  rare:      { bg: 'rgba(59,130,246,0.12)',  border: '#3b82f640', text: '#60a5fa' },
  epic:      { bg: 'rgba(139,92,246,0.12)',  border: '#8b5cf640', text: '#a78bfa' },
  legendary: { bg: 'rgba(251,191,36,0.12)',  border: '#fbbf2440', text: '#fbbf24' },
}

interface Props {
  open:    boolean
  onClose: () => void
}

export function CosmeticShop({ open, onClose }: Props) {
  const [tab,       setTab]       = useState<CosmeticType>('trail')
  const [owned,     setOwned]     = useState<string[]>([])
  const [equipped,  setEquipped]  = useState<Record<string, string | null>>({})
  const [balance,   setBalance]   = useState(0)
  const [feedback,  setFeedback]  = useState<{ id: string; msg: string } | null>(null)

  function refresh() {
    const inv = CosmeticInventoryManager.get()
    setOwned(inv.ownedIds)
    setEquipped({
      trail:       inv.equippedTrail,
      border:      inv.equippedBorder,
      victoryPose: inv.equippedVictoryPose,
      emote:       inv.equippedEmote,
    } as Record<string, string | null>)
    const profiles = LocalProfiles.getAll()
    const total    = profiles.reduce((sum, p) => sum + p.totalCoins, 0)
    setBalance(total)
  }

  useEffect(() => { if (open) refresh() }, [open])

  function handleBuy(cosmetic: Cosmetic) {
    const result = CosmeticInventoryManager.purchase(cosmetic.id, balance)
    if (result.success) {
      setFeedback({ id: cosmetic.id, msg: 'Purchased!' })
      setBalance(result.newBalance)
      refresh()
    } else {
      setFeedback({ id: cosmetic.id, msg: 'Not enough coins' })
    }
    setTimeout(() => setFeedback(null), 1800)
  }

  function handleEquip(id: string) {
    CosmeticInventoryManager.equip(id)
    refresh()
  }

  const cosmetics = getCosmeticsByType(tab)
  const equippedForTab = equipped[tab]

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="shop-bg"
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            key="shop-panel"
            className="fixed z-50 inset-x-0 bottom-0 max-h-[90dvh] flex flex-col rounded-t-3xl border-t border-white/10 bg-[#0a0a10]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 36 }}
          >
            {/* Handle + header */}
            <div className="flex-shrink-0 px-5 pt-4 pb-3">
              <div className="w-10 h-1 rounded-full bg-gray-700 mx-auto mb-4" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={16} className="text-yellow-400" />
                  <h2 className="font-black text-white text-base uppercase tracking-widest">Shop</h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-yellow-400 font-black text-sm">💰 {balance.toLocaleString()}</span>
                  <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex-shrink-0 flex gap-1 px-5 pb-3 overflow-x-auto">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                    tab === t.id
                      ? 'bg-yellow-400 text-black'
                      : 'bg-white/[0.05] text-gray-500 hover:bg-white/10 hover:text-gray-300'
                  }`}
                >
                  <span>{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-5 pb-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {cosmetics.map(c => {
                  const isOwned    = owned.includes(c.id)
                  const isEquipped = equippedForTab === c.id
                  const colors     = RARITY_COLORS[c.rarity]
                  const fb         = feedback?.id === c.id ? feedback.msg : null

                  return (
                    <motion.div
                      key={c.id}
                      className="rounded-2xl border p-3 flex flex-col gap-2"
                      style={{ backgroundColor: isEquipped ? colors.bg : 'rgba(10,10,12,0.8)', borderColor: isEquipped ? colors.border : 'rgba(255,255,255,0.06)' }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="text-3xl text-center leading-none pt-1">{c.icon}</div>

                      <div className="text-center">
                        <p className="font-black text-white text-xs uppercase leading-tight">{c.name}</p>
                        <p className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color: colors.text }}>
                          {c.rarity}
                        </p>
                      </div>

                      <p className="text-[10px] text-gray-600 text-center leading-tight">{c.description}</p>

                      {fb ? (
                        <div className={`text-center text-[10px] font-bold py-1 rounded-lg ${fb === 'Purchased!' ? 'text-green-400' : 'text-red-400'}`}>
                          {fb}
                        </div>
                      ) : c.unlockedBy === 'season' ? (
                        <div className="text-center text-[10px] text-purple-400 font-bold border border-purple-500/30 rounded-lg py-1">
                          Season Lv {c.seasonLevel}
                        </div>
                      ) : isOwned ? (
                        <button
                          onClick={() => handleEquip(c.id)}
                          className={`text-[10px] font-black uppercase tracking-wider py-1.5 rounded-xl w-full transition-colors ${
                            isEquipped
                              ? 'bg-yellow-400 text-black'
                              : 'bg-white/[0.07] text-gray-300 hover:bg-white/15'
                          }`}
                        >
                          {isEquipped ? 'Equipped ✓' : 'Equip'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuy(c)}
                          disabled={c.cost > balance}
                          className="text-[10px] font-black uppercase tracking-wider py-1.5 rounded-xl w-full bg-yellow-400/90 text-black hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          💰 {c.cost}
                        </button>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
