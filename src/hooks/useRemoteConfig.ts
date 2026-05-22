'use client'
import { useEffect, useState } from 'react'
import { fetchRemoteConfig, defaultRemoteConfig, type RemoteConfigValues } from '@/lib/firebase/remoteConfig'

export function useRemoteConfig(): RemoteConfigValues {
  const [config, setConfig] = useState<RemoteConfigValues>(defaultRemoteConfig)

  useEffect(() => {
    fetchRemoteConfig().then(setConfig)
  }, [])

  return config
}
